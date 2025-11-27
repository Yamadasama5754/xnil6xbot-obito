module.exports.config = {
  name: "تصنيف",
  version: "2.0",
  author: "Yamada KJ & Alastor",
  countDown: 5,
  role: 2,
  description: {
    en: "تغيير صلاحية أي أمر (0 للجميع، 1 للأدمن، 2 للمطور) أو عرض قائمة التصنيفات"
  },
  category: "معلومات",
  guide: {
    en: "   {pn} <إسم الأمر> <0/1/2>: قم بضبط الصلاحية للأمر\n   {pn} قائمة [رقم الصفحة]: عرض قائمة الأوامر"
  }
};

module.exports.langs = {
  ar: {
    usage: "⚠️ | الاستخدام:\n.تصنيف <اسم الأمر> <0/1/2>\n.تصنيف قائمة [رقم الصفحة]",
    invalidRole: "⚠️ | الدور يجب أن يكون 0 أو 1 أو 2.",
    commandNotFound: "❌ | لم أجد أمر باسم: {0}",
    noCommands: "❌ لا توجد أوامر مسجلة!",
    invalidPage: "❌ الصفحة {0} غير موجودة!\n📄 العدد الكلي من الصفحات: {1}",
    roleChanged: "✅ | تم تغيير صلاحية الأمر \"{0}\"\nمن: {1}\nإلى: {2}",
    error: "⚠️ | حصل خطأ أثناء محاولة تنفيذ الأمر."
  }
};

function getRoleText(role) {
  const roleMap = {
    0: "الجميع",
    1: "أدمن ومطور",
    2: "مطور فقط"
  };
  return roleMap[role] || "غير معروف";
}

module.exports.onStart = async function ({ api, event, args }) {
  try {
    const action = args[0]?.toLowerCase();

    // ===== عرض قائمة التصنيفات =====
    if (action === "قائمة") {
      const itemsPerPage = 10;
      const page = parseInt(args[1]) || 1;

      if (!global.GoatBot.commands || global.GoatBot.commands.size === 0) {
        return api.sendMessage("❌ لا توجد أوامر مسجلة!", event.threadID);
      }

      const allCommands = Array.from(global.GoatBot.commands.values());
      const totalPages = Math.ceil(allCommands.length / itemsPerPage);

      if (page < 1 || page > totalPages) {
        return api.sendMessage(
          `❌ الصفحة ${page} غير موجودة!\n📄 العدد الكلي من الصفحات: ${totalPages}`,
          event.threadID
        );
      }

      const startIdx = (page - 1) * itemsPerPage;
      const endIdx = startIdx + itemsPerPage;
      const pageCommands = allCommands.slice(startIdx, endIdx);

      let msg = `📋 قائمة تصنيف الأوامر (صفحة ${page}/${totalPages})\n\n`;
      pageCommands.forEach((cmd) => {
        const roleText = getRoleText(cmd.config?.role || 0);
        msg += `${cmd.config?.name || cmd.name} - [${roleText}]\n`;
      });

      msg += `\n💡 لعرض صفحة أخرى: .تصنيف قائمة [رقم الصفحة]`;

      return api.sendMessage(msg, event.threadID, event.messageID);
    }

    // ===== تغيير التصنيف =====
    if (args.length < 2) {
      return api.sendMessage(
        "⚠️ | الاستخدام:\n.تصنيف <اسم الأمر> <0/1/2>\n.تصنيف قائمة [رقم الصفحة]",
        event.threadID,
        event.messageID
      );
    }

    const commandName = args[0].toLowerCase();
    const newRole = parseInt(args[1]);

    if (![0, 1, 2].includes(newRole)) {
      return api.sendMessage("⚠️ | الدور يجب أن يكون 0 أو 1 أو 2.", event.threadID, event.messageID);
    }

    const command = global.GoatBot.commands.get(commandName) || 
                    global.GoatBot.commands.get(global.GoatBot.aliases.get(commandName));
    
    if (!command) {
      return api.sendMessage(`❌ | لم أجد أمر باسم: ${commandName}`, event.threadID, event.messageID);
    }

    // ✅ تعديل الدور
    const oldRole = command.config?.role || 0;
    command.config.role = newRole;

    return api.sendMessage(
      `✅ | تم تغيير صلاحية الأمر "${command.config?.name || command.name}"\nمن: ${getRoleText(oldRole)}\nإلى: ${getRoleText(newRole)}`,
      event.threadID,
      event.messageID
    );
  } catch (err) {
    console.log("❌ خطأ في أمر تصنيف:", err);
    return api.sendMessage("⚠️ | حصل خطأ أثناء محاولة تنفيذ الأمر.", event.threadID, event.messageID);
  }
};
