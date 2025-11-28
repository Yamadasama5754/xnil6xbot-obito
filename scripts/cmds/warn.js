const moment = require("moment-timezone");

module.exports.config = {
  name: "تحذير",
  aliases: ["warn"],
  version: "3.2",
  author: "Enhanced",
  countDown: 5,
  role: 0,
  description: "نظام تحذير",
  category: "المجموعة"
};

module.exports.langs = {
  ar: {
    groupOnly: "⚠️ هذا الأمر للمجموعات فقط!",
    noPermission: "🚫 فقط الأدمن يمكنهم تحذير الأعضاء!",
    notFound: "❌ لم أجد الشخص المراد تحذيره!"
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
    
    // تحويل إلى string للمقارنة
    const isSenderAdmin = adminIDs.some(id => String(id) === String(senderID));

    // === قائمة التحذيرات ===
    if (args[0] === "list" || args[0] === "قائمة") {
      const warnData = await threadsData.get(threadID, "data.warn_system", []);
      const warned = warnData.filter(w => w.warnings?.length > 0);

      if (!warned.length) {
        return message.reply("✅ لا توجد تحذيرات");
      }

      let msg = `📋 قائمة المحذرين (${warned.length})\n━━━━━━━━━━━━━━━━━━\n`;

      for (let i = 0; i < Math.min(warned.length, 10); i++) {
        const user = warned[i];
        const userName = await usersData.getName(user.uid) || "مستخدم";
        msg += `${i + 1}. ${userName} - ${user.warnings.length} تحذير\n`;
      }

      return message.reply(msg);
    }

    // === تحذير جديد ===
    if (!isSenderAdmin) {
      return message.reply("🚫 فقط الأدمن يمكنهم تحذير الأعضاء!");
    }

    let target = await getTarget(args, event);
    if (!target) {
      return message.reply("❌ لم أجد الشخص المراد تحذيره!");
    }

    if (String(target) === String(senderID)) {
      return message.reply("🚫 لا يمكنك تحذير نفسك!");
    }

    if (String(target) === String(botID)) {
      return message.reply("🚫 لا يمكنك تحذير البوت!");
    }

    if (adminIDs.some(id => String(id) === String(target))) {
      return message.reply("🚫 لا يمكنك تحذير أدمن!");
    }

    const reason = args.slice(1).join(" ") || "0";
    const time = moment().tz(global.GoatBot?.config?.timeZone || "Asia/Baghdad").format("HH:mm:ss DD/MM/YYYY");

    const warnData = await threadsData.get(threadID, "data.warn_system", []);
    let user = warnData.find(w => w.uid == target);

    if (!user) {
      user = { uid: target, warnings: [] };
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

    const targetName = await usersData.getName(target) || "مستخدم";

    // تصعيد تلقائي
    if (warnCount >= 3) {
      if (adminIDs.some(id => String(id) === String(botID))) {
        try {
          await api.removeUserFromGroup(target, threadID);
          return message.reply(`🚨 تم طرد ${targetName}! (3 تحذيرات)`);
        } catch (err) {
          console.log("[WARN] Kick error");
        }
      }
    }

    return message.reply(`⚠️ تحذير #${warnCount}\n👤 ${targetName}\n📝 السبب: ${reason}\n⏱️ الوقت: ${time}`);

  } catch (error) {
    console.error("[WARN] Error:", error.message);
    message.reply("❌ حدث خطأ");
  }
};
