module.exports = {
  config: {
    name: "autoUpdateInfoThread",
    version: "1.0",
    author: "Enhanced",
    category: "events"
  },

  langs: {
    ar: {
      memberCount: "عدد الأعضاء: {0}"
    },
    en: {
      memberCount: "Members: {0}"
    },
    vi: {
      memberCount: "Số thành viên: {0}"
    }
  },

  onStart: async ({ event, api, threadsData, getLang }) => {
    try {
      if (!event.threadID) return;
      
      const threadInfo = await api.getThreadInfo(event.threadID);
      if (!threadInfo) return;
      
      const memberCount = threadInfo.participantIDs?.length || 0;
      await threadsData.set(event.threadID, memberCount, "data.memberCount");
      
    } catch (error) {
      console.error("[AUTO_UPDATE] Error:", error.message);
    }
  }
};
