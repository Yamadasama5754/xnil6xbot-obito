const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
	config: {
		name: "توليد_صورة",
		aliases: ["d3", "dalle3", "دالي"],
		version: "1.0",
		author: "Yamada KJ",
		role: 2,
		usePrefix: false,
		description: "توليد صور باستخدام DALL·E 3 API",
		category: "ذكاء اصطناعي",
		guide: "{pn} <الوصف>"
	},

	langs: {
		ar: {
			providePrompt: "❌ يرجى تقديم وصف لتوليد الصورة.\nمثال: {pn} قطة ترتدي نظارات شمسية",
			generating: "🖌️ جاري توليد صورتك... يرجى الانتظار...",
			hereIsImage: "🖼️ هذه صورتك المولدة لـ: \"%1\"",
			failed: "⚠️ فشل في توليد الصورة. يرجى المحاولة لاحقاً."
		}
	},

	onStart: async function ({ api, event, args, message, getLang }) {
		try {
			const prompt = args.join(" ");

			if (!prompt) {
				return message.reply(getLang("providePrompt"));
			}

			message.reply(getLang("generating"));

			const apiUrl = `https://mjunlimited.onrender.com/gen?prompt=${encodeURIComponent(prompt)}&api_key=xnil6xxx11`;
			const response = await axios.get(apiUrl);

			const imageUrl = response.data?.original_images?.info?.imageUrl?.[0];

			if (!imageUrl) {
				throw new Error("لم يتم العثور على رابط الصورة");
			}

			const imageBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer' });
			const tempPath = path.join(__dirname, 'temp_dalle.png');
			fs.writeFileSync(tempPath, imageBuffer.data);

			message.reply({
				body: getLang("hereIsImage", prompt),
				attachment: fs.createReadStream(tempPath)
			}, () => {
				fs.unlinkSync(tempPath);
			});

		} catch (error) {
			console.error("خطأ DALL·E 3:", error);
			message.reply(getLang("failed"));
		}
	}
};
