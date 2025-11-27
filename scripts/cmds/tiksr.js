const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
	config: {
		name: "بحث_تيكتوك",
		aliases: ["tiksr", "tiktok_search"],
		version: "1.0",
		author: "Yamada KJ",
		countDown: 5,
		role: 0,
		description: "البحث عن فيديوهات على TikTok",
		category: "وسائط",
		guide: "{pn} <البحث> - <اختياري: عدد النتائج>"
	},

	langs: {
		ar: {
			noResults: "❌ لم يتم العثور على نتائج",
			error: "❌ حدث خطأ أثناء البحث",
			invalidOption: "❌ اختيار غير صحيح"
		}
	},

	onStart: async function ({ message }) {
		message.reply("أمر البحث عن TikTok - جاري التطوير");
	}
};
