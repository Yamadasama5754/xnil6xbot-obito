const axios = require("axios");
const baseApiUrl = async () => {
  const base = await axios.get(
    `https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`,
  );
  return base.data.api;
};

module.exports = {
  config: {
    name: "gemini",
    version: "1.0",
    author: "Dipto",
    description: {
      en: "Gemini AI assistant",
      ar: "مساعد Gemini الذكي"
    },
    countDown: 5,
    role: 0,
    category: "google",
    guide: {
      en: "{pn} message | photo reply",
      ar: "{pn} رسالة | رد على صورة"
    },
  },

  langs: {
    en: {
      noPrompt: "Please provide a prompt or message reply",
      error: "Sorry, there was an error processing your request."
    },
    ar: {
      noPrompt: "يرجى تقديم سؤال أو الرد على رسالة",
      error: "عذراً، حدث خطأ أثناء معالجة طلبك."
    }
  },

  onStart: async ({ api, args, event, getLang }) => {
    const prompt = args.join(" ");
    
    if (event.type === "message_reply") {
      var t = event.messageReply.attachments[0].url;
      try {
        const response = await axios.get(
          `${await baseApiUrl()}/gemini?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(t)}`,
        );
        const data2 = response.data.dipto;
        api.sendMessage(data2, event.threadID, event.messageID);
      } catch (error) {
        console.error("Error:", error.message);
        api.sendMessage(getLang("error") + " " + error, event.threadID, event.messageID);
      }
    }
    else if (!prompt) {
      return api.sendMessage(
        getLang("noPrompt"),
        event.threadID,
        event.messageID,
      );
    } else {
      try {
        const respons = await axios.get(
          `${await baseApiUrl()}/gemini?prompt=${encodeURIComponent(prompt)}`,
        );
        const message = respons.data.dipto;
        api.sendMessage(message, event.threadID, event.messageID);
      } catch (error) {
        console.error("Error calling Gemini AI:", error);
        api.sendMessage(
          getLang("error") + " " + error,
          event.threadID,
          event.messageID,
        );
      }
    }
  },
};
