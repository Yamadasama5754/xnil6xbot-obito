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
    guide: "{pn} [أمر] - عرض تفاصيل الأمر"
  },

  onStart: async function({ message, args, event, role }) {
    const commandName = args[0]?.toLowerCase();

    if (!commandName || commandName === 'all' || commandName === 'الكل') {
      const categoryMap = {};

      for (const [key, cmd] of commands) {
        if (cmd.config.role > 1 && role < cmd.config.role) continue;
        const cat = (cmd.config.category || "عام").toUpperCase();
        if (!categoryMap[cat]) categoryMap[cat] = [];
        categoryMap[cat].push(key);
      }

      let result = "╔══════════◇◆◇══════════╗\n      قائمة أوامر البوت\n╠══════════◇◆◇══════════╣\n";
      let total = 0;

      const cats = Object.keys(categoryMap).sort();
      for (const cat of cats) {
        const cmds = categoryMap[cat].sort();
        total += cmds.length;
        result += "\n   ┌────── " + cat + " ──────┐\n";
        for (const c of cmds) {
          result += "║ │ 🟢 " + c + "\n";
        }
        result += "║ └─────────────────┘\n╚══════════◇◆◇══════════╝\n";
      }

      result += "\n📊 إجمالي الأوامر: " + total;
      return message.reply(result);
    }

    let cmd = commands.get(commandName) || commands.get(aliases.get(commandName));
    if (!cmd) {
      return message.reply("⚠️ الأمر '" + commandName + "' غير موجود!");
    }

    const cfg = cmd.config;
    const desc = typeof cfg.description === 'string' ? cfg.description : (cfg.description?.ar || "لا يوجد وصف");
    const guide = typeof cfg.guide === 'string' ? cfg.guide : (cfg.guide?.ar || "لا يوجد دليل");

    let result = "🟢 الأمر: " + commandName + "\n";
    result += "📝 الوصف: " + desc + "\n";
    result += "📂 الفئة: " + (cfg.category || "عام") + "\n";
    result += "📖 الدليل:\n" + guide + "\n";
    
    return message.reply(result);
  }
};
