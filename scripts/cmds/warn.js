const moment = require("moment-timezone");

module.exports.config = {
  name: "تحذير",
  aliases: ["warn"],
  version: "3.1",
  author: "Enhanced",
  countDown: 5,
  role: 0,
  description: "نظام تحذير",
  category: "المجموعة",
  guide: "{pn} [@منشن|uid]: تحذير عضو\n{pn} list: قائمة المحذرين\n{pn} info: معلومات التحذيرات"
};

module.exports.langs = {
  ar: {
    groupOnly: "⚠️ هذا الأمر للمجموعات فقط!",
    noPermission: "🚫 فقط الأدمن يمكنهم تحذير الأعضاء!",
    notFound: "❌ لم أجد الشخص المراد تحذيره!",
    cantWarnSelf: "🚫 لا يمكنك تحذير نفسك!",
    cantWarnAdmin: "🚫 لا يمكنك تحذير أدمن!",
    cantWarnBot: "🚫 لا يمكنك تحذير البوت!",
    needBotAdmin: "🔴 البوت يحتاج صلاحيات أدمن!",
    warnSuccess: "⚠️ تحذير #{0}\n👤 {1}\n📝 السبب: {2}\n⏱️ الوقت: {3}",
    warnBanned: "🚨 تم طرد {0}! (3 تحذيرات)",
    noWarnings: "✅ لا توجد تحذيرات",
    listHeader: "📋 قائمة المحذرين ({0})",
    listItem: "{0}. {1} - {2} تحذير"
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

    // === قائمة التحذيرات ===
    if (args[0] === "list" || args[0] === "قائمة") {
      const warnData = await threadsData.get(threadID, "data.warn_system", []);
      const warned = warnData.filter(w => w.warnings?.length > 0);

      if (!warned.length) {
        return message.reply(getLang("noWarnings"));
      }

      let msg = getLang("listHeader", warned.length) + "\n━━━━━━━━━━━━━━━━━━\n";

      for (let i = 0; i < Math.min(warned.length, 10); i++) {
        const user = warned[i];
        const userName = await usersData.getName(user.uid) || "مستخدم";
        msg += getLang("listItem", i + 1, userName, user.warnings.length) + "\n";
      }

      return message.reply(msg);
    }

    // === معلومات التحذيرات ===
    if (args[0] === "info" || args[0] === "معلومات") {
      const warnData = await threadsData.get(threadID, "data.warn_system", []);
      let target = await getTarget(args, event);
      
      if (!target) target = senderID;

      const user = warnData.find(w => w.uid == target);
      if (!user || !user.warnings?.length) {
        return message.reply(getLang("noWarnings"));
      }

      const name = await usersData.getName(target) || "مستخدم";
      let msg = `📊 معلومات ${name}\n━━━━━━━━━━━\n`;

      user.warnings.forEach((w, i) => {
        msg += `#${i + 1} • ${w.reason}\n   ⏱️ ${w.time}\n`;
      });

      return message.reply(msg);
    }

    // === تحذير جديد ===
    if (!isSenderAdmin) {
      return message.reply(getLang("noPermission"));
    }

    let target = await getTarget(args, event);
    if (!target) {
      return message.reply(getLang("notFound"));
    }

    if (target === senderID) {
      return message.reply(getLang("cantWarnSelf"));
    }

    if (target === botID) {
      return message.reply(getLang("cantWarnBot"));
    }

    if (adminIDs.includes(target)) {
      return message.reply(getLang("cantWarnAdmin"));
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
      if (adminIDs.includes(botID)) {
        try {
          await api.removeUserFromGroup(target, threadID);
          return message.reply(getLang("warnBanned", targetName));
        } catch (err) {
          console.log("[WARN] Kick error");
        }
      }
    }

    return message.reply(getLang("warnSuccess", warnCount, targetName, reason, time));

  } catch (error) {
    console.error("[WARN] Error:", error.message);
    message.reply("❌ حدث خطأ");
  }
};
