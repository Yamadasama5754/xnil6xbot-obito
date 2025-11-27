const ignoreList = global.GoatBot.config.adminOnly.ignoreCommand;
const fs = require("fs-extra");

module.exports = {
	config: {
		name: "ignoreonlyad",
		aliases: ["ignoreadonly", "ignoreonlyadmin", "ignoreadminonly"],
		version: "1.2",
		author: "NTKhang",
		countDown: 5,
		role: 2,
		description: {
			vi: "Bỏ qua lệnh trong adminonly (khi bật adminonly, các lệnh được thêm từ lệnh này người dùng vẫn có thể sử dụng)",
			en: "Ignore command in adminonly (when turn on adminonly, user can use command added from this command)",
			ar: "أمر",
			ar: "Ignore command in adminonly (when turn on adminonly, user can use command added from this command) - أمر البوت"},
		category: "owner",
		guide: {
			vi: "   {pn} add <commandName>: Thêm lệnh vào danh sách bỏ qua"
				+ "\n   {pn} del <commandName>: Xóa lệnh khỏi danh sách bỏ qua"
				+ "\n   {pn} list: Xem danh sách lệnh bỏ qua",
			en: "   {pn} add <commandName>: Add command to ignore list"
				+ "\n   {pn} del <commandName>: Remove command from ignore list"
				+ "\n   {pn} list: View ignore list"
		}
	},

	langs: {
		vi: {
			missingCommandNameToAdd: "⚠️ Vui lòng nhập tên lệnh bạn muốn thêm vào danh sách bỏ qua",
			missingCommandNameToDelete: "⚠️ Vui lòng nhập tên lệnh bạn muốn xóa khỏi danh sách bỏ qua",
			commandNotFound: "❌ Không tìm thấy lệnh \"%1\" trong danh sách lệnh của bot",
			commandAlreadyInList: "❌ Lệnh \"%1\" đã có trong danh sách bỏ qua",
			commandAdded: "✅ Đã thêm lệnh \"%1\" vào danh sách bỏ qua",
			commandNotInList: "❌ Lệnh \"%1\" không có trong danh sách bỏ qua",
			commandDeleted: "✅ Đã xóa lệnh \"%1\" khỏi danh sách bỏ qua",
			ignoreList: "📑 Danh sách lệnh bỏ qua trong adminonly:\n%1"
		},
		en: {
			missingCommandNameToAdd: "⚠️ Please enter the command name you want to add to the ignore list",
			missingCommandNameToDelete: "⚠️ Please enter the command name you want to delete from the ignore list",
			commandNotFound: "❌ Command \"%1\" not found in bot's command list",
			commandAlreadyInList: "❌ Command \"%1\" already in ignore list",
			commandAdded: "✅ Added command \"%1\" to ignore list",
			commandNotInList: "❌ Command \"%1\" not in ignore list",
			commandDeleted: "✅ Removed command \"%1\" from ignore list",
			ignoreList: "📑 Ignore list in adminonly:\n%1"
		}
	},

	onStart: async function ({ args, message, getLang }) {
		switch (args[0]) {
			case "add": {
				if (!args[1])
					return message.reply(getLang("missingCommandNameToAdd"));
				const commandName = args[1].toLowerCase();
				const command = global.GoatBot.commands.get(commandName);
				if (!command)
					return message.reply(getLang("commandNotFound", commandName));
				if (ignoreList.includes(commandName))
					return message.reply(getLang("commandAlreadyInList", commandName));
				ignoreList.push(commandName);
				fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
				return message.reply(getLang("commandAdded", commandName));
			}
			case "del":
			case "delete":
			case "remove":
			case "rm":
			case "-d": {
				if (!args[1])
					return message.reply(getLang("missingCommandNameToDelete"));
				const commandName = args[1].toLowerCase();
				const command = global.GoatBot.commands.get(commandName);
				if (!command)
					return message.reply(getLang("commandNotFound", commandName));
				if (!ignoreList.includes(commandName))
					return message.reply(getLang("commandNotInList", commandName));
				ignoreList.splice(ignoreList.indexOf(commandName), 1);
				fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
				return message.reply(getLang("commandDeleted", commandName));
			}
			case "list": {
				return message.reply(getLang("ignoreList", ignoreList.join(", ")));
			}
			default: {
				return message.SyntaxError();
			}
		}
	}
};