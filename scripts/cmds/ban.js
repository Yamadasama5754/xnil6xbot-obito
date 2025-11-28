const moment = require("moment-timezone");

module.exports.config = {
  name: "حظر",
  aliases: ["ban", "block"],
  version: "2.1",
  author: "Enhanced",
  countDown: 5,
  role: 0,
  description: "حظر عضو",
  category: "المجموعة",
  guide: "{pn} [@منشن|uid]: حظر عضو\n{pn} list: قائمة المحظورين\n{pn} unban: إلغاء الحظر"
};

module.exports.langs = {
  ar: {
    groupOnly: "⚠️ هذا الأمر للمجموعات فقط!",
    noPermission: "🚫 فقط الأدمن يمكنهم حظر الأعضاء!",
    notFound: "❌ لم أجد الشخص المراد حظره!",
    cantBanSelf: "🚫 لا يمكنك حظر نفسك!",
    cantBanAdmin: "🚫 لا يمكنك حظر أدمن!",
    cantBanBot: "🚫 لا يمكنك حظر البوت!",
    alreadyBanned: "⚠️ هذا الشخص محظور بالفعل!",
    needBotAdmin: "🔴 البوت يحتاج صلاحيات أدمن!",
    bannedSuccess: "🔴 تم حظر {0}\n📝 السبب: {1}\n⏱️ الوقت: {2}",
    unbannedSuccess: "🟢 تم إلغاء حظر {0}",
    userNotBanned: "⚠️ الشخص {0} غير محظور!",
    noData: "✅ لا يوجد محظورين",
    listHeader: "📋 قائمة المحظورين ({0})",
    listItem: "{0}. {1} - {2}"
  }
};

async function getTarget(args, event) {
  if (Object.keys(event.mentions || {}).length) {
    return Object.keys(event.mentions)[0];
  }
  if (event.messageReply?.senderID) {
    return event.messageReply.senderID;
  }
  if (/^\d+$/.test(args[0])) {
    return args[0];
  }
  return null;
}

module.exports.onStart = async function ({ message, event, args, threadsData, getLang, usersData, api }) {
  try {
    const { threadID, senderID } = event;
    const threadInfo = await api.getThreadInfo(threadID);

    if (!threadInfo.isGroup) {
      return message.reply(getLang("groupOnly"));
    }

    const adminIDs = threadInfo.adminIDs || [];
    const botID = api.getCurrentUserID();
    const isSenderAdmin = adminIDs.includes(senderID);

    // === قسم إلغاء الحظر ===
    if (args[0] === "unban" || args[0] === "إلغاء") {
      if (!isSenderAdmin) {
        return message.reply(getLang("noPermission"));
      }

      let target = await getTarget(args, event);
      if (!target) {
        return message.reply(getLang("notFound"));
      }

      const dataBanned = await threadsData.get(threadID, "data.banned_list", []);
      const banIndex = dataBanned.findIndex(item => item.id == target);
      
      if (banIndex === -1) {
        return message.reply(getLang("userNotBanned", target));
      }

      dataBanned.splice(banIndex, 1);
      await threadsData.set(threadID, dataBanned, "data.banned_list");
      
      const targetName = await usersData.getName(target) || "مستخدم";
      return message.reply(getLang("unbannedSuccess", targetName));
    }

    // === قسم القائمة ===
    if (args[0] === "list" || args[0] === "قائمة") {
      const dataBanned = await threadsData.get(threadID, "data.banned_list", []);
      
      if (!dataBanned.length) {
        return message.reply(getLang("noData"));
      }

      let msg = getLang("listHeader", dataBanned.length) + "\n━━━━━━━━━━━━━━━━━━\n";
      
      for (let i = 0; i < Math.min(dataBanned.length, 10); i++) {
        const user = dataBanned[i];
        const userName = await usersData.getName(user.id) || "مستخدم";
        msg += getLang("listItem", i + 1, userName, user.reason || "بدون سبب") + "\n";
      }

      return message.reply(msg);
    }

    // === حظر جديد ===
    if (!isSenderAdmin) {
      return message.reply(getLang("noPermission"));
    }

    if (!adminIDs.includes(botID)) {
      return message.reply(getLang("needBotAdmin"));
    }

    let target = await getTarget(args, event);
    if (!target) {
      return message.reply(getLang("notFound"));
    }

    if (target === senderID) {
      return message.reply(getLang("cantBanSelf"));
    }

    if (target === botID) {
      return message.reply(getLang("cantBanBot"));
    }

    if (adminIDs.includes(target)) {
      return message.reply(getLang("cantBanAdmin"));
    }

    const dataBanned = await threadsData.get(threadID, "data.banned_list", []);
    
    if (dataBanned.some(b => b.id == target)) {
      return message.reply(getLang("alreadyBanned"));
    }

    const reason = args.slice(1).join(" ") || "0";
    const time = moment().tz(global.GoatBot?.config?.timeZone || "Asia/Baghdad").format("HH:mm:ss DD/MM/YYYY");

    dataBanned.push({
      id: target,
      reason: reason,
      time: time,
      bannedBy: senderID
    });

    await threadsData.set(threadID, dataBanned, "data.banned_list");

    // محاولة الطرد الفوري
    try {
      await api.removeUserFromGroup(target, threadID);
    } catch (err) {
      console.log("[BAN] Kick error:", err.message);
    }

    const targetName = await usersData.getName(target) || "مستخدم";
    return message.reply(getLang("bannedSuccess", targetName, reason, time));

  } catch (error) {
    console.error("[BAN] Error:", error.message);
    message.reply("❌ حدث خطأ");
  }
};

// حدث الانضمام - طرد تلقائي للمحظورين
module.exports.onEvent = async function ({ event, threadsData, api, usersData, message }) {
  try {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID } = event;
    const dataBanned = await threadsData.get(threadID, "data.banned_list", []);

    if (!dataBanned.length) return;

    const addedUsers = event.logMessageData?.addedParticipants || [];
    const botID = api.getCurrentUserID();
    const threadInfo = await api.getThreadInfo(threadID);
    const isBotAdmin = threadInfo.adminIDs?.includes(botID);

    for (const user of addedUsers) {
      const banned = dataBanned.find(b => b.id == user.userFbId);
      
      if (banned && isBotAdmin) {
        try {
          await api.removeUserFromGroup(user.userFbId, threadID);
          const name = await usersData.getName(user.userFbId) || "مستخدم";
          message.send(`🚫 تم طرد ${name} (محظور - السبب: ${banned.reason})`);
        } catch (err) {
          console.log("[BAN EVENT] Kick failed");
        }
      }
    }
  } catch (error) {
    console.error("[BAN EVENT] Error:", error.message);
  }
};
