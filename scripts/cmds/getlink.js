const shortenURL = require("tinyurl").shorten;
const { get } = require("axios");
const baseApiUrl = async () => {
	const base = await get(
		`https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`,
	);
	return base.data.api;
};

module.exports = {
	config: {
		name: "جلب_رابط",
		aliases: ["getlink", "gl", "g", "رابط"],
		version: "1.0",
		author: "Yamada KJ",
		countDown: 2,
		role: 0,
		description: "الحصول على رابط تحميل من فيديو، صوت، أو صورة مرسلة في المجموعة",
		category: "أدوات",
		guide: "{pn} [--t/t/tinyurl] [رد على مرفق]: رابط مختصر\n{pn} [--i/i/imgbb] [رد على مرفق]: رفع على imgbb\n{pn} [رد على مرفق]: رابط مباشر"
	},

	langs: {
		ar: {
			success: "✅ هذه روابط %1 ملف مرفق\n\n",
			replyRequired: "❌ يجب الرد على صوت، فيديو، أو صورة",
			photoRequired: "❌ يجب الرد على صورة",
			error: "❌ خطأ: %1"
		}
	},

	onStart: async function ({ message, args, event, getLang }) {
		try {
			let { messageReply, type, senderID } = event;
			let num = 0;
			let length = messageReply.attachments.length;
			var msg = getLang("success", length);

			if (
				args[0] === "--t" ||
				args[0] === "t" ||
				args[0] === "tinyurl" ||
				args[0] == "-t"
			) {
				if (type !== "message_reply") {
					return message.reply(getLang("replyRequired"));
				}
				if (!messageReply.attachments || length == 0) {
					return message.reply(getLang("replyRequired"));
				} else {
					for (let i = 0; i < length; i++) {
						let shortLink = await shortenURL(messageReply.attachments[i].url);
						num += 1;
						msg += `${num}: ${shortLink}\n`;
					}
					message.reply(msg);
				}
			} else if (
				args[0] == "i" ||
				args[0] == "--i" ||
				args[0] == "imgbb" ||
				args[0] == "-i"
			) {
				if (type !== "message_reply") {
					return message.reply(getLang("photoRequired"));
				}
				if (!messageReply.attachments || length == 0) {
					return message.reply(getLang("photoRequired"));
				} else {
					for (let i = 0; i < length; i++) {
						let imgLink = await get(
							`${await baseApiUrl()}/imgbb?url=${encodeURIComponent(messageReply.attachments[i].url)}`,
						);
						num += 1;
						msg += `${num}: ${imgLink.data.data.url}\n`;
					}
					message.reply(msg);
				}
			} else if (
				args[0] == "tg" ||
				args[0] == "telegraph" ||
				args[0] == "-tg" ||
				args[0] == "--tg"
			) {
				if (type !== "message_reply") {
					return message.reply(getLang("replyRequired"));
				}
				if (!messageReply.attachments || length == 0) {
					return message.reply(getLang("replyRequired"));
				} else {
					for (let i = 0; i < length; i++) {
						let shortLink = await shortenURL(messageReply.attachments[i].url);
						const res = await get(`${await baseApiUrl()}/tg?url=${shortLink}`);
						num += 1;
						msg += `${num}: ${res.data.data}\n`;
					}
					message.reply(msg);
				}
			} else if (
				args[0] == "imgur" ||
				args[0] == "imgurl" ||
				args[0] == "-imgur" ||
				args[0] == "--imgur"
			) {
				if (type !== "message_reply") {
					return message.reply(getLang("replyRequired"));
				}
				if (!messageReply.attachments || length == 0) {
					return message.reply(getLang("replyRequired"));
				} else {
					for (let i = 0; i < length; i++) {
						let shortLink = await shortenURL(messageReply.attachments[i].url);
						const res = await get(
							`${await baseApiUrl()}/imgur?url=${shortLink}`,
						);
						num += 1;
						msg += `${num}: ${res.data.data}\n`;
					}
					message.reply(msg);
				}
			} else if (
				args[0] == "dc" ||
				args[0] == "discord" ||
				args[0] == "-d" ||
				args[0] == "--dc"
			) {
				if (type !== "message_reply") {
					return message.reply(getLang("replyRequired"));
				}
				if (!messageReply.attachments || length == 0) {
					return message.reply(getLang("replyRequired"));
				} else {
					for (let i = 0; i < length; i++) {
						const encLink = encodeURIComponent(messageReply.attachments[i].url);
						const res = await get(
							`${await baseApiUrl()}/dc?imageUrl=${encLink}`,
						);
						num += 1;
						msg += `${num}: ${res.data.url}\n`;
					}
					message.reply(msg);
				}
			} else if (
				args[0] == "sl" ||
				args[0] == "shortlink" ||
				args[0] == "-s" ||
				args[0] == "--sl"
			) {
				if (type !== "message_reply") {
					return message.reply(getLang("replyRequired"));
				}
				if (!messageReply.attachments || length == 0) {
					return message.reply(getLang("replyRequired"));
				} else {
					for (let i = 0; i < length; i++) {
						const { data } = await get(
							`${await baseApiUrl()}/linkshort?link=${encodeURIComponent(messageReply.attachments[i].url)}name=${encodeURIComponent(messageReply.attachments[i].filename)}`,
						);
						num += 1;
						msg += `${num}: ${data.shortLink}\n`;
					}
					message.reply(msg);
				}
			} else if (
				args[0] == "--p" ||
				args[0] == "postimg" ||
				args[0] == "postimage" ||
				args[0] == "-p"
			) {
				if (type !== "message_reply") {
					return message.reply(getLang("photoRequired"));
				}
				if (!messageReply.attachments || length == 0) {
					return message.reply(getLang("photoRequired"));
				} else {
					for (let i = 0; i < length; i++) {
						const encLink = encodeURIComponent(messageReply.attachments[i].url);
						const res = await get(
							`${await baseApiUrl()}/postimg?imageUrl=${encLink}`,
						);
						num += 1;
						msg += `${num}: ${res.data.directLink}\n`;
					}
					message.reply(msg);
				}
			}

			if (!args[0]) {
				if (type !== "message_reply")
					return message.reply(getLang("replyRequired"));
				else if (!messageReply.attachments || length == 0)
					return message.reply(getLang("replyRequired"));
				else if (
					(type == "message_reply" && messageReply.attachments) ||
					length !== 0
				) {
					for (let i = 0; i < length; i++) {
						num += 1;
						msg += `${num}: ${messageReply.attachments[i].url}\n\n`;
					}
					message.reply(msg);
				}
			}
		} catch (err) {
			console.log(err);
			message.reply(getLang("error", err.message));
		}
	},
};
