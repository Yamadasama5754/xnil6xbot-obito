module.exports.config = {
  name: "الادمن_فقط",
  aliases: ["فقط مشرفو المجموعة", "adminonly", "فقط_الادمن"],
  version: "1.2",
  author: "NTKhang",
  countDown: 5,
  role: 1,
  description: {
    en: "تشغيل/إيقاف صندوق الإدارة فقط من يمكنه استخدام الروبوت"
  },
  category: "المجموعة",
  guide: {
    en: "{pn} [تشغيل | إيقاف]: تشغيل/إيقاف الوضع، يمكن لمسؤول المجموعة فقط استخدام الروبوت\n{pn} إشعار [تشغيل | إيقاف]: قم بتشغيل/إيقاف تشغيل الإشعار عندما لا يكون المستخدم مسؤولاً عن روبوت الاستخدام الجماعي"
  }
};

module.exports.langs = {
  ar: {
    groupOnly: "⚠️ | هذا الأمر للمجموعات فقط!",
    turnedOn: "✅ | تم تشغيل الوضع، حيث يمكن لمسؤول المجموعة فقط استخدام البوت",
    turnedOff: "❌ | تم إيقاف تشغيل الوضع، يمكن للجميع استخدام البوت",
    turnedOnNoti: "✅ | تم تشغيل الإشعار عندما لا يكون المستخدم مسؤولاً",
    turnedOffNoti: "❌ | تم إيقاف تشغيل الإشعار",
    syntaxError: "⚠️ | خطأ في بناء الجملة، فقط استخدم {pn} تشغيل أو {pn} إيقاف"
  }
};

module.exports.onStart = async function ({ args, message, event, threadsData, getLang, api }) {
  try {
    const threadInfo = await api.getThreadInfo(event.threadID);
    
    if (!threadInfo.isGroup) {
      return message.reply(getLang("groupOnly"));
    }

    let isSetNoti = false;
    let value;
    let keySetData = "data.onlyAdminBox";
    let indexGetVal = 0;

    if (args[0] === "إشعار") {
      isSetNoti = true;
      indexGetVal = 1;
      keySetData = "data.hideNotiMessageOnlyAdminBox";
    }

    if (args[indexGetVal] === "تشغيل")
      value = true;
    else if (args[indexGetVal] === "إيقاف")
      value = false;
    else
      return message.reply(getLang("syntaxError"));

    await threadsData.set(event.threadID, isSetNoti ? !value : value, keySetData);

    if (isSetNoti)
      return message.reply(value ? getLang("turnedOnNoti") : getLang("turnedOffNoti"));
    else
      return message.reply(value ? getLang("turnedOn") : getLang("turnedOff"));
  } catch (error) {
    console.error("[ADMINONLY] Error:", error.message);
    message.reply("❌ | حدث خطأ في الأمر");
  }
};
