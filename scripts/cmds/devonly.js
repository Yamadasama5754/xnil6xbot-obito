const fs = require("fs-extra");
const { config } = global.GoatBot;
const { client } = global;

module.exports.config = {
  name: "فقط_المطور",
  aliases: ["adonly", "المطور_فقط", "onlyadmin"],
  version: "1.3",
  author: "NTKhang",
  countDown: 5,
  role: 2,
  description: {
    en: "تشغيل/إيقاف يمكن للمطور فقط استخدام البوت"
  },
  category: "المالك",
  guide: {
    en: "{pn} [تشغيل | إيقاف]: تشغيل/إيقاف الوضع، يمكن للمطور فقط استخدام البوت\n{pn} إشعار [تشغيل | إيقاف]: قم بتشغيل/إيقاف تشغيل الإشعار عندما لا يكون المستخدم مسؤولا عن استخدام البوت"
  }
};

module.exports.langs = {
  ar: {
    turnedOn: "✅ تم تشغيل الوضع، حيث يمكن للمطور فقط استخدام البوت",
    turnedOff: "❌ تم إيقاف تشغيل الوضع، حيث يمكن للمطور فقط استخدام البوت",
    turnedOnNoti: "✅ تم تشغيل الإشعارات عندما لا يكون المستخدم مسؤولاً عن استخدام البوت",
    turnedOffNoti: "❌ تم إيقاف تشغيل الإشعارات عندما لا يكون المستخدم مسؤولاً عن استخدام البوت"
  }
};

module.exports.onStart = function ({ args, message, getLang }) {
  try {
    let isSetNoti = false;
    let value;
    let indexGetVal = 0;

    if (args[0] === "إشعار") {
      isSetNoti = true;
      indexGetVal = 1;
    }

    if (args[indexGetVal] === "تشغيل")
      value = true;
    else if (args[indexGetVal] === "إيقاف")
      value = false;
    else
      return message.SyntaxError();

    if (isSetNoti) {
      config.adminOnly.hideNotiMessage = !value;
      message.reply(getLang(value ? "turnedOnNoti" : "turnedOffNoti"));
    } else {
      config.adminOnly.enable = value;
      message.reply(getLang(value ? "turnedOn" : "turnedOff"));
    }

    fs.writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error("[DEVONLY] Error:", error.message);
    message.reply("❌ | حدث خطأ في الأمر");
  }
};
