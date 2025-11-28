const fs = require("fs-extra");
const path = require("path");

const warnsFile = path.join(process.cwd(), "database/warns.json");
const bansFile = path.join(process.cwd(), "database/bans.json");

const getWarns = (threadID) => {
  try {
    const data = fs.readJsonSync(warnsFile);
    return data[threadID] || {};
  } catch {
    return {};
  }
};

const saveWarns = (threadID, warns) => {
  try {
    const data = fs.readJsonSync(warnsFile);
    data[threadID] = warns;
    fs.writeFileSync(warnsFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("خطأ في حفظ التحذيرات:", err);
  }
};

const getBans = (threadID) => {
  try {
    const data = fs.readJsonSync(bansFile);
    return data[threadID] || [];
  } catch {
    return [];
  }
};

module.exports = {
  config: {
    name: "subscribe",
    version: "1.0",
    author: "Yamada KJ",
    category: "events"
  },

  langs: {
    ar: {
      botAdded: "✅ | تــم الــتــوصــيــل بـنـجـاح",
      botNickname: "𝑴𝒊𝒓𝒂𝒊",
      welcomeMessage: "✅ | تــم الــتــوصــيــل بـنـجـاح\n❏ الـرمـز : 『بدون رمز』\n❏ إسـم الـبـوت : 『%1』\nالــمــالــك : 『Yamada』\n╼╾─────⊹⊱⊰⊹─────╼╾\n⚠️  |  اكتب قائمة او اوامر او تقرير في حالة واجهتك أي مشكلة\n╼╾─────⊹⊱⊰⊹─────╼╾\n ⪨༒𓊈𒆜 𝑴𝒊𝒓𝒂𝒊 𒆜𓊉༒⪩ \n╼╾─────⊹⊱⊰⊹─────╼╾\n❏ رابـط الـمـطـور : \nhttps://www.facebook.com/profile.php?id=100092990751389",
      bannedUserKicked: "🚫 | تم طرد هذا العضو تلقائياً!\n📌 السبب: الشخص مبان من المجموعة",
      bannedUserWarning: "⚠️ | تنبيه: تم إضافة شخص مبان!\n👤 المعرف: %1\n⚠️ لازم البوت يكون ادمن لطرده تلقائياً!",
      warnsCleared: "✅ | تم حذف التحذيرات تلقائياً للعضو: %1\n👤 الشخص الذي أضافه: أدمن/مطور",
      warnedUserKicked: "🚫 | تم طرد العضو: %1\n📌 السبب: كان لديه 3 تحذيرات سابقة"
    }
  },

  onStart: async ({ message, event, api, usersData, threadsData, getLang }) => {
    try {
      if (!event.logMessageType) return;

      // جلب بيانات المجموعة
      let threadData = await threadsData.get(event.threadID);

      // إنشاء بيانات المجموعة إذا لم تكن موجودة
      if (!threadData) {
        await threadsData.create(event.threadID);
        threadData = await threadsData.get(event.threadID);
      }

      const { threadID } = event;

      switch (event.logMessageType) {
        case "log:unsubscribe": {
          // إذا تم طرد البوت من المجموعة
          if (event.logMessageData.leftParticipantFbId === api.getCurrentUserID()) {
            await threadsData.remove(event.threadID);
            console.log(`[SUBSCRIBE] تم حذف بيانات المجموعة ${event.threadID} لأن البوت تم طرده.`);
            return;
          }
          break;
        }

        case "log:subscribe": {
          // إذا تمت إضافة البوت إلى المجموعة
          if (event.logMessageData.addedParticipants.some((i) => i.userFbId === api.getCurrentUserID())) {
            // حذف رسالة التوصيل
            try {
              api.unsendMessage(event.messageID);
            } catch (e) {}

            // تغيير اسم البوت عند إضافته إلى المجموعة
            const botName = getLang("botNickname");
            try {
              api.changeNickname(
                `》 《 ❃ ➠ ${botName}`,
                event.threadID,
                api.getCurrentUserID()
              );
            } catch (e) {}

            // رسالة الترحيب عند إضافة البوت
            try {
              const welcomeMsg = getLang("welcomeMessage", botName);
              await api.sendMessage(welcomeMsg, event.threadID);
            } catch (e) {
              console.error("[SUBSCRIBE] خطأ في إرسال رسالة الترحيب:", e.message);
            }
          } else {
            // إذا تم إضافة أعضاء آخرين
            for (let i of event.logMessageData.addedParticipants) {
              const addedUserID = i.userFbId;
              await usersData.create(addedUserID);

              // 🚫 التحقق من قائمة الحظر أولاً
              const bans = getBans(event.threadID);
              if (bans.find(b => b.userID === addedUserID)) {
                try {
                  const botID = api.getCurrentUserID();
                  const threadInfo = await api.getThreadInfo(event.threadID);
                  const isBotAdmin = threadInfo.adminIDs?.some(admin => admin.id === botID);

                  if (isBotAdmin) {
                    // البوت ادمن: طرد الشخص المحظور تلقائياً
                    await api.removeUserFromGroup(addedUserID, event.threadID);
                    api.sendMessage(getLang("bannedUserKicked"), event.threadID);
                    continue;
                  } else {
                    // البوت ليس ادمن: رسالة تنبيه
                    api.sendMessage(getLang("bannedUserWarning", addedUserID), event.threadID);
                  }
                } catch (err) {
                  console.error("[SUBSCRIBE] خطأ في معالجة الشخص المبان:", err.message);
                }
              }

              // 🚫 التحقق من التحذيرات: إذا كان العضو لديه 3 تحذيرات وتم طرده
              const warns = getWarns(event.threadID);
              if (warns[addedUserID] && warns[addedUserID].kicked && warns[addedUserID].count >= 3) {
                const adderID = event.author; // معرف الشخص الذي أضاف العضو
                const config = global.GoatBot.config;
                const isAdminOrDev = config.ADMIN_IDS?.includes(adderID);

                if (isAdminOrDev) {
                  // إذا أضافه أدمن أو مطور: حذف التحذيرات تلقائياً
                  warns[addedUserID] = {
                    count: 0,
                    reasons: [],
                    warnedBy: [],
                    warnedAt: [],
                    kicked: false,
                    kickedDate: null
                  };
                  saveWarns(event.threadID, warns);

                  try {
                    const userName = await usersData.getName(addedUserID);
                    api.sendMessage(getLang("warnsCleared", userName), event.threadID);
                  } catch (err) {
                    console.error("[SUBSCRIBE] خطأ في إرسال الرسالة:", err);
                  }
                } else {
                  // إذا أضافه عضو عادي: طرده مرة أخرى تلقائياً
                  try {
                    const botID = api.getCurrentUserID();
                    const threadInfo = await api.getThreadInfo(event.threadID);
                    const isBotAdmin = threadInfo.adminIDs?.some(admin => admin.id === botID);

                    if (isBotAdmin) {
                      await api.removeUserFromGroup(addedUserID, event.threadID);
                      const userName = await usersData.getName(addedUserID);
                      api.sendMessage(getLang("warnedUserKicked", userName), event.threadID);
                    }
                  } catch (err) {
                    console.error("[SUBSCRIBE] خطأ في طرد العضو:", err);
                  }
                }
              }
            }
          }
          break;
        }
      }
    } catch (err) {
      console.error("[SUBSCRIBE] خطأ:", err.message);
    }
  }
};
