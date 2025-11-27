module.exports = {
	config: {
		name: "ترتيب_المساعدة",
		aliases: ["sorthelp", "ترتيب"],
		version: "1.2",
		author: "Yamada KJ",
		countDown: 5,
		role: 0,
		description: "ترتيب قائمة المساعدة",
		category: "معلومات",
		guide: "{pn} [name | category]"
	},

	langs: {
		ar: {
			savedName: "تم حفظ إعداد ترتيب قائمة المساعدة بالترتيب الأبجدي",
			savedCategory: "تم حفظ إعداد ترتيب قائمة المساعدة حسب الفئة"
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang }) {
		if (args[0] == "name") {
			await threadsData.set(event.threadID, "name", "settings.sortHelp");
			message.reply(getLang("savedName"));
		}
		else if (args[0] == "category") {
			threadsData.set(event.threadID, "category", "settings.sortHelp");
			message.reply(getLang("savedCategory"));
		}
		else
			message.SyntaxError();
	}
};
