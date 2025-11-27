const { getStreamsFromAttachment } = global.utils;

module.exports = {
	config: {
		name: "إخطار",
		aliases: ["notification", "notify", "noti"],
		version: "1.7",
		author: "Yamada KJ",
		countDown: 5,
		role: 2,
		description: "إرسال إخطار من المسؤول إلى جميع المجموعات",
		category: "المالك",
		guide: "{pn} <الرسالة>",
		envConfig: {
			delayPerGroup: 250
		}
	},

	langs: {
		ar: {
			missingMessage: "يرجى إدخال الرسالة التي تريد إرسالها إلى جميع المجموعات",
			notification: "إخطار من مشرف البوت إلى جميع مجموعات الدردشة (لا ترد على هذه الرسالة)",
			sendingNotification: "بدء إرسال الإخطار من مشرف البوت إلى %1 مجموعة",
			sentNotification: "✅ تم إرسال الإخطار إلى %1 مجموعة بنجاح",
			errorSendingNotification: "حدث خطأ أثناء الإرسال إلى %1 مجموعة:\n%2"
		}
	},

	onStart: async function ({ message, api, event, args, commandName, envCommands, threadsData, getLang }) {
		const { delayPerGroup } = envCommands[commandName];
		if (!args[0])
			return message.reply(getLang("missingMessage"));
		const formSend = {
			body: `${getLang("notification")}\n────────────────\n${args.join(" ")}`,
			attachment: await getStreamsFromAttachment(
				[
					...event.attachments,
					...(event.messageReply?.attachments || [])
				].filter(item => ["photo", "png", "animated_image", "video", "audio"].includes(item.type))
			)
		};

		const allThreadID = (await threadsData.getAll()).filter(t => t.isGroup && t.members.find(m => m.userID == api.getCurrentUserID())?.inGroup);
		message.reply(getLang("sendingNotification", allThreadID.length));

		let sendSucces = 0;
		const sendError = [];
		const wattingSend = [];

		for (const thread of allThreadID) {
			const tid = thread.threadID;
			const waitTime = new Promise((resolve) => {
				const timeout = setTimeout(async () => {
					try {
						await api.sendMessage(formSend, tid);
						sendSucces++;
					}
					catch (e) {
						sendError.push(`${thread.name}: ${e.message}`);
					}
					resolve();
				}, delayPerGroup);
				wattingSend.push(timeout);
			});
			await waitTime;
		}

		let msg = "";
		if (sendSucces > 0)
			msg += `${getLang("sentNotification", sendSucces)}\n`;
		if (sendError.length > 0)
			msg += `${getLang("errorSendingNotification", sendError.length, sendError.join("\n"))}`;
		message.reply(msg);
	}
};
