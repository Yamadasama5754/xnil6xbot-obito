const { getPrefix } = global.utils;

module.exports.config = {
  name: "مساعدة",
  version: "2.0",
  author: "NTKhang",
  countDown: 5,
  role: 0,
  description: {
    en: "عرض قائمة الأوامر والمساعدة"
  },
  category: "أدوات",
  guide: {
    en: "{pn}: عرض جميع الأوامر (الصفحة الأولى)\n{pn} <رقم>: عرض صفحة معينة\n{pn} الكل: عرض جميع الأوامر دفعة واحدة\n{pn} <اسم الأمر>: عرض تفاصيل أمر معين\n\nأمثلة:\n{pn} 1\n{pn} الكل\n{pn} حماية"
  }
};

module.exports.langs = {
  ar: {
    allCommands: "📚 | قائمة جميع الأوامر\n%1",
    noCommand: "❌ | الأمر '%1' غير موجود",
    usageGuide: "📖 | طريقة استخدام الأمر\n%1",
    pageNotFound: "❌ الصفحة غير موجودة",
    invalidPage: "❌ يرجى إدخال رقم صفحة صحيح"
  }
};

module.exports.onStart = async function ({ message, event, args, getLang, commandName, getPrefix: getPrefixFunc }) {
  try {
    const allCommands = Array.from(global.GoatBot.commands.values());
    const commandList = allCommands.filter(cmd => !cmd.config?.hidden);
    const prefix = getPrefix(event.threadID);
    const commandsPerPage = 20;
    const totalPages = Math.ceil(commandList.length / commandsPerPage);
    const totalCommands = commandList.length;

    // عرض الصفحة الأولى - بدون arguments
    if (args.length === 0) {
      let msg = `\n•—[قــائــمــة أوامــر البـــوت]—•\n`;
      const commandsToDisplay = commandList.slice(0, commandsPerPage);
      
      commandsToDisplay.forEach((command, index) => {
        const cmdName = command.config?.name || command.name;
        msg += `[${index + 1}] ⟻『${cmdName}』\n`;
      });

      msg += `\n✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏✎\n`;
      msg += `📜 الصفحة: 1/${totalPages}\n`;
      msg += `🪐 إجمالي عدد الأوامر: ${totalCommands} أمر\n`;
      msg += `🔖 | اكتب '${prefix}مساعدة رقم الصفحة' لرؤية الصفحات الأخرى.\n`;
      msg += `🧵 | اكتب '${prefix}مساعدة الكل' لرؤية جميع الأوامر.`;

      return message.reply(msg, (err, info) => {
        if (info) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            author: event.senderID,
            messageID: info.messageID
          });
        }
      });
    }

    const pageStr = args[0];

    // عرض جميع الأوامر
    if (pageStr === 'الكل') {
      let allCommandsMsg = "╭───────────────◊\n•——[قائمة جميع الأوامر]——•\n";

      commandList.forEach((command) => {
        const commandName = command.config?.name || command.name;
        allCommandsMsg += `❏ الإسم : 『${commandName}』\n`;
      });

      allCommandsMsg += `\n💫 إجمالي عدد الأوامر: ${totalCommands} أمر\n╰───────────────◊`;
      return message.reply(allCommandsMsg);
    }

    // عرض صفحة معينة (إذا كان رقم)
    if (!isNaN(pageStr) && parseInt(pageStr) > 0) {
      const page = parseInt(pageStr);

      if (page > totalPages) {
        return message.reply(getLang("pageNotFound"));
      }

      const startIndex = (page - 1) * commandsPerPage;
      const endIndex = page * commandsPerPage;

      let msg = `\n•—[قــائــمــة أوامــر البـــوت]—•\n`;
      const commandsToDisplay = commandList.slice(startIndex, endIndex);

      commandsToDisplay.forEach((command, index) => {
        const commandNumber = startIndex + index + 1;
        const cmdName = command.config?.name || command.name;
        msg += `[${commandNumber}] ⟻『${cmdName}』\n`;
      });

      msg += `\n✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏✎\n`;
      msg += `📜 الصفحة: ${page}/${totalPages}\n`;
      msg += `🪐 إجمالي عدد الأوامر: ${totalCommands} أمر\n`;
      msg += `🔖 | اكتب '${prefix}مساعدة رقم الصفحة' لرؤية الصفحات الأخرى.\n`;
      msg += `🧵 | اكتب '${prefix}مساعدة الكل' لرؤية جميع الأوامر.`;

      return message.reply(msg);
    }

    // البحث عن أمر معين
    const searchName = args.join(" ");
    const command = commandList.find(cmd => {
      const cmdName = cmd.config?.name || cmd.name;
      const cmdAliases = cmd.config?.aliases || [];
      return cmdName === searchName || 
             cmdName.toLowerCase() === searchName.toLowerCase() ||
             cmdAliases.some(alias => 
               alias === searchName || 
               alias.toLowerCase() === searchName.toLowerCase()
             );
    });

    if (!command) {
      return message.reply(getLang("noCommand", searchName));
    }

    // عرض معلومات الأمر
    const cmdName = command.config?.name || command.name;
    let description = "بلا وصف";
    
    if (command.config?.description) {
      if (typeof command.config.description === 'object') {
        description = command.config.description.en || command.config.description.ar || "بلا وصف";
      } else {
        description = command.config.description;
      }
    }

    let guide = "بلا إرشادات";
    if (command.config?.guide) {
      if (typeof command.config.guide === 'object') {
        guide = command.config.guide.en || command.config.guide.ar || "بلا إرشادات";
      } else {
        guide = command.config.guide;
      }
    }

    guide = guide.replace(/{pn}/g, prefix);

    const roleDesc = {
      0: "👥 للجميع",
      1: "👑 للأدمن والمطورين",
      2: "⚙️ للمطورين فقط"
    }[command.config?.role || 0];

    const cooldown = command.config?.countDown || command.config?.cooldowns || 0;
    const author = command.config?.author || "غير محدد";

    let infoMsg = `📖 | معلومات الأمر\n`;
    infoMsg += `═══════════════════════\n`;
    infoMsg += `📌 اسم الأمر: ${cmdName}\n`;
    infoMsg += `ℹ️ الوصف: ${description}\n`;
    infoMsg += `👤 الدور المطلوب: ${roleDesc}\n`;
    infoMsg += `⏱️ فترة الانتظار: ${cooldown} ثانية\n`;
    infoMsg += `👨‍💻 صاحب الأمر: ${author}\n`;
    infoMsg += `💻 طريقة الاستخدام:\n${guide}\n`;
    infoMsg += `═══════════════════════\n`;

    return message.reply(infoMsg);

  } catch (err) {
    console.error("[HELP] Error:", err.message);
    message.reply("❌ | حدث خطأ في الأمر");
  }
};

module.exports.onReply = async function ({ message, event, getLang, Reply }) {
  try {
    const { author } = Reply;
    if (author != event.senderID)
      return;

    const allCommands = Array.from(global.GoatBot.commands.values());
    const commandList = allCommands.filter(cmd => !cmd.config?.hidden);
    const prefix = global.utils.getPrefix ? global.utils.getPrefix(event.threadID) : '.';
    const commandsPerPage = 20;
    const totalPages = Math.ceil(commandList.length / commandsPerPage);
    const totalCommands = commandList.length;
    
    const searchName = event.body || "";

    if (!searchName) {
      return message.reply("❌ | يرجى إدخال اسم الأمر أو رقم صفحة");
    }

    // عرض جميع الأوامر
    if (searchName === 'الكل') {
      let allCommandsMsg = "╭───────────────◊\n•——[قائمة جميع الأوامر]——•\n";

      commandList.forEach((command) => {
        const commandName = command.config?.name || command.name;
        allCommandsMsg += `❏ الإسم : 『${commandName}』\n`;
      });

      allCommandsMsg += `\n💫 إجمالي عدد الأوامر: ${totalCommands} أمر\n╰───────────────◊`;
      return message.reply(allCommandsMsg, () => message.unsend(Reply.messageID));
    }

    // عرض صفحة معينة (إذا كان رقم)
    if (!isNaN(searchName) && parseInt(searchName) > 0) {
      const page = parseInt(searchName);

      if (page > totalPages) {
        return message.reply(getLang("pageNotFound"), () => message.unsend(Reply.messageID));
      }

      const startIndex = (page - 1) * commandsPerPage;
      const endIndex = page * commandsPerPage;

      let msg = `\n•—[قــائــمــة أوامــر البـــوت]—•\n`;
      const commandsToDisplay = commandList.slice(startIndex, endIndex);

      commandsToDisplay.forEach((command, index) => {
        const commandNumber = startIndex + index + 1;
        const cmdName = command.config?.name || command.name;
        msg += `[${commandNumber}] ⟻『${cmdName}』\n`;
      });

      msg += `\n✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏✎\n`;
      msg += `📜 الصفحة: ${page}/${totalPages}\n`;
      msg += `🪐 إجمالي عدد الأوامر: ${totalCommands} أمر\n`;
      msg += `🔖 | اكتب '${prefix}مساعدة رقم الصفحة' لرؤية الصفحات الأخرى.\n`;
      msg += `🧵 | اكتب '${prefix}مساعدة الكل' لرؤية جميع الأوامر.`;

      return message.reply(msg, () => message.unsend(Reply.messageID));
    }

    // البحث عن أمر معين
    const command = commandList.find(cmd => {
      const cmdName = cmd.config?.name || cmd.name;
      const cmdAliases = cmd.config?.aliases || [];
      return cmdName === searchName || 
             cmdName.toLowerCase() === searchName.toLowerCase() ||
             cmdAliases.some(alias => 
               alias === searchName || 
               alias.toLowerCase() === searchName.toLowerCase()
             );
    });

    if (!command) {
      return message.reply(getLang("noCommand", searchName), () => message.unsend(Reply.messageID));
    }

    const cmdName = command.config?.name || command.name;
    let description = "بلا وصف";
    
    if (command.config?.description) {
      if (typeof command.config.description === 'object') {
        description = command.config.description.en || command.config.description.ar || "بلا وصف";
      } else {
        description = command.config.description;
      }
    }

    let guide = "بلا إرشادات";
    if (command.config?.guide) {
      if (typeof command.config.guide === 'object') {
        guide = command.config.guide.en || command.config.guide.ar || "بلا إرشادات";
      } else {
        guide = command.config.guide;
      }
    }

    guide = guide.replace(/{pn}/g, prefix);

    const roleDesc = {
      0: "👥 للجميع",
      1: "👑 للأدمن والمطورين",
      2: "⚙️ للمطورين فقط"
    }[command.config?.role || 0];

    const cooldown = command.config?.countDown || command.config?.cooldowns || 0;
    const author = command.config?.author || "غير محدد";

    let infoMsg = `📖 | معلومات الأمر\n`;
    infoMsg += `═══════════════════════\n`;
    infoMsg += `📌 اسم الأمر: ${cmdName}\n`;
    infoMsg += `ℹ️ الوصف: ${description}\n`;
    infoMsg += `👤 الدور المطلوب: ${roleDesc}\n`;
    infoMsg += `⏱️ فترة الانتظار: ${cooldown} ثانية\n`;
    infoMsg += `👨‍💻 صاحب الأمر: ${author}\n`;
    infoMsg += `💻 طريقة الاستخدام:\n${guide}\n`;
    infoMsg += `═══════════════════════\n`;

    message.reply(infoMsg, () => message.unsend(Reply.messageID));

  } catch (err) {
    console.error("[HELP] onReply Error:", err.message);
  }
};
