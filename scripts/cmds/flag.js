const axios = require("axios");
const baseApiUrl = async () => {
	const base = await axios.get(
		`https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`,
	);
	return base.data.api;
};

module.exports = {
	config: {
		name: "لعبة_الأعلام",
		aliases: ["flag", "flagGame", "اعلام"],
		version: "3.0",
		author: "Yamada KJ",
		countDown: 0,
		role: 0,
		description: "تخمين اسم علم الدولة",
		category: "ألعاب",
		guide: "{pn}: ابدأ لعبة تخمين الأعلام\n{pn} list: عرض ترتيب الفائزين"
	},

	langs: {
		ar: {
			guessFlag: "خمن اسم هذا العلم (بالإنجليزية).",
			maxAttempts: "🚫 وصلت للحد الأقصى من المحاولات (5).",
			correct: "✅ إجابة صحيحة!\nلقد حصلت على %1 عملة و %2 خبرة.",
			wrong: "❌ إجابة خاطئة. لديك %1 محاولات متبقية.\n✅ حاول مرة أخرى!",
			rankings: "ترتيب لعبة الأعلام:\n\n",
			wins: "فوز",
			error: "خطأ: %1"
		}
	},

	onReply: async function ({ api, event, Reply, usersData, threadsData, getLang }) {
		const { country, attempts } = Reply;
		const maxAttempts = 5;
		if (event.type == "message_reply") {
			const reply = event.body.toLowerCase();
			const getCoin = 2 * 120.5;
			const getExp = 1 * 121;
			const userData = await usersData.get(event.senderID);
			if (attempts >= maxAttempts) {
				await api.sendMessage(
					getLang("maxAttempts"),
					event.threadID,
					event.messageID,
				);
				return;
			}
			if (isNaN(reply)) {
				if (reply == country.toLowerCase()) {
					try {
						await api.unsendMessage(Reply.messageID);
						await usersData.set(event.senderID, {
							money: userData.money + getCoin,
							exp: userData.exp + getExp,
							data: userData.data,
						});
						const grp = await threadsData.get(event.threadID);
						const userID = event.senderID;
						if (!grp.data.flagWins) {
							grp.data.flagWins = {};
						}
						if (!grp.data.flagWins[userID]) {
							grp.data.flagWins[userID] = 0;
						}
						grp.data.flagWins[userID] += 1;
						await threadsData.set(event.threadID, grp);
					} catch (err) {
						console.log("خطأ: ", err.message);
					} finally {
						const message = getLang("correct", getCoin, getExp);
						await api.sendMessage(message, event.threadID, event.messageID);
					}
				} else {
					Reply.attempts += 1;
					global.GoatBot.onReply.set(Reply.messageID, Reply);
					api.sendMessage(
						getLang("wrong", maxAttempts - Reply.attempts),
						event.threadID,
						event.messageID,
					);
				}
			}
		}
	},

	onStart: async function ({ api, args, event, threadsData, usersData, getLang }) {
		try {
			if (!args[0]) {
				const response = await axios.get(
					`${await baseApiUrl()}/flagGame?randomFlag=random`,
				);
				const { link, country } = response.data;
				await api.sendMessage(
					{
						body: getLang("guessFlag"),
						attachment: await global.utils.getStreamFromURL(link),
					},
					event.threadID,
					(error, info) => {
						global.GoatBot.onReply.set(info.messageID, {
							commandName: this.config.name,
							type: "reply",
							messageID: info.messageID,
							author: event.senderID,
							link,
							country,
							attempts: 0,
						});
					},
					event.messageID,
				);
			} else if (args[0] === "list" || args[0] === "قائمة") {
				const threadData = await threadsData.get(event.threadID);
				const { data } = threadData;
				const flagWins = data.flagWins || {};

				const flagStatsArray = Object.entries(flagWins);
				flagStatsArray.sort((a, b) => b[1] - a[1]);

				let message = getLang("rankings");
				let i = 0;
				for (const [userID, winCount] of flagStatsArray) {
					const userName = await usersData.getName(userID);
					message += `${i + 1}. ${userName}: ${winCount} ${getLang("wins")}\n`;
					i++;
				}

				return api.sendMessage(message, event.threadID, event.messageID);
			}
		} catch (error) {
			console.error(`خطأ: ${error.message}`);
			api.sendMessage(
				getLang("error", error.message),
				event.threadID,
				event.messageID,
			);
		}
	},
};
