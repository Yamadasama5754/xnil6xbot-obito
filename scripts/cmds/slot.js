module.exports = {
  config: {
    name: "slots",
    aliases: ["slot", "spin", "سلوت"],
    version: "1.3",
    author: "xnil6x",
    countDown: 3,
    role: 0,
    description: {
      en: "🎰 Ultra-stylish slot machine with balanced odds",
      ar: "🎰 ماكينة قمار أنيقة مع احتمالات متوازنة"
    },
    category: "game",
    guide: {
      en: "Use: {pn} [bet amount]",
      ar: "استخدم: {pn} [مبلغ الرهان]"
    }
  },

  langs: {
    en: {
      invalidBet: "🔴 𝗘𝗥𝗥𝗢𝗥: Please enter a valid bet amount!",
      insufficientFunds: "🔴 𝗜𝗡𝗦𝗨𝗙𝗙𝗜𝗖𝗜𝗘𝗡𝗧 𝗙𝗨𝗡𝗗𝗦: You need {amount} more to play!",
      megaJackpot: "🔥 𝗠𝗘𝗚𝗔 𝗝𝗔𝗖𝗞𝗣𝗢𝗧! 𝗧𝗥𝗜𝗣𝗟𝗘 7️⃣!",
      maxWin: "💎 𝗠𝗔𝗫 𝗪𝗜𝗡",
      bonus: "🎆 𝗕𝗢𝗡𝗨𝗦: +3% to your total balance!",
      jackpot: "💰 𝗝𝗔𝗖𝗞𝗣𝗢𝗧! 3 matching symbols!",
      bigWin: "💫 𝗕𝗜𝗚 𝗪𝗜𝗡",
      nice: "✨ 𝗡𝗜𝗖𝗘! 2 matching symbols!",
      win: "🌟 𝗪𝗜𝗡",
      luckySpin: "🎯 𝗟𝗨𝗖𝗞𝗬 𝗦𝗣𝗜𝗡! Bonus win!",
      smallWin: "🍀 𝗦𝗠𝗔𝗟𝗟 𝗪𝗜𝗡",
      betterLuck: "💸 𝗕𝗘𝗧𝗧𝗘𝗥 𝗟𝗨𝗖𝗞 𝗡𝗘𝗫𝗧 𝗧𝗜𝗠𝗘!",
      loss: "☠️ 𝗟𝗢𝗦𝗦",
      slotMachine: "🎰 𝗦𝗟𝗢𝗧 𝗠𝗔𝗖𝗛𝗜𝗡𝗘 🎰",
      result: "🎯 𝗥𝗘𝗦𝗨𝗟𝗧",
      won: "🏆 𝗪𝗢𝗡",
      lost: "💸 𝗟𝗢𝗦𝗧",
      balance: "💰 𝗕𝗔𝗟𝗔𝗡𝗖𝗘",
      tip: "💡 𝗧𝗜𝗣: Higher bets increase jackpot chances!"
    },
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

  onStart: async function ({ message, event, args, usersData, getLang }) {
    const { senderID } = event;
    const bet = parseInt(args[0]);

    const formatMoney = (amount) => {
      if (isNaN(amount)) return "💲0";
      amount = Number(amount);
      const scales = [
        { value: 1e15, suffix: 'Q', color: '🌈' },
        { value: 1e12, suffix: 'T', color: '✨' },
        { value: 1e9, suffix: 'B', color: '💎' },
        { value: 1e6, suffix: 'M', color: '💰' },
        { value: 1e3, suffix: 'k', color: '💵' }
      ];
      const scale = scales.find(s => amount >= s.value);
      if (scale) {
        const scaledValue = amount / scale.value;
        return `${scale.color}${scaledValue.toFixed(2)}${scale.suffix}`;
      }
      return `💲${amount.toLocaleString()}`;
    };

    if (isNaN(bet) || bet <= 0) {
      return message.reply(getLang("invalidBet"));
    }

    const user = await usersData.get(senderID);
    if (user.money < bet) {
      return message.reply(getLang("insufficientFunds").replace(/{amount}/g, formatMoney(bet - user.money)));
    }

    const symbols = [
      { emoji: "🍒", weight: 30 },
      { emoji: "🍋", weight: 25 },
      { emoji: "🍇", weight: 20 },
      { emoji: "🍉", weight: 15 },
      { emoji: "⭐", weight: 7 },
      { emoji: "7️⃣", weight: 3 }
    ];

    const roll = () => {
      const totalWeight = symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
      let random = Math.random() * totalWeight;
      for (const symbol of symbols) {
        if (random < symbol.weight) return symbol.emoji;
        random -= symbol.weight;
      }
      return symbols[0].emoji;
    };

    const slot1 = roll();
    const slot2 = roll();
    const slot3 = roll();

    let winnings = 0;
    let outcome;
    let winType = "";
    let bonus = "";

    if (slot1 === "7️⃣" && slot2 === "7️⃣" && slot3 === "7️⃣") {
      winnings = bet * 10;
      outcome = getLang("megaJackpot");
      winType = getLang("maxWin");
      bonus = getLang("bonus");
      await usersData.set(senderID, { money: user.money * 1.03 });
    } 
    else if (slot1 === slot2 && slot2 === slot3) {
      winnings = bet * 5;
      outcome = getLang("jackpot");
      winType = getLang("bigWin");
    } 
    else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
      winnings = bet * 2;
      outcome = getLang("nice");
      winType = getLang("win");
    } 
    else if (Math.random() < 0.5) {
      winnings = bet * 1.5;
      outcome = getLang("luckySpin");
      winType = getLang("smallWin");
    } 
    else {
      winnings = -bet;
      outcome = getLang("betterLuck");
      winType = getLang("loss");
    }

    await usersData.set(senderID, { money: user.money + winnings });
    const finalBalance = user.money + winnings;

    const slotBox = 
      "╔═════════════════════╗\n" +
      `║  ${getLang("slotMachine")}  ║\n` +
      "╠═════════════════════╣\n" +
      `║     [ ${slot1} | ${slot2} | ${slot3} ]     ║\n` +
      "╚═════════════════════╝";

    const resultColor = winnings >= 0 ? "🟢" : "🔴";
    const resultText = winnings >= 0 ? `${getLang("won")}: ${formatMoney(winnings)}` : `${getLang("lost")}: ${formatMoney(bet)}`;

    const messageContent = 
      `${slotBox}\n\n` +
      `${getLang("result")}: ${outcome}\n` +
      `${winType ? `${winType}\n` : ""}` +
      `${bonus ? `${bonus}\n` : ""}` +
      `\n${resultColor} ${resultText}` +
      `\n${getLang("balance")}: ${formatMoney(finalBalance)}` +
      `\n\n${getLang("tip")}`;

    return message.reply(messageContent);
  }
};
