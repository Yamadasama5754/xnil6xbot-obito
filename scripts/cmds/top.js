module.exports = {
  config: {
    name: "top",
    aliases: ["richlist", "الاغنياء"],
    version: "1.2",
    author: "xnil6x",
    description: {
      en: "💰 Top Money Leaderboard",
			ar: "💰 قائمة أغنى المستخدمين"
    },
    category: "Economy",
    guide: {
      en: "{pn} [number]",
			ar: "{pn} [رقم]"
    }
  },

  langs: {
    en: {
      noUsers: "❌ No users with money data found!",
      title: "🏆 𝗧𝗢𝗣 {count},
		ar: {} 𝗥𝗜𝗖𝗛𝗘𝗦𝗧 𝗨𝗦𝗘𝗥𝗦\n━━━━━━━━━━━━━━━━━━\n\n",
      rank: "𝗥𝗮𝗻𝗸",
      balance: "💰 𝗕𝗮𝗹𝗮𝗻𝗰𝗲",
      footer: "━━━━━━━━━━━━━━━━━━\n💡 Use {p}top 5 for top 5 or {p}top 20 for top 20",
      error: "⚠️ Failed to fetch leaderboard. Please try again later."
    },
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
        const name = user.name || "Unknown User";
        const money = formatMoney(user.money || 0);
        
        leaderboardMsg += `${getRankEmoji(rank)} ${getLang("rank")} ${rank}: ${name}\n${getLang("balance")}: ${money}\n\n`;
      });

      leaderboardMsg += getLang("footer");

      api.sendMessage(leaderboardMsg, event.threadID);

    } catch (error) {
      console.error("❌ Top Command Error:", error);
      api.sendMessage(getLang("error"), event.threadID);
    }
  }
};

function getRankEmoji(rank) {
  const emojis = ["👑","🥈","🥉","🔷","🔶","⭐","✨","▪️"];
  if (rank === 1) return emojis[0];
  if (rank === 2) return emojis[1];
  if (rank === 3) return emojis[2];
  if (rank <= 5) return emojis[3];
  if (rank <= 10) return emojis[4];
  if (rank <= 15) return emojis[5];
  return emojis[6];
}

function formatMoney(amount) {
  if (amount >= 1000000000000000) {
    return (amount / 1000000000000000).toFixed(2) + "QT";
  }
  if (amount >= 1000000000000) {
    return (amount / 1000000000000).toFixed(2) + "T";
  }
  if (amount >= 1000000000) {
    return (amount / 1000000000).toFixed(2) + "B";
  }
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(2) + "M";
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(2) + "K";
  }
  return amount.toString();
}
