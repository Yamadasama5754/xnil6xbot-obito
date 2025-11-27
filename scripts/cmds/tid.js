module.exports = {
	config: {
		name: "tid",
		version: "1.2",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: {
			vi: "Xem id nhóm chat của bạn",
			en: "View threadID of your group chat",
			ar: "أمر",
			ar: "عرض معرف المحادثة الجماعية"
		},
		category: "info",
		guide: {
			en: "{pn}",
			ar: "{pn}",
			ar: "{pn}"
		}
	},

	langs: {
		en: {
			threadID: "Thread ID: {id},
		ar: {}"
		},
		ar: {
			threadID: "معرف المحادثة: {id}"
		}
	},

	onStart: async function ({ message, event }) {
		message.reply(event.threadID.toString());
	}
};
