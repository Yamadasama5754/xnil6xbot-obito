if (!global.client.busyList)
	global.client.busyList = {};

module.exports = {
	config: {
		name: "مشغول",
		aliases: ["busy", "عدم_ازعاج"],
		version: "1.6",
		author: "Yamada KJ",
		countDown: 5,
		role: 0,
		description: "تشغيل وضع عدم الإزعاج، عند الإشارة إليك سيقوم البوت بالإخطار",
		category: "المحادثة",
		guide: "{pn} [فارغ | السبب]: تشغيل وضع عدم الإزعاج\n{pn} off: إيقاف وضع عدم الإزعاج"
	},

	langs: {
		ar: {
			turnedOff: "✅ تم إيقاف وضع عدم الإزعاج",
			turnedOn: "✅ تم تشغيل وضع عدم الإزعاج",
			turnedOnWithReason: "✅ تم تشغيل وضع عدم الإزعاج بسبب: %1",
			turnedOnWithoutReason: "✅ تم تشغيل وضع عدم الإزعاج",
			alreadyOn: "المستخدم %1 مشغول حالياً",
			alreadyOnWithReason: "المستخدم %1 مشغول حالياً بسبب: %2"
		}
	},

	onStart: async function ({ args, message, event, getLang, usersData }) {
		const { senderID } = event;

		if (args[0] == "off") {
			const { data } = await usersData.get(senderID);
			delete data.busy;
			await usersData.set(senderID, data, "data");
			return message.reply(getLang("turnedOff"));
		}

		const reason = args.join(" ") || "";
		await usersData.set(senderID, reason, "data.busy");
		return message.reply(
			reason ?
				getLang("turnedOnWithReason", reason) :
				getLang("turnedOnWithoutReason")
		);
	},

	onChat: async ({ event, message, getLang }) => {
		const { mentions } = event;

		if (!mentions || Object.keys(mentions).length == 0)
			return;
		const arrayMentions = Object.keys(mentions);

		for (const userID of arrayMentions) {
			const reasonBusy = global.db.allUserData.find(item => item.userID == userID)?.data.busy || false;
			if (reasonBusy !== false) {
				return message.reply(
					reasonBusy ?
						getLang("alreadyOnWithReason", mentions[userID].replace("@", ""), reasonBusy) :
						getLang("alreadyOn", mentions[userID].replace("@", "")));
			}
		}
	}
};
