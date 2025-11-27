const axios = require("axios");
const { getStreamFromURL } = global.utils;

module.exports = {
	config: {
		name: "تخمين_الكلمة",
		aliases: ["dhbc", "guessword"],
		version: "1.3",
		author: "Yamada KJ",
		countDown: 5,
		role: 0,
		description: "لعبة تخمين الكلمة من الصور",
		category: "ألعاب",
		guide: "{pn}",
		envConfig: {
			reward: 1000
		}
	},

	langs: {
		ar: {
			reply: "رد على هذه الرسالة بالإجابة\n%1",
			isSong: "هذا اسم أغنية للمغني %1",
			notPlayer: "⚠️ أنت لست اللاعب في هذا السؤال",
			correct: "🎉 مبروك! أجبت بشكل صحيح وحصلت على %1$",
			wrong: "⚠️ إجابة خاطئة"
		}
	},

	onStart: async function ({ message, event, commandName, getLang }) {
		const datagame = (await axios.get("https://goatbotserver.onrender.com/api/duoihinhbatchu")).data;
		const { wordcomplete, casi, image1, image2 } = datagame.data;

		message.reply({
			body: getLang("reply", wordcomplete.replace(/\S/g, "█ ")) + (casi ? getLang("isSong", casi) : ''),
			attachment: [
				await getStreamFromURL(image1),
				await getStreamFromURL(image2)
			]
		}, (err, info) => {
			global.GoatBot.onReply.set(info.messageID, {
				commandName,
				messageID: info.messageID,
				author: event.senderID,
				wordcomplete
			});
		});
	},

	onReply: async ({ message, Reply, event, getLang, usersData, envCommands, commandName }) => {
		const { author, wordcomplete, messageID } = Reply;
		if (event.senderID != author)
			return message.reply(getLang("notPlayer"));

		if (formatText(event.body) == formatText(wordcomplete)) {
			global.GoatBot.onReply.delete(messageID);
			await usersData.addMoney(event.senderID, envCommands[commandName].reward);
			message.reply(getLang("correct", envCommands[commandName].reward));
		}
		else
			message.reply(getLang("wrong"));
	}
};

function formatText(text) {
	return text.normalize("NFD")
		.toLowerCase()
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[đ|Đ]/g, (x) => x == "đ" ? "d" : "D");
}
