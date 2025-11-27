function checkShortCut(nickname, uid, userName) {
	/\{userName\}/gi.test(nickname) ? nickname = nickname.replace(/\{userName\}/gi, userName) : null;
	/\{userID\}/gi.test(uid) ? nickname = nickname.replace(/\{userID\}/gi, uid) : null;
	return nickname;
}

module.exports = {
	config: {
		name: "لقب_تلقائي",
		aliases: ["autosetname", "تغيير_لقب"],
		version: "1.3",
		author: "Yamada KJ",
		cooldowns: 5,
		role: 1,
		description: "تغيير تلقائي للقب الأعضاء الجدد",
		category: "المحادثة",
		guide: "{pn} set <لقب>: لضبط تغيير اللقب تلقائياً، مع الاختصارات:\n+ {userName}: اسم العضو الجديد\n+ {userID}: معرف العضو\nمثال: {pn} set {userName} 🚀\n\n{pn} [on | off]: لتشغيل/إيقاف هذه الميزة\n\n{pn} [view | info]: عرض الإعدادات الحالية"
	},

	langs: {
		ar: {
			missingConfig: "⚠️ يرجى إدخال الإعدادات المطلوبة",
			configSuccess: "✅ تم ضبط الإعدادات بنجاح",
			currentConfig: "📋 إعدادات اللقب التلقائي الحالية في مجموعتك:\n%1",
			notSetConfig: "⚠️ مجموعتك لم تقم بضبط إعدادات اللقب التلقائي",
			syntaxError: "⚠️ خطأ في الصيغة، استخدم فقط \"{pn} on\" أو \"{pn} off\"",
			turnOnSuccess: "✅ تم تشغيل ميزة اللقب التلقائي",
			turnOffSuccess: "❌ تم إيقاف ميزة اللقب التلقائي",
			error: "⚠️ حدث خطأ أثناء استخدام ميزة اللقب التلقائي، حاول إيقاف ميزة رابط الدعوة في المجموعة وحاول مرة أخرى"
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang }) {
		switch (args[0]) {
			case "set":
			case "add":
			case "config":
			case "ضبط": {
				if (args.length < 2)
					return message.reply(getLang("missingConfig"));
				const configAutoSetName = args.slice(1).join(" ");
				await threadsData.set(event.threadID, configAutoSetName, "data.autoSetName");
				return message.reply(getLang("configSuccess"));
			}
			case "view":
			case "info":
			case "عرض": {
				const configAutoSetName = await threadsData.get(event.threadID, "data.autoSetName");
				return message.reply(configAutoSetName ? getLang("currentConfig", configAutoSetName) : getLang("notSetConfig"));
			}
			default: {
				const enableOrDisable = args[0];
				if (enableOrDisable !== "on" && enableOrDisable !== "off")
					return message.reply(getLang("syntaxError"));
				await threadsData.set(event.threadID, enableOrDisable === "on", "settings.enableAutoSetName");
				return message.reply(enableOrDisable == "on" ? getLang("turnOnSuccess") : getLang("turnOffSuccess"));
			}
		}
	},

	onEvent: async ({ message, event, api, threadsData, getLang }) => {
		if (event.logMessageType !== "log:subscribe")
			return;
		if (!await threadsData.get(event.threadID, "settings.enableAutoSetName"))
			return;
		const configAutoSetName = await threadsData.get(event.threadID, "data.autoSetName");

		return async function () {
			const addedParticipants = [...event.logMessageData.addedParticipants];

			for (const user of addedParticipants) {
				const { userFbId: uid, fullName: userName } = user;
				try {
					await api.changeNickname(checkShortCut(configAutoSetName, uid, userName), event.threadID, uid);
				}
				catch (e) {
					return message.reply(getLang("error"));
				}
			}
		};
	}
};
