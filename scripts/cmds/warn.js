module.exports.config = {
  name: "تحذير",
  version: "1.2",
  author: "NTKhang",
  countDown: 5,
  role: 1,
  description: {
    en: "تحذير المستخدمين في المجموعة"
  },
  category: "إدارة",
  guide: {
    en: "{pn} <@المستخدم> <السبب>: تحذير مستخدم\n{pn}: الرد على رسالة لتحذير صاحبها"
  }
};

module.exports.langs = {
  ar: {
    cantWarn: "❌ | لا يمكنك تحذير هذا الشخص",
    warned: "⚠️ | تم تحذير %1",
    reason: "❗ | السبب: %1",
    noReason: "📌 | بدون سبب محدد",
    noUser: "❌ | المرجو تحديد المستخدم",
    replyWarning: "✅ | تم تحذير %1"
  }
};

module.exports.onStart = async function ({ message, event, args, getLang }) {
  try {
    const { mentions, senderID } = event;
    
    // الرد على رسالة
    if (event.type === "message_reply") {
      const replyToUserID = event.messageReply.senderID;
      if (replyToUserID === senderID) {
        return message.reply(getLang("cantWarn"));
      }
      
      const userName = event.messageReply.senderName || "المستخدم";
      const reason = args.length > 0 ? args.join(" ") : getLang("noReason");
      
      return message.reply(getLang("replyWarning", userName) + "\n" + getLang("reason", reason));
    }

    // التحذير برمز @
    if (mentions && Object.keys(mentions).length > 0) {
      const userID = Object.keys(mentions)[0];
      const userName = mentions[userID];
      
      if (userID === senderID) {
        return message.reply(getLang("cantWarn"));
      }

      const reason = args.slice(1).join(" ") || getLang("noReason");
      return message.reply(getLang("warned", userName) + "\n" + getLang("reason", reason));
    }

    return message.SyntaxError();

  } catch (error) {
    console.error("[WARNING] Error:", error.message);
    message.reply("❌ | حدث خطأ في الأمر");
  }
};

module.exports.onReply = async function ({ message, event, args, getLang, Reply }) {
  try {
    const { mentions, senderID } = event;

    if (Reply.author !== senderID) {
      return;
    }

    if (mentions && Object.keys(mentions).length > 0) {
      const userID = Object.keys(mentions)[0];
      const userName = mentions[userID];
      
      if (userID === senderID) {
        return message.reply(getLang("cantWarn"));
      }

      const reason = args.slice(1).join(" ") || getLang("noReason");
      return message.reply(getLang("warned", userName) + "\n" + getLang("reason", reason), () => {
        message.unsend(Reply.messageID);
      });
    }

    message.reply(getLang("noUser"), () => message.unsend(Reply.messageID));

  } catch (error) {
    console.error("[WARNING] onReply Error:", error.message);
  }
};
