const axios = require('axios');
const { getStreamFromURL } = global.utils;

module.exports = {
	config: {
		name: "افاتار",
		aliases: ["avatar", "صورة_رمزية"],
		author: "Yamada KJ",
		version: "1.6",
		cooldowns: 5,
		role: 0,
		description: "إنشاء أفاتار أنمي مع التوقيع",
		category: "صور",
		guide: "{pn} <معرّف الشخصية أو اسم الشخصية> | <نص الخلفية> | <التوقيع> | <اسم اللون أو رمز اللون>\n{pn} help: اعرض كيفية استخدام هذا الأمر"
	},

	langs: {
		ar: {
			initImage: "⏳ جاري تهيئة الصورة، يرجى الانتظار...",
			invalidCharacter: "⚠️ حالياً هناك %1 شخصية فقط على النظام، يرجى إدخال معرف شخصية أقل",
			notFoundCharacter: "❌ لم يتم العثور على شخصية تحمل اسم %1 في قائمة الشخصيات",
			errorGetCharacter: "❌ حدث خطأ أثناء الحصول على بيانات الشخصية:\n%1: %2",
			success: "✅ أفاتارك\nالشخصية: %1\nالمعرف: %2\nنص الخلفية: %3\nالتوقيع: %4\nاللون: %5",
			defaultColor: "الافتراضي",
			error: "❌ حدث خطأ\n%1: %2"
		}
	},

	onStart: async function ({ args, message, getLang }) {
		const content = args.join(" ").split("|").map(item => item = item.trim());
		let idNhanVat, tenNhanvat;
		const chu_Nen = content[1];
		const chu_Ky = content[2];
		const colorBg = content[3];
		if (!args[0])
			return message.SyntaxError();
		message.reply(getLang("initImage"));
		try {
			const dataChracter = (await axios.get("https://goatbotserver.onrender.com/taoanhdep/listavataranime?apikey=ntkhang")).data.data;
			if (!isNaN(content[0])) {
				idNhanVat = parseInt(content[0]);
				const totalCharacter = dataChracter.length - 1;
				if (idNhanVat > totalCharacter)
					return message.reply(getLang("invalidCharacter", totalCharacter));
				tenNhanvat = dataChracter[idNhanVat].name;
			}
			else {
				const findChracter = dataChracter.find(item => item.name.toLowerCase() == content[0].toLowerCase());
				if (findChracter) {
					idNhanVat = findChracter.stt;
					tenNhanvat = content[0];
				}
				else
					return message.reply(getLang("notFoundCharacter", content[0]));
			}
		}
		catch (error) {
			const err = error.response.data;
			return message.reply(getLang("errorGetCharacter", err.error, err.message));
		}

		const endpoint = `https://goatbotserver.onrender.com/taoanhdep/avataranime`;
		const params = {
			id: idNhanVat,
			chu_Nen,
			chu_Ky,
			apikey: "ntkhangGoatBot"
		};
		if (colorBg)
			params.colorBg = colorBg;

		try {
			const avatarImage = await getStreamFromURL(endpoint, "avatar.png", { params });
			message.reply({
				body: getLang("success", tenNhanvat, idNhanVat, chu_Nen, chu_Ky, colorBg || getLang("defaultColor")),
				attachment: avatarImage
			});
		}
		catch (error) {
			error.response.data.on("data", function (e) {
				const err = JSON.parse(e);
				message.reply(getLang("error", err.error, err.message));
			});
		}
	}
};
