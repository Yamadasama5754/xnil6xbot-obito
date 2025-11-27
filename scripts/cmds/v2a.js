const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
	config: {
		name: "فيديو_لصوت",
		aliases: ["v2a", "video2audio", "تحويل_فيديو"],
		version: "1.2",
		author: "Yamada KJ",
		countDown: 20,
		description: "تحويل الفيديو إلى صوت",
		category: "وسائط",
		guide: "{pn} - رد على رسالة فيديو"
	},

	langs: {
		ar: {
			invalidMedia: "يرجى الرد على رسالة فيديو لتحويلها إلى صوت",
			error: "حدث خطأ أثناء التحويل"
		}
	},

	onStart: async function ({ api, event, message }) {
		try {
			if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
				return message.reply("يرجى الرد على رسالة فيديو لتحويلها إلى صوت");
			}

			const attachment = event.messageReply.attachments[0];
			if (attachment.type !== "video") {
				return message.reply("يجب أن يكون المحتوى المرد عليه فيديو");
			}

			const { data } = await axios.get(attachment.url, { method: 'GET', responseType: 'arraybuffer' });
			const path = __dirname + `/cache/audio.m4a`;
			
			if (!fs.existsSync(__dirname + '/cache')) {
				fs.mkdirSync(__dirname + '/cache');
			}

			fs.writeFileSync(path, Buffer.from(data));
			const audioStream = fs.createReadStream(path);
			
			api.sendMessage({ body: "", attachment: [audioStream] }, event.threadID, event.messageID);
		} catch (e) {
			console.error(e);
			message.reply("حدث خطأ أثناء التحويل: " + e.message);
		}
	}
};
