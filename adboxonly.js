module.exports = {
	config: {
		name: "مشرفين_المجموعة_فقط",
		aliases: ["onlyadbox", "adboxonly", "adminboxonly", "onlyadminbox"],
		version: "1.3",
		author: "Yamada KJ",
		countDown: 5,
		role: 1,
		description: "تشغيل/إيقاف وضع السماح لمشرفي المجموعة فقط باستخدام البوت",
		category: "المحادثة",
		guide: "{pn} [on | off]: تشغيل/إيقاف وضع السماح لمشرفي المجموعة فقط باستخدام البوت\n{pn} noti [on | off]: تشغيل/إيقاف الإشعار عندما يستخدم غير المشرف البوت"
	},

	langs: {
		ar: {
			turnedOn: "✅ تم تشغيل وضع السماح لمشرفي المجموعة فقط باستخدام البوت",
			turnedOff: "❌ تم إيقاف وضع السماح لمشرفي المجموعة فقط باستخدام البوت",
			turnedOnNoti: "🔔 تم تشغيل الإشعار عندما يستخدم غير مشرف المجموعة البوت",
			turnedOffNoti: "🔕 تم إيقاف الإشعار عندما يستخدم غير مشرف المجموعة البوت",
			syntaxError: "⚠️ خطأ في الصيغة، استخدم فقط {pn} on أو {pn} off"
		}
	},

	onStart: async function ({ args, message, event, threadsData, getLang }) {
		let isSetNoti = false;
		let value;
		let keySetData = "data.onlyAdminBox";
		let indexGetVal = 0;

		if (args[0] == "noti") {
			isSetNoti = true;
			indexGetVal = 1;
			keySetData = "data.hideNotiMessageOnlyAdminBox";
		}

		if (args[indexGetVal] == "on")
			value = true;
		else if (args[indexGetVal] == "off")
			value = false;
		else
			return message.reply(getLang("syntaxError"));

		await threadsData.set(event.threadID, isSetNoti ? !value : value, keySetData);

		if (isSetNoti)
			return message.reply(value ? getLang("turnedOnNoti") : getLang("turnedOffNoti"));
		else
			return message.reply(value ? getLang("turnedOn") : getLang("turnedOff"));
	}
};
