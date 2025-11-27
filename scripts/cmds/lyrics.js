const axios = require("axios");

const baseApiUrl = async () => {
	const base = await axios.get(
		`https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`,
	);
	return base.data.api;
};

module.exports = {
	config: {
		name: "كلمات_أغنية",
		aliases: ["lyrics", "اغنية"],
		version: "1.0",
		author: "Yamada KJ",
		countDown: 5,
		role: 0,
		description: "الحصول على كلمات الأغاني مع صورها",
		category: "موسيقى",
		guide: "{pn} <اسم الأغنية>"
	},

	langs: {
		ar: {
			noSongName: "يرجى تقديم اسم الأغنية!",
			error: "حدث خطأ أثناء جلب كلمات الأغنية!",
			title: "عنوان الأغنية",
			artist: "الفنان",
			songLyrics: "كلمات الأغنية"
		}
	},

	onStart: async ({ api, event, args, getLang }) => {
		try {
			const Songs = args.join(' ');
			if (!Songs) {
				return api.sendMessage(getLang("noSongName"), event.threadID, event.messageID);
			}

			const res = await axios.get(`${await baseApiUrl()}/lyrics2?songName=${encodeURIComponent(Songs)}`);
			const data = res.data;
			if (!data.title || !data.artist || !data.lyrics) {
				return api.sendMessage(getLang("error"), event.threadID, event.messageID);
			}

			const songMessage = {
				body: `❏♡${getLang("title")}: ${data.title}\n\n❏♡${getLang("artist")}: ${data.artist}\n\n❏♡${getLang("songLyrics")}:\n\n${data.lyrics}`
			};

			if (data.image) {
				const stream = await axios.get(data.image, { responseType: 'stream' });
				songMessage.attachment = stream.data;
			}

			return api.sendMessage(songMessage, event.threadID, event.messageID);
		} catch (error) {
			api.sendMessage("خطأ: " + error.message, event.threadID, event.messageID);
		}
	}
};
