const { getPrefix } = global.utils;

module.exports.config = {
  name: "مساعدة",
  version: "1.7",
  author: "NTKhang",
  countDown: 5,
  role: 0,
  description: {
    en: "عرض قائمة الأوامر والمساعدة"
  },
  category: "أدوات",
  guide: {
    en: "{pn}: عرض جميع الأوامر\n{pn} <اسم الأمر>: عرض طريقة استخدام أمر معين\n\nأمثلة:\n{pn} حماية\n{pn} قواعد"
  }
};

module.exports.langs = {
  ar: {
    allCommands: "📚 | قائمة جميع الأوامر\n%1",
    noCommand: "❌ | الأمر '%1' غير موجود",
    usageGuide: "📖 | طريقة استخدام الأمر\n%1"
  }
};

module.exports.onStart = async function ({ message, event, args, getLang, commandName }) {
  try {
    const allCommands = Array.from(global.GoatBot.commands.values());
    const commandList = allCommands.filter(cmd => !cmd.config?.hidden);

    // عرض جميع الأوامر
    if (args.length === 0) {
      let msg = `═══════════════════════════════════════\n📚 قائمة جميع الأوامر\n═══════════════════════════════════════\n\n`;
      let index = 1;
      
      for (const command of commandList) {
        const cmdName = command.config?.name || command.name;
        msg += `[${index}] ${cmdName}\n`;
        index++;
      }

      msg += `\n═══════════════════════════════════════\n`;
      msg += `📊 إجمالي الأوامر: ${commandList.length} أمر\n`;
      msg += `💡 الاستخدام: ${getPrefix(event.threadID)}مساعدة <اسم الأمر>\n`;
      msg += `📌 مثال: ${getPrefix(event.threadID)}مساعدة حماية\n`;
      msg += `═══════════════════════════════════════`;

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

    // استبدال {pn} بـ prefix
    const prefix = getPrefix(event.threadID);
    guide = guide.replace(/{pn}/g, prefix);

    const roleDesc = {
      0: "👥 للجميع",
      1: "👑 للأدمن والمطورين",
      2: "⚙️ للمطورين فقط"
    }[command.config?.role || 0];

    const cooldown = command.config?.countDown || command.config?.cooldowns || 0;

    let infoMsg = `═══════════════════════════════════════\n`;
    infoMsg += `📌 الأمر: ${cmdName}\n`;
    infoMsg += `═══════════════════════════════════════\n`;
    infoMsg += `📝 الوصف:\n${description}\n\n`;
    infoMsg += `💻 طريقة الاستخدام:\n${guide}\n\n`;
    infoMsg += `👤 المستوى المطلوب: ${roleDesc}\n`;
    infoMsg += `⏱️ وقت الانتظار: ${cooldown} ثانية\n`;
    infoMsg += `👨‍💻 المطور: ${command.config?.author || "غير محدد"}\n`;
    infoMsg += `═══════════════════════════════════════`;

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
    const searchName = event.body || "";

    if (!searchName) {
      return message.reply("❌ | يرجى إدخال اسم الأمر");
    }

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

    const prefix = getPrefix(event.threadID);
    guide = guide.replace(/{pn}/g, prefix);

    const roleDesc = {
      0: "👥 للجميع",
      1: "👑 للأدمن والمطورين",
      2: "⚙️ للمطورين فقط"
    }[command.config?.role || 0];

    const cooldown = command.config?.countDown || command.config?.cooldowns || 0;

    let infoMsg = `═══════════════════════════════════════\n`;
    infoMsg += `📌 الأمر: ${cmdName}\n`;
    infoMsg += `═══════════════════════════════════════\n`;
    infoMsg += `📝 الوصف:\n${description}\n\n`;
    infoMsg += `💻 طريقة الاستخدام:\n${guide}\n\n`;
    infoMsg += `👤 المستوى المطلوب: ${roleDesc}\n`;
    infoMsg += `⏱️ وقت الانتظار: ${cooldown} ثانية\n`;
    infoMsg += `👨‍💻 المطور: ${command.config?.author || "غير محدد"}\n`;
    infoMsg += `═══════════════════════════════════════`;

    message.reply(infoMsg, () => message.unsend(Reply.messageID));

  } catch (err) {
    console.error("[HELP] onReply Error:", err.message);
  }
};
