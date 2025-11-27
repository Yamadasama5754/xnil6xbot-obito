module.exports = {
        config: {
                name: "تصنيف",
                version: "1.4",
                author: "NTKhang",
                countDown: 5,
                role: 1,
                description: {
                        vi: "Chỉnh sửa role của lệnh (những lệnh có role < 2)",
                        en: "قم بتغيير قاعدة الأوامر  (القواعد مع رقم < 2)"
                },
                category: "معلومات",
                guide: {
                        vi: "   {pn} <إسم الأمر> <القاعدة الجديدة>: set role mới cho lệnh"
                                + "\n   Với:"
                                + "\n   + <commandName>: tên lệnh"
                                + "\n   + <new role>: role mới của lệnh với:"
                                + "\n   + <new role> = 0: lệnh có thể được sử dụng bởi mọi thành viên trong nhóm"
                                + "\n   + <new role> = 1: lệnh chỉ có thể được sử dụng bởi quản trị viên"
                                + "\n   + <new role> = default: reset role lệnh về mặc định"
                                + "\n   Ví dụ:"
                                + "\n    {pn} rank 1: (lệnh rank sẽ chỉ có thể được sử dụng bởi quản trị viên)"
                                + "\n    {pn} rank 0: (lệnh rank sẽ có thể được sử dụng bởi mọi thành viên trong nhóm)"
                                + "\n    {pn} rank default: reset về mặc định"
                                + "\n—————"
                                + "\n   {pn} [viewrole|view|show]: xem role của những lệnh đã chỉnh sửa",
                        en: "   {pn} <إسم الأمر> <القاعدة الجديدة>: قم بضبط القاعدة للأمر"
                                + "\n   مع:"
                                + "\n   + <إسم الأمر>: إسم الأمر"
                                + "\n   + <القاعدة الجديدة>: القاعدة الجديدة للأمر:"
                                + "\n   + <القاعدة الجديدة> = 0: يمكن للجميع إستخدام الأمر "
                                + "\n   + <قاعدة جديدة> = 1: يمكن إستخدام الامر فقط من طرف الآدمنية"
                                + "\n   + <الأمر الجديد > = الاصل : إستعادة قاعدة الأمر إلى 0"
                                + "\n   مثلل :"
                                + "\n    {pn} مستواي 1: (الأمر مستواي يمكن إستخدامه من طرف الآدمنية فقط)"
                                + "\n    {pn} مستواي 0: (يمكن إستخدام الأمر من طرف الجميع)"
                                + "\n    {pn} مستواي الأصل: إستعادة ااأمر إلى ماكان عليه في البداية"
                                + "\n—————"
                                + "\n   {pn} [عرض القاعدة|عرض|رؤية]: مشاهدة قاعدة الأمر"
                }
        },

        langs: {
                vi: {
                        noEditedCommand: "✅ Hiện tại nhóm bạn không có lệnh nào được chỉnh sửa role",
                        editedCommand: "⚠️ Những lệnh trong nhóm bạn đã chỉnh sửa role:\n",
                        noPermission: "❗ Chỉ có quản trị viên mới có thể thực hiện lệnh này",
                        commandNotFound: "Không tìm thấy lệnh \"%1\"",
                        noChangeRole: "❗ Không thể thay đổi role của lệnh \"%1\"",
                        resetRole: "Đã reset role của lệnh \"%1\" về mặc định",
                        changedRole: "Đã thay đổi role của lệnh \"%1\" thành %2"
                },
                en: {
                        noEditedCommand: "⚠️ | ليس هناك أي قاعدة لهذا الأمر تم تعديلها من قبل",
                        editedCommand: "⚠️ مجموعتك لم يتم فيها اي تعديلات بالنسبة للقواعد:\n",
                        noPermission: "❗ | فقط آدمنية المجموعة يمكنهم إستخدام هذا الأمر",
                        commandNotFound: " ❗ |الأمر  \"%1\" لم يتم إيجاده",
                        noChangeRole: "❗ | لم يتم إيجاد أي أمر تم التعديل عليه من قبل \"%1\"",
                        resetRole: " 🧿 | تم إعادة قاعدة الأمر  \"%1\" إلى الأصل",
                        changedRole: " ✅ |تم تغيير قاعدة الأمر  \"%1\" إلى  %2 بنحاح"
                },
                ar: {
                        noEditedCommand: "✅ لا توجد أي أوامر تم تعديل قاعدتها حالياً",
                        editedCommand: "⚠️ الأوامر المعدلة في مجموعتك:\n",
                        noPermission: "❗ فقط آدمنية المجموعة يمكنهم استخدام هذا الأمر",
                        commandNotFound: "❗ الأمر \"%1\" غير موجود",
                        noChangeRole: "❗ لا يمكن تغيير قاعدة الأمر \"%1\"",
                        resetRole: "🧿 تم إعادة قاعدة الأمر \"%1\" إلى الأصل",
                        changedRole: "✅ تم تغيير قاعدة الأمر \"%1\" إلى %2 بنجاح"
                }
        },

        onStart: async function ({ message, event, args, role, threadsData, api, getLang }) {
                try {
                        if (!global.GoatBot || !global.GoatBot.commands) {
                                return message.reply("❌ البوت لم يكن جاهز، حاول لاحقاً");
                        }

                        const { commands, aliases } = global.GoatBot;
                        const setRole = await threadsData.get(event.threadID, "data.setRole", {});

                        if (["view", "viewrole", "show", "عرض", "رؤية"].includes(args[0])) {
                                if (!setRole || Object.keys(setRole).length === 0)
                                        return message.reply(getLang("noEditedCommand"));
                                let msg = getLang("editedCommand");
                                for (const cmd in setRole) msg += `- ${cmd} => ${setRole[cmd]}\n`;
                                return message.reply(msg);
                        }

                        let commandName = (args[0] || "").toLowerCase();
                        let newRole = args[1];
                        
                        if (!commandName || newRole === undefined)
                                return message.reply(getLang("noPermission"));
                        
                        if ((isNaN(newRole) && newRole !== "default" && newRole !== "الأصل")) {
                                return message.reply("❌ يجب أن تكون القاعدة رقم (0 أو 1 أو 2) أو 'default'");
                        }
                        
                        if (role === undefined || role < 1)
                                return message.reply(getLang("noPermission"));

                        const command = commands.get(commandName) || commands.get(aliases.get(commandName));
                        if (!command)
                                return message.reply(getLang("commandNotFound", commandName));
                        
                        commandName = command.config.name;

                        let Default = false;
                        if (newRole === "default" || newRole === "الأصل" || parseInt(newRole) == command.config.role) {
                                Default = true;
                                newRole = command.config.role;
                        }
                        else {
                                newRole = parseInt(newRole);
                        }

                        if (!Default) {
                                setRole[commandName] = newRole;
                        } else {
                                delete setRole[commandName];
                        }
                        
                        await api.setMessageReaction("✅", event.messageID, (err) => {}, true);
                        await threadsData.set(event.threadID, setRole, "data.setRole");
                        
                        if (Default === true) {
                                message.reply(getLang("resetRole", commandName));
                        } else {
                                message.reply(getLang("changedRole", commandName, newRole));
                        }
                } catch (error) {
                        console.error("❌ خطأ في أمر التصنيف:", error);
                        message.reply("❌ حدث خطأ: " + error.message);
                }
        }
};
