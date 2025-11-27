module.exports = {
	config: {
		name: "الأثرياء",
		aliases: ["top", "richlist"],
		version: "1.2",
		author: "Yamada KJ",
		description: "💰 قائمة أغنى المستخدمين",
		category: "اقتصاد",
		guide: "{pn} [رقم]"
	},

	langs: {
		ar: {
			noUsers: "❌ لم يتم العثور على مستخدمين لديهم بيانات مالية!",
			title: "🏆 أغنى {count} مستخدم\n━━━━━━━━━━━━━━━━━━\n\n",
			rank: "المرتبة",
			balance: "💰 الرصيد",
			footer: "━━━━━━━━━━━━━━━━━━\n💡 استخدم {p}top 5 لأفضل 5 أو {p}top 20 لأفضل 20",
			error: "⚠️ فشل في جلب قائمة الترتيب. يرجى المحاولة لاحقاً."
		}
	},

	onStart: async function ({ api, event, usersData, args, getLang }) {
		try {
			const allUsers = await usersData.getAll();
			
			const topCount = args[0] ? Math.min(parseInt(args[0]), 20) : 10;
			
			const topUsers = allUsers
				.filter(user => user.money !== undefined)
				.sort((a, b) => b.money - a.money)
				.slice(0, topCount);

			if (topUsers.length === 0) {
				return api.sendMessage(getLang("noUsers"), event.threadID);
			}

			let leaderboardMsg = getLang("title").replace(/{count}/g, topCount);
			
			topUsers.forEach((user, index) => {
				const rank = index + 1;
				const name = user.name || "مستخدم غير معروف";
				const money = formatMoney(user.money || 0);
				
				leaderboardMsg += `${getRankEmoji(rank)} ${getLang("rank")} ${rank}: ${name}\n${getLang("balance")}: ${money}\n\n`;
			});

			leaderboardMsg += getLang("footer");

			api.sendMessage(leaderboardMsg, event.threadID);

		} catch (error) {
			console.error("❌ خطأ:", error);
			api.sendMessage(getLang("error"), event.threadID);
		}
	}
};

function getRankEmoji(rank) {
	const emojis = ["👑","🥈","🥉","🔷","🔶","⭐","✨","▪️"];
	return emojis[rank - 1] || "▪️";
}

function formatMoney(amount) {
	if (amount >= 1000000) return (amount / 1000000).toFixed(1) + "M";
	if (amount >= 1000) return (amount / 1000).toFixed(1) + "K";
	return amount.toString();
}
