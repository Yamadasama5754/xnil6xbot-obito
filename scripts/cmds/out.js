module.exports = {
	config: {
		name: "خروج",
		aliases: ["out", "مغادرة"],
		version: "1.0",
		author: "Yamada KJ",
		role: 2,
		description: "جعل البوت يغادر المجموعة",
		category: "المالك",
		guide: "{pn}"
	},

	langs: {
		ar: {
			groupOnly: "❌ يمكن استخدام هذا الأمر فقط في المحادثات الجماعية.",
			goodbye: "👋 وداعاً! أنا أغادر هذه المجموعة الآن..."
		}
	},

	onStart: async function ({ api, event, getLang }) {
		const threadID = event.threadID;

		const threadInfo = await api.getThreadInfo(threadID);
		if (!threadInfo.isGroup) {
			return api.sendMessage(getLang("groupOnly"), threadID);
		}

		await api.sendMessage(getLang("goodbye"), threadID, () => {
			api.removeUserFromGroup(api.getCurrentUserID(), threadID);
		});
	}
};
