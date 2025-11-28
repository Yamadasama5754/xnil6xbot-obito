const { getTime, drive } = global.utils;

module.exports = {
  config: {
    name: "leave",
    version: "1.5",
    author: "Enhanced",
    category: "events"
  },

  langs: {
    ar: {
      session1: "الصباح",
      session2: "الظهيرة",
      session3: "بعد الظهر",
      session4: "المساء",
      leaveType1: "غادر {userName} كان صنما لم نكن بحاجته اصلا لاتنسى تسكر الباب وراك 🐢🔱",
      leaveType2: "تم طرده من المجموعة {userName} خذوه عبرة 😺📜",
      defaultLeaveMessage: "{type}"
    }
  },

  onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
    try {
      if (event.logMessageType !== "log:unsubscribe") return;

      return async function () {
        try {
          const { threadID } = event;
          const threadData = await threadsData.get(threadID);
          
          if (threadData?.settings?.sendLeaveMessage === false) {
            return;
          }

          const { leftParticipantFbId } = event.logMessageData || {};
          if (!leftParticipantFbId) return;
          
          if (leftParticipantFbId === api.getCurrentUserID()) {
            return;
          }

          const userName = await usersData.getName(leftParticipantFbId) || "مستخدم";
          const threadName = threadData?.threadName || "المجموعة";
          
          let leaveMessage = threadData?.data?.leaveMessage;
          if (!leaveMessage) {
            leaveMessage = getLang("defaultLeaveMessage");
          }

          const form = {};

          // تحديد نوع الرسالة (غادر أم تم طرده)
          const isVoluntary = leftParticipantFbId === event.author;
          const typeMessage = isVoluntary ? getLang("leaveType1") : getLang("leaveType2");

          // ترتيب الاستبدالات: أولاً {type}، ثم {userName}
          leaveMessage = leaveMessage
            .replace(/\{type\}/g, typeMessage)
            .replace(/\{userName\}|\{userNameTag\}/g, userName)
            .replace(/\{threadName\}|\{boxName\}/g, threadName);

          if (leaveMessage.includes("{userNameTag}")) {
            form.mentions = [{
              id: leftParticipantFbId,
              tag: userName
            }];
          }

          form.body = leaveMessage;

          if (threadData?.data?.leaveAttachment && Array.isArray(threadData.data.leaveAttachment)) {
            const files = threadData.data.leaveAttachment;
            const attachments = files.reduce((acc, file) => {
              try {
                acc.push(drive.getFile(file, "stream"));
              } catch (e) {
                console.log("[LEAVE] Attachment error");
              }
              return acc;
            }, []);
            const results = await Promise.allSettled(attachments);
            form.attachment = results
              .filter(({ status }) => status === "fulfilled")
              .map(({ value }) => value);
          }

          message.send(form);
        } catch (handlerError) {
          console.error("[LEAVE] Handler error:", handlerError.message);
        }
      };
    } catch (error) {
      console.error("[LEAVE] Event error:", error.message);
    }
  }
};
