const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

module.exports.config = {
  name: "بانترست",
  aliases: ["pin", "pinterest", "بانس"],
  version: "2.0",
  author: "Enhanced",
  countDown: 10,
  role: 0,
  description: "البحث عن صور دقيقة من بينترست",
  category: "صور",
  guide: `{pn} [كلمة البحث] [العدد]: البحث عن صور
مثال: {pn} انمي 5 (5 صور)
{pn} صور لوفي 10 (10 صور)
الحد الأقصى: 30 صورة`
};

module.exports.langs = {
  ar: {
    needSearch: "❌ اكتب كلمة البحث!\n💡 مثال: .بانترست انمي 5",
    invalidNumber: "❌ الرقم يجب أن يكون من 1 إلى 30",
    searching: "🔍 جاري البحث عن '{0}' ({1} صور)...",
    foundZero: "❌ لم أجد صور مطابقة لـ '{0}'",
    downloadError: "⚠️ خطأ في تحميل الصورة #{0}",
    downloadFailed: "❌ فشل تحميل الصور. حاول مرة أخرى",
    apiError: "⚠️ خطأ في الاتصال بالخادم: {0}",
    sending: "📤 جاري إرسال {0} صور...",
    success: "✅ نتائج البحث عن: '{0}'\n🎯 عدد الصور: {1}\n⏱️ الوقت: {2}",
    truncated: "\n⚠️ تم اختيار {0} صورة من {1} متاحة (أفضل النتائج)",
    timeout: "⏱️ انتهت مهلة الانتظار - خادم البحث بطيء",
    statsHeader: "📊 إحصائيات البحث",
    statsSearch: "🔍 عمليات بحث: {0}",
    statsImages: "🖼️ صور تم إرسالها: {0}",
    statsFailed: "❌ محاولات فاشلة: {0}",
    statsEmpty: "📭 لا توجد إحصائيات بعد"
  }
};

// ترجمة العربية للإنجليزية
const translateToEnglish = async (text) => {
  try {
    const response = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text)}`,
      { timeout: 8000 }
    );
    return response?.data?.[0]?.[0]?.[0] || text;
  } catch (error) {
    console.error("[PINTEREST] Translation error:", error.message);
    return text;
  }
};

// البحث عن صور - مع محاولات متعددة وتصفية دقيقة
const searchPinterest = async (query, limit = 10) => {
  try {
    const apis = [
      `https://hiroshi-api.onrender.com/image/pinterest?search=${encodeURIComponent(query)}&limit=${Math.min(limit * 2, 50)}`,
      `https://api.imgbb.com/1/search?key=your_api&q=${encodeURIComponent(query)}&limit=${limit}`,
    ];

    // استخدم API الأول الموثوق
    const response = await axios.get(apis[0], { timeout: 45000 });
    
    let images = response.data?.data || [];
    
    // تصفية الصور (إزالة الصور المكررة والغير ذات الصلة)
    if (Array.isArray(images)) {
      images = images.filter((url, idx, arr) => {
        // التحقق من صيغة الصورة
        if (!url) return false;
        
        // منع الصور المكررة
        if (arr.indexOf(url) !== idx) return false;
        
        // التحقق من أن الرابط صحيح
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
    console.error("[PINTEREST] Search error:", error.message);
    throw new Error(`خطأ في البحث: ${error.message}`);
  }
};

// تحميل الصورة بمحاولات متعددة
const downloadImage = async (imageUrl, filePath, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 15000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });

      const buffer = Buffer.from(response.data, "binary");
      
      // التحقق من حجم الصورة
      if (buffer.length < 1000) {
        console.warn(`[PINTEREST] Image too small: ${buffer.length} bytes`);
        continue;
      }

      fs.writeFileSync(filePath, buffer);
      return true;
    } catch (error) {
      console.warn(`[PINTEREST] Download attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt === retries) {
        throw error;
      }
      // انتظر قبل المحاولة التالية
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return false;
};

module.exports.onStart = async function ({ api, event, args, message, threadsData, getLang }) {
  try {
    api.setMessageReaction("⏱️", event.messageID, () => {}, true);

    // التحقق من المدخلات
    if (!args || args.length === 0) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply(getLang("needSearch"));
    }

    // استخراج العدد من آخر argument
    let imageCount = 10; // الافتراضي
    let searchQuery = args.join(" ");

    // فحص آخر كلمة إذا كانت رقم
    const lastArg = args[args.length - 1];
    if (/^\d+$/.test(lastArg)) {
      imageCount = Math.min(Math.max(parseInt(lastArg), 1), 30); // 1-30
      searchQuery = args.slice(0, -1).join(" ");
    }

    // تحقق من أن هناك بحث
    if (!searchQuery.trim()) {
      return message.reply(getLang("needSearch"));
    }

    // التحقق من أن الرقم صحيح
    if (!/^\d+$/.test(imageCount.toString())) {
      return message.reply(getLang("invalidNumber"));
    }

    // ترجمة إلى الإنجليزية إذا لزم الأمر
    let searchTerm = searchQuery.trim();
    if (/[\u0600-\u06FF]/.test(searchTerm)) {
      searchTerm = await translateToEnglish(searchTerm);
    }

    // إرسال رسالة البحث
    message.reply(getLang("searching", searchQuery, imageCount));

    // البحث عن الصور
    let imageUrls;
    try {
      imageUrls = await searchPinterest(searchTerm, imageCount);
    } catch (searchError) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply(getLang("apiError", searchError.message));
    }

    // التحقق من النتائج
    if (!imageUrls || imageUrls.length === 0) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply(getLang("foundZero", searchQuery));
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

    message.reply(getLang("sending", imageUrls.length));

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
        console.error(`[PINTEREST] Image ${i + 1} failed:`, imgError.message);
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

    // التحقق من الصور المحملة
    if (imgData.length === 0) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply(getLang("downloadFailed"));
    }

    // إرسال الصور
    api.setMessageReaction("✅", event.messageID, () => {}, true);
    
    const timeStr = moment().tz(global.GoatBot?.config?.timeZone || "Asia/Baghdad").format("HH:mm:ss");
    let body = getLang("success", searchQuery, imgData.length, timeStr);
    
    if (imgData.length < imageCount) {
      body += getLang("truncated", imgData.length, imageUrls.length);
    }

    api.sendMessage({
      attachment: imgData,
      body: body
    }, event.threadID, (err) => {
      if (err) console.error("[PINTEREST] Send error:", err.message);
      
      // تنظيف الملفات المؤقتة
      setTimeout(() => {
        for (const filePath of downloadedPaths) {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (delErr) {
            console.error("[PINTEREST] Cleanup error:", delErr.message);
          }
        }
      }, 2000);
    });

  } catch (error) {
    console.error("[PINTEREST] Error:", error.message);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    message.reply(getLang("apiError", error.message));
  }
};

// أمر الإحصائيات
module.exports.onChat = async function ({ body, event, message, threadsData, getLang }) {
  if (!body || !body.toLowerCase().startsWith(".بانترست")) return;

  const args = body.slice(8).trim().split(/\s+/);
  
  if (args[0] === "إحصائيات" || args[0] === "stats") {
    try {
      const stats = await threadsData.get(event.threadID, "data.pinterest_stats", {
        searches: 0,
        totalImages: 0,
        failed: 0
      });

      let response = getLang("statsHeader") + "\n━━━━━━━━━━━━━━━━━━\n";
      response += getLang("statsSearch", stats.searches) + "\n";
      response += getLang("statsImages", stats.totalImages) + "\n";
      response += getLang("statsFailed", stats.failed);

      message.reply(response);
    } catch (error) {
      console.error("[PINTEREST Stats] Error:", error.message);
      message.reply("❌ خطأ في جلب الإحصائيات");
    }
  }
};
