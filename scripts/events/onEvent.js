module.exports = {
  config: {
    name: "onEvent",
    version: "1.0",
    author: "Enhanced",
    category: "events",
    isBot: false
  },

  langs: {
    ar: {
      eventError: "❌ حدث خطأ في معالجة الحدث: {0}"
    },
    en: {
      eventError: "❌ Error processing event: {0}"
    },
    vi: {
      eventError: "❌ Lỗi xử lý sự kiện: {0}"
    }
  },

  onStart: async (params) => {
    try {
      const { event, api, getLang } = params;
      
      if (!event) return;
      
      // معالجة الأحداث العامة
      if (event.logMessageType) {
        // تسجيل الأحداث
        console.log(`[EVENT] ${event.logMessageType} at thread ${event.threadID}`);
      }
      
    } catch (error) {
      console.error("[ON_EVENT] Error:", error.message);
    }
  }
};
