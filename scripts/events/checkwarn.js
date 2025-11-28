module.exports = {
  config: {
    name: "checkwarn",
    version: "1.0",
    author: "Enhanced",
    category: "events"
  },

  langs: {
    ar: {
      checkWarn: "⚠️ تنبيه: لديك {0} تحذيرات"
    },
    en: {
      checkWarn: "⚠️ Warning: You have {0} warnings"
    },
    vi: {
      checkWarn: "⚠️ Cảnh báo: Bạn có {0} cảnh báo"
    }
  },

  onStart: async ({ event, threadsData, usersData, message, getLang }) => {
    try {
      if (!event.senderID) return;
      
      const warns = await threadsData.get(event.threadID, `data.warns.${event.senderID}`, []);
      if (!warns || warns.length === 0) return;
      
      if (warns.length >= 3) {
        message.send(getLang("checkWarn", warns.length));
      }
    } catch (error) {
      console.error("[CHECKWARN] Error:", error.message);
    }
  }
};
