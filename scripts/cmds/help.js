const fs = require("fs");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "3.2",
    author: "NTKhang // xnil6x",
    countDown: 5,
    role: 0,
    description: {
      en: "View command information with enhanced interface",
      ar: "عرض معلومات الأوامر بواجهة محسنة"
    },
    category: "info",
    guide: {
      en: "{pn} [command] - View command details\n{pn} all - View all commands\n{pn} c [category] - View commands in category",
      ar: "{pn} [أمر] - عرض تفاصيل الأمر\n{pn} all - عرض جميع الأوامر\n{pn} c [فئة] - عرض أوامر الفئة"
    }
  },

  langs: {
    en: {
      helpHeader: "╔══════════◇◆◇══════════╗\n"
                + "      BOT COMMAND LIST\n"
                + "╠══════════◇◆◇══════════╣",
      categoryHeader: "\n   ┌────── {category} ──────┐\n",
      commandItem: "║ │ 🟢 {name}",
      helpFooter: "║ └─────────────────┘\n"
                + "╚══════════◇◆◇══════════╝",
      commandInfo: "╔══════════◇◆◇══════════╗\n"
                 + "║           COMMAND INFORMATION      \n"
                 + "╠══════════◇◆◇══════════╣\n"
                 + "║ 🏷️ Name: {name}\n"
                 + "║ 📝 Description: {description}\n"
                 + "║ 📂 Category: {category}\n"
                 + "║ 🔤 Aliases: {aliases}\n"
                 + "║ 🏷️ Version: {version}\n"
                 + "║ 🔒 Permissions: {role}\n"
                 + "║ ⏱️ Cooldown: {countDown}s\n"
                 + "║ 🔧 Use Prefix: {usePrefix}\n"
                 + "║ 👤 Author: {author}\n"
                 + "╠══════════◇◆◇══════════╣",
      usageHeader: "║ 🛠️ USAGE GUIDE",
      usageBody: " ║ {usage}",
      usageFooter: "╚══════════◇◆◇══════════╝",
      commandNotFound: "⚠️ Command '{command}' not found!",
      doNotHave: "None",
      roleText0: "👥 All Users",
      roleText1: "👑 Group Admins",
      roleText2: "⚡ Bot Admins",
      totalCommands: "📊 Total Commands: {total}\n"
                  + "xnil",
      noCommandsInCategory: "❌ No commands found in category: {category}"
    },
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
      totalCommands: "📊 إجمالي الأوامر: {total}\n"
                  + "xnil",
      noCommandsInCategory: "❌ لا توجد أوامر في الفئة: {category}"
    }
  },

  onStart: async function({ message, args, event, threadsData, role, getLang }) {
    const { threadID } = event;
    const prefix = getPrefix(threadID);
    const commandName = args[0]?.toLowerCase();
    const bannerPath = path.join(__dirname, "assets", "20250319_111041.png");

    if (commandName === 'c' && args[1]) {
      const categoryArg = args[1].toUpperCase();
      const commandsInCategory = [];

      for (const [name, cmd] of commands) {
        if (cmd.config.role > 1 && role < cmd.config.role) continue;
        const category = cmd.config.category?.toUpperCase() || "GENERAL";
        if (category === categoryArg) {
          commandsInCategory.push({ name });
        }
      }

      if (commandsInCategory.length === 0) {
        return message.reply(getLang("noCommandsInCategory").replace(/{category}/g, categoryArg));
      }

      let replyMsg = getLang("helpHeader");
      replyMsg += getLang("categoryHeader").replace(/{category}/g, categoryArg);

      commandsInCategory.sort((a, b) => a.name.localeCompare(b.name)).forEach(cmd => {
        replyMsg += getLang("commandItem").replace(/{name}/g, cmd.name) + "\n";
      });

      replyMsg += getLang("helpFooter");
      replyMsg += "\n" + getLang("totalCommands").replace(/{total}/g, commandsInCategory.length);

      return message.reply(replyMsg);
    }

    if (!commandName || commandName === 'all') {
      const categories = new Map();

      for (const [name, cmd] of commands) {
        if (cmd.config.role > 1 && role < cmd.config.role) continue;

        const category = cmd.config.category?.toUpperCase() || "GENERAL";
        if (!categories.has(category)) {
          categories.set(category, []);
        }
        categories.get(category).push({ name });
      }

      const sortedCategories = [...categories.keys()].sort();
      let replyMsg = getLang("helpHeader").replace(/{prefix}/g, prefix);
      let totalCommands = 0;

      for (const category of sortedCategories) {
        const commandsInCategory = categories.get(category).sort((a, b) => a.name.localeCompare(b.name));
        totalCommands += commandsInCategory.length;

        replyMsg += getLang("categoryHeader").replace(/{category}/g, category);

        commandsInCategory.forEach(cmd => {
          replyMsg += getLang("commandItem").replace(/{name}/g, cmd.name) + "\n";
        });

        replyMsg += getLang("helpFooter");
      }

      replyMsg += "\n" + getLang("totalCommands").replace(/{total}/g, totalCommands);

      try {
        if (fs.existsSync(bannerPath)) {
          return message.reply({
            body: replyMsg,
            attachment: fs.createReadStream(bannerPath)
          });
        } else {
          return message.reply(replyMsg);
        }
      } catch (e) {
        console.error("Couldn't load help banner:", e);
        return message.reply(replyMsg);
      }
    }

    let cmd = commands.get(commandName) || commands.get(aliases.get(commandName));
    if (!cmd) {
      return message.reply(getLang("commandNotFound").replace(/{command}/g, commandName));
    }

    const config = cmd.config;
    const lang = global.GoatBot.config.language || "en";
    const description = config.description?.[lang] || config.description?.en || config.description || "No description";
    const aliasesList = config.aliases?.join(", ") || getLang("doNotHave");
    const category = config.category?.toUpperCase() || "GENERAL";

    let roleText;
    switch(config.role) {
      case 1: roleText = getLang("roleText1"); break;
      case 2: roleText = getLang("roleText2"); break;
      default: roleText = getLang("roleText0");
    }

    let guide = config.guide?.[lang] || config.guide?.en || config.usage || config.guide || "No usage guide available";
    if (typeof guide === "object") guide = guide.body;
    guide = guide.replace(/\{prefix\}/g, prefix).replace(/\{name\}/g, config.name).replace(/\{pn\}/g, prefix + config.name);

    let replyMsg = getLang("commandInfo")
      .replace(/{name}/g, config.name)
      .replace(/{description}/g, description)
      .replace(/{category}/g, category)
      .replace(/{aliases}/g, aliasesList)
      .replace(/{version}/g, config.version)
      .replace(/{role}/g, roleText)
      .replace(/{countDown}/g, config.countDown || 1)
      .replace(/{usePrefix}/g, typeof config.usePrefix === "boolean" ? (config.usePrefix ? "✅ نعم" : "❌ لا") : "❓ غير معروف")
      .replace(/{author}/g, config.author || "Unknown");

    replyMsg += "\n" + getLang("usageHeader") + "\n" +
                getLang("usageBody").replace(/{usage}/g, guide.split("\n").join("\n ")) + "\n" +
                getLang("usageFooter");

    return message.reply(replyMsg);
  }
};
