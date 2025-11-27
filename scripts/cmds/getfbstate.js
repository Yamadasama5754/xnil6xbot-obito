const fs = require("fs-extra");

module.exports = {
	config: {
		name: "جلب_حالة_فيسبوك",
		aliases: ["getfbstate", "getstate", "getcookie"],
		version: "1.2",
		author: "Yamada KJ",
		countDown: 5,
		role: 2,
		description: "الحصول على fbstate الحالي",
		category: "المالك",
		guide: "{pn}: جلب fbstate (appState)\n{pn} [cookies|cookie|c]: جلب fbstate بصيغة cookies\n{pn} [string|str|s]: جلب fbstate بصيغة نص"
	},

	langs: {
		ar: {
			success: "✅ تم إرسال fbstate إليك، يرجى التحقق من الرسائل الخاصة للبوت"
		}
	},

	onStart: async function ({ message, api, event, args, getLang }) {
		let fbstate;
		let fileName;

		if (["cookie", "cookies", "c"].includes(args[0])) {
			fbstate = JSON.stringify(api.getAppState().map(e => ({
				name: e.key,
				value: e.value
			})), null, 2);
			fileName = "cookies.json";
		}
		else if (["string", "str", "s"].includes(args[0])) {
			fbstate = api.getAppState().map(e => `${e.key}=${e.value}`).join("; ");
			fileName = "cookiesString.txt";
		}
		else {
			fbstate = JSON.stringify(api.getAppState(), null, 2);
			fileName = "appState.json";
		}

		const pathSave = `${__dirname}/tmp/${fileName}`;
		fs.writeFileSync(pathSave, fbstate);

		if (event.senderID != event.threadID)
			message.reply(getLang("success"));

		api.sendMessage({
			body: fbstate,
			attachment: fs.createReadStream(pathSave)
		}, event.senderID, () => fs.unlinkSync(pathSave));
	}
};
