const { translate } = require("@vitalets/google-translate-api");

module.exports.config = {
  name: "ترجمة",
  version: "1.0",
  author: "Yamada KJ & Alastor",
  countDown: 3,
  role: 0,
  description: {
    en: "ترجمة النصوص - ترجمة [لغة] [نص] أو رد على رسالة وقل الأمر"
  },
  category: "أدوات",
  guide: {
    en: "   {pn} <لغة> <نص>: ترجمة النص\n   {pn} عربية: رد على رسالة وقل الأمر لترجمتها"
  },
  aliases: ["translate", "ترجم"]
};

// خريطة اللغات المدعومة
const getLangCode = (langName) => {
  const languages = {
    "عربية": "ar",
    "english": "en",
    "فرنسية": "fr",
    "الإنجليزية": "en",
    "الفرنسية": "fr",
    "إسباني": "es",
    "spanish": "es",
    "french": "fr",
    "english": "en",
    "arabic": "ar",
    "ar": "ar",
    "en": "en",
    "fr": "fr",
    "es": "es",
    "de": "de",
    "ألمانية": "de",
    "german": "de",
    "ja": "ja",
    "يابانية": "ja",
    "zh": "zh",
    "صينية": "zh"
  };
  return languages[langName?.toLowerCase()] || "ar";
};

const langNames = {
  "ar": "🇸🇦 العربية",
  "en": "🇺🇸 الإنجليزية",
  "fr": "🇫🇷 الفرنسية",
  "es": "🇪🇸 الإسبانية",
  "de": "🇩🇪 الألمانية",
  "ja": "🇯🇵 اليابانية",
  "zh": "🇨🇳 الصينية"
};

module.exports.onStart = async function ({ api, event, args, message }) {
  try {
    api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

    let textToTranslate = "";
    let targetLang = "ar"; // افتراضي: العربية

    // حالة 1: الرد على رسالة
    if (event.messageReply) {
      textToTranslate = event.messageReply.body;
      const detectedLang = getLangCode(args[0]);
      targetLang = detectedLang !== "ar" || args[0] ? detectedLang : "ar";
    }
    // حالة 2: لا توجد معاملات
    else if (args.length === 0) {
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return message.reply(
        "❌ استخدم الأمر بشكل صحيح:\n" +
        ".ترجمة [لغة] [النص]\n" +
        "مثال: .ترجمة عربية Hello world\n\n" +
        "أو رد على رسالة وقل: .ترجمة عربية"
      );
    }
    // حالة 3: أول معامل هو اللغة
    else if (getLangCode(args[0]) && args.length > 1) {
      targetLang = getLangCode(args[0]);
      textToTranslate = args.slice(1).join(" ");
    }
    // حالة 4: بدون تحديد لغة (افتراضي عربي)
    else {
      textToTranslate = args.join(" ");
      targetLang = "ar";
    }

    if (!textToTranslate.trim()) {
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return message.reply("❌ يجب تحديد نص للترجمة!");
    }

    // ترجمة النص
    const result = await translate(textToTranslate, { to: targetLang });
    const translatedText = result.text;

    const langDisplay = langNames[targetLang] || "لغة مختارة";

    const responseMsg = `📝 ترجمة إلى ${langDisplay}:\n\n${translatedText}`;
    message.reply(responseMsg);
    api.setMessageReaction("✅", event.messageID, (err) => {}, true);

  } catch (error) {
    console.error("❌ خطأ في الترجمة:", error.message);
    api.setMessageReaction("❌", event.messageID, (err) => {}, true);
    message.reply("❌ حدث خطأ أثناء الترجمة! قد تكون الخدمة غير متاحة حالياً.");
  }
};
