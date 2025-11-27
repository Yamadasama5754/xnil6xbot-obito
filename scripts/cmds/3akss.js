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
    en: "قم بتحويل فيديو ألى صوت"
  },
  category: "وسائط",
  guide: {
    en: "{pn} (قم بالرد على فيديو)"
  }
};

module.exports.onStart = async function ({ api, event, message }) {
  try {
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
      return message.reply("❌ | الرجاء الرد على فيديو");
    }

    const att = event.messageReply.attachments[0];
    if (att.type !== "video") {
      return message.reply("❌ | أرجوك قم بالرد على الفيديو 🎥");
    }

    const cacheDir = path.join(process.cwd(), "cache");
    await fs.ensureDir(cacheDir);

    const { data } = await axios.get(att.url, { 
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const audioPath = path.join(cacheDir, `video_${Date.now()}.m4a`);
    await fs.writeFile(audioPath, data);

    const audioReadStream = fs.createReadStream(audioPath);
    const msg = { 
      body: "✅ | تم تحويل الفيديو إلى صوت",
      attachment: audioReadStream 
    };

    api.sendMessage(msg, event.threadID, () => {
      setTimeout(() => {
        try {
          if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
          }
        } catch (err) {
          console.error("[3AKSS] Error deleting file:", err.message);
        }
      }, 2000);
    });

  } catch (error) {
    console.error("[3AKSS] Error:", error.message);
    message.reply(`❌ | حدث خطأ: ${error.message}`);
  }
};
