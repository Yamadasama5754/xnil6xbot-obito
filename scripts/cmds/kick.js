const moment = require("moment-timezone");

module.exports.config = {
  name: "طرد",
  aliases: ["kick", "remove", "إزالة"],
  version: "2.0",
  author: "Enhanced",
  countDown: 5,
  role: 1,
  description: "نظام طرد متقدم مع سجل كامل",
  category: "المجموعة",
  guide: `{pn} [@منشن|uid|رد] [السبب]: طرد عضو
{pn} قائمة: عرض المطرودين
{pn} معلومات [@منشن|uid|رد]: معلومات الطردات
{pn} إحصائيات: عرض الإحصائيات
{pn} إعادة_تعيين: مسح السجلات`
};

module.exports.langs = {
  ar: {
    // === رسائل النجاح ===
    kickSuccess: "👋 تم طرد العضو بنجاح\n👤 {0}\n📝 السبب: {1}\n⏱️ الوقت: {2}",
    
    // === رسائل الخطأ ===
    notFoundTarget: "❌ لم أجد الشخص المراد طرده!\n💡 استخدم: @منشن أو uid أو رد على رسالة",
    noPermission: "🚫 فقط الأدمن يمكنهم طرد الأعضاء!",
    cantKickAdmin: "🚫 لا يمكنك طرد الأدمن!",
    cantKickYourself: "🚫 لا يمكنك طرد نفسك!",
    cantKickBot: "🚫 لا يمكنك طرد البوت!",
    userNotInGroup: "❌ الشخص ليس في المجموعة!",
    kickFailed: "❌ فشل الطرد (تحقق من الصلاحيات)",
    needAdminRights: "⚠️ البوت يحتاج صلاحيات أدمن للطرد",
    
    // === رسائل القوائم ===
    listHeader: "📋 سجل المطرودين ({0} شخص)",
    listEmpty: "✅ لا يوجد سجلات طردات",
    listItem: "{0}. {1} ({2})\n   📝 السبب: {3}\n   ⏱️ التاريخ: {4}\n   ⚖️ من قبل: {5}\n",
    
    // === معلومات الطردات ===
    infoHeader: "📊 سجل طردات {0}",
    infoKicks: "إجمالي الطردات: {0}",
    noKickHistory: "✅ لا يوجد سجلات طرد لهذا الشخص",
    
    // === الإحصائيات ===
    statsHeader: "📈 إحصائيات الطردات",
    totalKicks: "👥 إجمالي الطردات: {0}",
    uniqueUsers: "🚪 عدد الأشخاص المطرودين: {0}",
    topKicker: "🏆 الأكثر طرداً: {0} ({1} طرد)",
    topKicked: "😞 الأكثر طرداً: {0} ({1} مرات)",
    
    // === رسائل أخرى ===
    noReason: "بدون سبب محدد",
    noName: "مستخدم فيسبوك",
    resetSuccess: "✅ تم مسح سجلات الطردات",
    
    // === أحداث ===
    autoKickDetected: "🚨 تنبيه تلقائي\n{0} حاول الانضمام لكن تم طرده (محظور)",
    requireAdminForAutoKick: "⚠️ لا يمكن الطرد التلقائي (صلاحيات ناقصة)"
  }
};

// === دالة الحصول على الهدف ===
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

// === دالة الحصول على السبب ===
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
    const kickData = await threadsData.get(threadID, "data.kick_system", []);

    // === الأوامر الفرعية ===

    if (args[0] === "قائمة" || args[0] === "list") {
      if (!kickData.length) {
        return message.reply(getLang("listEmpty"));
      }
      
      let msg = getLang("listHeader", kickData.length) + "\n━━━━━━━━━━━━━━━━━━\n";
      for (const [idx, kick] of kickData.entries()) {
        const name = await usersData.getName(kick.uid) || getLang("noName");
        const kickedBy = await usersData.getName(kick.kickedBy) || "مجهول";
        msg += getLang("listItem", idx + 1, name, kick.uid, kick.reason, kick.time, kickedBy);
      }
      return message.reply(msg);
    }

    if (args[0] === "معلومات" || args[0] === "info") {
      let targetID = await getTarget(args, event);
      if (!targetID) {
        targetID = senderID;
      }

      const userKicks = kickData.filter(k => k.uid == targetID);
      if (!userKicks.length) {
        return message.reply(getLang("noKickHistory"));
      }

      const name = await usersData.getName(targetID) || getLang("noName");
      let msg = getLang("infoHeader", name) + "\n━━━━━━━━━━━━━━━━━━\n";
      msg += getLang("infoKicks", userKicks.length) + "\n\n";
      
      for (const [idx, kick] of userKicks.entries()) {
        const kickedBy = await usersData.getName(kick.kickedBy) || "مجهول";
        msg += `#{idx + 1}\n   📝 السبب: ${kick.reason}\n   ⏱️ التاريخ: ${kick.time}\n   ⚖️ من قبل: ${kickedBy}\n`;
      }
      
      return message.reply(msg);
    }

    if (args[0] === "إحصائيات" || args[0] === "stats") {
      const totalKicks = kickData.length;
      const uniqueUsers = new Set(kickData.map(k => k.uid)).size;
      
      let topKicker = {};
      for (const kick of kickData) {
        topKicker[kick.kickedBy] = (topKicker[kick.kickedBy] || 0) + 1;
      }
      let topKickerID = Object.keys(topKicker).reduce((a, b) => 
        topKicker[a] > topKicker[b] ? a : b, null
      );
      
      let topKicked = {};
      for (const kick of kickData) {
        topKicked[kick.uid] = (topKicked[kick.uid] || 0) + 1;
      }
      let topKickedID = Object.keys(topKicked).reduce((a, b) => 
        topKicked[a] > topKicked[b] ? a : b, null
      );

      let msg = getLang("statsHeader") + "\n━━━━━━━━━━━━━━━━━━\n";
      msg += getLang("totalKicks", totalKicks) + "\n";
      msg += getLang("uniqueUsers", uniqueUsers) + "\n";
      
      if (topKickerID) {
        const topKickerName = await usersData.getName(topKickerID) || getLang("noName");
        msg += getLang("topKicker", topKickerName, topKicker[topKickerID]) + "\n";
      }
      
      if (topKickedID) {
        const topKickedName = await usersData.getName(topKickedID) || getLang("noName");
        msg += getLang("topKicked", topKickedName, topKicked[topKickedID]);
      }
      
      return message.reply(msg);
    }

    if (args[0] === "إعادة_تعيين" || args[0] === "reset") {
      if (!adminIDs.includes(senderID)) {
        return message.reply(getLang("noPermission"));
      }

      await threadsData.set(threadID, [], "data.kick_system");
      return message.reply(getLang("resetSuccess"));
    }

    // === طرد جديد ===
    if (!adminIDs.includes(senderID)) {
      return message.reply(getLang("noPermission"));
    }

    let targetID = await getTarget(args, event);
    if (!targetID) {
      return message.reply(getLang("notFoundTarget"));
    }

    if (targetID === senderID) {
      return message.reply(getLang("cantKickYourself"));
    }

    if (targetID === botID) {
      return message.reply(getLang("cantKickBot"));
    }

    if (adminIDs.includes(targetID)) {
      return message.reply(getLang("cantKickAdmin"));
    }

    if (!threadInfo.participantIDs?.includes(targetID)) {
      return message.reply(getLang("userNotInGroup"));
    }

    const reason = getReason(args, event);
    const time = moment().tz(global.GoatBot?.config?.timeZone || "Asia/Baghdad").format("HH:mm:ss DD/MM/YYYY");

    if (!adminIDs.includes(botID)) {
      return message.reply(getLang("needAdminRights"));
    }

    try {
      await api.removeUserFromGroup(targetID, threadID);

      kickData.push({
        uid: targetID,
        reason,
        time,
        timestamp: kickData.length + 1,
        kickedBy: senderID
      });

      await threadsData.set(threadID, kickData, "data.kick_system");

      const name = await usersData.getName(targetID) || getLang("noName");
      return message.reply(getLang("kickSuccess", name, reason, time));

    } catch (err) {
      console.error("[KICK] Error:", err.message);
      return message.reply(getLang("kickFailed"));
    }

  } catch (error) {
    console.error("[KICK] Critical Error:", error.message);
    message.reply("❌ حدث خطأ: " + error.message);
  }
};

module.exports.onEvent = async function ({ event, api, threadsData, usersData, message, getLang }) {
  try {
    if (event.logMessageType === "log:subscribe") {
      const { threadID } = event;
      const banData = await threadsData.get(threadID, "data.banned_list", []);

      if (!banData.length) return;

      const addedUsers = event.logMessageData?.addedParticipants || [];
      const threadInfo = await api.getThreadInfo(threadID);
      const botID = api.getCurrentUserID();
      const isBotAdmin = threadInfo.adminIDs?.includes(botID);

      for (const addedUser of addedUsers) {
        const bannedUser = banData.find(b => b.id == addedUser.userFbId);
        
        if (bannedUser) {
          const name = await usersData.getName(addedUser.userFbId) || getLang("noName");
          
          let alert = `🚨 اكتشاف محاولة انضمام محظور!\n`;
          alert += `👤 ${name}\n`;
          alert += `📝 السبب: ${bannedUser.reason}`;
          
          message.send(alert);

          if (isBotAdmin) {
            try {
              await api.removeUserFromGroup(addedUser.userFbId, threadID);
              message.send(getLang("autoKickDetected", name));
            } catch (err) {
              message.send(getLang("requireAdminForAutoKick"));
            }
          } else {
            message.send(getLang("requireAdminForAutoKick"));
          }
        }
      }
    }
  } catch (error) {
    console.error("[KICK EVENT] Error:", error.message);
  }
};
