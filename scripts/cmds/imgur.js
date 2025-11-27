const axios = require('axios');

module.exports = {
  config: {
    name: "رابط",
    aliases: ["img", "imgur"],
    version: "1.1",
    author: "Yamada KJ",
    shortDescription: {
      en: "🖼️ Upload media to Imgur"
    },
    longDescription: {
      en: "✨ Uploads images/videos/GIFs to Imgur and returns the public link"
    },
    category: "utility",
    guide: {
      en: "{p}imgur [reply to media]",
			ar: "{pn}"
    }
  },

  
	langs: {
		en: {},
		ar: { command: "أمر", error: "خطأ", success: "نجح", usage: "الاستخدام", invalid: "غير صالح" }
	},

	onStart: async function ({ api, event, message }) {
    try {
      if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
        return message.reply("🔍 Please reply to an image, video, or GIF to upload it to Imgur.");
      }

      const attachment = event.messageReply.attachments[0];
      const fileUrl = attachment.url;

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const imgurToken = process.env.IMGUR_TOKEN;
      if (!imgurToken) {
        throw new Error("Imgur API token not configured");
      }

      const response = await axios.post(
        "https://api.imgur.com/3/upload",
        { image: fileUrl },
        {
          headers: {
            Authorization: `Bearer ${imgurToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      const imgurData = response.data.data;

      if (!imgurData.link) {
        throw new Error("No link returned from Imgur");
      }

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      const resultMessage = `
🖼️ 𝗜𝗠𝗚𝗨𝗥 𝗨𝗣𝗟𝗢𝗔𝗗 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟!
━━━━━━━━━━━━━━
🔗 𝗟𝗶𝗻𝗸: ${imgurData.link}
💽 𝗧𝘆𝗽𝗲: ${imgurData.type}
━━━━━━━━━━━━━━
✨ 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 ${this.config.author}
      `;

      message.reply({ body: resultMessage });

    } catch (error) {
      console.error("🔴 Imgur Upload Error:", error);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("⚠️ An error occurred while uploading to Imgur. Please try again later.");
    }
  }
};
