module.exports.config = {
  name: "مساعدة",
  category: "أدوات",
  author: "Yamada KJ & Alastor",
  countDown: 5,
  description: "عرض قائمة الأوامر أو معلومات عن أمر معين",
  role: 0,
  aliases: ["help", "اوامر", "أوامر", "الاوامر"]
};

const getRoleDescription = (role) => {
  const roles = {
    0: "👥 للجميع",
    1: "👑 للأدمن والمطورين",
    2: "⚙️ للمطورين فقط"
  };
  return roles[role] || "غير محدد";
};

module.exports.onStart = async function ({ api, event, args, message }) {
  try {
    const allCommands = Array.from(global.GoatBot.commands.values());
    const commandList = allCommands.filter(cmd => !cmd.config?.hidden);
    const commandsPerPage = 20;
    const totalPages = Math.ceil(commandList.length / commandsPerPage);
    const totalCommands = commandList.length;

    // بدون arguments - اعرض الصفحة الأولى
    if (args.length === 0) {
      let msg = `\n•—[قــائــمــة أوامــر البوت]—•\n`;
      const commandsToDisplay = commandList.slice(0, commandsPerPage);
      commandsToDisplay.forEach((command, index) => {
        msg += `[${index + 1}] ⟻『${command.config?.name || command.name}』\n`;
      });

      msg += `\n✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏✎\n` +
             `📜 الصفحة: 1/${totalPages}\n` +
             `🪐 إجمالي عدد الأوامر: ${totalCommands} أمر\n` +
             `🔖 | اكتب '.مساعدة 2' لرؤية الصفحة التالية\n` +
             `🧵 | اكتب '.مساعدة الكل' لرؤية جميع الأوامر`;

      return message.reply(msg);
    }

    const pageStr = args[0];

    // اعرض جميع الأوامر
    if (pageStr === 'الكل') {
      let allCommandsMsg = "╭───────────────◊\n•——[قائمة جميع الأوامر]——•\n";
      
      commandList.forEach((command) => {
        const commandName = command.config?.name || command.name;
        allCommandsMsg += `❏ ${commandName}\n`;
      });

      allCommandsMsg += `\nإجمالي: ${totalCommands} أمر\n╰───────────────◊`;
      return message.reply(allCommandsMsg);
    }

    // اعرض صفحة معينة (إذا كان رقم)
    if (!isNaN(pageStr) && parseInt(pageStr) > 0) {
      const page = parseInt(pageStr);
      
      if (page > totalPages) {
        return message.reply("❌ الصفحة غير موجودة");
      }

      const startIndex = (page - 1) * commandsPerPage;
      const endIndex = page * commandsPerPage;

      let msg = `\n•—[قــائــمــة أوامــر البوت]—•\n`;
      const commandsToDisplay = commandList.slice(startIndex, endIndex);
      
      commandsToDisplay.forEach((command, index) => {
        const commandNumber = startIndex + index + 1;
        msg += `[${commandNumber}] ⟻『${command.config?.name || command.name}』\n`;
      });

      msg += `\n✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏✎\n` +
             `📜 الصفحة: ${page}/${totalPages}\n` +
             `🪐 إجمالي عدد الأوامر: ${totalCommands} أمر\n` +
             `🔖 | اكتب '.مساعدة ${page + 1}' للصفحة التالية\n` +
             `🧵 | اكتب '.مساعدة الكل' لرؤية جميع الأوامر`;

      return message.reply(msg);
    }

    // ابحث عن أمر معين
    const searchName = args.join(" ");
    const command = commandList.find(
      cmd => {
        const cmdName = cmd.config?.name || cmd.name;
        const cmdAliases = cmd.config?.aliases || cmd.aliases || [];
        return cmdName === searchName || 
                cmdName.toLowerCase() === searchName.toLowerCase() ||
                cmdAliases.some(alias => 
                  alias === searchName || 
                  alias.toLowerCase() === searchName.toLowerCase()
                );
      }
    );

    if (!command) {
      return message.reply(`❌ لم أجد الأمر '${searchName}'\n\n📝 اكتب: .مساعدة 1`);
    }

    // عرض معلومات الأمر
    const roleDesc = getRoleDescription(command.config?.role || 0);
    const aliases = (command.config?.aliases || command.aliases) && (command.config?.aliases || command.aliases).length > 0 
      ? (command.config?.aliases || command.aliases).join(", ") 
      : "لا توجد";
    
    // استخراج الوصف من الكائن
    let description = "بلا وصف";
    if (command.config?.description) {
      if (typeof command.config.description === 'object') {
        description = command.config.description.en || command.config.description.ar || "بلا وصف";
      } else {
        description = command.config.description;
      }
    }
    
    let infoMsg = `📖 معلومات الأمر\n`;
    infoMsg += `═══════════════════════\n`;
    infoMsg += `📌 اسم الأمر: ${command.config?.name || command.name}\n`;
    infoMsg += `ℹ️ الوصف: ${description}\n`;
    infoMsg += `👤 الدور المطلوب: ${roleDesc}\n`;
    infoMsg += `⏱️ فترة الانتظار: ${command.config?.countDown || command.config?.cooldowns || 0}s\n`;
    infoMsg += `🔗 الأسماء البديلة: ${aliases}\n`;
    infoMsg += `👨‍💻 صاحب الأمر: ${command.config?.author || "غير محدد"}\n`;
    infoMsg += `═══════════════════════`;

    return message.reply(infoMsg);

  } catch (err) {
    console.error("[HELP] Error:", err);
    return message.reply(`❌ خطأ: ${err.message}`);
  }
};
