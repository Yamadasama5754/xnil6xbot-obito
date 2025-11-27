const fs = require("fs-extra");
const path = require("path");

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
  version: "1.0",
  author: "Yamada KJ & Alastor",
  countDown: 5,
  role: 0,
  description: {
    en: "إضافة عضو إلى المجموعة (متاح للجميع)"
  },
  category: "المجموعة",
  guide: {
    en: "   {pn} <ID أو رابط أو منشن>: إضافة عضو إلى المجموعة"
  },
  aliases: ["join"]
};

module.exports.langs = {
  ar: {
    notGroup: "⚠️ | هذا الأمر يشتغل فقط داخل المجموعات.",
    needTarget: "⚠️ | لازم تكتب أيدي الشخص أو تعمل mention أو رد على رسالته أو رابط فيسبوك.",
    invalidLink: "⚠️ | الرابط غير صالح. لازم يكون فيه ID رقمي.",
    userBanned: "❌ | هذا الشخص مبان من المجموعة! لا يمكن إضافته.",
    alreadyInGroup: "ℹ️ | هذا الشخص موجود بالفعل في المجموعة.",
    addFailed: "❌ | فشل إضافة الشخص.",
    notAdmin: "⚠️ | لازم البوت يصبح أدمن في المجموعة لإضافة أعضاء!",
    alreadyMember: "ℹ️ | هذا الشخص موجود بالفعل في المجموعة.",
    blocked: "🔍 | هذا الشخص محظور أو قد حظر المجموعة.",
    addSuccess: "✅ | تم إدخال العضو ({0}) إلى المجموعة بنجاح!",
    error: "⚠️ | حصل خطأ غير متوقع:\n{0}"
  }
};

module.exports.onStart = async function ({ api, event, args, message }) {
  try {
    const threadInfo = await api.getThreadInfo(event.threadID);

    // تحقق: هل هذا خاص أم مجموعة؟
    if (!threadInfo.isGroup) {
      return message.reply("⚠️ | هذا الأمر يشتغل فقط داخل المجموعات.");
    }

    // تحديد الشخص (ID أو رابط فيسبوك أو mention أو رد على رسالة)
    let targetID;

    // لو الأمر جاء كرد على رسالة
    if (event.type === "message_reply" && event.messageReply) {
      targetID = event.messageReply.senderID;
    }
    // لو فيه mention
    else if (Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    }
    // لو فيه ID أو رابط
    else if (args.length > 0) {
      targetID = args[0];

      // لو الرابط فيسبوك → حاول استخراج الـ ID
      if (targetID.includes("facebook.com")) {
        const match = targetID.match(/facebook\.com\/(\d+)/);
        if (match) {
          targetID = match[1];
        } else {
          return message.reply("⚠️ | الرابط غير صالح. لازم يكون فيه ID رقمي.");
        }
      }
    }

    if (!targetID) {
      return message.reply("⚠️ | لازم تكتب أيدي الشخص أو تعمل mention أو رد على رسالته أو رابط فيسبوك.");
    }

    // تحقق: هل الشخص مبان؟
    const bans = getBans(event.threadID);
    if (bans.find(b => b.userID === targetID)) {
      return message.reply("❌ | هذا الشخص مبان من المجموعة! لا يمكن إضافته.");
    }

    // تحقق: هل الشخص موجود بالفعل في المجموعة؟
    const alreadyInGroup = threadInfo.participantIDs.includes(targetID);
    if (alreadyInGroup) {
      return message.reply("ℹ️ | هذا الشخص موجود بالفعل في المجموعة.");
    }

    // محاولة الإضافة
    api.addUserToGroup(targetID, event.threadID, (err) => {
      if (err) {
        let errorMsg = "❌ | فشل إضافة الشخص.\n";

        // تحليل نوع الخطأ
        if (err.message?.includes("not admin") || err.message?.includes("not authorized") || err.message?.includes("permission")) {
          errorMsg = "⚠️ | لازم البوت يصبح أدمن في المجموعة لإضافة أعضاء!";
        } else if (err.message?.includes("already") || err.message?.includes("member")) {
          errorMsg = "ℹ️ | هذا الشخص موجود بالفعل في المجموعة.";
        } else if (err.message?.includes("blocked")) {
          errorMsg = "🔍 | هذا الشخص محظور أو قد حظر المجموعة.";
        } else {
          errorMsg += `🔍 السبب: ${err.message || "خطأ غير معروف"}`;
        }

        return message.reply(errorMsg);
      }
      message.reply(`✅ | تم إدخال العضو (${targetID}) إلى المجموعة بنجاح!`);
    });
  } catch (err) {
    return message.reply("⚠️ | حصل خطأ غير متوقع:\n" + err.message);
  }
};
