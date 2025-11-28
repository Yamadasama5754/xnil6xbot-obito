const { getPrefix } = global.utils;

module.exports.config = {
  name: "قواعد",
  version: "1.5",
  author: "NTKhang",
  countDown: 5,
  role: 0,
  description: {
    en: "إنشاء/عرض/إضافة/تعديل/تغيير المكان/حذف قواعد المجموعة"
  },
  category: "المجموعة",
  guide: {
    en: "{pn} [إضافة | -a] <القواعد>: قم بإضافة قاعدة\n{pn}: قم برؤية قواعد المجموعة\n{pn} [تعديل | -e] <n> <المحتوى>: قم بالتعديل على القاعدة رقم n\n{pn} [نقل | -m] <1> <2> مبادلة موقف القاعدة\n{pn} [حذف | -d] <n>: حذف القاعدة رقم n\n{pn} [إزالة | -r]: إزالة جميع القواعد"
  }
};

module.exports.langs = {
  ar: {
    yourRules: "⚜️ | قواعد مجموعتك\n%1",
    noRules: "⚠️ | ليس لدى مجموعتك أي قواعد، لإضافة قواعد استخدم `%1قواعد إضافة`",
    noPermissionAdd: "❌ | فقط آدمنز المجموعة يمكنهم إضافة قواعد",
    noContent: "⁉️ | المرجو إدخال محتوى القاعدة",
    success: "✅ | تمت إضافة قاعدة جديدة إلى المجموعة بنجاح",
    noPermissionEdit: "❌ | فقط آدمنز المجموعة يمكنهم التعديل على القواعد",
    invalidNumber: "⚠️ | أرجوك قم بإدخال رقم القاعدة التي تريد التعديل عليها",
    rulesNotExist: "❗ | القاعدة رقم %1 غير موجودة",
    numberRules: "🌟 | مجموعتك لديها فقط %1 من القواعد",
    noContentEdit: "⚠️ | أرجوك قم بإدخال المحتوى التي تريد به تعديل القاعدة %1",
    successEdit: "✅ | تم تعديل القاعدة %1 إلى: %2 بنجاح",
    noPermissionMove: "❌ | فقط آدمنز المجموعة من يمكنهم نقل القواعد",
    invalidNumberMove: "⚠️ | المرجو إدخال اثنين من القواعد التي تريد تبديل أماكنهم",
    sameNumberMove: "❌ | لا يمكن تغيير مكان 2 لأنهم نفس القواعد",
    rulesNotExistMove2: "❗ | القاعدة %1 و %2 غير موجودان",
    successMove: "✅ | تم تغيير أماكن القاعدة رقم %1 و %2 بنجاح",
    noPermissionDelete: "❌ | فقط آدمن المجموعة من يمكنهم حذف القواعد",
    invalidNumberDelete: "⚠️ | أرجوك قم بإدخال رقم القاعدة التي ترغب في حذفها",
    rulesNotExistDelete: "❗ | القاعدة رقم %1 غير موجودة",
    successDelete: "✅ | تم حذف القاعدة %1 من المجموعة: %2",
    noPermissionRemove: "❌ | فقط الآدمن من يمكنهم إزالة جميع قواعد المجموعة",
    confirmRemove: "⚠️ | قم بالتفاعل على هذه الرسالة باستخدام أي إيموجي لتأكيد إزالة جميع قواعد المجموعة",
    successRemove: "✅ | تمت إزالة جميع قواعد المجموعة",
    invalidNumberView: "⚠️ | أرجوك قم بإدخال رقم القاعدة التي تريد أن يتم عرضها"
  }
};

module.exports.onStart = async function ({ role, args, message, event, threadsData, getLang, commandName }) {
  try {
    const { threadID, senderID } = event;
    const type = args[0];
    const rulesOfThread = await threadsData.get(threadID, "data.rules", []);
    const totalRules = rulesOfThread.length;

    if (!type) {
      let i = 1;
      const msg = rulesOfThread.reduce((text, rules) => text += `${i++}. ${rules}\n`, "");
      message.reply(msg ? getLang("yourRules", msg) : getLang("noRules", getPrefix(threadID)), (err, info) => {
        if (info) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            author: senderID,
            rulesOfThread,
            messageID: info.messageID
          });
        }
      });
    } else if (["add", "-a"].includes(type)) {
      if (role < 1)
        return message.reply(getLang("noPermissionAdd"));
      if (!args[1])
        return message.reply(getLang("noContent"));
      rulesOfThread.push(args.slice(1).join(" "));
      await threadsData.set(threadID, rulesOfThread, "data.rules");
      message.reply(getLang("success"));
    } else if (["edit", "-e"].includes(type)) {
      if (role < 1)
        return message.reply(getLang("noPermissionEdit"));
      const stt = parseInt(args[1]);
      if (isNaN(stt))
        return message.reply(getLang("invalidNumber"));
      if (!rulesOfThread[stt - 1])
        return message.reply(`${getLang("rulesNotExist", stt)}, ${totalRules == 0 ? getLang("noRules") : getLang("numberRules", totalRules)}`);
      if (!args[2])
        return message.reply(getLang("noContentEdit", stt));
      const newContent = args.slice(2).join(" ");
      rulesOfThread[stt - 1] = newContent;
      await threadsData.set(threadID, rulesOfThread, "data.rules");
      message.reply(getLang("successEdit", stt, newContent));
    } else if (["move", "-m"].includes(type)) {
      if (role < 1)
        return message.reply(getLang("noPermissionMove"));
      const num1 = parseInt(args[1]);
      const num2 = parseInt(args[2]);
      if (isNaN(num1) || isNaN(num2))
        return message.reply(getLang("invalidNumberMove"));
      if (!rulesOfThread[num1 - 1] || !rulesOfThread[num2 - 1]) {
        const msg = !rulesOfThread[num1 - 1] && !rulesOfThread[num2 - 1] ?
          getLang("rulesNotExistMove2", num1, num2) :
          !rulesOfThread[num1 - 1] ?
            getLang("rulesNotExist", num1) :
            getLang("rulesNotExist", num2);
        return message.reply(`${msg}, ${totalRules == 0 ? getLang("noRules") : getLang("numberRules", totalRules)}`);
      }
      if (num1 == num2)
        return message.reply(getLang("sameNumberMove"));
      [rulesOfThread[num1 - 1], rulesOfThread[num2 - 1]] = [rulesOfThread[num2 - 1], rulesOfThread[num1 - 1]];
      await threadsData.set(threadID, rulesOfThread, "data.rules");
      message.reply(getLang("successMove", num1, num2));
    } else if (["delete", "del", "-d"].includes(type)) {
      if (role < 1)
        return message.reply(getLang("noPermissionDelete"));
      if (!args[1] || isNaN(args[1]))
        return message.reply(getLang("invalidNumberDelete"));
      const rulesDel = rulesOfThread[parseInt(args[1]) - 1];
      if (!rulesDel)
        return message.reply(`${getLang("rulesNotExistDelete", args[1])}, ${totalRules == 0 ? getLang("noRules") : getLang("numberRules", totalRules)}`);
      rulesOfThread.splice(parseInt(args[1]) - 1, 1);
      await threadsData.set(threadID, rulesOfThread, "data.rules");
      message.reply(getLang("successDelete", args[1], rulesDel));
    } else if (["remove", "reset", "-r", "-rm"].includes(type)) {
      if (role < 1)
        return message.reply(getLang("noPermissionRemove"));
      message.reply(getLang("confirmRemove"), (err, info) => {
        if (info) {
          global.GoatBot.onReaction.set(info.messageID, {
            commandName: "rules",
            messageID: info.messageID,
            author: senderID
          });
        }
      });
    } else if (!isNaN(type)) {
      let msg = "";
      for (const stt of args) {
        const rules = rulesOfThread[parseInt(stt) - 1];
        if (rules)
          msg += `${stt}. ${rules}\n`;
      }
      if (msg == "")
        return message.reply(`${getLang("rulesNotExist", type)}, ${totalRules == 0 ? getLang("noRules") : getLang("numberRules", totalRules)}`);
      message.reply(msg);
    } else {
      message.SyntaxError();
    }
  } catch (error) {
    console.error("[RULES] Error:", error.message);
    message.reply("❌ | حدث خطأ في الأمر");
  }
};

module.exports.onReply = async function ({ message, event, getLang, Reply }) {
  try {
    const { author, rulesOfThread } = Reply;
    if (author != event.senderID)
      return;
    const num = parseInt(event.body || "");
    if (isNaN(num) || num < 1)
      return message.reply(getLang("invalidNumberView"));
    const totalRules = rulesOfThread.length;
    if (num > totalRules)
      return message.reply(`${getLang("rulesNotExist", num)}, ${totalRules == 0 ? getLang("noRules") : getLang("numberRules", totalRules)}`);
    message.reply(`${num}. ${rulesOfThread[num - 1]}`, () => message.unsend(Reply.messageID));
  } catch (error) {
    console.error("[RULES] onReply Error:", error.message);
  }
};

module.exports.onReaction = async function ({ threadsData, message, Reaction, event, getLang }) {
  try {
    const { author } = Reaction;
    const { threadID, userID } = event;
    if (author != userID)
      return;
    await threadsData.set(threadID, [], "data.rules");
    message.reply(getLang("successRemove"));
  } catch (error) {
    console.error("[RULES] onReaction Error:", error.message);
  }
};
