module.exports = {
	config: {
		name: "طرد",
		aliases: ["kick", "إزالة_عضو"],
		version: "1.3",
		author: "Yamada KJ",
		countDown: 5,
		role: 1,
		description: "طرد عضو من المحادثة",
		category: "المحادثة",
		guide: "{pn} @إشارات: لطرد الأعضاء المُشار إليهم"
	},

	langs: {
		ar: {
			needAdmin: "يرجى إضافة صلاحية مشرف للبوت قبل استخدام هذه الميزة"
		}
	},

	onStart: async function ({ message, event, args, threadsData, api, getLang }) {
		const adminIDs = await threadsData.get(event.threadID, "adminIDs");
		if (!adminIDs.includes(api.getCurrentUserID()))
			return message.reply(getLang("needAdmin"));
		async function kickAndCheckError(uid) {
			try {
				await api.removeUserFromGroup(uid, event.threadID);
			}
			catch (e) {
				message.reply(getLang("needAdmin"));
				return "ERROR";
			}
		}
		if (!args[0]) {
			if (!event.messageReply)
				return message.SyntaxError();
			await kickAndCheckError(event.messageReply.senderID);
		}
		else {
			const uids = Object.keys(event.mentions);
			if (uids.length === 0)
				return message.SyntaxError();
			if (await kickAndCheckError(uids.shift()) === "ERROR")
				return;
			for (const uid of uids)
				api.removeUserFromGroup(uid, event.threadID);
		}
	}
};
