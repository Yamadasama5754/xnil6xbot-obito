const fs = require("fs-extra");
const { config } = global.GoatBot;
const { client } = global;

module.exports = {
	config: {
		name: "للمشرف_فقط",
		aliases: ["adonly", "onlyad", "onlyadmin", "adminonly"],
		version: "1.5",
		author: "Yamada KJ",
		countDown: 5,
		role: 2,
		description: "تشغيل/إيقاف وضع السماح للمشرف فقط باستخدام البوت",
		category: "المالك",
		guide: "{pn} [on | off]: تشغيل/إيقاف وضع السماح للمشرف فقط باستخدام البوت\n{pn} noti [on | off]: تشغيل/إيقاف الإشعار عندما يستخدم غير المشرف البوت"
	},

	langs: {
		ar: {
			turnedOn: "✅ تم تشغيل وضع السماح للمشرف فقط باستخدام البوت",
			turnedOff: "❌ تم إيقاف وضع السماح للمشرف فقط باستخدام البوت",
			turnedOnNoti: "🔔 تم تشغيل الإشعار عندما يستخدم غير المشرف البوت",
			turnedOffNoti: "🔕 تم إيقاف الإشعار عندما يستخدم غير المشرف البوت"
		}
	},

	onStart: function ({ args, message, getLang }) {
		let isSetNoti = false;
		let value;
		let indexGetVal = 0;

		if (args[0] == "noti") {
			isSetNoti = true;
			indexGetVal = 1;
		}

		if (args[indexGetVal] == "on")
			value = true;
		else if (args[indexGetVal] == "off")
			value = false;
		else
			return message.SyntaxError();

		if (isSetNoti) {
			config.hideNotiMessage.adminOnly = !value;
			message.reply(getLang(value ? "turnedOnNoti" : "turnedOffNoti"));
		}
		else {
			config.adminOnly.enable = value;
			message.reply(getLang(value ? "turnedOn" : "turnedOff"));
		}

		fs.writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
	}
};
