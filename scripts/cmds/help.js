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
      helpHeader: "╔══════════◇◆◇══════════╗\n"
                + "      قائمة أوامر البوت\n"
                + "╠══════════◇◆◇══════════╣",
      categoryHeader: "\n   ┌────── {category} ──────┐\n",
      commandItem: "║ │ 🟢 {name}",
      helpFooter: "║ └─────────────────┘\n"
                + "╚══════════◇◆◇══════════╝",
      commandInfo: "╔══════════◇◆◇══════════╗\n"
                 + "║           معلومات الأمر      \n"
                 + "╠══════════◇◆◇══════════╣\n"
                 + "║ 🏷️ الاسم: {name}\n"
                 + "║ 📝 الوصف: {description}\n"
                 + "║ 📂 الفئة: {category}\n"
                 + "║ 🔤 الأسماء البديلة: {aliases}\n"
                 + "║ 🏷️ الإصدار: {version}\n"
                 + "║ 🔒 الصلاحيات: {role}\n"
                 + "║ ⏱️ وقت الانتظار: {countDown}ث\n"
                 + "║ 🔧 يستخدم بادئة: {usePrefix}\n"
                 + "║ 👤 المطور: {author}\n"
                 + "╠══════════◇◆◇══════════╣",
      usageHeader: "║ 🛠️ دليل الاستخدام",
      usageBody: " ║ {usage}",
      usageFooter: "╚══════════◇◆◇══════════╝",
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

  onStart: async function({ message, args, event, threadsData, role, getLang }) {
    const { threadID } = event;
    const prefix = getPrefix(threadID);
    const commandName = args[0]?.toLowerCase();

    if (commandName === 'c' && args[1]) {
      const categoryArg = args[1].toUpperCase();
      const commandsInCategory = [];

      for (const [name, cmd] of commands) {
        if (cmd.config.role > 1 && role < cmd.config.role) continue;
        const category = cmd.config.category?.toUpperCase() || "عام";
        if (category === categoryArg) {
          commandsInCategory.push(cmd.config.name);
        }
      }

      if (commandsInCategory.length === 0) {
        return message.reply(getLang("noCommandsInCategory").replace(/{category}/g, categoryArg));
      }

      let replyMsg = getLang("helpHeader");
      replyMsg += getLang("categoryHeader").replace(/{category}/g, categoryArg);

      commandsInCategory.sort().forEach(cmdName => {
        replyMsg += getLang("commandItem").replace(/{name}/g, cmdName) + "\n";
      });

      replyMsg += getLang("helpFooter");
      replyMsg += "\n" + getLang("totalCommands").replace(/{total}/g, commandsInCategory.length);

      return message.reply(replyMsg);
    }

    if (!commandName || commandName === 'all' || commandName === 'الكل') {
      const categories = new Map();

      for (const [name, cmd] of commands) {
        if (cmd.config.role > 1 && role < cmd.config.role) continue;

        const category = cmd.config.category?.toUpperCase() || "عام";
        if (!categories.has(category)) {
          categories.set(category, []);
        }
        categories.get(category).push(cmd.config.name);
      }

      const sortedCategories = [...categories.keys()].sort();
      let replyMsg = getLang("helpHeader").replace(/{prefix}/g, prefix);
      let totalCommands = 0;

      for (const category of sortedCategories) {
        const commandsInCategory = categories.get(category).sort();
        totalCommands += commandsInCategory.length;

        replyMsg += getLang("categoryHeader").replace(/{category}/g, category);

        commandsInCategory.forEach(cmdName => {
          replyMsg += getLang("commandItem").replace(/{name}/g, cmdName) + "\n";
        });

        replyMsg += getLang("helpFooter");
      }

      replyMsg += "\n" + getLang("totalCommands").replace(/{total}/g, totalCommands);

      return message.reply(replyMsg);
    }

    let cmd = commands.get(commandName) || commands.get(aliases.get(commandName));
    if (!cmd) {
      return message.reply(getLang("commandNotFound").replace(/{command}/g, commandName));
    }

    const config = cmd.config;
    const description = typeof config.description === 'object' 
      ? (config.description.ar || config.description.en || getLang("noDescription"))
      : (config.description || getLang("noDescription"));
    const aliasesList = config.aliases?.join(", ") || getLang("doNotHave");
    const category = config.category?.toUpperCase() || "عام";

    let roleText;
    switch(config.role) {
      case 1: roleText = getLang("roleText1"); break;
      case 2: roleText = getLang("roleText2"); break;
      default: roleText = getLang("roleText0");
    }

    let guide = typeof config.guide === 'object'
      ? (config.guide.ar || config.guide.en || getLang("noGuide"))
      : (config.guide || config.usage || getLang("noGuide"));
    if (typeof guide === "object") guide = guide.body;
    guide = guide.replace(/\{prefix\}/g, prefix).replace(/\{name\}/g, config.name).replace(/\{pn\}/g, prefix + config.name);

    let usePrefixText;
    if (typeof config.usePrefix === "boolean") {
      usePrefixText = config.usePrefix ? getLang("yes") : getLang("no");
    } else {
      usePrefixText = getLang("unknown");
    }

    let replyMsg = getLang("commandInfo")
      .replace(/{name}/g, config.name)
      .replace(/{description}/g, description)
      .replace(/{category}/g, category)
      .replace(/{aliases}/g, aliasesList)
      .replace(/{version}/g, config.version)
      .replace(/{role}/g, roleText)
      .replace(/{countDown}/g, config.countDown || 1)
      .replace(/{usePrefix}/g, usePrefixText)
      .replace(/{author}/g, config.author || "غير معروف");

    replyMsg += "\n" + getLang("usageHeader") + "\n" +
                getLang("usageBody").replace(/{usage}/g, guide.split("\n").join("\n ")) + "\n" +
                getLang("usageFooter");

    return message.reply(replyMsg);
  }
};
