const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "تصميم",
  aliases: ["gfxs"],
  version: "1.0",
  author: "Samir",
  countDown: 35,
  role: 0,
  description: {
    en: "قم بإنشاء تصميم خاص بك"
  },
  category: "صور",
  guide: {
    en: "{pn} الإسم"
  }
};

module.exports.onStart = async function ({ message, args, api, event }) {
  const text = args.join(" ");
  const cacheDir = path.join(process.cwd(), "cache");
  
  if (!text) {
    return message.reply(` ⚠️ | أرجوك قم بإدخال إسمك للتصميم`);
  }
  
  try {
    await fs.ensureDir(cacheDir);
    
    const img = `https://tanjiro-api.onrender.com/gfx1?name=${encodeURIComponent(text)}&api_key=tanjiro`;
    
    const imgResponse = await axios.get(img, {
      responseType: "arraybuffer",
      timeout: 15000
    });

    const filePath = path.join(cacheDir, `gfx_${Date.now()}.jpg`);
    await fs.writeFile(filePath, imgResponse.data);

    api.sendMessage({
      body: ` ✨ تفضل تصميمك`,
      attachment: fs.createReadStream(filePath)
    }, event.threadID, () => {
      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          console.error("[GFXS] Error deleting file:", e.message);
        }
      }, 2000);
    });

  } catch (error) {
    console.error("[GFXS] Error:", error.message);
    message.reply(`❌ حدث خطأ أثناء إنشاء التصميم. حاول مرة أخرى.`);
  }
};
