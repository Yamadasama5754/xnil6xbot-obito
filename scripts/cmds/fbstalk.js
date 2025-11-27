const axios = require('axios');

module.exports = {
	config: {
		name: "معلومات_فيسبوك",
		aliases: ["fbstalk", "fbinfo", "تتبع_فيسبوك"],
		version: "3.0",
		author: "Yamada KJ",
		role: 0,
		description: "البحث المتقدم عن ملف فيسبوك الشخصي",
		category: "أدوات",
		guide: "{pn} [uid/رابط/إشارة/رد]"
	},

	langs: {
		ar: {
			fetching: "🔍 جاري جلب معلومات الملف الشخصي...",
			invalidInput: "❌ إدخال غير صالح. يرجى تقديم UID أو رابط الملف الشخصي أو الإشارة أو الرد على رسالة.",
			fetchFailed: "❌ فشل في جلب بيانات المستخدم أو الملف الشخصي خاص",
			profileInfo: "🌟 معلومات الملف الشخصي الكاملة\n━━━━━━━━━━━━━━━━━━━━━",
			error: "⚠️ حدث خطأ. يرجى المحاولة لاحقاً."
		}
	},

	onStart: async function ({ message, api, event, args, getLang }) {
		try {
			const apiKey = "xnil69x";

			const formatInfo = (label, value) => {
				if (!value || value === "not available") return "";
				return `🔹 ${label}: ${value}\n`;
			};

			const formatArrayInfo = (label, array) => {
				if (!Array.isArray(array) || array.length === 0) return "";
				const items = array.map(item => item.name || item).join(', ');
				return `🔹 ${label}: ${items}\n`;
			};

			const getUID = async (input) => {
				if (/^\d+$/.test(input)) return input;

				if (input.includes("facebook.com")) {
					const username = input.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/([^\/]+)/)?.[1];
					if (username) {
						const res = await axios.get(`https://xnilapi-glvi.onrender.com/xnil/fbstalk?username=${username}&key=${apiKey}`);
						return res.data.success ? res.data.id : null;
					}
				}

				if (input.startsWith("@")) {
					const mention = Object.entries(event.mentions).find(([_, name]) => name === input.slice(1));
					return mention ? mention[0] : null;
				}

				return null;
			};

			let targetUID;

			if (event.messageReply) {
				targetUID = event.messageReply.senderID;
			} else if (!args[0]) {
				targetUID = event.senderID;
			} else {
				targetUID = await getUID(args[0]);
			}

			if (!targetUID) {
				return message.reply(getLang("invalidInput"));
			}

			api.sendMessage(getLang("fetching"), event.threadID);

			const response = await axios.get(`https://xnilapi-glvi.onrender.com/xnil/fbstalk?uid=${targetUID}&key=${apiKey}`);
			const user = response.data;

			if (!user.success) {
				return api.sendMessage(getLang("fetchFailed"), event.threadID);
			}

			let formattedInfo = getLang("profileInfo") + "\n";

			formattedInfo += formatInfo("🆔 معرف المستخدم", user.id);
			formattedInfo += formatInfo("👤 الاسم", user.name);
			formattedInfo += formatInfo("📛 الاسم الكامل", 
				[user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' '));
			formattedInfo += formatInfo("🔗 اسم المستخدم", user.username);
			formattedInfo += formatInfo("🌐 رابط الملف الشخصي", user.link);

			formattedInfo += formatInfo("📝 نبذة", user.about);
			formattedInfo += formatInfo("🎂 تاريخ الميلاد", user.birthday);
			formattedInfo += formatInfo("👫 الجنس", user.gender);
			formattedInfo += formatInfo("💑 الحالة الاجتماعية", user.relationship_status);
			formattedInfo += formatInfo("📍 الموقع", user.location);
			formattedInfo += formatInfo("🛕 الديانة", user.religion);
			formattedInfo += formatInfo("🏠 مسقط الرأس", user.hometown);

			if (user.highSchoolName || user.collegeName) {
				formattedInfo += `📚 التعليم:\n`;
				formattedInfo += formatInfo("🏫 الثانوية", user.highSchoolName);
				formattedInfo += formatInfo("🎓 الجامعة", user.collegeName);
			}

			formattedInfo += formatArrayInfo("🗣️ اللغات", user.languages);
			formattedInfo += formatArrayInfo("⚽ الرياضات", user.sports);
			formattedInfo += formatArrayInfo("🏆 الفرق المفضلة", user.favorite_teams);
			formattedInfo += formatArrayInfo("🏅 الرياضيين المفضلين", user.favorite_athletes);

			formattedInfo += formatInfo("👥 المتابعون", user.follower);
			formattedInfo += formatInfo("📅 تاريخ إنشاء الحساب", 
				user.created_time ? new Date(user.created_time).toLocaleString('ar-EG') : null);
			formattedInfo += formatInfo("🔄 آخر تحديث", 
				user.updated_time ? new Date(user.updated_time).toLocaleString('ar-EG') : null);

			formattedInfo += `━━━━━━━━━━━━━━━━━━━━━`;

			const attachments = [];
			
			if (user.picture) {
				try {
					const profilePic = await global.utils.getStreamFromURL(user.picture);
					attachments.push(profilePic);
				} catch (e) {
					console.error("فشل في جلب صورة الملف الشخصي:", e);
				}
			}

			if (user.cover) {
				try {
					const coverPhoto = await global.utils.getStreamFromURL(user.cover);
					attachments.push(coverPhoto);
				} catch (e) {
					console.error("فشل في جلب صورة الغلاف:", e);
				}
			}

			await api.sendMessage({
				body: formattedInfo,
				attachment: attachments
			}, event.threadID);

		} catch (error) {
			console.error("خطأ FBStalk:", error);
			api.sendMessage(getLang("error"), event.threadID);
		}
	}
};
