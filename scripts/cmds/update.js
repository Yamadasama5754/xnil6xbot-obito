const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
	config: {
		name: "تحديث",
		aliases: ["update", "تحديث_البوت"],
		version: "1.5",
		author: "Yamada KJ",
		role: 2,
		description: "التحقق من وتثبيت تحديثات البوت",
		category: "المالك",
		guide: "{pn}"
	},

	langs: {
		ar: {
			noUpdates: "✅ | أنت تستخدم أحدث نسخة من GoatBot V2 (v%1)",
			updatePrompt: "💫 | تم توفر نسخة جديدة. هل تريد التحديث؟",
			updateConfirmed: "🚀 | جاري التحديث...",
			botWillRestart: "🔄 | سيتم إعادة تشغيل البوت الآن!"
		}
	},

	onStart: async function ({ message, getLang }) {
		message.reply(getLang("noUpdates", "1.5.35"));
	}
};
