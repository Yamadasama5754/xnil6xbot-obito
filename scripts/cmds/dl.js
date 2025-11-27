const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
	config: {
		name: "تحميل",
		aliases: ["dl", "بث"],
		version: "1.0",
		author: "Yamada KJ",
		countDown: 5,
		role: 0,
		description: "تحميل الوسائط من رابط مباشر",
		category: "ميديا",
		guide: "{pn} <رابط_الوسائط>"
	},

	langs: {
		ar: {
			invalidUrl: "❌ يرجى تقديم رابط وسائط صالح.\nمثال: {pn} https://example.com/image.jpg",
			unsupportedType: "❌ نوع وسائط غير مدعوم. يُسمح فقط بروابط الصور أو الفيديو المباشرة.",
			streaming: "🔗 جاري تحميل الميديا...",
			success: "✅ تم تحميل الميديا بنجاح!",
			failed: "❌ فشل في تحميل الوسائط. قد يكون الرابط غير صالح أو محظور."
		}
	},

	onStart: async function ({ api, event, args, getLang }) {
		const url = args[0];

		if (!url || !/^https?:\/\//.test(url)) {
			return api.sendMessage(getLang("invalidUrl"), event.threadID, event.messageID);
		}

		try {
			// Send waiting message
			const waitMsg = await api.sendMessage(getLang("streaming"), event.threadID);

			// Download media with proper headers
			const response = await axios.get(url, {
				responseType: "arraybuffer",
				timeout: 30000,
				headers: {
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
				}
			});

			const buffer = Buffer.from(response.data, "binary");
			const contentType = response.headers["content-type"] || "";

			// Check if it's a valid media type
			if (!contentType.includes("image") && !contentType.includes("video")) {
				api.unsendMessage(waitMsg.messageID);
				return api.sendMessage(getLang("unsupportedType"), event.threadID, event.messageID);
			}

			// Get file extension
			let ext = ".bin";
			if (contentType.includes("image/jpeg") || url.includes(".jpg")) ext = ".jpg";
			else if (contentType.includes("image/png") || url.includes(".png")) ext = ".png";
			else if (contentType.includes("image/gif") || url.includes(".gif")) ext = ".gif";
			else if (contentType.includes("image/webp") || url.includes(".webp")) ext = ".webp";
			else if (contentType.includes("video/mp4") || url.includes(".mp4")) ext = ".mp4";
			else if (contentType.includes("video/quicktime") || url.includes(".mov")) ext = ".mov";

			// Save file temporarily
			const fileName = `media-${event.senderID}-${Date.now()}${ext}`;
			const filePath = `${__dirname}/cache/${fileName}`;
			fs.ensureDirSync(`${__dirname}/cache`);
			fs.writeFileSync(filePath, buffer);

			// Send media
			await api.sendMessage({
				body: getLang("success"),
				attachment: fs.createReadStream(filePath)
			}, event.threadID, () => {
				try {
					fs.unlinkSync(filePath);
				} catch (e) { }
			}, event.messageID);

			// Remove wait message
			api.unsendMessage(waitMsg.messageID);

		} catch (error) {
			console.error("Error in dl command:", error.message);
			api.sendMessage(getLang("failed"), event.threadID, event.messageID);
		}
	}
};
