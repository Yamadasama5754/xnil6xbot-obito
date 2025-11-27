const fs = require('fs');
const path = require('path');

module.exports = {
	config: {
		name: "ملف",
		aliases: ["file", "ارسال_ملف"],
		version: "1.0",
		author: "Yamada KJ",
		countDown: 5,
		role: 2,
		description: "إرسال ملف من البوت",
		category: "المالك",
		guide: "{pn} <مسار الملف>\nمثال: {pn} scripts/cmds/curl.js"
	},

	langs: {
		ar: {
			noPermission: "⚠️ ليس لديك صلاحية استخدام هذا الأمر.",
			providePath: "⚠️ يرجى تقديم مسار الملف.",
			notFound: "⚠️ الملف غير موجود: %1"
		}
	},

	onStart: async function ({ message, args, api, event, getLang }) {
		const permission = ["100001986888287"];
		if (!permission.includes(event.senderID)) {
			return api.sendMessage(getLang("noPermission"), event.threadID, event.messageID);
		}

		const filePath = args.join(" ");
		if (!filePath) {
			return api.sendMessage(getLang("providePath"), event.threadID, event.messageID);
		}

		const absolutePath = path.resolve(filePath);
		if (!fs.existsSync(absolutePath)) {
			return api.sendMessage(getLang("notFound", filePath), event.threadID, event.messageID);
		}

		const fileContent = fs.readFileSync(absolutePath, 'utf8');
		api.sendMessage({ body: fileContent }, event.threadID);
	}
};
