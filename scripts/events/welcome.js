const { getTime, drive } = global.utils;

if (!global.temp.welcomeEvent)
  global.temp.welcomeEvent = {};

module.exports = {
  config: {
    name: "welcome",
    version: "2.0",
    author: "Enhanced",
    category: "events",
  },

  langs: {
    ar: {
      session1: "الصباح 🌅",
      session2: "الظهيرة ☀️",
      session3: "بعد الظهر 🌤️",
      session4: "المساء 🌙",
      welcomeMessage: "✨ مرحبًا بك في عالم السحر والتكنولوجيا! 🚀\n≼━━━━━⌬🌟🧿🌟⌬━━━━━━≽\n🐍 بادئة البوت : %1\n≼━━━━━⌬🌟🧿🌟⌬━━━━━━≽\n💫 **اكتشف السحر بكتابة** `%1help`",
      multiple1: "مرحباً بك",
      multiple2: "مرحباً بكم جميعاً",
      defaultWelcomeMessage: `┌────━━❖🧿❖━━─────┐\n⚜️الأسم : 『{userName}』\n💮________༺🩷༻________💮\n⚜️إسم المجموعة : 『{boxName}』\n💮________༺🩷༻________💮\n⚜️الوقت : 『{session}』\n💮________༺🩷༻________💮\n🔖ولا تنسى يا 『{userName}』 اللفظ و إن ضاق بك الرد\n└────━━❖🧿❖━━─────┘`
    },
    vi: {
      session1: "sáng",
      session2: "trưa",
      session3: "chiều",
      session4: "tối",
      welcomeMessage: "Cảm ơn bạn đã mời tôi vào nhóm!\nPrefix bot: %1\nĐể xem danh sách lệnh hãy nhập: %1help",
      multiple1: "bạn",
      multiple2: "các bạn",
      defaultWelcomeMessage: "Xin chào {userName}.\nChào mừng bạn đến với {boxName}.\nChúc bạn có buổi {session} vui vẻ!"
    },
    en: {
      session1: "Morning",
      session2: "Noon",
      session3: "Afternoon",
      session4: "Evening",
      welcomeMessage: "Thanks for inviting me to the group!\nBot Prefix: %1\nTo see the command list, type: %1help",
      multiple1: "you",
      multiple2: "everyone",
      defaultWelcomeMessage: "Hello {userName}.\nWelcome to {boxName}.\nHave a great {session}!"
    }
  },

  onStart: async ({ threadsData, message, event, api, getLang }) => {
    try {
      if (event.logMessageType !== "log:subscribe") return;

      const hours = getTime("HH");
      const { threadID } = event;
      const { nickNameBot } = global.GoatBot.config;
      const prefix = global.utils.getPrefix(threadID);
      const dataAddedParticipants = event.logMessageData?.addedParticipants || [];

      // التحقق من إضافة البوت
      if (dataAddedParticipants.some((item) => item.userFbId === api.getCurrentUserID())) {
        try {
          if (nickNameBot) {
            await api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
          }
        } catch (e) {
          console.log("[WELCOME] Nick error:", e.message);
        }
        return message.send(getLang("welcomeMessage", prefix));
      }

      // إنشاء مؤقت للترحيب
      if (!global.temp.welcomeEvent[threadID]) {
        global.temp.welcomeEvent[threadID] = {
          joinTimeout: null,
          dataAddedParticipants: [],
        };
      }

      global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
      clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

      global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
        try {
          const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
          const threadData = await threadsData.get(threadID);
          
          // التحقق من تعطيل رسالة الترحيب
          if (threadData?.settings?.sendWelcomeMessage === false) {
            return;
          }

          const dataBanned = threadData?.data?.banned_ban || [];
          const threadName = threadData?.threadName || "مجموعة";
          const userName = [];
          const mentions = [];
          let multiple = false;

          if (dataAddedParticipants.length > 1) multiple = true;

          for (const user of dataAddedParticipants) {
            if (!user || !user.userFbId) continue;
            if (dataBanned.some((item) => item?.id === user.userFbId)) continue;
            
            userName.push(user.fullName || "مستخدم");
            mentions.push({
              tag: user.fullName || "مستخدم",
              id: user.userFbId,
            });
          }

          if (userName.length === 0) return;

          let welcomeMessage = threadData?.data?.welcomeMessage;
          
          if (!welcomeMessage) {
            try {
              welcomeMessage = getLang("defaultWelcomeMessage");
            } catch (e) {
              console.log("[WELCOME] getLang error:", e.message);
              welcomeMessage = "مرحباً بك {userName} في {boxName}";
            }
          }

          const form = {
            mentions: welcomeMessage.match(/\{userNameTag\}/g) ? mentions : null,
          };

          welcomeMessage = welcomeMessage
            .replace(/\{userName\}|\{userNameTag\}/g, userName.join(", "))
            .replace(/\{boxName\}|\{threadName\}/g, threadName)
            .replace(/\{multiple\}/g, multiple ? getLang("multiple2") : getLang("multiple1"))
            .replace(/\{session\}/g,
              hours <= 10 ? getLang("session1") :
              hours <= 12 ? getLang("session2") :
              hours <= 18 ? getLang("session3") :
              getLang("session4")
            );

          form.body = welcomeMessage;

          // إضافة الصور إن وجدت
          if (threadData?.data?.welcomeAttachment && Array.isArray(threadData.data.welcomeAttachment)) {
            const files = threadData.data.welcomeAttachment;
            const attachments = files.reduce((acc, file) => {
              try {
                acc.push(drive.getFile(file, "stream"));
              } catch (e) {
                console.log("[WELCOME] Attachment error:", e.message);
              }
              return acc;
            }, []);
            
            const results = await Promise.allSettled(attachments);
            form.attachment = results
              .filter(({ status }) => status === "fulfilled")
              .map(({ value }) => value);
          }

          message.send(form);
          delete global.temp.welcomeEvent[threadID];
        } catch (timeoutError) {
          console.error("[WELCOME] Timeout handler error:", timeoutError.message);
        }
      }, 1500);

    } catch (error) {
      console.error("[WELCOME] Event error:", error.message);
    }
  },
};
