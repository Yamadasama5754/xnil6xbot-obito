module.exports = {
	config: {
		name: "معرف",
		aliases: ["tid", "threadid", "الآيدي"],
		version: "1.2",
		author: "Yamada KJ",
		countDown: 5,
		role: 0,
		description: "عرض معرف المحادثة الجماعية",
		category: "معلومات",
		guide: "{pn}"
	},

	langs: {
		ar: {
			threadID: "معرف المحادثة: {id}"
		}
	},

	onStart: async function ({ message, event }) {
		message.reply(event.threadID.toString());
	}
};
