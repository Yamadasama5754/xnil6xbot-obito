const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "أنمي2",
  aliases: ["animefy"],
  version: "1.0",
  author: "حسين يعقوبي",
  countDown: 2,
  role: 0,
  description: {
    en: "تحويل الصورة إلى نمط أنيمي"
  },
  category: "أنمي",
  guide: {
    en: "{pn} {قم بالرد على صورة}"
  }
};

module.exports.onStart = async function ({ api, event }) {
  const { threadID, messageID } = event;
  const cacheDir = path.join(process.cwd(), "cache");

  try {
    // التأكد من وجود مجلد cache
    await fs.ensureDir(cacheDir);

    // الحصول على صورة أنيمي من الـ API
    const response = await axios.get(`https://sandipapi.onrender.com/anime`, {
      timeout: 10000
    });
    
    const image = response.data.url;

    if (!image) {
      return api.sendMessage(
        `❌ | فشل في الحصول على صورة أنيمي`,
        threadID,
        messageID
      );
    }

    // تحميل الصورة
    const imgResponse = await axios.get(image, { 
      responseType: "arraybuffer",
      timeout: 10000
    });
    
    const img = Buffer.from(imgResponse.data, 'binary');

    // حفظ الصورة مؤقتاً
    const pathie = path.join(cacheDir, `animefy_${Date.now()}.jpg`);
    await fs.writeFile(pathie, img);

    // إرسال الصورة
    api.sendMessage({
      body: " ✨ إليك صورة الأنمي :",
      attachment: fs.createReadStream(pathie)
    }, threadID, () => {
      // حذف الملف المؤقت
      setTimeout(() => {
        try {
          if (fs.existsSync(pathie)) {
            fs.unlinkSync(pathie);
          }
        } catch (e) {
          console.error("[ANIME2] Error deleting temp file:", e.message);
        }
      }, 2000);
    }, messageID);

  } catch (error) {
    console.error("[ANIME2] Error:", error.message);
    api.sendMessage(
      ` ❌ | حدث خطأ:\n\n${error.message}`,
      threadID,
      messageID
    );
  }
};
