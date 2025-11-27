const axios = require("axios");
const fs = require("fs");

module.exports = {
  config: {
    name: "بارد",
    version: "1.1",
    author: "rehat--",
    countDown: 5,
    role: 0,
    longDescription: { en: "ذكاء أصطناعي يجيب عن الأسئلة" },
    guide: { en: "{pn} <سؤال>" },
    category: "الذكاء الإصطناعي",
  },
  clearHistory: function () {
    global.GoatBot.onReply.clear();
  },

  onStart: async function ({ message, event, args, commandName }) {
    const uid = event.senderID;
    const prompt = args.join(" ");

    if (!prompt) {
      message.reply(" ⚠️ | المرجو إدخال سؤال.");
      return;
    }

    if (prompt.toLowerCase() === "clear") {
      this.clearHistory();
      message.reply(" ✅ | تم مسح السجل");
      return;
    }

    // تحليل الصور باستخدام Gemini
    if (event.type === "message_reply" && event.messageReply.attachments && event.messageReply.attachments[0].type === "photo") {
      try {
        const photo = encodeURIComponent(event.messageReply.attachments[0].url);
        const query = args.join(" ") || "وصف الصورة";
        const url = `https://turtle-apis.onrender.com/api/gemini/img?prompt=${encodeURIComponent(query)}&url=${photo}`;
        const response = await axios.get(url, { timeout: 10000 });
        message.reply(response.data.answer || response.data.result || " ✅ تم معالجة الصورة");
        return;
      } catch (error) {
        console.error("[BARD] Image error:", error.message);
        message.reply(' ❌ | خطأ في معالجة الصورة');
        return;
      }
    }

    // الرد على الأسئلة باستخدام Gemini
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyDn36rL2l0oxyS6_h6OqtHn_LK4CVk3u_0`;
      
      const response = await axios.post(apiUrl, {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }, { timeout: 15000 });

      let content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || " ❌ | لم يتم الحصول على إجابة";

      message.reply(content, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
          });
        }
      });
    } catch (error) {
      console.error("[BARD] Error:", error.message);
      message.reply(' ❌ | حدث خطأ في الرد. حاول مرة أخرى.');
    }
  },

  onReply: async function ({ message, event, Reply, args }) {
    const prompt = args.join(" ");
    let { author, commandName } = Reply;
    
    if (event.senderID !== author) return;
    if (!prompt) return;

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyDn36rL2l0oxyS6_h6OqtHn_LK4CVk3u_0`;
      
      const response = await axios.post(apiUrl, {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }, { timeout: 15000 });

      let content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || " ❌ | لم يتم الحصول على إجابة";

      message.reply(content, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
          });
        }
      });
    } catch (error) {
      console.error("[BARD] Reply error:", error.message);
      message.reply(" ❌ | حدث خطأ في الرد.");
    }
  },
};
