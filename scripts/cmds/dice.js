module.exports = {
	config: {
		name: "نرد",
		aliases: ["dice", "زهر"],
		version: "1.7",
		author: "Yamada KJ",
		description: "🎲 لعبة النرد | راهن واربح العملات!",
		category: "ألعاب",
		guide: "{pn} <مبلغ الرهان>\nمثال: {pn} 1000"
	},

	langs: {
		ar: {
			accountIssue: "❌ مشكلة في الحساب! يرجى المحاولة لاحقاً.",
			invalidUsage: "⚠️ استخدام غير صحيح!\nاستخدم مثل: {pn} <مبلغ الرهان>\nمثال: {pn} 1000",
			insufficientBalance: "❌ لديك فقط %1 عملة!",
			diceRolled: "🎲 النرد: %1\n",
			youLost: "❌ خسرت!\nخسارة: %1 عملة",
			youWonDouble: "✅ فزت بضعف!\nفوز: +%1 عملة",
			youWonTriple: "✅ فزت بثلاثة أضعاف!\nفوز: +%1 عملة",
			jackpot: "🎉 جائزة كبرى! رمية 6\nفوز: +%1 عملة"
		}
	},

	onStart: async function ({ api, event, args, usersData, getLang }) {
		const { senderID, threadID } = event;
		const userData = await usersData.get(senderID);

		if (!userData || userData.money === undefined) {
			return api.sendMessage(getLang("accountIssue"), threadID);
		}

		const betAmount = parseInt(args[0]);

		if (isNaN(betAmount) || betAmount <= 0) {
			return api.sendMessage(getLang("invalidUsage"), threadID);
		}

		if (betAmount > userData.money) {
			return api.sendMessage(getLang("insufficientBalance", formatMoney(userData.money)), threadID);
		}

		const diceRoll = Math.floor(Math.random() * 6) + 1;
		let resultMessage = getLang("diceRolled", diceRoll);
		let winAmount = 0;

		switch (diceRoll) {
			case 1:
			case 2:
				winAmount = -betAmount;
				resultMessage += getLang("youLost", formatMoney(betAmount));
				break;
			case 3:
				winAmount = betAmount * 2;
				resultMessage += getLang("youWonDouble", formatMoney(winAmount));
				break;
			case 4:
			case 5:
				winAmount = betAmount * 3;
				resultMessage += getLang("youWonTriple", formatMoney(winAmount));
				break;
			case 6:
				winAmount = betAmount * 10;
				resultMessage += getLang("jackpot", formatMoney(winAmount));
				break;
		}

		await usersData.set(senderID, {
			money: userData.money + winAmount
		});

		return api.sendMessage(resultMessage, threadID);
	}
};

function formatMoney(num) {
	if (num >= 1e15) return (num / 1e15).toFixed(2).replace(/\.00$/, "") + " كوادريليون";
	if (num >= 1e12) return (num / 1e12).toFixed(2).replace(/\.00$/, "") + " تريليون";
	if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, "") + " مليار";
	if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, "") + " مليون";
	if (num >= 1e3) return (num / 1e3).toFixed(2).replace(/\.00$/, "") + " ألف";
	return num.toString();
}
