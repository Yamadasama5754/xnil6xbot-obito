module.exports = {
  config: {
    name: "newcommandevent",
    version: "1.0",
    author: "Enhanced",
    category: "events",
    isBot: false
  },

  langs: {
    ar: {
      newCommand: "✨ أمر جديد: {0}"
    },
    en: {
      newCommand: "✨ New command: {0}"
    },
    vi: {
      newCommand: "✨ Lệnh mới: {0}"
    }
  },

  onStart: async (params) => {
    try {
      const { event, getLang } = params;
      
      if (!event || !event.body) return;
      
      // معالجة الأوامر الجديدة
      console.log("[NEW_COMMAND] Event triggered");
      
    } catch (error) {
      console.error("[NEW_COMMAND] Error:", error.message);
    }
  }
};
