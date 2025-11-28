const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

module.exports.config = {
  name: "بانترست",
  aliases: ["pin", "pinterest"],
  version: "2.1",
  author: "Enhanced",
  countDown: 10,
  role: 0,
  description: "البحث عن صور من بينترست",
  category: "صور"
};

module.exports.langs = {
  ar: {
    needSearch: "❌ اكتب كلمة البحث!\n💡 مثال: .بانترست انمي 5"
  }
};

const translateToEnglish = async (text) => {
  try {
    const response = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text)}`,
      { timeout: 8000 }
    );
    return response?.data?.[0]?.[0]?.[0] || text;
  } catch (error) {
    console.error("[PINTEREST] Translation error");
    return text;
  }
};

const searchPinterest = async (query, limit = 10) => {
  try {
    const response = await axios.get(
      `https://hiroshi-api.onrender.com/image/pinterest?search=${encodeURIComponent(query)}&limit=${limit}`,
      { timeout: 45000 }
    );

    let images = response.data?.data || [];

    if (Array.isArray(images)) {
      images = images.filter((url) => {
        if (!url) return false;
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });
    }

    return images.slice(0, limit);
  } catch (error) {
    console.error("[PINTEREST] Search error");
    throw error;
  }
};

const downloadImage = async (imageUrl, filePath, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 15000,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const buffer = Buffer.from(response.data, "binary");

      if (buffer.length < 1000) {
        if (attempt === retries) throw new Error("صورة صغيرة جداً");
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      fs.writeFileSync(filePath, buffer);
      return true;
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return false;
};

module.exports.onStart = async function ({ api, event, args, message, threadsData }) {
  try {
    api.setMessageReaction("⏱️", event.messageID, () => {}, true);

    if (!args || args.length === 0) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("❌ اكتب كلمة البحث!\n💡 مثال: .بانترست انمي 5");
    }

    // استخراج العدد من آخر argument
    let imageCount = 5;
    let searchQuery = args.join(" ");

    const lastArg = args[args.length - 1];
    if (/^\d+$/.test(lastArg)) {
      imageCount = Math.min(Math.max(parseInt(lastArg), 1), 20);
      searchQuery = args.slice(0, -1).join(" ");
    }

    if (!searchQuery.trim()) {
      return message.reply("❌ اكتب كلمة البحث!");
    }

    // ترجمة إلى الإنجليزية
    let searchTerm = searchQuery.trim();
    if (/[\u0600-\u06FF]/.test(searchTerm)) {
      searchTerm = await translateToEnglish(searchTerm);
    }

    message.reply(`🔍 جاري البحث عن "${searchQuery}" (${imageCount} صور)...`);

    // البحث
    let imageUrls;
    try {
      imageUrls = await searchPinterest(searchTerm, imageCount);
    } catch (searchError) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("❌ خطأ في البحث، حاول مرة أخرى");
    }

    if (!imageUrls || imageUrls.length === 0) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply(`❌ لم أجد صور مطابقة لـ "${searchQuery}"`);
    }

    // إعداد مجلد التخزين المؤقت
    const cacheDir = path.join(process.cwd(), "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // تحميل الصور
    const imgData = [];
    const downloadedPaths = [];
    let successCount = 0;

    message.reply(`📤 جاري إرسال ${imageUrls.length} صور...`);

    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const filePath = path.join(cacheDir, `pinterest_${Date.now()}_${i + 1}.jpg`);

        const downloaded = await downloadImage(imageUrls[i], filePath);
        if (downloaded) {
          imgData.push(fs.createReadStream(filePath));
          downloadedPaths.push(filePath);
          successCount++;
        }
      } catch (imgError) {
        console.error(`[PINTEREST] Image ${i + 1} failed`);
      }
    }

    // تحديث الإحصائيات
    const stats = await threadsData.get(event.threadID, "data.pinterest_stats", {
      searches: 0,
      totalImages: 0,
      failed: 0
    });
    stats.searches++;
    stats.totalImages += successCount;
    await threadsData.set(event.threadID, stats, "data.pinterest_stats");

    if (imgData.length === 0) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("❌ فشل تحميل الصور، حاول مرة أخرى");
    }

    api.setMessageReaction("✅", event.messageID, () => {}, true);

    const timeStr = moment().tz(global.GoatBot?.config?.timeZone || "Asia/Baghdad").format("HH:mm:ss");
    const body = `✅ نتائج البحث عن "${searchQuery}"\n🎯 عدد الصور: ${imgData.length}\n⏱️ الوقت: ${timeStr}`;

    api.sendMessage({
      attachment: imgData,
      body: body
    }, event.threadID, (err) => {
      if (err) console.error("[PINTEREST] Send error");

      setTimeout(() => {
        for (const filePath of downloadedPaths) {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (delErr) {
            console.error("[PINTEREST] Cleanup error");
          }
        }
      }, 2000);
    });

  } catch (error) {
    console.error("[PINTEREST] Error:", error.message);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    message.reply("❌ حدث خطأ");
  }
};
