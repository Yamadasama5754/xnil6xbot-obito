const { writeFileSync } = require("fs-extra");
const { config } = global.GoatBot;
const { client } = global;

module.exports = {
	config: {
		name: "القائمة_البيضاء",
		aliases: ["wl", "whitelist", "وضع_خاص"],
		version: "1.5",
		author: "Yamada KJ",
		countDown: 5,
		role: 0,
		description: "إضافة أو إزالة المستخدمين من القائمة البيضاء",
		category: "المالك",
		guide: "{pn} add <معرف> - إضافة\n{pn} remove <معرف> - إزالة\n{pn} list - عرض القائمة\n{pn} mode on/off - تفعيل/تعطيل"
	},

	langs: {
		ar: {
			added: "✅ تمت إضافة %1 مستخدم",
			alreadyAdded: "⚠️ هذا المستخدم مضاف بالفعل",
			missingIdAdd: "⚠️ يرجى إدخال معرف المستخدم",
			removed: "✅ تمت إزالة %1 مستخدم",
			notAdded: "❎ لم يكن المستخدم مضافاً",
			missingIdRemove: "⚠️ يرجى إدخال معرف المستخدم",
			listAdmin: "📋 قائمة المستخدمين:\n%1",
			turnedOn: "✅ تم تفعيل وضع القائمة البيضاء",
			turnedOff: "❎ تم تعطيل وضع القائمة البيضاء",
			turnedOnNoti: "✅ تم تفعيل الإخطارات",
			turnedOffNoti: "❎ تم تعطيل الإخطارات",
			permissionDenied: "❌ ليس لديك صلاحيات"
		}
	},

	onStart: async function ({ message, args, event, getLang, api }) {
		const permission = global.GoatBot.config.adminBot;
		if (!permission.includes(event.senderID)) {
			return message.reply(getLang("permissionDenied"));
		}

		switch (args[0]) {
			case "add":
			case "-a": {
				let uids = [];
				if (Object.keys(event.mentions).length > 0) {
					uids = Object.keys(event.mentions);
				} else if (event.messageReply) {
					uids.push(event.messageReply.senderID);
				} else {
					uids = args.slice(1).filter(arg => !isNaN(arg));
				}

				if (uids.length === 0) return message.reply(getLang("missingIdAdd"));

				config.whiteListMode.whiteListIds.push(...uids);
				writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
				return message.reply(getLang("added", uids.length));
			}

			case "remove":
			case "-r": {
				let uids = [];
				if (Object.keys(event.mentions).length > 0) {
					uids = Object.keys(event.mentions);
				} else if (event.messageReply) {
					uids.push(event.messageReply.senderID);
				} else {
					uids = args.slice(1).filter(arg => !isNaN(arg));
				}

				if (uids.length === 0) return message.reply(getLang("missingIdRemove"));

				uids.forEach(uid => {
					const idx = config.whiteListMode.whiteListIds.indexOf(uid);
					if (idx > -1) {
						config.whiteListMode.whiteListIds.splice(idx, 1);
					}
				});
				writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
				return message.reply(getLang("removed", uids.length));
			}

			case "list":
			case "-l": {
				const list = config.whiteListMode.whiteListIds.join("\n") || "لا يوجد مستخدمون";
				return message.reply(getLang("listAdmin", list));
			}

			case "mode":
			case "-m": {
				const value = args[1] === "on";
				config.whiteListMode.enable = value;
				writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
				return message.reply(getLang(value ? "turnedOn" : "turnedOff"));
			}

			default:
				return message.reply(getLang("missingIdAdd"));
		}
	}
};
