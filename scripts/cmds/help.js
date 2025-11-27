const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "مساعدة",
    aliases: ["help", "اوامر", "الأوامر"],
    version: "3.2",
    author: "Yamada KJ",
    countDown: 5,
    role: 0,
    description: "عرض معلومات الأوامر بواجهة محسنة",
    category: "معلومات",
    guide: "{pn} [أمر] - عرض تفاصيل الأمر\n{pn} all - عرض جميع الأوامر\n{pn} c [فئة] - عرض أوامر الفئة"
  },

  langs: {
    ar: {
      helpHeader: "╔══════════◇◆◇══════════╗\n      قائمة أوامر البوت\n╠══════════◇◆◇══════════╣",
      categoryHeader: "\n   ┌────── {category} ──────┐\n",
      commandItem: "║ │ 🟢 {name}",
      helpFooter: "║ └─────────────────┘\n╚══════════◇◆◇══════════╝",
      commandNotFound: "⚠️ الأمر '{command}' غير موجود!",
      doNotHave: "لا يوجد",
      roleText0: "👥 جميع المستخدمين",
      roleText1: "👑 مشرفو المجموعة",
      roleText2: "⚡ مشرفو البوت",
      totalCommands: "📊 إجمالي الأوامر: {total}",
      noCommandsInCategory: "❌ لا توجد أوامر في الفئة: {category}",
      yes: "نعم",
      no: "لا",
      unknown: "غير معروف",
      noDescription: "لا يوجد وصف",
      noGuide: "لا يوجد دليل استخدام"
    }
  },

  onStart: async function({ message, args, event, role, getLang }) {
    const { threadID } = event;
    const prefix = getPrefix(threadID);
    const commandName = args[0]?.toLowerCase();

    if (!commandName || commandName === 'all' || commandName === 'الكل') {
      const categoryMap = new Map();

      for (const [cmdKey, cmdObj] of commands) {
        if (cmdObj.config.role > 1 && role < cmdObj.config.role) continue;
        const cat = cmdObj.config.category?.toUpperCase() || "عام";
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, []);
        }
        categoryMap.get(cat).push(cmdKey);
      }

      const sortedCategories = Array.from(categoryMap.keys()).sort();
      let msg = getLang("helpHeader") + "\n";
      let total = 0;

      for (const cat of sortedCategories) {
        const cmds = categoryMap.get(cat).sort();
        total += cmds.length;
        msg += getLang("categoryHeader").replace(/{category}/g, cat);
        cmds.forEach(c => {
          msg += getLang("commandItem").replace(/{name}/g, c) + "\n";
        });
        msg += getLang("helpFooter") + "\n";
      }

      msg += "\n" + getLang("totalCommands").replace(/{total}/g, total);
      return message.reply(msg);
    }

    let cmd = commands.get(commandName) || commands.get(aliases.get(commandName));
    if (!cmd) {
      return message.reply(getLang("commandNotFound").replace(/{command}/g, commandName));
    }

    const cfg = cmd.config;
    const desc = typeof cfg.description === 'string' ? cfg.description : (cfg.description?.ar || "");
    const guide = typeof cfg.guide === 'string' ? cfg.guide : (cfg.guide?.ar || "");

    let msg = `🟢 الأمر: ${commandName}\n`;
    msg += `📝 الوصف: ${desc || getLang("noDescription")}\n`;
    msg += `📂 الفئة: ${cfg.category || "عام"}\n`;
    msg += guide ? `📖 الدليل:\n${guide}\n` : "";
    
    return message.reply(msg);
  }
};
