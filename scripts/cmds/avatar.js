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
			initImage: "⏳ جاري تهيئة الأفاتار، يرجى الانتظار...",
			invalidCharacter: "⚠️ حالياً هناك %1 شخصية فقط على النظام، يرجى إدخال معرف شخصية أقل",
			notFoundCharacter: "❌ لم يتم العثور على شخصية تحمل اسم %1 في قائمة الشخصيات",
			errorGetCharacter: "❌ حدث خطأ أثناء جلب الشخصيات: %1",
			success: "✅ أفاتارك\n🎨 الشخصية: %1\n🔢 المعرف: %2\n📝 الخلفية: %3\n✍️ التوقيع: %4\n🎨 اللون: %5",
			defaultColor: "الافتراضي",
			error: "❌ حدث خطأ في إنشاء الأفاتار: %1",
			apiError: "❌ خدمة الأفاتار غير متاحة حالياً، يرجى المحاولة لاحقاً"
		}
	},

	onStart: async function ({ args, message, getLang }) {
		const content = args.join(" ").split("|").map(item => item.trim());
		let idNhanVat, tenNhanvat;
		const chu_Nen = content[1] || "";
		const chu_Ky = content[2] || "";
		const colorBg = content[3] || "";

		if (!args[0])
			return message.SyntaxError();

		message.reply(getLang("initImage"));

		try {
			// Get list of characters
			const charResponse = await axios.get("https://goatbotserver.onrender.com/taoanhdep/listavataranime?apikey=ntkhang", {
				timeout: 10000
			});

			const dataChracter = charResponse.data?.data;
			if (!dataChracter || dataChracter.length === 0)
				return message.reply(getLang("apiError"));

			// Find character by ID or name
			if (!isNaN(content[0])) {
				idNhanVat = parseInt(content[0]);
				const totalCharacter = dataChracter.length - 1;
				if (idNhanVat > totalCharacter)
					return message.reply(getLang("invalidCharacter", totalCharacter));
				tenNhanvat = dataChracter[idNhanVat]?.name || "Unknown";
			}
			else {
				const findChracter = dataChracter.find(item => item.name?.toLowerCase() === content[0]?.toLowerCase());
				if (findChracter) {
					idNhanVat = findChracter.stt;
					tenNhanvat = findChracter.name;
				}
				else
					return message.reply(getLang("notFoundCharacter", content[0]));
			}

			// Create avatar
			const endpoint = `https://goatbotserver.onrender.com/taoanhdep/avataranime`;
			const params = {
				id: idNhanVat,
				chu_Nen: chu_Nen || "Goat Bot",
				chu_Ky: chu_Ky || "V2",
				apikey: "ntkhangGoatBot"
			};

			if (colorBg)
				params.colorBg = colorBg;

			try {
				const avatarImage = await getStreamFromURL(endpoint, "avatar.png", { params });
				message.reply({
					body: getLang("success", tenNhanvat, idNhanVat, chu_Nen || "ملخصة", chu_Ky || "الوصف", colorBg || getLang("defaultColor")),
					attachment: avatarImage
				});
			} catch (error) {
				console.error("Avatar generation error:", error.message);
				message.reply(getLang("error", "فشل إنشاء الصورة"));
			}

		} catch (error) {
			console.error("Avatar command error:", error.message);
			if (error.code === "ECONNABORTED" || error.code === "ENOTFOUND")
				return message.reply(getLang("apiError"));
			else
				return message.reply(getLang("errorGetCharacter", error.message));
		}
	}
};
