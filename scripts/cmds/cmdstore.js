const axios = require("axios");
const availableCmdsUrl = "https://raw.githubusercontent.com/Blankid018/D1PT0/main/availableCmds.json";
const cmdUrlsJson = "https://raw.githubusercontent.com/Blankid018/D1PT0/main/cmdUrls.json";
const ITEMS_PER_PAGE = 10;

module.exports.config = {
	name: "متجر_الأوامر",
	aliases: ["cmdstore", "cs", "cmds"],
	author: "Yamada KJ",
	role: 0,
	version: "6.9",
	description: "متجر أوامر البوت",
	countDown: 3,
	category: "بوت",
	guide: "{pn} [اسم الأمر | حرف واحد | رقم الصفحة]"
};

module.exports.langs = {
	ar: {
		notFound: "❌ لم يتم العثور على أوامر تبدأ بـ \"%1\".",
		cmdNotFound: "❌ الأمر \"%1\" غير موجود.",
		invalidPage: "❌ رقم صفحة غير صالح. يرجى إدخال رقم بين 1 و %1.",
		failedRetrieve: "❌ فشل في استرداد الأوامر.",
		forMore: "اكتب \"%1 %2\" لمزيد من الأوامر.",
		whoAreYou: "من أنت؟ 🐸",
		replyNumber: "❌ يرجى الرد برقم بين %1 و %2.",
		urlNotFound: "❌ لم يتم العثور على رابط الأمر.",
		failedUrl: "❌ فشل في استرداد رابط الأمر."
	}
};

module.exports.onStart = async function ({ api, event, args, getLang }) {
	const query = args.join(" ").trim().toLowerCase();
	try {
		const response = await axios.get(availableCmdsUrl);
		let cmds = response.data.cmdName;
		let finalArray = cmds;
		let page = 1;

		if (query) {
			if (!isNaN(query)) {
				page = parseInt(query);
			} else if (query.length === 1) {
				finalArray = cmds.filter(cmd => cmd.cmd.startsWith(query));
				if (finalArray.length === 0) {
					return api.sendMessage(getLang("notFound", query), event.threadID, event.messageID);
				}
			} else {
				finalArray = cmds.filter(cmd => cmd.cmd.includes(query));
				if (finalArray.length === 0) {
					return api.sendMessage(getLang("cmdNotFound", query), event.threadID, event.messageID);
				}
			}
		}

		const totalPages = Math.ceil(finalArray.length / ITEMS_PER_PAGE);
		if (page < 1 || page > totalPages) {
			return api.sendMessage(
				getLang("invalidPage", totalPages),
				event.threadID,
				event.messageID
			);
		}

		const startIndex = (page - 1) * ITEMS_PER_PAGE;
		const endIndex = startIndex + ITEMS_PER_PAGE;
		const cmdsToShow = finalArray.slice(startIndex, endIndex);
		let msg = `╭───✦ متجر الأوامر ✦───╮\n│ الصفحة ${page} من ${totalPages} صفحة\n│ إجمالي ${finalArray.length} أمر\n`;
		cmdsToShow.forEach((cmd, index) => {
			msg += `│ ───✦ ${startIndex + index + 1}. ${cmd.cmd}\n│ المؤلف: ${cmd.author}\n│ التحديث: ${cmd.update || "غير محدد"}\n`;
		});
		msg += `╰─────────────⧕`;

		if (page < totalPages) {
			msg += `\n` + getLang("forMore", this.config.name, page + 1);
		}
		api.sendMessage(
			msg,
			event.threadID,
			(error, info) => {
				global.GoatBot.onReply.set(info.messageID, {
					commandName: this.config.name,
					type: "reply",
					messageID: info.messageID,
					author: event.senderID,
					cmdName: finalArray,
					page: page
				});
			},
			event.messageID
		);
	} catch (error) {
		api.sendMessage(
			getLang("failedRetrieve"),
			event.threadID,
			event.messageID
		);
	}
};

module.exports.onReply = async function ({ api, event, Reply, getLang }) {
	if (Reply.author != event.senderID) {
		return api.sendMessage(getLang("whoAreYou"), event.threadID, event.messageID);
	}
	const reply = parseInt(event.body);
	const startIndex = (Reply.page - 1) * ITEMS_PER_PAGE;
	const endIndex = startIndex + ITEMS_PER_PAGE;

	if (isNaN(reply) || reply < startIndex + 1 || reply > endIndex) {
		return api.sendMessage(
			getLang("replyNumber", startIndex + 1, Math.min(endIndex, Reply.cmdName.length)),
			event.threadID,
			event.messageID
		);
	}
	try {
		const cmdName = Reply.cmdName[reply - 1].cmd;
		const { status } = Reply.cmdName[reply - 1];
		const response = await axios.get(cmdUrlsJson);
		const selectedCmdUrl = response.data[cmdName];
		if (!selectedCmdUrl) {
			return api.sendMessage(
				getLang("urlNotFound"),
				event.threadID,
				event.messageID
			);
		}
		api.unsendMessage(Reply.messageID);
		const msg = `╭───────⭓\n│ الحالة: ${status || "غير محدد"}\n│ رابط الأمر: ${selectedCmdUrl}\n╰─────────────⭓`;
		api.sendMessage(msg, event.threadID, event.messageID);
	} catch (error) {
		api.sendMessage(
			getLang("failedUrl"),
			event.threadID,
			event.messageID
		);
	}
};
