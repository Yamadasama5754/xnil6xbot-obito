const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "تخيلي",
  version: "1.1.0",
  author: "Yamada KJ & Alastor",
  countDown: 15,
  role: 0,
  description: {
    en: "إنشاء فن باستخدام الذكاء الاصطناعي من وصف معطى مع إمكانية إعادة الرسم"
  },
  category: "صور",
  guide: {
    en: "   {pn} <الوصف>: إنشاء صورة من وصف\n   رد بـ 'إعادة' لإعادة الرسم"
  },
  aliases: ["imagin", "تخيل"]
};

// دالة توليد الصورة
const generateImage = async (api, threadID, messageID, prompt, senderID) => {
  const tempDir = path.join(process.cwd(), "cache");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  try {
    const waitMsg = await api.sendMessage(
      "⚙️ | جـارٍ تـولـيـد وصـفـك...\n⏱️ | الرجاء الانتظار...",
      threadID
    );

    // ترجمة النص
    const translationRes = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(
        prompt
      )}`
    );
    const translatedPrompt = translationRes?.data?.[0]?.[0]?.[0];

    if (!translatedPrompt)
      return api.sendMessage("❌ | حدث خطأ أثناء ترجمة النص.", threadID);

    // إنشاء الصورة
    const url = "https://ai-api.magicstudio.com/api/ai-art-generator";
    const form = new FormData();
    form.append("prompt", translatedPrompt);
    form.append("output_format", "bytes");
    form.append("user_profile_id", "null");
    form.append("anonymous_user_id", "8e79d4c4-801b-4908-858b-4afbee282b3e");
    form.append("request_timestamp", Math.floor(Date.now() / 1000));
    form.append("user_is_subscribed", "false");
    form.append("client_id", "pSgX7WgjukXCBoYwDM8G8GLnRRkvAoJlqa5eAVvj95o");

    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
        Origin: "https://magicstudio.com",
        Referer: "https://magicstudio.com/ai-art-generator/",
      },
      responseType: "arraybuffer",
      timeout: 30000
    });

    if (response.data) {
      const filePath = path.join(tempDir, `${Date.now()}.png`);
      fs.writeFileSync(filePath, response.data);

      api.unsendMessage(waitMsg.messageID);
      api.setMessageReaction("✔️", messageID, () => {}, true);

      api.sendMessage(
        {
          body: `✔️ | تـم تـولـيـد الـصـورة بنجاح!\n📝 | الوصف: ${prompt}\n\n✅ للـرسم مجددًا، رد بـ "إعادة".`,
          attachment: fs.createReadStream(filePath),
        },
        threadID,
        (err, info) => {
          if (!err && info && info.messageID) {
            try {
              fs.unlinkSync(filePath);
            } catch (e) {
              console.error("خطأ في حذف الملف:", e.message);
            }
            
            // حفظ الوصف للرد على "إعادة"
            if (global.GoatBot && global.GoatBot.onEvent) {
              global.GoatBot.onEvent.push({
                messageID: info.messageID,
                author: senderID,
                prompt: prompt,
                name: "تخيلي",
                onStart: async ({ event, api }) => {
                  if (event.type === "message_reply" && event.messageReply?.messageID === info.messageID) {
                    const choice = event.body?.trim().toLowerCase();
                    if (choice === "إعادة" && event.senderID === senderID) {
                      await generateImage(api, event.threadID, event.messageID, prompt, senderID);
                    }
                  }
                }
              });
            }
          }
        }
      );
    } else {
      api.unsendMessage(waitMsg.messageID);
      api.sendMessage("❌ | فشل في إنشاء الصورة.", threadID);
    }
  } catch (error) {
    console.error("❌ خطأ أثناء توليد الصورة:", error.message);
    api.sendMessage("❌ | حدث خطأ أثناء إنشاء الصورة. تأكد من أن الخدمة متاحة.", threadID);
  }
};

module.exports.onStart = async function ({ api, event, args, message }) {
  const { threadID, messageID, senderID } = event;

  if (!args || args.length === 0) {
    api.setMessageReaction("⚙️", messageID, () => {}, true);
    return message.reply("⚠️ | يرجى تقديم وصف لإنشاء صورة بعد الأمر.\n\nمثال: .تخيلي قط أسود بعيون زرقاء");
  }

  const prompt = args.join(" ");
  await generateImage(api, threadID, messageID, prompt, senderID);
};
