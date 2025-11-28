const { removeHomeDir, log } = global.utils;

module.exports.config = {
  name: "تنفيذ",
  aliases: ["eval", "كود"],
  version: "1.6",
  author: "Yamada KJ",
  countDown: 5,
  role: 2,
  description: "اختبار الكود بسرعة",
  category: "المالك",
  guide: "{pn} <الكود المراد اختباره>"
};

module.exports.langs = {
  ar: {
    error: "❌ حدث خطأ:"
  }
};

module.exports.onStart = async function ({ api, args, message, event, threadsData, usersData, globalData, role, getLang }) {
  try {
    function output(msg) {
      if (typeof msg == "number" || typeof msg == "boolean" || typeof msg == "function")
        msg = msg.toString();
      else if (msg instanceof Map) {
        let text = `Map(${msg.size}) `;
        text += JSON.stringify(mapToObj(msg), null, 2);
        msg = text;
      }
      else if (typeof msg == "object")
        msg = JSON.stringify(msg, null, 2);
      else if (typeof msg == "undefined")
        msg = "undefined";

      message.reply(msg);
    }

    function out(msg) {
      output(msg);
    }

    function mapToObj(map) {
      const obj = {};
      map.forEach(function (v, k) {
        obj[k] = v;
      });
      return obj;
    }

    const cmd = `
    (async () => {
      try {
        ${args.join(" ")}
      }
      catch(err) {
        log.err("eval command", err);
        message.send(
          "${getLang("error")}\\n" +
          (err.stack ?
            removeHomeDir(err.stack) :
            removeHomeDir(JSON.stringify(err, null, 2) || "")
          )
        );
      }
    })()`;

    eval(cmd);
  } catch (error) {
    console.error("[EVAL] Error:", error);
    message.reply(`${getLang("error")}\n${error.message}`);
  }
};
