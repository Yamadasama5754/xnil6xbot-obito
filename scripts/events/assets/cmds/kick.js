module.exports.config = {
  name: "طرد",
  version: "1.0",
  author: "Yamada KJ & Alastor",
  countDown: 5,
  role: 1,
  description: {
    en: "طرد عضو من المجموعة (يتطلب أن يكون البوت أدمن). استخدم 'طرد الكل' لطرد الجميع (للمطور فقط)."
  },
  category: "إدارة",
  guide: {
    en: "   {pn} <ID أو منشن أو رد> [السبب]: طرد عضو\n   {pn} الكل: طرد جميع الأعضاء (للمطور فقط)"
  },
  aliases: ["بانكاي", "kick"]
};

module.exports.onStart = async function ({ api, event, args, message }) {
  try {
    const threadID = event.threadID;
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const senderID = event.senderID;

    // تحقق: هل هذا خاص أم مجموعة؟
    if (!threadInfo.isGroup) {
      return message.reply("⚠️ | هذا الأمر يشتغل فقط داخل المجموعات.");
    }

    // تحقق: هل البوت أدمن؟
    if (!threadInfo.adminIDs?.some(admin => admin.id === botID)) {
      return message.reply("⚠️ | يجب أن يكون البوت أدمن حتى يقدر يطرد الأعضاء.");
    }

    // جلب قائمة المطورين من الكونفيغ
    let developerIDs = [];
    try {
      const configPath = require("path").join(process.cwd(), "config.json");
      const config = require(configPath);
      developerIDs = config.developers || [];
    } catch (err) {
      console.error("خطأ في جلب المطورين:", err.message);
      developerIDs = ["100092990751389"]; // قيمة افتراضية
    }

    // IDs المحمية (المطورين والبوت)
    const protectedIDs = new Set([...developerIDs, botID]);

    // خيار "طرد الكل" - للمطور فقط
    if (args[0] && args[0].toLowerCase() === "الكل") {
      // تحقق: هل المستخدم مطور؟
      if (!developerIDs.includes(senderID)) {
        return message.reply("🔒 | فقط المطور يقدر يستخدم خاصية طرد الكل!");
      }

      const exemptIDs = new Set(protectedIDs);

      // إضافة الأيديات المستثناة المحددة من المستخدم
      if (args.length > 1) {
        for (let i = 1; i < args.length; i++) {
          exemptIDs.add(args[i]);
        }
      }

      const participantIDs = threadInfo.participantIDs;
      const toKick = participantIDs.filter(id => !exemptIDs.has(id));

      if (toKick.length === 0) {
        return message.reply("⚠️ | لا يوجد أعضاء للطرد (الجميع محمين).");
      }

      message.reply(`⏳ جاري طرد ${toKick.length} عضو...`);

      let kicked = 0;
      for (const id of toKick) {
        try {
          await api.removeUserFromGroup(id, threadID);
          kicked++;
          // تأخير صغير لتجنب rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.error(`❌ فشل طرد ${id}:`, err.message);
        }
      }

      return message.reply(`✅ | تم طرد ${kicked} عضو من أصل ${toKick.length}`);
    }

    // جلب ID الهدف (الطرد العادي)
    let targetID;

    if (event.type === "message_reply" && event.messageReply) {
      targetID = event.messageReply.senderID;
    } else if (Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } else if (args.length > 0) {
      targetID = args[0];
    }

    if (!targetID) {
      return message.reply("⚠️ | من فضلك ضع ID أو اعمل mention أو رد على رسالة الشخص اللي تبغى تطرده.");
    }

    // منع طرد المطورين
    if (developerIDs.includes(targetID)) {
      return message.reply("🔒 | لا يمكن طرد المطور!");
    }

    // منع طرد البوت (فقط المطور)
    if (targetID === botID && !developerIDs.includes(senderID)) {
      return message.reply("🔒 | لا يمكن طرد البوت! فقط المطور يقدر يطرده.");
    }

    // منع الأدمن من طرد المطورين الآخرين
    const isAdmin = threadInfo.adminIDs?.some(admin => admin.id === senderID);
    if (isAdmin && !developerIDs.includes(senderID) && developerIDs.includes(targetID)) {
      return message.reply("🔒 | لا يمكن طرد هذا العضو (محمي).");
    }

    // استخراج السبب لو موجود
    let reason = null;
    if (args.length > 1) {
      reason = args.slice(1).join(" ");
    } else if (Object.keys(event.mentions).length > 0 && args.length > 0) {
      reason = args.slice(1).join(" ");
    } else if (event.type === "message_reply" && args.length > 0) {
      reason = args.join(" ");
    }

    // تنفيذ الطرد
    await api.removeUserFromGroup(targetID, threadID);

    return message.reply(
      reason
        ? `✅ | تم طرد العضو: ${targetID}\n📌 السبب: ${reason}`
        : `✅ | تم طرد العضو: ${targetID}`
    );

  } catch (err) {
    console.error("❌ خطأ في أمر طرد:", err.message);
    message.reply(`⚠️ | حصل خطأ أثناء محاولة الطرد:\n${err.message}`);
  }
};
