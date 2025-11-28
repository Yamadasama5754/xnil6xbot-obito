const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

const bansFile = path.join(process.cwd(), "database/bans.json");

const getBans = (threadID) => {
  try {
    const data = fs.readJsonSync(bansFile);
    return data[threadID] || [];
  } catch {
    return [];
  }
};

module.exports.config = {
  name: "ادخل",
  aliases: ["add", "invite", "join"],
  version: "2.0",
  author: "Enhanced",
  countDown: 10,
  role: 0,
  description: "إضافة عضو إلى المجموعة",
  category: "المجموعة",
  guide: `{pn} [ID|رابط|@منشن]: إضافة عضو
{pn} رد: إضافة من خلال الرد
{pn} إحصائيات: عرض إحصائيات الإضافات`
};

module.exports.langs = {
  ar: {
    groupOnly: "⚠️ هذا الأمر للمجموعات فقط!",
    needTarget: "❌ لازم تحدد الشخص: ايدي أو رابط أو @منشن أو رد على رسالة",
    invalidLink: "⚠️ الرابط غير صحيح - لازم يحتوي على ايدي فيسبوك",
    userBanned: "🚫 هذا الشخص مبان من المجموعة!\n📝 السبب: {0}\n⏱️ التاريخ: {1}",
    alreadyInGroup: "ℹ️ هذا الشخص موجود بالفعل في المجموعة",
    notAdmin: "🔴 البوت لازم يكون أدمن لإضافة أعضاء!",
    blocked: "🚫 الشخص محظور أو حظر المجموعة (قيود فيسبوك)",
    cannotAdd: "⚠️ فيسبوك منع إضافة هذا الشخص:\n• قد يكون الحساب محذوف\n• أو محظور من المجموعة\n• أو عطل تقني",
    apiError: "❌ خطأ في الاتصال: {0}",
    addSuccess: "✅ تم إضافة ({0}) بنجاح!\n⏱️ الوقت: {1}",
    addFailed: "❌ فشل الإضافة - خطأ غير متوقع",
    userNotFound: "🔍 لم يتم العثور على هذا الشخص",
    invalidID: "❌ ايدي غير صحيح - لازم أرقام فقط",
    selfAdd: "😅 لا تستطيع إضافة نفسك!",
    botAdd: "😅 لا تستطيع إضافة البوت!",
    statsHeader: "📊 إحصائيات الإضافات",
    statsSuccess: "✅ إضافات ناجحة: {0}",
    statsFailed: "❌ محاولات فاشلة: {0}",
    statsBanned: "🚫 أشخاص مبانون: {0}",
    statsEmpty: "📭 لا توجد إحصائيات بعد",
    recentAdds: "📝 آخر 5 إضافات:\n{0}",
    recentAddItem: "{0}. {1} - {2}"
  }
};

module.exports.onStart = async function ({ api, event, args, message, usersData, threadsData, getLang }) {
  try {
    const { threadID, senderID, messageReply } = event;
    const threadInfo = await api.getThreadInfo(threadID);

    // التحقق: مجموعة أم لا؟
    if (!threadInfo.isGroup) {
      return message.reply(getLang("groupOnly"));
    }

    // تحديد الشخص المراد إضافته
    let targetID;
    let targetName = "مجهول";

    // الرد على رسالة
    if (event.type === "message_reply" && messageReply) {
      targetID = messageReply.senderID;
    }
    // المنشن
    else if (Object.keys(event.mentions || {}).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    }
    // الـ ID أو الرابط
    else if (args && args[0]) {
      targetID = args[0].trim();

      // فحص الرابط
      if (targetID.includes("facebook.com")) {
        const match = targetID.match(/facebook\.com\/(?:profile\.php\?id=)?(\d+)/);
        if (match) {
          targetID = match[1];
        } else {
          return message.reply(getLang("invalidLink"));
        }
      }
    }

    if (!targetID) {
      return message.reply(getLang("needTarget"));
    }

    // التحقق من صحة الـ ID
    if (!/^\d+$/.test(targetID)) {
      return message.reply(getLang("invalidID"));
    }

    // منع إضافة النفس
    if (targetID === senderID) {
      return message.reply(getLang("selfAdd"));
    }

    // منع إضافة البوت
    const botID = api.getCurrentUserID();
    if (targetID === botID) {
      return message.reply(getLang("botAdd"));
    }

    // التحقق من الحظر
    const bans = getBans(threadID);
    const banRecord = bans.find(b => b.userID === targetID);
    if (banRecord) {
      const banTime = banRecord.date || "غير معروف";
      const banReason = banRecord.reason || "بدون سبب";
      return message.reply(getLang("userBanned", banReason, banTime));
    }

    // التحقق من صلاحيات البوت
    const botMember = threadInfo.adminIDs?.includes(botID);
    if (!botMember) {
      return message.reply(getLang("notAdmin"));
    }

    // الحصول على اسم الشخص
    try {
      const userInfo = await api.getUserInfo(targetID);
      targetName = userInfo[targetID]?.name || "مجهول";
    } catch (e) {
      console.log("[ADD] Could not fetch user info:", e.message);
    }

    // محاولة الإضافة
    api.addUserToGroup(targetID, threadID, async (err) => {
      try {
        // تحديث الإحصائيات
        const stats = await threadsData.get(threadID, "data.add_stats", {
          success: 0,
          failed: 0,
          banned: 0,
          recent: []
        });

        const timeStr = moment().tz(global.GoatBot?.config?.timeZone || "Asia/Baghdad").format("HH:mm:ss DD/MM/YYYY");

        if (err) {
          const errorMsg = (err.message || "").toLowerCase();
          let response = "";

          // تحليل الأخطاء
          if (errorMsg.includes("not admin") || errorMsg.includes("not authorized")) {
            response = getLang("notAdmin");
          } else if (errorMsg.includes("already") || errorMsg.includes("member")) {
            response = getLang("alreadyInGroup");
          } else if (errorMsg.includes("blocked") || errorMsg.includes("block")) {
            response = getLang("blocked");
          } else if (errorMsg.includes("cannot add") || errorMsg.includes("cannot invite")) {
            response = getLang("cannotAdd");
          } else {
            response = getLang("apiError", errorMsg);
          }

          stats.failed++;
          await threadsData.set(threadID, stats, "data.add_stats");
          return message.reply(response);
        }

        // نجاح الإضافة
        stats.success++;
        stats.recent = stats.recent || [];
        stats.recent.unshift({
          name: targetName,
          id: targetID,
          time: timeStr,
          addedBy: senderID
        });
        if (stats.recent.length > 5) {
          stats.recent = stats.recent.slice(0, 5);
        }

        await threadsData.set(threadID, stats, "data.add_stats");
        message.reply(getLang("addSuccess", `${targetName} (${targetID})`, timeStr));

      } catch (statError) {
        console.error("[ADD] Stats error:", statError.message);
        // حتى لو فشل حفظ الإحصائيات، الإضافة تمت بنجاح
      }
    });

  } catch (error) {
    console.error("[ADD] Error:", error.message);
    message.reply(getLang("apiError", error.message));
  }
};

// أمر الإحصائيات
module.exports.onChat = async function ({ body, event, message, threadsData, getLang }) {
  if (!body || !body.toLowerCase().startsWith(".ادخل")) return;

  const args = body.slice(5).trim().split(/\s+/);
  
  if (args[0] === "إحصائيات" || args[0] === "stats") {
    try {
      const { threadID } = event;
      const stats = await threadsData.get(threadID, "data.add_stats", {
        success: 0,
        failed: 0,
        banned: 0,
        recent: []
      });

      let response = getLang("statsHeader") + "\n━━━━━━━━━━━━━━━━━━\n";
      response += getLang("statsSuccess", stats.success) + "\n";
      response += getLang("statsFailed", stats.failed) + "\n";
      response += getLang("statsBanned", stats.banned) + "\n";

      if (stats.recent?.length > 0) {
        response += "\n" + getLang("recentAdds");
        for (const [idx, add] of stats.recent.entries()) {
          response += "\n" + getLang("recentAddItem", idx + 1, add.name, add.time);
        }
      }

      message.reply(response);
    } catch (error) {
      console.error("[ADD Stats] Error:", error.message);
      message.reply("❌ خطأ في جلب الإحصائيات");
    }
  }
};
