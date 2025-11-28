const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "عكس",
  aliases: ["video2audio"],
  version: "1.0",
  author: "Gina Cole",
  countDown: 10,
  role: 0,
  description: {
    en: "تحويل الفيديو إلى صوت"
  },
  category: "وسائط"
};

module.exports.onStart = async function ({ api, event, message }) {
  try {
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
      return message.reply("❌ الرجاء الرد على فيديو");
    }

    const att = event.messageReply.attachments[0];
    if (att.type !== "video") {
      return message.reply("❌ أرجوك قم بالرد على الفيديو فقط");
    }

    if (!att.url) {
      return message.reply("❌ لا يمكن الوصول إلى الفيديو");
    }

    message.reply("⏳ جاري التحويل...");

    const cacheDir = path.join(process.cwd(), "cache");
    await fs.ensureDir(cacheDir);

    const { data } = await axios.get(att.url, { 
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const audioPath = path.join(cacheDir, `video_${Date.now()}.m4a`);
    await fs.writeFile(audioPath, data);

    const audioStream = fs.createReadStream(audioPath);
    api.sendMessage({ body: "✅ تم التحويل", attachment: audioStream }, event.threadID, () => {
      setTimeout(() => {
        try {
          if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        } catch (e) {}
      }, 2000);
    });
  } catch (error) {
    message.reply(`❌ خطأ: ${error.message}`);
  }
};
