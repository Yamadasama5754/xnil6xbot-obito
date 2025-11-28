const { getStreamFromURL, uploadImgbb } = global.utils;

module.exports.config = {
  name: "حماية",
  version: "1.9",
  author: "NTKhang",
  countDown: 5,
  role: 0,
  description: {
    en: "قم بتشغيل أو إيقاف حماية المجموعة"
  },
  category: "المجموعة",
  guide: {
    en: "{pn} صورة [تشغيل | إيقاف]: مكافحة تغيير صورة المجموعة\n{pn} الإسم [تشغيل | إيقاف]: مكافحة تغيير إسم المجموعة\n{pn} اللقب [تشغيل | إيقاف]: مكافحة تغيير لقب الأعضاء\n{pn} السمة [تشغيل | إيقاف]: مكافحة تغيير السمة (theme) للمجموعة\n{pn} إيموجي [تشغيل | إيقاف]: مكافحة تغيير إيموجي المجموعة"
  }
};

module.exports.langs = {
  ar: {
    antiChangeAvatarOn: "✅ تم تشغيل مضاد تغيير صورة المجموعة",
    antiChangeAvatarOff: "❌ تم إيقاف مضاد تغيير صورة المجموعة",
    missingAvt: "أنت لم تقم بضبط أفاتار للمجموعة",
    antiChangeNameOn: "✅ تم تشغيل مضاد تغيير إسم المجموعة",
    antiChangeNameOff: "❌ تم إيقاف مضاد تغيير إسم المجموعة",
    antiChangeNicknameOn: "✅ تم تشغيل مضاد تغيير اللقب بالنسبة للأعضاء",
    antiChangeNicknameOff: "❌ تم إيقاف تشغيل مضاد تغيير اللقب بالنسبة للأعضاء",
    antiChangeThemeOn: "✅ تم تشغيل مضاد تغيير السمة بالنسبة للمجموعة",
    antiChangeThemeOff: "❌ تم إيقاف مضاد تغيير السمة بالنسبة للمجموعة",
    antiChangeEmojiOn: "✅ تم تشغيل مضاد تغيير إيموجي المجموعة",
    antiChangeEmojiOff: "❌ تم إيقاف تشغيل مضاد تغيير إيموجي المجموعة",
    antiChangeAvatarAlreadyOn: "مجموعتك حاليا في وضع مضاد تغيير صورة المجموعة",
    antiChangeAvatarAlreadyOnButMissingAvt: "مجموعتك حاليا في وضع مضاد تغيير صورة المجموعة لكن لم يتم ضبط صورة للمجموعة",
    antiChangeNameAlreadyOn: "مجموعتك حاليا في وضع مضاد تغيير إسم المجموعة",
    antiChangeNicknameAlreadyOn: "مجموعتك حاليا في وضع مضاد تغيير اللقب بالنسبة للأعضاء",
    antiChangeThemeAlreadyOn: "مجموعتك حاليا في وضع مضاد تغيير السمة",
    antiChangeEmojiAlreadyOn: "مجموعتك حاليا في وضع مضاد تغيير إيموجي المجموعة"
  }
};

module.exports.onStart = async function ({ message, event, args, threadsData, getLang }) {
  try {
    if (!args[0])
      return message.SyntaxError();

    // تحويل الأوامر العربية إلى الإنجليزية
    if (args[1] === "تشغيل") args[1] = "on";
    if (args[1] === "إيقاف") args[1] = "off";

    if (!["on", "off"].includes(args[1]))
      return message.SyntaxError();

    const { threadID } = event;
    const dataAntiChangeInfoBox = await threadsData.get(threadID, "data.antiChangeInfoBox", {});

    async function checkAndSaveData(key, data) {
      if (args[1] === "off")
        delete dataAntiChangeInfoBox[key];
      else
        dataAntiChangeInfoBox[key] = data;

      await threadsData.set(threadID, dataAntiChangeInfoBox, "data.antiChangeInfoBox");
      message.reply(getLang(`antiChange${key.slice(0, 1).toUpperCase()}${key.slice(1)}${args[1].slice(0, 1).toUpperCase()}${args[1].slice(1)}`));
    }

    switch (args[0]) {
      case "الصورة":
      case "صورة_رمزية":
      case "image": {
        const threadData = await threadsData.get(threadID);
        const { imageSrc } = threadData || {};
        if (!imageSrc)
          return message.reply(getLang("missingAvt"));
        const newImageSrc = await uploadImgbb(imageSrc);
        await checkAndSaveData("avatar", newImageSrc.image.url);
        break;
      }
      case "الإسم": {
        const threadData = await threadsData.get(threadID);
        const { threadName } = threadData || {};
        await checkAndSaveData("name", threadName);
        break;
      }
      case "اللقب": {
        const threadData = await threadsData.get(threadID);
        const { members } = threadData || { members: [] };
        const nicknameObj = (members || []).map(user => ({ [user.userID]: user.nickname })).reduce((a, b) => ({ ...a, ...b }), {});
        await checkAndSaveData("nickname", nicknameObj);
        break;
      }
      case "السمة": {
        const threadData = await threadsData.get(threadID);
        const { threadThemeID } = threadData || {};
        await checkAndSaveData("theme", threadThemeID);
        break;
      }
      case "إيموجي":
      case "الإيموجي": {
        const threadData = await threadsData.get(threadID);
        const { emoji } = threadData || {};
        await checkAndSaveData("emoji", emoji);
        break;
      }
      default: {
        return message.SyntaxError();
      }
    }
  } catch (error) {
    console.error("[PROTECT] Error:", error.message);
    message.reply("❌ | حدث خطأ في الأمر");
  }
};

module.exports.onEvent = async function ({ message, event, threadsData, role, api, getLang }) {
  try {
    const { threadID, logMessageType, logMessageData, author } = event;

    switch (logMessageType) {
      case "log:thread-image": {
        const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
        if (!dataAntiChange.avatar && role < 1)
          return;
        return async function () {
          if (role < 1 && api.getCurrentUserID() !== author) {
            if (dataAntiChange.avatar != "REMOVE") {
              message.reply(getLang("antiChangeAvatarAlreadyOn"));
              api.changeGroupImage(await getStreamFromURL(dataAntiChange.avatar), threadID);
            } else {
              message.reply(getLang("antiChangeAvatarAlreadyOnButMissingAvt"));
            }
          } else {
            const imageSrc = logMessageData.url;
            if (!imageSrc)
              return await threadsData.set(threadID, "REMOVE", "data.antiChangeInfoBox.avatar");
            const newImageSrc = await uploadImgbb(imageSrc);
            await threadsData.set(threadID, newImageSrc.image.url, "data.antiChangeInfoBox.avatar");
          }
        };
      }
      case "log:thread-name": {
        const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
        if (!dataAntiChange.hasOwnProperty("name"))
          return;
        return async function () {
          if (role < 1 && api.getCurrentUserID() !== author) {
            message.reply(getLang("antiChangeNameAlreadyOn"));
            api.setTitle(dataAntiChange.name, threadID);
          } else {
            const threadName = logMessageData.name;
            await threadsData.set(threadID, threadName, "data.antiChangeInfoBox.name");
          }
        };
      }
      case "log:user-nickname": {
        const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
        if (!dataAntiChange.hasOwnProperty("nickname"))
          return;
        return async function () {
          const { nickname, participant_id } = logMessageData;
          if (role < 1 && api.getCurrentUserID() !== author) {
            message.reply(getLang("antiChangeNicknameAlreadyOn"));
            api.changeNickname(dataAntiChange.nickname[participant_id], threadID, participant_id);
          } else {
            await threadsData.set(threadID, nickname, `data.antiChangeInfoBox.nickname.${participant_id}`);
          }
        };
      }
      case "log:thread-color": {
        const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
        if (!dataAntiChange.hasOwnProperty("theme"))
          return;
        return async function () {
          if (role < 1 && api.getCurrentUserID() !== author) {
            message.reply(getLang("antiChangeThemeAlreadyOn"));
            api.changeThreadColor(dataAntiChange.theme || "196241301102133", threadID);
          } else {
            const threadThemeID = logMessageData.theme_id;
            await threadsData.set(threadID, threadThemeID, "data.antiChangeInfoBox.theme");
          }
        };
      }
      case "log:thread-icon": {
        const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
        if (!dataAntiChange.hasOwnProperty("emoji"))
          return;
        return async function () {
          if (role < 1 && api.getCurrentUserID() !== author) {
            message.reply(getLang("antiChangeEmojiAlreadyOn"));
            api.changeThreadEmoji(dataAntiChange.emoji, threadID);
          } else {
            const threadEmoji = logMessageData.thread_icon;
            await threadsData.set(threadID, threadEmoji, "data.antiChangeInfoBox.emoji");
          }
        };
      }
    }
  } catch (error) {
    console.error("[PROTECT] Event Error:", error.message);
  }
};
