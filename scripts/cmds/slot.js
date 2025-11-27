module.exports = {
	config: {
		name: "سلوت",
		aliases: ["slots", "slot", "spin"],
		version: "1.3",
		author: "Yamada KJ",
		countDown: 3,
		role: 0,
		description: "🎰 ماكينة قمار أنيقة مع احتمالات متوازنة",
		category: "ألعاب",
		guide: "استخدم: {pn} [مبلغ الرهان]"
	},

	langs: {
		ar: {
			invalidBet: "🔴 خطأ: يرجى إدخال مبلغ رهان صالح!",
			insufficientFunds: "🔴 رصيد غير كافٍ: تحتاج {amount} إضافية للعب!",
			megaJackpot: "🔥 جائزة كبرى! ثلاثة 7️⃣!",
			maxWin: "💎 فوز أقصى",
			bonus: "🎆 مكافأة: +3% لرصيدك الكلي!",
			jackpot: "💰 جائزة كبرى! 3 رموز متطابقة!",
			bigWin: "💫 فوز كبير",
			nice: "✨ رائع! رمزان متطابقان!",
			win: "🌟 فوز",
			luckySpin: "🎯 دورة محظوظة! فوز إضافي!",
			smallWin: "🍀 فوز صغير",
			betterLuck: "💸 حظاً أوفر في المرة القادمة!",
			loss: "☠️ خسارة",
			slotMachine: "🎰 ماكينة القمار 🎰",
			result: "🎯 النتيجة",
			won: "🏆 ربحت",
			lost: "💸 خسرت",
			balance: "💰 الرصيد",
			tip: "💡 نصيحة: الرهانات الأعلى تزيد فرص الجائزة الكبرى!"
		}
	},

	onStart: async function ({ message, event, usersData, args, getLang }) {
		const bet = parseInt(args[0]) || 10;
		if (isNaN(bet) || bet <= 0) {
			return message.reply(getLang("invalidBet"));
		}

		const userData = await usersData.get(event.senderID);
		if (userData.money < bet) {
			return message.reply(getLang("insufficientFunds", bet - userData.money));
		}

		const symbols = ["🍎", "🍊", "🍋", "🍌", "🍉", "7️⃣"];
		const spin = () => symbols[Math.floor(Math.random() * symbols.length)];

		const reel1 = spin();
		const reel2 = spin();
		const reel3 = spin();

		let won = 0;
		let resultMessage = getLang("slotMachine") + "\n";
		resultMessage += `${reel1} ${reel2} ${reel3}\n\n`;
		resultMessage += getLang("result") + "\n";

		if (reel1 === reel2 && reel2 === reel3) {
			if (reel1 === "7️⃣") {
				won = bet * 100;
				resultMessage += getLang("megaJackpot");
			} else {
				won = bet * 10;
				resultMessage += getLang("jackpot");
			}
		} else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
			won = bet * 3;
			resultMessage += getLang("nice");
		} else if (Math.random() < 0.1) {
			won = bet * 2;
			resultMessage += getLang("luckySpin");
		} else {
			won = -bet;
			resultMessage += getLang("betterLuck");
		}

		const newMoney = userData.money + won;
		await usersData.set(event.senderID, { money: newMoney });

		resultMessage += "\n\n";
		resultMessage += won > 0 ? getLang("won") : getLang("lost");
		resultMessage += `: ${Math.abs(won)} 💵\n`;
		resultMessage += `${getLang("balance")}: ${newMoney} 💵\n`;
		resultMessage += getLang("tip");

		message.reply(resultMessage);
	}
};
