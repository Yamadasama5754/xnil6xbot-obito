const axios = require("axios");

module.exports.config = {
  name: "بروفايلك",
  version: "1.0",
  author: "Yamada KJ & Alastor",
  countDown: 5,
  role: 2,
  description: {
    en: "تغيير صورة ملف تعريف البوت"
  },
  category: "إدارة",
  guide: {
    en: "   {pn} <رابط الصورة>: تغيير صورة البروفايل\n   {pn} <نص التعليق>: رد على صورة أو أرسل صورة مع الأمر"
  },
  aliases: ["ppf", "avatar", "الصورة"]
};

module.exports.onStart = async function ({ api, event, args, message }) {
  try {
    let imageURL = (args[0] || "").startsWith("http") ? args.shift() : null;

    if (!imageURL) {
      // الرد على صورة
      if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
        imageURL = event.messageReply.attachments[0].url;
      }
      // أو إرسال صورة مع الأمر
      else if (event.attachments && event.attachments.length > 0) {
        imageURL = event.attachments[0].url;
      }
    }

    if (!imageURL) {
      return message.reply(
        "❌ يجب تزويد رابط صورة أو إرسال صورة مع الأمر\n" +
        "مثال: .بروفايلك https://example.com/image.jpg"
      );
    }

    const caption = args.join(" ") || "بروفايل جديد";

    let response;
    try {
      response = await axios.get(imageURL, {
        responseType: "arraybuffer",
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });
    } catch (err) {
      return message.reply("❌ حدث خطأ أثناء جلب الصورة من الرابط");
    }

    // تحقق من نوع الملف
    const contentType = response.headers["content-type"];
    if (!contentType || !contentType.includes("image")) {
      return message.reply("❌ الملف ليس صورة صحيحة");
    }

    // محاولة تغيير الأفاتار
    api.changeAvatar(response.data, caption, null, (err) => {
      if (err) {
        console.error("❌ خطأ في تغيير الأفاتار:", err.message);
        return message.reply(`❌ خطأ: ${err.message}`);
      }
      return message.reply("✅ تم تغيير صورة ملف التعريف بنجاح!");
    });

  } catch (err) {
    console.error("❌ خطأ في أمر SetAvatar:", err.message);
    message.reply(`❌ حدثت مشكلة: ${err.message}`);
  }
};
