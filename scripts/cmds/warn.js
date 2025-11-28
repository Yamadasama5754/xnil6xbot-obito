const { getTime } = global.utils;
const moment = require("moment-timezone");

module.exports.config = {
  name: "تحذير",
  aliases: ["warn", "تحذر", "warning"],
  version: "3.0",
  author: "Enhanced",
  countDown: 5,
  role: 0,
  description: "نظام تحذير متقدم مع تصعيد تلقائي",
  category: "المجموعة",
  guide: `{pn} [@منشن|uid|رد] [السبب]: تحذير العضو
{pn} قائمة: عرض المحذرين
{pn} محظورين: عرض المحظورين (3+ تحذيرات)
{pn} معلومات [@منشن|uid|رد]: معلومات التحذيرات
{pn} حذف [@منشن|uid|رد] [الرقم]: حذف تحذير
{pn} رفع_الحظر [@منشن|uid|رد]: إلغاء الحظر
{pn} إحصائيات: عرض إحصائيات
{pn} إعادة_تعيين: مسح جميع البيانات`
};

module.exports.langs = {
  ar: {
    warnSuccess: "⚠️ تحذير #{0}\n👤 {1}\n📝 السبب: {2}\n⏱️ الوقت: {3}\n🚨 التحذيرات: {4}/3",
    warnFailedKick: "⚠️ تحذير #{0}\n👤 {1}\n📝 السبب: {2}\n🚨 التحذيرات: {3}/3\n❌ فشل الطرد (صلاحيات ناقصة)",
    warnBanned: "❌ تحذير #{0} - الحظر المباشر!\n👤 {1}\n📝 السبب: {2}\n🚨 التحذيرات: {3}/3\n✅ تم طرد العضو",
    unwarnSuccess: "✅ تم حذف التحذير #{0}\n👤 {1}\n📊 التحذيرات المتبقية: {2}",
    unbanSuccess: "🟢 تم إلغاء الحظر\n👤 {0}\n📝 التحذيرات السابقة: {1}",
    notFoundTarget: "❌ لم أجد الشخص المراد تحذيره!\n💡 استخدم: @منشن أو uid أو رد على رسالة",
    noPermission: "🚫 فقط الأدمن يمكنهم تحذير الأعضاء!",
    cantWarnAdmin: "🚫 لا يمكنك تحذير الأدمن!",
    cantWarnYourself: "🚫 لا يمكنك تحذير نفسك!",
    cantWarnBot: "🚫 لا يمكنك تحذير البوت!",
    userNotFound: "❌ الشخص لم يتم العثور عليه في المجموعة",
    noWarnings: "✅ هذا الشخص ليس لديه تحذيرات",
    invalidNumber: "❌ رقم التحذير غير صحيح!",
    listHeader: "📋 قائمة المحذرين ({0} أعضاء)",
    listEmpty: "✅ لا يوجد أعضاء محذرين",
    bannedHeader: "🚫 قائمة المحظورين ({0} أعضاء)",
    bannedEmpty: "✅ لا يوجد أعضاء محظورين",
    listItem: "{0}. {1} ({2}) - {3} تحذير",
    infoHeader: "📊 معلومات التحذيرات\n👤 {0}",
    infoItem: "#{0} • {1}\n   📝 السبب: {2}\n   ⏱️ الوقت: {3}\n   ⚖️ المحذر: {4}\n",
    statsHeader: "📈 إحصائيات التحذيرات",
    totalWarned: "👥 إجمالي المحذرين: {0}",
    totalWarnings: "⚠️ إجمالي التحذيرات: {0}",
    totalBanned: "🚫 إجمالي المحظورين: {0}",
    topWarned: "🏆 الأكثر تحذيراً: {0} ({1} تحذير)",
    noReason: "بدون سبب محدد",
    noName: "مستخدم فيسبوك",
    resetSuccess: "✅ تم إعادة تعيين جميع البيانات",
    needAdminToKick: "⚠️ البوت يحتاج صلاحيات أدمن لطرد الأعضاء",
    autoKickAlert: "🚨 تنبيه تلقائي\n{0} حاول الانضمام لكن تم طرده (محظور)",
    requireAdminAlert: "⚠️ يتطلب صلاحيات أدمن\nلم أستطع طرد المحظور {0}",
    syntaxError: "❌ صيغة خاطئة!\n💡 اكتب .تحذير للمساعدة"
  }
};

async function getTarget(args, event) {
  if (Object.keys(event.mentions || {}).length) {
    return Object.keys(event.mentions)[0];
  }
  if (event.messageReply?.senderID) {
    return event.messageReply.senderID;
  }
  if (!isNaN(args[0]) && args[0]) {
    return args[0];
  }
  return null;
}

function getReason(args, event) {
  let reason = args.join(" ").trim();
  Object.keys(event.mentions || {}).forEach(uid => {
    reason = reason.replace(event.mentions[uid], "").trim();
  });
  if (!isNaN(args[0])) {
    reason = args.slice(1).join(" ").trim();
  }
  return reason || "بدون سبب";
}

module.exports.onStart = async function ({ message, api, event, args, threadsData, usersData, getLang }) {
  try {
    const { threadID, senderID } = event;
    const threadInfo = await api.getThreadInfo(threadID);
    
    if (!threadInfo.isGroup) {
      return message.reply("⚠️ | هذا الأمر للمجموعات فقط!");
    }

    const adminIDs = threadInfo.adminIDs || [];
    const botID = api.getCurrentUserID();
    const warnData = await threadsData.get(threadID, "data.warn_system", []);
    const isUserAdmin = adminIDs.includes(senderID);

    if (args[0] === "قائمة" || args[0] === "list") {
      const warned = warnData.filter(w => w.warnings?.length > 0);
      if (!warned.length) {
        return message.reply(getLang("listEmpty"));
      }
      let msg = getLang("listHeader", warned.length) + "\n━━━━━━━━━━━━━━━━━━\n";
      for (const [idx, user] of warned.entries()) {
        const name = await usersData.getName(user.uid) || getLang("noName");
        msg += getLang("listItem", idx + 1, name, user.uid, user.warnings.length) + "\n";
      }
      return message.reply(msg);
    }

    if (args[0] === "محظورين" || args[0] === "banned") {
      const banned = warnData.filter(w => w.warnings?.length >= 3);
      if (!banned.length) {
        return message.reply(getLang("bannedEmpty"));
      }
      let msg = getLang("bannedHeader", banned.length) + "\n━━━━━━━━━━━━━━━━━━\n";
      for (const [idx, user] of banned.entries()) {
        const name = await usersData.getName(user.uid) || getLang("noName");
        msg += getLang("listItem", idx + 1, name, user.uid, user.warnings.length) + "\n";
      }
      return message.reply(msg);
    }

    if (args[0] === "معلومات" || args[0] === "info") {
      let targetID = await getTarget(args, event);
      if (!targetID) targetID = senderID;
      const user = warnData.find(w => w.uid == targetID);
      if (!user || !user.warnings?.length) {
        return message.reply(getLang("noWarnings"));
      }
      const name = await usersData.getName(targetID) || getLang("noName");
      let msg = getLang("infoHeader", name) + "\n━━━━━━━━━━━━━━━━━━\n";
      for (const [idx, warn] of user.warnings.entries()) {
        const warnBy = await usersData.getName(warn.warnedBy) || "مجهول";
        msg += getLang("infoItem", idx + 1, warn.timestamp, warn.reason, warn.time, warnBy);
      }
      return message.reply(msg);
    }

    if (args[0] === "إحصائيات" || args[0] === "stats") {
      const totalWarned = warnData.filter(w => w.warnings?.length > 0).length;
      const totalWarnings = warnData.reduce((sum, w) => sum + (w.warnings?.length || 0), 0);
      const totalBanned = warnData.filter(w => w.warnings?.length >= 3).length;
      let topUser = warnData.reduce((prev, current) => 
        ((prev.warnings?.length || 0) > (current.warnings?.length || 0)) ? prev : current, { warnings: [] }
      );
      let msg = getLang("statsHeader") + "\n━━━━━━━━━━━━━━━━━━\n";
      msg += getLang("totalWarned", totalWarned) + "\n";
      msg += getLang("totalWarnings", totalWarnings) + "\n";
      msg += getLang("totalBanned", totalBanned) + "\n";
      if ((topUser.warnings?.length || 0) > 0) {
        const topName = await usersData.getName(topUser.uid) || getLang("noName");
        msg += getLang("topWarned", topName, topUser.warnings.length);
      }
      return message.reply(msg);
    }

    if (args[0] === "حذف" || args[0] === "remove") {
      if (!isUserAdmin) {
        return message.reply(getLang("noPermission"));
      }
      let targetID = await getTarget(args, event);
      if (!targetID) {
        return message.reply(getLang("notFoundTarget"));
      }
      const user = warnData.find(w => w.uid == targetID);
      if (!user || !user.warnings?.length) {
        return message.reply(getLang("noWarnings"));
      }
      let warnNum = parseInt(args[args.length - 1]) || user.warnings.length;
      if (isNaN(warnNum) || warnNum < 1 || warnNum > user.warnings.length) {
        return message.reply(getLang("invalidNumber"));
      }
      const removed = user.warnings.splice(warnNum - 1, 1)[0];
      if (user.warnings.length === 0) {
        warnData.splice(warnData.indexOf(user), 1);
      }
      await threadsData.set(threadID, warnData, "data.warn_system");
      const name = await usersData.getName(targetID) || getLang("noName");
      return message.reply(getLang("unwarnSuccess", warnNum, name, user.warnings.length));
    }

    if (args[0] === "رفع_الحظر" || args[0] === "unban") {
      if (!isUserAdmin) {
        return message.reply(getLang("noPermission"));
      }
      let targetID = await getTarget(args, event);
      if (!targetID) {
        return message.reply(getLang("notFoundTarget"));
      }
      const user = warnData.find(w => w.uid == targetID);
      if (!user) {
        return message.reply(getLang("noWarnings"));
      }
      const oldCount = user.warnings.length;
      user.warnings = [];
      await threadsData.set(threadID, warnData, "data.warn_system");
      const name = await usersData.getName(targetID) || getLang("noName");
      return message.reply(getLang("unbanSuccess", name, oldCount));
    }

    if (args[0] === "إعادة_تعيين" || args[0] === "reset") {
      if (!isUserAdmin) {
        return message.reply(getLang("noPermission"));
      }
      await threadsData.set(threadID, [], "data.warn_system");
      return message.reply(getLang("resetSuccess"));
    }

    // === تحذير جديد - التحقق من صلاحيات الأدمن ===
    if (!isUserAdmin) {
      return message.reply(getLang("noPermission"));
    }

    let targetID = await getTarget(args, event);
    if (!targetID) {
      return message.reply(getLang("notFoundTarget"));
    }

    if (targetID === senderID) {
      return message.reply(getLang("cantWarnYourself"));
    }

    if (targetID === botID) {
      return message.reply(getLang("cantWarnBot"));
    }

    if (adminIDs.includes(targetID)) {
      return message.reply(getLang("cantWarnAdmin"));
    }

    const reason = getReason(args, event);
    const time = moment().tz(global.GoatBot?.config?.timeZone || "Asia/Baghdad").format("HH:mm:ss DD/MM/YYYY");

    let user = warnData.find(w => w.uid == targetID);
    if (!user) {
      user = { uid: targetID, warnings: [] };
      warnData.push(user);
    }

    user.warnings.push({
      reason,
      time,
      timestamp: user.warnings.length + 1,
      warnedBy: senderID
    });

    const warnCount = user.warnings.length;
    await threadsData.set(threadID, warnData, "data.warn_system");
    const name = await usersData.getName(targetID) || getLang("noName");

    if (warnCount >= 3) {
      if (adminIDs.includes(botID)) {
        try {
          await api.removeUserFromGroup(targetID, threadID);
          return message.reply(getLang("warnBanned", warnCount, name, reason, warnCount));
        } catch (err) {
          return message.reply(getLang("warnFailedKick", warnCount, name, reason, warnCount));
        }
      } else {
        return message.reply(getLang("warnFailedKick", warnCount, name, reason, warnCount));
      }
    } else {
      return message.reply(getLang("warnSuccess", warnCount, name, reason, time, warnCount));
    }

  } catch (error) {
    console.error("[WARN] Error:", error.message);
    message.reply("❌ حدث خطأ: " + error.message);
  }
};

module.exports.onEvent = async function ({ event, api, threadsData, usersData, message, getLang }) {
  try {
    if (event.logMessageType === "log:subscribe") {
      const { threadID } = event;
      const warnData = await threadsData.get(threadID, "data.warn_system", []);
      if (!warnData.length) return;
      const addedUsers = event.logMessageData?.addedParticipants || [];
      const threadInfo = await api.getThreadInfo(threadID);
      const botID = api.getCurrentUserID();
      const isBotAdmin = threadInfo.adminIDs?.includes(botID);
      for (const addedUser of addedUsers) {
        const bannedUser = warnData.find(w => w.uid == addedUser.userFbId && w.warnings?.length >= 3);
        if (bannedUser) {
          const name = await usersData.getName(addedUser.userFbId) || getLang("noName");
          message.send(`🚨 اكتشاف محاولة انضمام محظور!\n👤 ${name}\n⚠️ التحذيرات: ${bannedUser.warnings.length}/3`);
          if (isBotAdmin) {
            try {
              await api.removeUserFromGroup(addedUser.userFbId, threadID);
              message.send(getLang("autoKickAlert", name));
            } catch (err) {
              message.send(getLang("requireAdminAlert", name));
            }
          } else {
            message.send(getLang("requireAdminAlert", name));
          }
        }
      }
    }
  } catch (error) {
    console.error("[WARN EVENT] Error:", error.message);
  }
};
