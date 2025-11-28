const { findUid } = global.utils;
const moment = require("moment-timezone");

module.exports.config = {
  name: "حظر",
  aliases: ["ban", "طرد", "block"],
  version: "2.0",
  author: "Enhanced",
  countDown: 5,
  role: 1,
  description: "حظر عضو من المحادثة بشكل متكامل",
  category: "المجموعة",
  guide: "{pn} [@منشن|uid|رابط|رد] [السبب]: حظر عضو\n{pn} list: عرض المحظورين\n{pn} unban [@منشن|uid|رابط|رد]: إلغاء حظر\n{pn} check: فحص وطرد المحظورين"
};

module.exports.langs = {
  ar: {
    // النجاح
    bannedSuccess: "🔴 تم حظر {0} بنجاح!\n📝 السبب: {1}\n⏱️ الوقت: {2}",
    unbannedSuccess: "🟢 تم إلغاء حظر {0} بنجاح!",
    checkComplete: "✅ تم فحص المحظورين وطرد {0} عضو",
    
    // الأخطاء
    notFoundTarget: "❌ لم أجد الشخص المراد حظره!\n💡 استخدم: @منشن أو uid أو رابط أو رد على رسالته",
    notFoundTargetUnban: "❌ لم أجد الشخص المراد إلغاء حظره!\n💡 استخدم: @منشن أو uid أو رابط أو رد على رسالته",
    userNotBanned: "⚠️ الشخص {0} غير محظور في هذه المجموعة",
    cantSelfBan: "🚫 لا يمكنك حظر نفسك يا عبقري!",
    cantBanAdmin: "🚫 لا يمكنك حظر المشرف! 👮",
    cantBanBot: "🚫 لا يمكنك حظر البوت الذكي! 🤖",
    alreadyBanned: "⚠️ هذا الشخص محظور بالفعل! تم الحظر في: {0}",
    needAdmin: "⚠️ البوت يحتاج صلاحيات مشرف لطرد الأعضاء",
    
    // البيانات
    noReason: "بدون سبب محدد",
    noName: "مستخدم فيسبوك",
    noData: "✅ لا يوجد أعضاء محظورين في هذه المجموعة",
    
    // القوائم
    listHeader: "📋 قائمة المحظورين ({0}/{1})",
    listItem: "{0}. {1} ({2})\n   📝 السبب: {3}\n   ⏱️ التاريخ: {4}\n",
    
    // الأحداث
    banEventTitle: "🔴 نبيهة حظر",
    banEventDetected: "تم اكتشاف محظور يحاول الانضمام!",
    banEventName: "المحظور: {0}",
    banEventReason: "السبب الأصلي: {0}",
    banEventTime: "وقت الحظر: {0}",
    banEventKicked: "✅ تم طرده تلقائياً",
    banEventFailed: "⚠️ فشل الطرد التلقائي (مفقود الصلاحيات)"
  }
};

module.exports.onStart = async function ({ message, event, args, threadsData, getLang, usersData, api }) {
  try {
    const { threadID, senderID, messageID } = event;
    
    // التحقق من أن الأمر في مجموعة فقط
    const threadInfo = await api.getThreadInfo(threadID);
    if (!threadInfo.isGroup) {
      return message.reply("⚠️ | هذا الأمر للمجموعات فقط!");
    }

    const dataBanned = await threadsData.get(threadID, "data.banned_list", []);
    const adminIDs = threadInfo.adminIDs || [];
    const botID = api.getCurrentUserID();

    // === قسم إلغاء الحظر ===
    if (args[0] === "unban" || args[0] === "الغاء" || args[0] === "إلغاء") {
      let target = await getTarget(args, event, 1);

      if (!target) {
        return message.reply(getLang("notFoundTargetUnban"));
      }

      const banIndex = dataBanned.findIndex(item => item.id == target);
      if (banIndex === -1) {
        return message.reply(getLang("userNotBanned", target));
      }

      dataBanned.splice(banIndex, 1);
      await threadsData.set(threadID, dataBanned, "data.banned_list");

      const targetName = await usersData.getName(target) || getLang("noName");
      return message.reply(getLang("unbannedSuccess", targetName));
    }

    // === قسم الفحص والطرد ===
    if (args[0] === "check" || args[0] === "فحص") {
      if (!dataBanned.length) {
        return message.reply(getLang("noData"));
      }

      let kickedCount = 0;
      for (const bannedUser of dataBanned) {
        if (threadInfo.participantIDs?.includes(bannedUser.id)) {
          try {
            await api.removeUserFromGroup(bannedUser.id, threadID);
            kickedCount++;
          } catch (err) {
            console.log(`[BAN] Failed to kick ${bannedUser.id}:`, err.message);
          }
        }
      }

      return message.reply(getLang("checkComplete", kickedCount));
    }

    // === قسم عرض القائمة ===
    if (args[0] === "list" || args[0] === "قائمة") {
      if (!dataBanned.length) {
        return message.reply(getLang("noData"));
      }

      const limit = 15;
      const page = Math.max(1, parseInt(args[1]) || 1);
      const totalPages = Math.ceil(dataBanned.length / limit);
      const start = (page - 1) * limit;
      const end = Math.min(page * limit, dataBanned.length);

      let msg = getLang("listHeader", page, totalPages) + "\n━━━━━━━━━━━━━━━━━━━━━━\n";

      for (let i = start; i < end; i++) {
        const user = dataBanned[i];
        const userName = await usersData.getName(user.id) || getLang("noName");
        msg += getLang("listItem", i + 1, userName, user.id, user.reason, user.time);
      }

      msg += "━━━━━━━━━━━━━━━━━━━━━━";
      return message.reply(msg);
    }

    // === قسم حظر جديد ===
    let target = await getTarget(args, event, 0);
    let reason = args.join(" ").replace(Object.values(event.mentions || {})[0] || "", "").trim() || getLang("noReason");

    if (!target) {
      return message.reply(getLang("notFoundTarget"));
    }

    // === الفحوصات الأمنية ===
    if (target === senderID) {
      return message.reply(getLang("cantSelfBan"));
    }

    if (target === botID) {
      return message.reply(getLang("cantBanBot"));
    }

    if (adminIDs.includes(target)) {
      return message.reply(getLang("cantBanAdmin"));
    }

    const existingBan = dataBanned.find(item => item.id == target);
    if (existingBan) {
      return message.reply(getLang("alreadyBanned", existingBan.time));
    }

    // === إضافة الحظر ===
    const time = moment().tz(global.GoatBot?.config?.timeZone || "Asia/Baghdad").format("HH:mm:ss DD/MM/YYYY");
    const banData = {
      id: target,
      time,
      reason,
      bannedBy: senderID
    };

    dataBanned.push(banData);
    await threadsData.set(threadID, dataBanned, "data.banned_list");

    const targetName = await usersData.getName(target) || getLang("noName");
    
    message.reply(getLang("bannedSuccess", targetName, reason, time));

    // === محاولة الطرد الفوري ===
    if (threadInfo.participantIDs?.includes(target)) {
      if (adminIDs.includes(botID)) {
        try {
          await api.removeUserFromGroup(target, threadID);
        } catch (err) {
          console.log(`[BAN] Kick failed:`, err.message);
        }
      }
    }

  } catch (error) {
    console.error("[BAN] Critical Error:", error.message);
    message.reply("❌ حدث خطأ في معالجة الأمر: " + error.message);
  }
};

module.exports.onEvent = async function ({ event, api, threadsData, getLang, message, usersData }) {
  try {
    // اكتشاف انضمام عضو محظور
    if (event.logMessageType === "log:subscribe") {
      const { threadID } = event;
      const addedUsers = event.logMessageData?.addedParticipants || [];
      const dataBanned = await threadsData.get(threadID, "data.banned_list", []);

      if (!dataBanned.length) return;

      const threadInfo = await api.getThreadInfo(threadID);
      const botID = api.getCurrentUserID();
      const isBotAdmin = threadInfo.adminIDs?.includes(botID);

      for (const addedUser of addedUsers) {
        const bannedRecord = dataBanned.find(item => item.id == addedUser.userFbId);

        if (bannedRecord) {
          const userName = addedUser.fullName || await usersData.getName(addedUser.userFbId) || getLang("noName");
          
          // رسالة إنذار
          let alertMsg = `${getLang("banEventTitle")}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
          alertMsg += `${getLang("banEventDetected")}\n`;
          alertMsg += `${getLang("banEventName", userName)}\n`;
          alertMsg += `${getLang("banEventReason", bannedRecord.reason)}\n`;
          alertMsg += `${getLang("banEventTime", bannedRecord.time)}\n`;

          if (isBotAdmin) {
            try {
              await api.removeUserFromGroup(addedUser.userFbId, threadID);
              alertMsg += `\n${getLang("banEventKicked")} 🚫`;
            } catch (err) {
              alertMsg += `\n${getLang("banEventFailed")} ⚠️`;
            }
          } else {
            alertMsg += `\n${getLang("banEventFailed")} ⚠️`;
          }

          message.send(alertMsg);
        }
      }
    }
  } catch (error) {
    console.error("[BAN EVENT] Error:", error.message);
  }
};

// === دالة مساعدة: الحصول على المستخدم المستهدف ===
async function getTarget(args, event, startIndex = 0) {
  const arg = args[startIndex];

  // التحقق من ID مباشر
  if (!isNaN(arg) && arg) {
    return arg;
  }

  // التحقق من رابط فيسبوك
  if (arg?.startsWith("https")) {
    const { findUid } = global.utils;
    try {
      return await findUid(arg);
    } catch {
      return null;
    }
  }

  // التحقق من المنشن
  if (Object.keys(event.mentions || {}).length) {
    return Object.keys(event.mentions)[0];
  }

  // التحقق من الرد على رسالة
  if (event.messageReply?.senderID) {
    return event.messageReply.senderID;
  }

  return null;
}
