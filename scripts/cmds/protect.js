const { getStreamFromURL, uploadImgbb } = global.utils;
const moment = require("moment-timezone");

module.exports.config = {
  name: "حماية",
  aliases: ["protect", "حم"],
  version: "3.0",
  author: "Enhanced",
  countDown: 5,
  role: 1,
  description: "نظام حماية متقدم للمجموعة",
  category: "المجموعة",
  guide: `{pn} صورة [تشغيل|إيقاف]: حماية الصورة
{pn} اسم [تشغيل|إيقاف]: حماية الاسم
{pn} لقب [تشغيل|إيقاف]: حماية الألقاب
{pn} سمة [تشغيل|إيقاف]: حماية السمة
{pn} إيموجي [تشغيل|إيقاف]: حماية الإيموجي
{pn} قائمة: عرض الحمايات
{pn} إحصائيات: إحصائيات المحاولات
{pn} إعادة_تعيين: إلغاء جميع الحمايات`
};

module.exports.langs = {
  ar: {
    groupOnly: "⚠️ هذا الأمر للمجموعات فقط!",
    noPermission: "🚫 فقط الأدمن يمكنهم تفعيل الحمايات!",
    syntaxError: "❌ صيغة خاطئة!\n💡 استخدم: .حماية [النوع] [تشغيل|إيقاف]",
    apiError: "❌ خطأ في API: {0}",
    protectOn: "🟢 تم تفعيل حماية {0}\n⏱️ الوقت: {1}",
    protectOff: "🔴 تم إيقاف حماية {0}",
    alreadyEnabled: "⚠️ حماية {0} مفعلة بالفعل!",
    alreadyDisabled: "⚠️ حماية {0} معطلة بالفعل!",
    changeDetected: "🚨 محاولة تغيير {0}!\n👤 من قبل: {1}\n⏱️ الوقت: {2}",
    listHeader: "📋 الحمايات المفعلة",
    listEmpty: "✅ لا توجد حمايات مفعلة",
    listItem: "{0}. {1} ✅",
    statsHeader: "📊 إحصائيات المحاولات",
    statsItem: "{0}: {1} محاولة",
    statsEmpty: "✅ لا توجد محاولات",
    resetSuccess: "✅ تم إلغاء جميع الحمايات",
    revertSuccess: "✅ تم استرجاع {0}"
  }
};

const PROTECTION_TYPES = {
  avatar: { name: "الصورة", emoji: "🖼️", type: "log:thread-image" },
  name: { name: "الاسم", emoji: "📝", type: "log:thread-name" },
  nickname: { name: "الألقاب", emoji: "🏷️", type: "log:user-nickname" },
  theme: { name: "السمة", emoji: "🎨", type: "log:thread-color" },
  emoji: { name: "الإيموجي", emoji: "😀", type: "log:thread-icon" }
};

module.exports.onStart = async function ({ message, event, args, threadsData, api, getLang }) {
  try {
    const { threadID, senderID } = event;
    const threadInfo = await api.getThreadInfo(threadID);

    if (!threadInfo.isGroup) {
      return message.reply(getLang("groupOnly"));
    }

    const adminIDs = threadInfo.adminIDs || [];
    if (!adminIDs.includes(senderID)) {
      return message.reply(getLang("noPermission"));
    }

    const protectData = await threadsData.get(threadID, "data.protect_system", {});
    const statData = await threadsData.get(threadID, "data.protect_stats", {});

    // قائمة الحمايات
    if (args[0] === "قائمة" || args[0] === "list") {
      const enabled = Object.keys(protectData).filter(k => protectData[k]?.enabled);
      if (!enabled.length) {
        return message.reply(getLang("listEmpty"));
      }
      let msg = getLang("listHeader") + "\n━━━━━━━━━━━━━━━━━━\n";
      for (const [idx, key] of enabled.entries()) {
        const type = PROTECTION_TYPES[key];
        msg += getLang("listItem", idx + 1, `${type.emoji} ${type.name}`);
      }
      return message.reply(msg);
    }

    // الإحصائيات
    if (args[0] === "إحصائيات" || args[0] === "stats") {
      if (!Object.keys(statData).length) {
        return message.reply(getLang("statsEmpty"));
      }
      let msg = getLang("statsHeader") + "\n━━━━━━━━━━━━━━━━━━\n";
      for (const [key, count] of Object.entries(statData)) {
        const type = PROTECTION_TYPES[key];
        if (type) {
          msg += getLang("statsItem", `${type.emoji} ${type.name}`, count) + "\n";
        }
      }
      return message.reply(msg);
    }

    // إعادة تعيين
    if (args[0] === "إعادة_تعيين" || args[0] === "reset") {
      await threadsData.set(threadID, {}, "data.protect_system");
      await threadsData.set(threadID, {}, "data.protect_stats");
      return message.reply(getLang("resetSuccess"));
    }

    // تفعيل/إيقاف حماية
    if (!args[0] || !["تشغيل", "إيقاف", "on", "off"].includes(args[1])) {
      return message.reply(getLang("syntaxError"));
    }

    const protectType = args[0].toLowerCase();
    const isOn = ["تشغيل", "on"].includes(args[1].toLowerCase());
    let protectionKey = null;

    // تحديد نوع الحماية
    for (const key of Object.keys(PROTECTION_TYPES)) {
      if (key.startsWith(protectType) || protectType.includes(key)) {
        protectionKey = key;
        break;
      }
    }

    if (!protectionKey) {
      return message.reply(getLang("syntaxError"));
    }

    // التحقق من الحالة الحالية
    if (isOn && protectData[protectionKey]?.enabled) {
      return message.reply(getLang("alreadyEnabled").replace("{0}", PROTECTION_TYPES[protectionKey].name));
    }

    if (!isOn && !protectData[protectionKey]?.enabled) {
      return message.reply(getLang("alreadyDisabled").replace("{0}", PROTECTION_TYPES[protectionKey].name));
    }

    // الحفظ
    if (isOn) {
      if (!protectData[protectionKey]) {
        protectData[protectionKey] = {};
      }
      protectData[protectionKey].enabled = true;
      protectData[protectionKey].createdAt = moment().tz(global.GoatBot?.config?.timeZone || "Asia/Baghdad").format("HH:mm:ss DD/MM/YYYY");
      
      await threadsData.set(threadID, protectData, "data.protect_system");
      const time = moment().tz(global.GoatBot?.config?.timeZone || "Asia/Baghdad").format("HH:mm:ss DD/MM/YYYY");
      const typeInfo = PROTECTION_TYPES[protectionKey];
      return message.reply(getLang("protectOn", `${typeInfo.emoji} ${typeInfo.name}`, time));
    } else {
      if (protectData[protectionKey]) {
        delete protectData[protectionKey];
      }
      await threadsData.set(threadID, protectData, "data.protect_system");
      return message.reply(getLang("protectOff", PROTECTION_TYPES[protectionKey].name));
    }

  } catch (error) {
    console.error("[PROTECT] Error:", error.message);
    message.reply(getLang("apiError").replace("{0}", error.message));
  }
};

module.exports.onEvent = async function ({ message, event, threadsData, api, usersData, getLang }) {
  try {
    const { threadID, logMessageType, logMessageData, author } = event;
    const botID = api.getCurrentUserID();

    // البحث عن نوع الحماية
    let protectionKey = null;
    for (const [key, config] of Object.entries(PROTECTION_TYPES)) {
      if (config.type === logMessageType) {
        protectionKey = key;
        break;
      }
    }

    if (!protectionKey) return;

    const protectData = await threadsData.get(threadID, "data.protect_system", {});
    if (!protectData[protectionKey]?.enabled) return;

    // تجاهل تغييرات البوت والأدمن
    if (author === botID) return;
    const threadInfo = await api.getThreadInfo(threadID);
    if (threadInfo.adminIDs?.includes(author)) return;

    return async function () {
      try {
        const protType = PROTECTION_TYPES[protectionKey];
        const authorName = await usersData.getName(author) || "مجهول";
        const time = moment().tz(global.GoatBot?.config?.timeZone || "Asia/Baghdad").format("HH:mm:ss DD/MM/YYYY");

        // تحديث الإحصائيات
        const statData = await threadsData.get(threadID, "data.protect_stats", {});
        statData[protectionKey] = (statData[protectionKey] || 0) + 1;
        await threadsData.set(threadID, statData, "data.protect_stats");

        // إرسال إنذار
        message.send(getLang("changeDetected", `${protType.emoji} ${protType.name}`, authorName, time));

        // استرجاع البيانات - استدعاء من السجل المحفوظ
        switch (protectionKey) {
          case "avatar": {
            const threadData = await threadsData.get(threadID);
            if (threadData?.imageSrc) {
              try {
                const imgUrl = await uploadImgbb(threadData.imageSrc);
                await api.changeGroupImage(await getStreamFromURL(imgUrl.image.url), threadID);
                message.send(getLang("revertSuccess", "الصورة"));
              } catch (err) {
                console.error("[PROTECT] Avatar revert:", err.message);
              }
            }
            break;
          }
          case "name": {
            const threadData = await threadsData.get(threadID);
            if (threadData?.threadName) {
              try {
                await api.setTitle(threadData.threadName, threadID);
                message.send(getLang("revertSuccess", "الاسم"));
              } catch (err) {
                console.error("[PROTECT] Name revert:", err.message);
              }
            }
            break;
          }
          case "nickname": {
            const threadData = await threadsData.get(threadID);
            const { participant_id, nickname } = logMessageData;
            const members = threadData?.members || [];
            const member = members.find(m => m.userID === participant_id);
            if (member?.nickname) {
              try {
                await api.changeNickname(member.nickname, threadID, participant_id);
                message.send(getLang("revertSuccess", "اللقب"));
              } catch (err) {
                console.error("[PROTECT] Nickname revert:", err.message);
              }
            }
            break;
          }
          case "theme": {
            const threadData = await threadsData.get(threadID);
            const theme = threadData?.threadThemeID || "196241301102133";
            try {
              await api.changeThreadColor(theme, threadID);
              message.send(getLang("revertSuccess", "السمة"));
            } catch (err) {
              console.error("[PROTECT] Theme revert:", err.message);
            }
            break;
          }
          case "emoji": {
            const threadData = await threadsData.get(threadID);
            if (threadData?.emoji) {
              try {
                await api.changeThreadEmoji(threadData.emoji, threadID);
                message.send(getLang("revertSuccess", "الإيموجي"));
              } catch (err) {
                console.error("[PROTECT] Emoji revert:", err.message);
              }
            }
            break;
          }
        }
      } catch (err) {
        console.error("[PROTECT] Event handler:", err.message);
      }
    };
  } catch (error) {
    console.error("[PROTECT] Event Error:", error.message);
  }
};
