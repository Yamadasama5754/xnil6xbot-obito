const axios = require("axios");

module.exports = {
	config: {
		name: "اختبار_api",
		aliases: ["apitest"],
		version: "1.0",
		author: "Yamada KJ",
		role: 4,
		usePrefix: false,
		description: "اختبار أي API عام عبر GET أو POST",
		category: "أدوات",
		cooldowns: 3,
		guide: "{pn} get <رابط> | {pn} post <رابط> <بيانات>"
	},

	langs: {
		ar: {
			usage: "الاستخدام:\n{pn} get <رابط>\n{pn} post <رابط> <بيانات-json>",
			invalidJson: "❌ بيانات JSON غير صالحة لطلب POST.",
			onlyGetPost: "❌ فقط طريقتي GET و POST مدعومتان.",
			responseTooLong: "❌ الاستجابة طويلة جداً.",
			error: "❌ خطأ: %1"
		}
	},

	onStart: async function ({ api, event, args, getLang }) {
		const method = args[0]?.toLowerCase();
		const url = args[1];
		const bodyInput = args.slice(2).join(" ");

		if (!method || !url) {
			return api.sendMessage(getLang("usage"), event.threadID, event.messageID);
		}

		try {
			let res;
			if (method === "get") {
				res = await axios.get(url);
			} else if (method === "post") {
				let data = {};
				try {
					data = bodyInput ? JSON.parse(bodyInput) : {};
				} catch (e) {
					return api.sendMessage(getLang("invalidJson"), event.threadID, event.messageID);
				}
				res = await axios.post(url, data);
			} else {
				return api.sendMessage(getLang("onlyGetPost"), event.threadID, event.messageID);
			}

			const reply = JSON.stringify(res.data, null, 2);
			return api.sendMessage(reply.length > 19000 ? getLang("responseTooLong") : reply, event.threadID, event.messageID);
		} catch (err) {
			return api.sendMessage(getLang("error", err.response?.data?.message || err.message), event.threadID, event.messageID);
		}
	}
};
