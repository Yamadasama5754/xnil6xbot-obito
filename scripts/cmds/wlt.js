const { config } = global.GoatBot;
const { client } = global;
const { writeFileSync } = require("fs-extra");

module.exports = {
	config: {
		name: "القائمة_البيضاء_مجموعة",
		aliases: ["wlt", "whitelist_thread"],
		version: "1.5",
		author: "Yamada KJ",
		countDown: 5,
		role: 2,
		description: "إضافة أو إزالة أو تعديل معرفات المجموعات في القائمة البيضاء",
		category: "المالك",
		guide: "{pn} add - إضافة\n{pn} remove - إزالة\n{pn} list - عرض القائمة\n{pn} mode on/off - تفعيل/تعطيل"
	},

	langs: {
		ar: {
			added: "✅ تمت إضافة %1 مجموعة",
			alreadyWLT: "⚠️ هذه المجموعة مضافة بالفعل",
			missingTIDAdd: "⚠️ يرجى إدخال معرف المجموعة",
			removed: "✅ تمت إزالة %1 مجموعة",
			notAdded: "❎ لم تكن المجموعة مضافة",
			missingTIDRemove: "⚠️ يرجى إدخال معرف المجموعة",
			listWLTs: "📋 قائمة المجموعات البيضاء:\n%1",
			turnedOn: "✅ تم تفعيل وضع القائمة البيضاء",
			turnedOff: "❎ تم تعطيل وضع القائمة البيضاء",
			turnedOnNoti: "✅ تم تفعيل الإخطارات",
			turnedOffNoti: "❎ تم تعطيل الإخطارات"
		}
	},

	onStart: async function ({ message, args, event, getLang, api }) {
		switch (args[0]) {
			case "add":
			case "-a": {
				let tids = args.slice(1).filter(arg => !isNaN(arg));
				if (tids.length <= 0) {
					tids.push(event.threadID);
				}
				config.whiteListModeThread.whiteListThreadIds.push(...tids);
				writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
				return message.reply(getLang("added", tids.length));
			}
			case "remove":
			case "-r": {
				let tids = args.slice(1).filter(arg => !isNaN(arg));
				if (tids.length <= 0) {
					tids.push(event.threadID);
				}
				tids.forEach(tid => {
					const idx = config.whiteListModeThread.whiteListThreadIds.indexOf(tid);
					if (idx > -1) {
						config.whiteListModeThread.whiteListThreadIds.splice(idx, 1);
					}
				});
				writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
				return message.reply(getLang("removed", tids.length));
			}
			case "list":
			case "-l": {
				const list = config.whiteListModeThread.whiteListThreadIds.join("\n");
				return message.reply(getLang("listWLTs", list || "لا توجد مجموعات"));
			}
			case "mode":
			case "-m": {
				const value = args[1] === "on";
				config.whiteListModeThread.enable = value;
				writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
				return message.reply(getLang(value ? "turnedOn" : "turnedOff"));
			}
			default:
				return message.reply(getLang("missingTIDAdd"));
		}
	}
};
