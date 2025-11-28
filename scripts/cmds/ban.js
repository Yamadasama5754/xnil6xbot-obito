const moment = require("moment-timezone");

module.exports.config = {
  name: "حظر",
  aliases: ["ban"],
  version: "2.2",
  author: "Enhanced",
  countDown: 5,
  role: 0,
  description: "حظر عضو",
  category: "المجموعة"
};

module.exports.langs = {
  ar: {
    groupOnly: "⚠️ هذا الأمر للمجموعات فقط!"
  }
};

async function getTarget(args, event) {
  if (Object.keys(event.mentions || {}).length) {
    return Object.keys(event.mentions)[0];
  }
  if (event.messageReply?.senderID) {
    return event.messageReply.senderID;
  }
  if (args[0] && /^\d+$/.test(args[0])) {
    return args[0];
  }
  return null;
}

module.exports.onStart = async function ({ message, event, args, threadsData, usersData, api }) {
  try {
    const { threadID, senderID } = event;
    const threadInfo = await api.getThreadInfo(threadID);

    if (!threadInfo.isGroup) {
      return message.reply("⚠️ هذا الأمر للمجموعات فقط!");
    }

    const adminIDs = threadInfo.adminIDs || [];
    const botID = api.getCurrentUserID();
    
    const isSenderAdmin = adminIDs.some(id => String(id) === String(senderID));

    // === قائمة المحظورين ===
    if (args[0] === "list" || args[0] === "قائمة") {
      const dataBanned = await threadsData.get(threadID, "data.banned_list", []);

      if (!dataBanned.length) {
        return message.reply("✅ لا يوجد محظورين");
      }

      let msg = `📋 قائمة المحظورين (${dataBanned.length})\n━━━━━━━━━━━━━━━━━━\n`;

      for (let i = 0; i < Math.min(dataBanned.length, 10); i++) {
        const user = dataBanned[i];
        const userName = await usersData.getName(user.id) || "مستخدم";
        msg += `${i + 1}. ${userName} - ${user.reason || "بدون سبب"}\n`;
      }

      return message.reply(msg);
    }

    // === إلغاء الحظر ===
    if (args[0] === "unban" || args[0] === "إلغاء") {
      if (!isSenderAdmin) {
        return message.reply("🚫 فقط الأدمن يمكنهم إلغاء الحظر!");
      }

      let target = await getTarget(args, event);
      if (!target) {
        return message.reply("❌ لم أجد الشخص!");
      }

      const dataBanned = await threadsData.get(threadID, "data.banned_list", []);
      const banIndex = dataBanned.findIndex(item => item.id == target);

      if (banIndex === -1) {
        return message.reply("⚠️ الشخص غير محظور!");
      }

      dataBanned.splice(banIndex, 1);
      await threadsData.set(threadID, dataBanned, "data.banned_list");

      const targetName = await usersData.getName(target) || "مستخدم";
      return message.reply(`🟢 تم إلغاء حظر ${targetName}`);
    }

    // === حظر جديد ===
    if (!isSenderAdmin) {
      return message.reply("🚫 فقط الأدمن يمكنهم حظر الأعضاء!");
    }

    if (!adminIDs.some(id => String(id) === String(botID))) {
      return message.reply("🔴 البوت يحتاج صلاحيات أدمن!");
    }

    let target = await getTarget(args, event);
    if (!target) {
      return message.reply("❌ لم أجد الشخص المراد حظره!");
    }

    if (String(target) === String(senderID)) {
      return message.reply("🚫 لا يمكنك حظر نفسك!");
    }

    if (String(target) === String(botID)) {
      return message.reply("🚫 لا يمكنك حظر البوت!");
    }

    if (adminIDs.some(id => String(id) === String(target))) {
      return message.reply("🚫 لا يمكنك حظر أدمن!");
    }

    const dataBanned = await threadsData.get(threadID, "data.banned_list", []);

    if (dataBanned.some(b => b.id == target)) {
      return message.reply("⚠️ هذا الشخص محظور بالفعل!");
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
      console.log("[BAN] Kick error");
    }

    const targetName = await usersData.getName(target) || "مستخدم";
    return message.reply(`🔴 تم حظر ${targetName}\n📝 السبب: ${reason}\n⏱️ الوقت: ${time}`);

  } catch (error) {
    console.error("[BAN] Error:", error.message);
    message.reply("❌ حدث خطأ");
  }
};

module.exports.onEvent = async function ({ event, threadsData, api, usersData, message }) {
  try {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID } = event;
    const dataBanned = await threadsData.get(threadID, "data.banned_list", []);

    if (!dataBanned.length) return;

    const addedUsers = event.logMessageData?.addedParticipants || [];
    const botID = api.getCurrentUserID();
    const threadInfo = await api.getThreadInfo(threadID);
    const isBotAdmin = threadInfo.adminIDs?.some(id => String(id) === String(botID));

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
