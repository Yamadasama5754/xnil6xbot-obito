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
  guide: `{pn} [ID|رابط|@منشن]: إضافة عضو`
};

module.exports.langs = {
  ar: {
    groupOnly: "⚠️ هذا الأمر للمجموعات فقط!",
    needTarget: "❌ لازم تحدد الشخص: ايدي أو رابط أو @منشن أو رد على رسالة",
    invalidLink: "⚠️ الرابط غير صحيح",
    userBanned: "🚫 هذا الشخص مبان من المجموعة!",
    alreadyInGroup: "ℹ️ هذا الشخص موجود بالفعل في المجموعة",
    notAdmin: "🔴 البوت لازم يكون أدمن لإضافة أعضاء!",
    blocked: "🚫 الشخص محظور أو حظر المجموعة",
    cannotAdd: "⚠️ فيسبوك منع إضافة هذا الشخص",
    apiError: "❌ خطأ في الاتصال",
    addSuccess: "✅ تم إضافة العضو بنجاح!",
    invalidID: "❌ ايدي غير صحيح"
  }
};

module.exports.onStart = async function ({ api, event, args, message, usersData, threadsData, getLang }) {
  try {
    const { threadID, senderID, messageReply } = event;
    const threadInfo = await api.getThreadInfo(threadID);

    if (!threadInfo.isGroup) {
      return message.reply(getLang("groupOnly"));
    }

    let targetID;
    let targetName = "مجهول";

    if (event.type === "message_reply" && messageReply) {
      targetID = messageReply.senderID;
    } else if (Object.keys(event.mentions || {}).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } else if (args && args[0]) {
      targetID = args[0].trim();
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

    if (!/^\d+$/.test(targetID)) {
      return message.reply(getLang("invalidID"));
    }

    if (targetID === senderID) {
      return message.reply("😅 لا تستطيع إضافة نفسك!");
    }

    const botID = api.getCurrentUserID();
    if (targetID === botID) {
      return message.reply("😅 لا تستطيع إضافة البوت!");
    }

    const bans = getBans(threadID);
    const banRecord = bans.find(b => b.userID === targetID);
    if (banRecord) {
      return message.reply(getLang("userBanned"));
    }

    try {
      const userInfo = await api.getUserInfo(targetID);
      targetName = userInfo[targetID]?.name || "مجهول";
    } catch (e) {
      console.log("[ADD] User fetch failed");
    }

    api.addUserToGroup(targetID, threadID, async (err) => {
      try {
        const stats = await threadsData.get(threadID, "data.add_stats", {
          success: 0,
          failed: 0
        });
        const timeStr = moment().tz(global.GoatBot?.config?.timeZone || "Asia/Baghdad").format("HH:mm:ss");

        if (err) {
          const errorMsg = (err.message || "").toLowerCase();
          let response = getLang("apiError");

          if (errorMsg.includes("not admin") || errorMsg.includes("not authorized") || errorMsg.includes("permission")) {
            response = getLang("notAdmin");
          } else if (errorMsg.includes("already") || errorMsg.includes("member")) {
            response = getLang("alreadyInGroup");
          } else if (errorMsg.includes("blocked") || errorMsg.includes("block")) {
            response = getLang("blocked");
          } else if (errorMsg.includes("cannot")) {
            response = getLang("cannotAdd");
          }

          stats.failed++;
          await threadsData.set(threadID, stats, "data.add_stats");
          return message.reply(response);
        }

        stats.success++;
        await threadsData.set(threadID, stats, "data.add_stats");
        message.reply(getLang("addSuccess"));

      } catch (statError) {
        console.error("[ADD] Stats error:", statError.message);
      }
    });

  } catch (error) {
    console.error("[ADD] Error:", error.message);
    message.reply("❌ خطأ في الاتصال");
  }
};
