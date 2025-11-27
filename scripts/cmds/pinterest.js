const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "بانترست",
  version: "1.0",
  author: "Yamada KJ & Alastor",
  countDown: 3,
  role: 0,
  description: {
    en: "صور من بنترست"
  },
  category: "صور",
  guide: {
    en: "   {pn} <كلمة البحث>: البحث عن صور على بنترست"
  },
  aliases: ["بانس", "pinterest"]
};

const translateToEnglish = async (text) => {
  try {
    const translationResponse = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text)}`
    );
    return translationResponse?.data?.[0]?.[0]?.[0] || text;
  } catch (error) {
    console.error("❌ خطأ في الترجمة:", error.message);
    return text;
  }
};

module.exports.onStart = async function ({ api, event, args, message }) {
  try {
    api.setMessageReaction("⏱️", event.messageID, (err) => {}, true);

    if (!args || args.length === 0) {
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return message.reply("❌ | أدخل كلمة البحث المراد البحث عنه في بنترست.\n\n📝 مثال: .بانترست القطط");
    }

    let keySearch = args.join(" ");

    try {
      // ترجمة كلمة البحث إلى الإنجليزية إذا كانت عربية
      keySearch = await translateToEnglish(keySearch);

      const pinterestResponse = await axios.get(
        `https://hiroshi-api.onrender.com/image/pinterest?search=${encodeURIComponent(keySearch)}`,
        { 
          timeout: 30000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          }
        }
      );

      const data = pinterestResponse.data?.data;

      if (!data || data.length === 0) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return message.reply(`❌ | لم يتم العثور على صور ل "${keySearch}"`);
      }

      // الحد الأقصى 10 صور
      const imagesToDownload = data.slice(0, 10);
      const cacheDir = path.join(process.cwd(), "cache");

      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const imgData = [];
      const downloadedPaths = [];

      for (let i = 0; i < imagesToDownload.length; i++) {
        try {
          const filePath = path.join(cacheDir, `pinterest_${Date.now()}_${i + 1}.jpg`);
          const imageResponse = await axios.get(imagesToDownload[i], {
            responseType: "arraybuffer",
            timeout: 10000,
            headers: {
              "User-Agent": "Mozilla/5.0"
            }
          });
          fs.writeFileSync(filePath, Buffer.from(imageResponse.data, "binary"));
          imgData.push(fs.createReadStream(filePath));
          downloadedPaths.push(filePath);
        } catch (imgError) {
          console.error(`❌ فشل تحميل الصورة ${i + 1}:`, imgError.message);
        }
      }

      if (imgData.length === 0) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return message.reply("❌ | فشل تحميل الصور. حاول مرة أخرى.");
      }

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      api.sendMessage({
        attachment: imgData,
        body: `⚜️ | نتائج البحث عن: ${keySearch}\n\n📊 | تم العثور على ${imgData.length} صورة`
      }, event.threadID, (err, info) => {
        if (err) console.error("❌ خطأ في إرسال الرسالة:", err.message);
        // حذف الصور المؤقتة
        for (const filePath of downloadedPaths) {
          setTimeout(() => {
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            } catch (delErr) {
              console.error("خطأ في حذف الملف:", delErr.message);
            }
          }, 1000);
        }
      });

    } catch (error) {
      console.error("❌ خطأ في جلب الصور:", error.message);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      message.reply("❌ | حدث خطأ أثناء جلب الصور. يرجى المحاولة مرة أخرى.");
    }
  } catch (err) {
    console.error("❌ خطأ في أمر بانترست:", err.message);
    message.reply(`❌ حدث خطأ: ${err.message}`);
  }
};
