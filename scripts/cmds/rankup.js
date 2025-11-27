const deltaNext = global.GoatBot.configCommands.envCommands.rank.deltaNext;
const expToLevel = exp => Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNext)) / 2);
const { drive } = global.utils;

module.exports = {
	config: {
		name: "ترقية",
		aliases: ["rankup", "رفع_مستوى"],
		version: "1.4",
		author: "Yamada KJ",
		countDown: 5,
		role: 0,
		description: "تشغيل/إيقاف إخطار رفع المستوى",
		category: "المرتبة",
		guide: "{pn} [on | off]",
		envConfig: {
			deltaNext: 5
		}
	},

	langs: {
		ar: {
			syntaxError: "خطأ في الصيغة، يمكنك فقط استخدام {pn} on أو {pn} off",
			turnedOn: "تم تشغيل إخطار رفع المستوى",
			turnedOff: "تم إيقاف إخطار رفع المستوى",
			notiMessage: "🎉🎉 تهانينا على الوصول إلى المستوى %1"
		}
	},

	onStart: async function ({ message, event, threadsData, args, getLang }) {
		if (!["on", "off"].includes(args[0]))
			return message.reply(getLang("syntaxError"));
		await threadsData.set(event.threadID, args[0] == "on", "settings.sendRankupMessage");
		return message.reply(args[0] == "on" ? getLang("turnedOn") : getLang("turnedOff"));
	},

	onChat: async function ({ threadsData, usersData, event, message, getLang }) {
		const threadData = await threadsData.get(event.threadID);
		const sendRankupMessage = threadData.settings.sendRankupMessage;
		if (!sendRankupMessage)
			return;
		const { exp } = await usersData.get(event.senderID);
		const currentLevel = expToLevel(exp);
		if (currentLevel > expToLevel(exp - 1)) {
			let customMessage = await threadsData.get(event.threadID, "data.rankup.message");
			let isTag = false;
			let userData;
			const formMessage = {};

			if (customMessage) {
				userData = await usersData.get(event.senderID);
				customMessage = customMessage
					.replace(/{userName}/g, userData.name)
					.replace(/{level}/g, currentLevel);
				isTag = true;
				formMessage.body = customMessage;
				formMessage.mentions = [{
					id: event.senderID,
					tag: userData.name
				}];
			}
			else {
				userData = await usersData.get(event.senderID);
				formMessage.body = getLang("notiMessage", currentLevel).replace(/{userName}/g, userData.name);
				formMessage.mentions = [{
					id: event.senderID,
					tag: userData.name
				}];
			}

			message.reply(formMessage);
		}
	}
};
