module.exports = {
	config: {
		name: "كلمات_محظورة",
		aliases: ["badwords", "badword", "محظورة"],
		version: "1.4",
		author: "Yamada KJ",
		countDown: 5,
		role: 1,
		description: "تشغيل/إيقاف/إضافة/حذف تحذير الكلمات البذيئة، إذا خالف العضو سيتم تحذيره، وفي المرة الثانية سيتم طرده",
		category: "المحادثة",
		guide: "{pn} add <كلمات>: إضافة كلمات محظورة\n{pn} delete <كلمات>: حذف كلمات محظورة\n{pn} list: عرض القائمة\n{pn} unwarn [uid | @tag]: إزالة تحذير من عضو\n{pn} on: تشغيل التحذير\n{pn} off: إيقاف التحذير"
	},

	langs: {
		ar: {
			onText: "تشغيل",
			offText: "إيقاف",
			onlyAdmin: "⚠️ فقط المشرفون يمكنهم إضافة كلمات محظورة للقائمة",
			missingWords: "⚠️ لم تدخل الكلمات المحظورة",
			addedSuccess: "✅ تمت إضافة %1 كلمة محظورة للقائمة",
			alreadyExist: "❌ %1 كلمة محظورة موجودة بالفعل في القائمة: %2",
			tooShort: "⚠️ %1 كلمة محظورة لا يمكن إضافتها لأنها أقصر من 2 حرف: %2",
			onlyAdmin2: "⚠️ فقط المشرفون يمكنهم حذف الكلمات المحظورة من القائمة",
			missingWords2: "⚠️ لم تدخل الكلمات للحذف",
			deletedSuccess: "✅ تم حذف %1 كلمة محظورة من القائمة",
			notExist: "❌ %1 كلمة محظورة غير موجودة في القائمة: %2",
			emptyList: "⚠️ قائمة الكلمات المحظورة في مجموعتك فارغة حالياً",
			badWordsList: "📑 قائمة الكلمات المحظورة في مجموعتك: %1",
			onlyAdmin3: "⚠️ فقط المشرفون يمكنهم %1 هذه الميزة",
			turnedOnOrOff: "✅ تحذير الكلمات المحظورة تم %1",
			onlyAdmin4: "⚠️ فقط المشرفون يمكنهم حذف تحذير الكلمات المحظورة",
			missingTarget: "⚠️ لم تدخل معرف المستخدم أو الإشارة للمستخدم",
			notWarned: "⚠️ المستخدم %1 لم يتم تحذيره بسبب الكلمات المحظورة",
			removedWarn: "✅ المستخدم %1 | %2 تمت إزالة تحذير كلمات محظورة واحد منه",
			warned: "⚠️ تم اكتشاف الكلمة المحظورة \"%1\" في رسالتك، إذا استمررت في المخالفة سيتم طردك من المجموعة.",
			warned2: "⚠️ تم اكتشاف الكلمة المحظورة \"%1\" في رسالتك، لقد خالفت مرتين وسيتم طردك من المجموعة.",
			needAdmin: "❌ البوت يحتاج صلاحيات مشرف لطرد الأعضاء المحظورين",
			unwarned: "✅ تمت إزالة تحذير الكلمات المحظورة من المستخدم %1 | %2"
		}
	},

	onStart: async function ({ message, event, args, threadsData, usersData, role, getLang }) {
		if (!await threadsData.get(event.threadID, "data.badWords"))
			await threadsData.set(event.threadID, {
				words: [],
				violationUsers: {}
			}, "data.badWords");

		const badWords = await threadsData.get(event.threadID, "data.badWords.words", []);

		switch (args[0]) {
			case "add":
			case "اضافة": {
				if (role < 1)
					return message.reply(getLang("onlyAdmin"));
				const words = args.slice(1).join(" ").split(/[,|]/);
				if (words.length === 0)
					return message.reply(getLang("missingWords"));
				const badWordsExist = [];
				const success = [];
				const failed = [];
				for (const word of words) {
					const oldIndex = badWords.indexOf(word);
					if (oldIndex === -1) {
						badWords.push(word);
						success.push(word);
					}
					else if (oldIndex > -1) {
						badWordsExist.push(word);
					}
					else
						failed.push(word);
				}
				await threadsData.set(event.threadID, badWords, "data.badWords.words");
				message.reply(
					success.length > 0 ? getLang("addedSuccess", success.length) : ""
						+ (badWordsExist.length > 0 ? getLang("alreadyExist", badWordsExist.length, badWordsExist.map(word => hideWord(word)).join(", ")) : "")
						+ (failed.length > 0 ? getLang("tooShort", failed.length, failed.join(", ")) : "")
				);
				break;
			}
			case "delete":
			case "del":
			case "-d":
			case "حذف": {
				if (role < 1)
					return message.reply(getLang("onlyAdmin2"));
				const words = args.slice(1).join(" ").split(/[,|]/);
				if (words.length === 0)
					return message.reply(getLang("missingWords2"));
				const success = [];
				const failed = [];
				for (const word of words) {
					const oldIndex = badWords.indexOf(word);
					if (oldIndex > -1) {
						badWords.splice(oldIndex, 1);
						success.push(word);
					}
					else
						failed.push(word);
				}
				await threadsData.set(event.threadID, badWords, "data.badWords.words");
				message.reply(
					(success.length > 0 ? getLang("deletedSuccess", success.length) : "")
					+ (failed.length > 0 ? getLang("notExist", failed.length, failed.join(", ")) : "")
				);
				break;
			}
			case "list":
			case "all":
			case "-a":
			case "قائمة": {
				if (badWords.length === 0)
					return message.reply(getLang("emptyList"));
				message.reply(getLang("badWordsList", args[1] === "hide" ? badWords.map(word => hideWord(word)).join(", ") : badWords.join(", ")));
				break;
			}
			case "on": {
				if (role < 1)
					return message.reply(getLang("onlyAdmin3", getLang("onText")));
				await threadsData.set(event.threadID, true, "settings.badWords");
				message.reply(getLang("turnedOnOrOff", getLang("onText")));
				break;
			}
			case "off": {
				if (role < 1)
					return message.reply(getLang("onlyAdmin3", getLang("offText")));
				await threadsData.set(event.threadID, false, "settings.badWords");
				message.reply(getLang("turnedOnOrOff", getLang("offText")));
				break;
			}
			case "unwarn":
			case "الغاء_تحذير": {
				if (role < 1)
					return message.reply(getLang("onlyAdmin4"));
				let userID;
				if (Object.keys(event.mentions)[0])
					userID = Object.keys(event.mentions)[0];
				else if (args[1])
					userID = args[1];
				else if (event.messageReply)
					userID = event.messageReply.senderID;
				if (isNaN(userID))
					return message.reply(getLang("missingTarget"));
				const violationUsers = await threadsData.get(event.threadID, "data.badWords.violationUsers", {});
				if (!violationUsers[userID])
					return message.reply(getLang("notWarned", userID));
				violationUsers[userID]--;
				await threadsData.set(event.threadID, violationUsers, "data.badWords.violationUsers");
				const userName = await usersData.getName(userID);
				message.reply(getLang("unwarned", userID, userName));
			}
		}
	},

	onChat: async function ({ message, event, api, threadsData, prefix, getLang }) {
		if (!event.body)
			return;
		const threadData = global.db.allThreadData.find(t => t.threadID === event.threadID) || await threadsData.create(event.threadID);
		const isEnabled = threadData.settings.badWords;
		if (!isEnabled)
			return;
		const allAliases = [...(global.GoatBot.commands.get("badwords").config.aliases || []), ...(threadData.data.aliases?.["badwords"] || [])];
		const isCommand = allAliases.some(a => event.body.startsWith(prefix + a));
		if (isCommand)
			return;
		const badWordList = threadData.data.badWords?.words;
		if (!badWordList || badWordList.length === 0)
			return;
		const violationUsers = threadData.data.badWords?.violationUsers || {};

		for (const word of badWordList) {
			if (event.body.match(new RegExp(`\\b${word}\\b`, "gi"))) {
				if ((violationUsers[event.senderID] || 0) < 1) {
					message.reply(getLang("warned", word));
					violationUsers[event.senderID] = violationUsers[event.senderID] ? violationUsers[event.senderID] + 1 : 1;
					await threadsData.set(event.threadID, violationUsers, "data.badWords.violationUsers");
					return;
				}
				else {
					await message.reply(getLang("warned2", word));
					api.removeUserFromGroup(event.senderID, event.threadID, (err) => {
						if (err)
							return message.reply(getLang("needAdmin"), (e, info) => {
								let { onEvent } = global.GoatBot;
								onEvent.push({
									messageID: info.messageID,
									onStart: ({ event }) => {
										if (event.logMessageType === "log:thread-admins" && event.logMessageData.ADMIN_EVENT == "add_admin") {
											const { TARGET_ID } = event.logMessageData;
											if (TARGET_ID == api.getCurrentUserID())
												api.removeUserFromGroup(event.senderID, event.threadID, () => onEvent = onEvent.filter(item => item.messageID != info.messageID));
										}
									}
								});
							});
					});
				}
			}
		}
	}
};


function hideWord(str) {
	return str.length == 2 ?
		str[0] + "*" :
		str[0] + "*".repeat(str.length - 2) + str[str.length - 1];
}
