const { getStreamFromURL, uploadImgbb } = global.utils;

module.exports = {
	config: {
		name: "حماية_المجموعة",
		aliases: ["antichangeinfobox", "حماية"],
		version: "1.9",
		author: "Yamada KJ",
		countDown: 5,
		role: 0,
		description: "تشغيل/إيقاف حماية تغيير معلومات المجموعة",
		category: "المحادثة",
		guide: "{pn} avt [on | off]: حماية صورة المجموعة\n{pn} name [on | off]: حماية اسم المجموعة\n{pn} nickname [on | off]: حماية الألقاب\n{pn} theme [on | off]: حماية الثيم\n{pn} emoji [on | off]: حماية الإيموجي"
	},

	langs: {
		ar: {
			antiChangeAvatarOn: "✅ تم تشغيل حماية صورة المجموعة",
			antiChangeAvatarOff: "❌ تم إيقاف حماية صورة المجموعة",
			missingAvt: "⚠️ لم تقم بتعيين صورة للمجموعة",
			antiChangeNameOn: "✅ تم تشغيل حماية اسم المجموعة",
			antiChangeNameOff: "❌ تم إيقاف حماية اسم المجموعة",
			antiChangeNicknameOn: "✅ تم تشغيل حماية الألقاب",
			antiChangeNicknameOff: "❌ تم إيقاف حماية الألقاب",
			antiChangeThemeOn: "✅ تم تشغيل حماية الثيم",
			antiChangeThemeOff: "❌ تم إيقاف حماية الثيم",
			antiChangeEmojiOn: "✅ تم تشغيل حماية الإيموجي",
			antiChangeEmojiOff: "❌ تم إيقاف حماية الإيموجي",
			antiChangeAvatarAlreadyOn: "🔒 المجموعة محمية ضد تغيير الصورة",
			antiChangeAvatarAlreadyOnButMissingAvt: "🔒 المجموعة محمية ضد تغيير الصورة لكن لم يتم تعيين صورة",
			antiChangeNameAlreadyOn: "🔒 المجموعة محمية ضد تغيير الاسم",
			antiChangeNicknameAlreadyOn: "🔒 المجموعة محمية ضد تغيير الألقاب",
			antiChangeThemeAlreadyOn: "🔒 المجموعة محمية ضد تغيير الثيم",
			antiChangeEmojiAlreadyOn: "🔒 المجموعة محمية ضد تغيير الإيموجي"
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang }) {
		if (!["on", "off"].includes(args[1]))
			return message.SyntaxError();
		const { threadID } = event;
		const dataAntiChangeInfoBox = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
		async function checkAndSaveData(key, data) {
			if (args[1] === "off")
				delete dataAntiChangeInfoBox[key];
			else
				dataAntiChangeInfoBox[key] = data;

			await threadsData.set(threadID, dataAntiChangeInfoBox, "data.antiChangeInfoBox");
			message.reply(getLang(`antiChange${key.slice(0, 1).toUpperCase()}${key.slice(1)}${args[1].slice(0, 1).toUpperCase()}${args[1].slice(1)}`));
		}
		switch (args[0]) {
			case "avt":
			case "avatar":
			case "image":
			case "صورة": {
				const { imageSrc } = await threadsData.get(threadID);
				if (!imageSrc)
					return message.reply(getLang("missingAvt"));
				const newImageSrc = await uploadImgbb(imageSrc);
				await checkAndSaveData("avatar", newImageSrc.image.url);
				break;
			}
			case "name":
			case "اسم": {
				const { threadName } = await threadsData.get(threadID);
				await checkAndSaveData("name", threadName);
				break;
			}
			case "nickname":
			case "لقب": {
				const { members } = await threadsData.get(threadID);
				await checkAndSaveData("nickname", members.map(user => ({ [user.userID]: user.nickname })).reduce((a, b) => ({ ...a, ...b }), {}));
				break;
			}
			case "theme":
			case "ثيم": {
				const { threadThemeID } = await threadsData.get(threadID);
				await checkAndSaveData("theme", threadThemeID);
				break;
			}
			case "emoji":
			case "ايموجي": {
				const { emoji } = await threadsData.get(threadID);
				await checkAndSaveData("emoji", emoji);
				break;
			}
			default: {
				return message.SyntaxError();
			}
		}
	},

	onEvent: async function ({ message, event, threadsData, role, api, getLang }) {
		const { threadID, logMessageType, logMessageData, author } = event;
		switch (logMessageType) {
			case "log:thread-image": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!dataAntiChange.avatar && role < 1)
					return;
				return async function () {
					if (role < 1 && api.getCurrentUserID() !== author) {
						if (dataAntiChange.avatar != "REMOVE") {
							message.reply(getLang("antiChangeAvatarAlreadyOn"));
							api.changeGroupImage(await getStreamFromURL(dataAntiChange.avatar), threadID);
						}
						else {
							message.reply(getLang("antiChangeAvatarAlreadyOnButMissingAvt"));
						}
					}
					else {
						const imageSrc = logMessageData.url;
						if (!imageSrc)
							return await threadsData.set(threadID, "REMOVE", "data.antiChangeInfoBox.avatar");

						const newImageSrc = await uploadImgbb(imageSrc);
						await threadsData.set(threadID, newImageSrc.image.url, "data.antiChangeInfoBox.avatar");
					}
				};
			}
			case "log:thread-name": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!dataAntiChange.hasOwnProperty("name"))
					return;
				return async function () {
					if (role < 1 && api.getCurrentUserID() !== author) {
						message.reply(getLang("antiChangeNameAlreadyOn"));
						api.setTitle(dataAntiChange.name, threadID);
					}
					else {
						const threadName = logMessageData.name;
						await threadsData.set(threadID, threadName, "data.antiChangeInfoBox.name");
					}
				};
			}
			case "log:user-nickname": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!dataAntiChange.hasOwnProperty("nickname"))
					return;
				return async function () {
					const { nickname, participant_id } = logMessageData;

					if (role < 1 && api.getCurrentUserID() !== author) {
						message.reply(getLang("antiChangeNicknameAlreadyOn"));
						api.changeNickname(dataAntiChange.nickname[participant_id], threadID, participant_id);
					}
					else {
						await threadsData.set(threadID, nickname, `data.antiChangeInfoBox.nickname.${participant_id}`);
					}
				};
			}
			case "log:thread-color": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!dataAntiChange.hasOwnProperty("theme"))
					return;
				return async function () {
					if (role < 1 && api.getCurrentUserID() !== author) {
						message.reply(getLang("antiChangeThemeAlreadyOn"));
						api.changeThreadColor(dataAntiChange.theme || "196241301102133", threadID);
					}
					else {
						const threadThemeID = logMessageData.theme_id;
						await threadsData.set(threadID, threadThemeID, "data.antiChangeInfoBox.theme");
					}
				};
			}
			case "log:thread-icon": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!dataAntiChange.hasOwnProperty("emoji"))
					return;
				return async function () {
					if (role < 1 && api.getCurrentUserID() !== author) {
						message.reply(getLang("antiChangeEmojiAlreadyOn"));
						api.changeThreadEmoji(dataAntiChange.emoji, threadID);
					}
					else {
						const threadEmoji = logMessageData.thread_icon;
						await threadsData.set(threadID, threadEmoji, "data.antiChangeInfoBox.emoji");
					}
				};
			}
		}
	}
};
