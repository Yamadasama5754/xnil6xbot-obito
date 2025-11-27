const axios = require('axios');

module.exports = {
  config: {
    name: "رابط",
    aliases: ["img", "imgur", "رفع"],
    version: "1.1",
    author: "Yamada KJ",
    cooldowns: 5,
    role: 0,
    description: "رفع الصور والفيديوهات على Imgur",
    category: "الأدوات",
    guide: "{pn}: رد على صورة لرفعها"
  },

	onStart: async function ({ api, event, message }) {
    try {
      if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
        return message.reply("🔍 يرجى الرد على صورة أو فيديو لرفعها على Imgur");
      }

      const attachment = event.messageReply.attachments[0];
      const fileUrl = attachment.url;

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const response = await axios.post(
        "https://api.imgur.com/3/upload",
        { image: fileUrl },
        {
          headers: {
            Authorization: "Bearer 911dc78bc9cf5b7a327227fef7d53abd2585bec5",
            "Content-Type": "application/json"
          }
        }
      );

      const imgurData = response.data.data;

      if (!imgurData.link) {
        throw new Error("لم يتم إرجاع رابط من Imgur");
      }

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      const resultMessage = `
🖼️ تم الرفع بنجاح على Imgur!
━━━━━━━━━━━━━━
🔗 الرابط: ${imgurData.link}
💽 النوع: ${imgurData.type}
━━━━━━━━━━━━━━
✨ بواسطة ${this.config.author}
      `;

      message.reply({ body: resultMessage });

    } catch (error) {
      console.error("❌ خطأ في رفع الصورة على Imgur:", error);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("⚠️ حدث خطأ أثناء رفع الصورة. يرجى المحاولة لاحقاً");
    }
  }
};
