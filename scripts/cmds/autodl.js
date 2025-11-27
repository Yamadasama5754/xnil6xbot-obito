const axios = require("axios");
const fs = require("fs-extra");
const tinyurl = require("tinyurl");

const baseApiUrl = async () => {
	const base = await axios.get("https://raw.githubusercontent.com/xnil6x404/Api-Zone/refs/heads/main/Api.json");
	return base.data.xnil2;
};

const config = {
	name: "تحميل_تلقائي",
	aliases: ["autodl"],
	version: "3.0",
	author: "Yamada KJ",
	description: "تحميل تلقائي للفيديوهات والصور من تيك توك، يوتيوب، فيسبوك، انستغرام والمزيد",
	category: "ميديا",
	usePrefix: true,
	dependencies: {
		"tinyurl": "",
		"fs-extra": ""
	}
};

const langs = {
	ar: {
		fetching: "⏳ جاري جلب الميديا...\nيرجى الانتظار!",
		unableToRetrieve: "❌ غير قادر على استرداد الميديا. يرجى التحقق من الرابط أو المحاولة لاحقاً.",
		mediaDownloaded: "╭━━━[ ✅ تم تحميل الميديا ]━━━╮\n┃ %1 النوع: %2\n┃ ⚡ السرعة: %3 ثانية\n┃ 🔗 الرابط: %4\n╰━━━━━━━━━━━━━━━━━━━━━━╯\nاستمتع بـ%5! صنع بـ ❤️",
		video: "🎬 فيديو",
		photo: "🖼️ صورة",
		error: "❌ عذراً! حدث خطأ ما.\n━━━━━━━━━━━━━━━\n• الخطأ: %1\n• حاول مرة أخرى لاحقاً أو تحقق من الرابط.\n━━━━━━━━━━━━━━━"
	}
};

const onStart = () => {};

const onChat = async ({ api, event, getLang }) => {
	const body = event.body?.trim();
	if (!body) return;

	const supportedSites = [
		"https://vt.tiktok.com", "https://www.tiktok.com/", "https://vm.tiktok.com",
		"https://www.facebook.com", "https://fb.watch",
		"https://www.instagram.com/", "https://www.instagram.com/p/",
		"https://youtu.be/", "https://www.youtube.com/", "https://youtube.com/watch",
		"https://x.com/", "https://twitter.com/", "https://pin.it/"
	];

	if (!supportedSites.some(site => body.includes(site))) return;

	const startTime = Date.now();
	const waitMsg = await api.sendMessage(langs.ar.fetching, event.threadID);

	try {
		const apiUrl = `${await baseApiUrl()}/alldl?url=${encodeURIComponent(body)}`;
		const { data } = await axios.get(apiUrl);
		const content = data?.content;

		const mediaLink = content?.result || content?.url;
		if (!mediaLink) {
			return api.sendMessage(langs.ar.unableToRetrieve, event.threadID, event.messageID);
		}

		let extension = ".mp4";
		let mediaIcon = "🎬";
		let mediaLabel = "فيديو";

		if (mediaLink.includes(".jpg") || mediaLink.includes(".jpeg")) {
			extension = ".jpg";
			mediaIcon = "🖼️";
			mediaLabel = "صورة";
		} else if (mediaLink.includes(".png")) {
			extension = ".png";
			mediaIcon = "🖼️";
			mediaLabel = "صورة";
		}

		const fileName = `media-${event.senderID}-${Date.now()}${extension}`;
		const filePath = `${__dirname}/cache/${fileName}`;
		fs.ensureDirSync(`${__dirname}/cache`);

		const buffer = await axios.get(mediaLink, { responseType: "arraybuffer" }).then(res => res.data);
		fs.writeFileSync(filePath, Buffer.from(buffer, "binary"));

		const shortUrl = await tinyurl.shorten(mediaLink);
		const duration = ((Date.now() - startTime) / 1000).toFixed(2);

		api.unsendMessage(waitMsg.messageID);

		const stylishMessage = `
╭━━━[ ✅ تم تحميل الميديا ]━━━╮
┃ ${mediaIcon} النوع: ${mediaLabel}
┃ ⚡ السرعة: ${duration} ثانية
┃ 🔗 الرابط: ${shortUrl}
╰━━━━━━━━━━━━━━━━━━━━━━╯
استمتع بالـ${mediaLabel}! صنع بـ ❤️ بواسطة Yamada KJ
`;

		await api.sendMessage(
			{
				body: stylishMessage,
				attachment: fs.createReadStream(filePath)
			},
			event.threadID,
			() => fs.unlinkSync(filePath),
			event.messageID
		);

	} catch (err) {
		console.error("[autodl] خطأ:", err);
		api.setMessageReaction("❌", event.messageID, true);

		const errorMsg = `
❌ عذراً! حدث خطأ ما.
━━━━━━━━━━━━━━━
• الخطأ: ${err.message}
• حاول مرة أخرى لاحقاً أو تحقق من الرابط.
━━━━━━━━━━━━━━━`;

		api.sendMessage(errorMsg, event.threadID, event.messageID);
	}
};

module.exports = {
	config,
	langs,
	onStart,
	onChat,
	run: onStart,
	handleEvent: onChat
};
