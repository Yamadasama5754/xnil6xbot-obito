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
    1: "👑 للأدمن فقط",
    2: "⚙️ للمطورين فقط"
  };
  return roles[role] || "غير محدد";
};

const getRoleIcon = (role) => {
  const icons = {
    0: "👥",
    1: "👑",
    2: "⚙️"
  };
  return icons[role] || "❓";
};

module.exports.onStart = async function ({ api, event, args, message }) {
  try {
    const allCommands = Array.from(global.GoatBot.commands.values());
    const commandList = allCommands.filter(cmd => !cmd.config?.hidden);
    const commandsPerPage = 15;
    const totalPages = Math.ceil(commandList.length / commandsPerPage);
    const totalCommands = commandList.length;

    // بدون arguments - اعرض الصفحة الأولى
    if (args.length === 0) {
      let msg = `\n╔════════════════════════╗\n`;
      msg += `║  📋 قائمة الأوامر 📋  ║\n`;
      msg += `╚════════════════════════╝\n\n`;
      
      const commandsToDisplay = commandList.slice(0, commandsPerPage);
      commandsToDisplay.forEach((command, index) => {
        const role = getRoleIcon(command.config?.role || 0);
        const name = command.config?.name || command.name;
        msg += `[${index + 1}] ${role} ${name}\n`;
      });

      msg += `\n╔════════════════════════╗\n`;
      msg += `📄 الصفحة: 1/${totalPages}\n`;
      msg += `🪐 الإجمالي: ${totalCommands} أمر\n`;
      msg += `╚════════════════════════╝\n\n`;
      msg += `💡 استخدم:\n`;
      msg += `  • .مساعدة 2 → الصفحة التالية\n`;
      msg += `  • .مساعدة الكل → جميع الأوامر\n`;
      msg += `  • .مساعدة اسم → معلومات الأمر`;

      return message.reply(msg);
    }

    const pageStr = args[0];

    // اعرض جميع الأوامر
    if (pageStr === 'الكل') {
      let allCommandsMsg = `╔════════════════════════╗\n`;
      allCommandsMsg += `║  📋 جميع الأوامر 📋  ║\n`;
      allCommandsMsg += `╚════════════════════════╝\n\n`;
      
      commandList.forEach((command, idx) => {
        const role = getRoleIcon(command.config?.role || 0);
        const name = command.config?.name || command.name;
        allCommandsMsg += `[${idx + 1}] ${role} ${name}\n`;
      });

      allCommandsMsg += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      allCommandsMsg += `📊 الإجمالي: ${totalCommands} أمر\n`;
      allCommandsMsg += `━━━━━━━━━━━━━━━━━━━━━━`;

      return message.reply(allCommandsMsg);
    }

    // اعرض صفحة معينة (إذا كان رقم)
    if (!isNaN(pageStr) && parseInt(pageStr) > 0) {
      const page = parseInt(pageStr);
      
      if (page > totalPages) {
        return message.reply(`❌ الصفحة غير موجودة\n📝 الصفحات المتاحة: 1 إلى ${totalPages}`);
      }

      const startIndex = (page - 1) * commandsPerPage;
      const endIndex = page * commandsPerPage;

      let msg = `\n╔════════════════════════╗\n`;
      msg += `║  📋 قائمة الأوامر 📋  ║\n`;
      msg += `╚════════════════════════╝\n\n`;
      
      const commandsToDisplay = commandList.slice(startIndex, endIndex);
      
      commandsToDisplay.forEach((command, index) => {
        const commandNumber = startIndex + index + 1;
        const role = getRoleIcon(command.config?.role || 0);
        const name = command.config?.name || command.name;
        msg += `[${commandNumber}] ${role} ${name}\n`;
      });

      msg += `\n╔════════════════════════╗\n`;
      msg += `📄 الصفحة: ${page}/${totalPages}\n`;
      msg += `🪐 الإجمالي: ${totalCommands} أمر\n`;
      msg += `╚════════════════════════╝\n\n`;
      msg += `💡 استخدم:\n`;
      if (page < totalPages) msg += `  • .مساعدة ${page + 1} → الصفحة التالية\n`;
      if (page > 1) msg += `  • .مساعدة ${page - 1} → الصفحة السابقة\n`;
      msg += `  • .مساعدة الكل → جميع الأوامر\n`;
      msg += `  • .مساعدة اسم → معلومات الأمر`;

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
      return message.reply(`❌ لم أجد الأمر: "${searchName}"\n\n💡 اكتب: .مساعدة 1`);
    }

    // عرض معلومات مفصلة للأمر
    const roleDesc = getRoleDescription(command.config?.role || 0);
    const aliases = (command.config?.aliases || command.aliases) && (command.config?.aliases || command.aliases).length > 0 
      ? (command.config?.aliases || command.aliases).join(" • ") 
      : "لا توجد";
    
    // استخراج الوصف
    let description = "بلا وصف";
    if (command.config?.description) {
      if (typeof command.config.description === 'object') {
        description = command.config.description.en || command.config.description.ar || "بلا وصف";
      } else {
        description = command.config.description;
      }
    }

    // استخراج طريقة الاستخدام (guide)
    let usage = "بلا معلومات";
    if (command.config?.guide) {
      if (typeof command.config.guide === 'object') {
        usage = command.config.guide.en || command.config.guide.ar || "بلا معلومات";
      } else {
        usage = command.config.guide;
      }
    }
    
    let infoMsg = `╔════════════════════════════════════╗\n`;
    infoMsg += `║  📖 معلومات الأمر 📖  ║\n`;
    infoMsg += `╚════════════════════════════════════╝\n\n`;
    
    infoMsg += `📌 الاسم:\n${command.config?.name || command.name}\n\n`;
    
    infoMsg += `ℹ️ الوصف:\n${description}\n\n`;
    
    infoMsg += `👤 الصلاحية:\n${roleDesc}\n\n`;
    
    infoMsg += `⏱️ فترة الانتظار:\n${command.config?.countDown || command.config?.cooldowns || 0} ثانية\n\n`;
    
    infoMsg += `🔗 الأسماء البديلة:\n${aliases}\n\n`;
    
    infoMsg += `📚 طريقة الاستخدام:\n${usage}\n\n`;
    
    infoMsg += `👨‍💻 الصاحب:\n${command.config?.author || "غير محدد"}\n\n`;
    
    infoMsg += `╔════════════════════════════════════╝`;

    return message.reply(infoMsg);

  } catch (err) {
    console.error("[HELP] Error:", err);
    return message.reply(`❌ خطأ: ${err.message}`);
  }
};
