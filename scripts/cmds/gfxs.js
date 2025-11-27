const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs");

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
  if (!text) {
    return message.reply(` ⚠️ | أرجوك قم بإدخال إسمك للتصميم`);
  } else {
    try {
      const img = `https://tanjiro-api.onrender.com/gfx1?name=${encodeURIComponent(text)}&api_key=tanjiro`;                

      const form = {
        body: ` ✨ تفضل تصميمك`
      };
      form.attachment = [];
      form.attachment[0] = await global.utils.getStreamFromURL(img);
      message.reply(form);
    } catch (error) {
      console.error("[GFXS] Error:", error.message);
      message.reply(`❌ حدث خطأ أثناء إنشاء التصميم. حاول مرة أخرى.`);
    }
  }
};
