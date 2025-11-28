module.exports.config = {
  name: "ايدي",
  aliases: ["id", "user_id"],
  version: "2.0",
  author: "Enhanced",
  countDown: 5,
  role: 0,
  description: "الحصول على ايدي المستخدم",
  category: "معلومات",
  guide: "{pn}: ايدي حسابك\n{pn} [@منشن|uid|رد]: ايدي شخص آخر"
};

module.exports.onStart = async function ({ event, message, args }) {
  try {
    let targetID;

    // الحصول على الايدي المستهدف
    if (Object.keys(event.mentions || {}).length) {
      targetID = Object.keys(event.mentions)[0];
    } else if (event.messageReply?.senderID) {
      targetID = event.messageReply.senderID;
    } else if (!isNaN(args[0]) && args[0]) {
      targetID = args[0];
    } else {
      targetID = event.senderID;
    }

    return message.reply(targetID);
  } catch (error) {
    console.error("[ID] Error:", error.message);
    message.reply("❌ حدث خطأ: " + error.message);
  }
};
