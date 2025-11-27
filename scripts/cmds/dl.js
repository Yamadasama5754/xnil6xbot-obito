const axios = require("axios");

module.exports = {
	config: {
		name: "تحميل",
		aliases: ["dl", "بث"],
		version: "1.0",
		author: "Yamada KJ",
		countDown: 5,
		role: 0,
		description: "بث الوسائط من رابط",
		category: "أدوات",
		guide: "{pn} <رابط_الوسائط>"
	},

	langs: {
		ar: {
			invalidUrl: "❌ يرجى تقديم رابط وسائط صالح.\nمثال: {pn} https://example.com/image.jpg",
			unsupportedType: "❌ نوع وسائط غير مدعوم. يُسمح فقط بروابط الصور أو الفيديو المباشرة.",
			streaming: "🔗 جاري البث: {url}",
			failed: "❌ فشل في بث الوسائط. قد يكون الرابط غير صالح أو محظور."
		}
	},

	onStart: async function ({ api, event, args, getLang }) {
		const url = args[0];

		if (!url || !/^https?:\/\//.test(url)) {
			return api.sendMessage(getLang("invalidUrl"), event.threadID, event.messageID);
		}

		try {
			const res = await axios.get(url, { responseType: "stream" });
			const contentType = res.headers["content-type"];

			if (!["image", "video"].some(type => contentType.startsWith(type))) {
				return api.sendMessage(getLang("unsupportedType"), event.threadID, event.messageID);
			}

			api.sendMessage({
				body: getLang("streaming").replace(/{url}/g, url),
				attachment: res.data
			}, event.threadID, event.messageID);

		} catch (e) {
			api.sendMessage(getLang("failed"), event.threadID, event.messageID);
		}
	}
};
