module.exports.config = {
  name: "حذف",
  version: "1.2",
  author: "NTKhang",
  countDown: 5,
  role: 0,
  description: {
    en: "قم بحذف رسائل البوت"
  },
  category: "المجموعة",
  guide: {
    en: "قم بالرد على الرسالة التي تريد حذفها {pn}"
  }
};

module.exports.langs = {
  ar: {
    syntaxError: "⚠️ | أرجوك قم بالرد على الرسالة التي تريد حذفها، فقط رسائل البوت"
  }
};

module.exports.onStart = async function ({ message, event, api, getLang }) {
  try {
    if (!event.messageReply || event.messageReply.senderID != api.getCurrentUserID())
      return message.reply(getLang("syntaxError"));
    message.unsend(event.messageReply.messageID);
  } catch (error) {
    console.error("[DELETE] Error:", error.message);
    message.reply("❌ | فشل حذف الرسالة");
  }
};
