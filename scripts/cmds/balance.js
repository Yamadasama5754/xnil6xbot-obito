module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "$", "cash", "رصيد"],
    version: "3.2",
    author: "xnil6x",
    countDown: 3,
    role: 0,
    description: {
      en: "💰 Premium Economy System with Stylish Display",
      ar: "💰 نظام اقتصادي متميز بعرض أنيق"
    },
    category: "economy",
    guide: {
      en: "╔════✦ Usage Guide ✦════╗\n"
        + "║ ➤ {pn} - Check your balance\n"
        + "║ ➤ {pn} @user - Check others\n"
        + "║ ➤ {pn} t @user amount - Transfer\n"
        + "║ ➤ {pn} [reply] - Check replied user's balance\n"
        + "╚══════════════════════╝",
      ar: "╔════✦ دليل الاستخدام ✦════╗\n"
        + "║ ➤ {pn} - تحقق من رصيدك\n"
        + "║ ➤ {pn} @مستخدم - تحقق من رصيد غيرك\n"
        + "║ ➤ {pn} t @مستخدم المبلغ - تحويل أموال\n"
        + "║ ➤ {pn} [رد] - تحقق من رصيد المستخدم بالرد\n"
        + "╚══════════════════════╝"
    }
  },

  langs: {
    en: {
      invalidUsage: "Invalid Usage",
      usageGuide: "Use: {prefix}balance t @user amount",
      error: "Error",
      amountPositive: "Amount must be positive.",
      cantSendSelf: "You can't send money to yourself.",
      insufficientBalance: "Insufficient Balance",
      needMore: "You need {amount} more.",
      transferComplete: "Transfer Complete",
      to: "To: {name}",
      sent: "Sent: {amount}",
      newBalance: "Your New Balance: {amount}",
      userBalance: "{name}'s Balance",
      balance: "💰 Balance: {amount}",
      userBalances: "User Balances",
      yourBalance: "Your Balance"
    },
    ar: {
      invalidUsage: "استخدام غير صحيح",
      usageGuide: "استخدم: {prefix}balance t @مستخدم المبلغ",
      error: "خطأ",
      amountPositive: "يجب أن يكون المبلغ إيجابياً.",
      cantSendSelf: "لا يمكنك إرسال أموال لنفسك.",
      insufficientBalance: "رصيد غير كافٍ",
      needMore: "تحتاج {amount} إضافية.",
      transferComplete: "تم التحويل بنجاح",
      to: "إلى: {name}",
      sent: "تم إرسال: {amount}",
      newBalance: "رصيدك الجديد: {amount}",
      userBalance: "رصيد {name}",
      balance: "💰 الرصيد: {amount}",
      userBalances: "أرصدة المستخدمين",
      yourBalance: "رصيدك"
    }
  },

  onStart: async function ({ message, event, args, usersData, prefix, getLang }) {
    const { senderID, messageReply, mentions } = event;

    const formatMoney = (amount) => {
      if (isNaN(amount)) return "$0";
      amount = Number(amount);
      const scales = [
        { value: 1e15, suffix: 'Q' },
        { value: 1e12, suffix: 'T' },
        { value: 1e9, suffix: 'B' },
        { value: 1e6, suffix: 'M' },
        { value: 1e3, suffix: 'k' }
      ];
      const scale = scales.find(s => amount >= s.value);
      if (scale) {
        const scaledValue = amount / scale.value;
        return `$${scaledValue.toFixed(1)}${scale.suffix}`;
      }
      return `$${amount.toLocaleString()}`;
    };

    const createFlatDisplay = (title, contentLines) => {
      return `✨ ${title} ✨\n` + 
        contentLines.map(line => `➤ ${line}`).join('\n') + '\n';
    };

    if (args[0]?.toLowerCase() === 't') {
      const targetID = Object.keys(mentions)[0] || messageReply?.senderID;
      const amount = parseFloat(args[args.length - 1]);

      if (!targetID || isNaN(amount)) {
        return message.reply(createFlatDisplay(getLang("invalidUsage"), [
          getLang("usageGuide").replace(/{prefix}/g, prefix)
        ]));
      }

      if (amount <= 0) return message.reply(createFlatDisplay(getLang("error"), [getLang("amountPositive")]));
      if (senderID === targetID) return message.reply(createFlatDisplay(getLang("error"), [getLang("cantSendSelf")]));

      const [sender, receiver] = await Promise.all([
        usersData.get(senderID),
        usersData.get(targetID)
      ]);

      if (sender.money < amount) {
        return message.reply(createFlatDisplay(getLang("insufficientBalance"), [
          getLang("needMore").replace(/{amount}/g, formatMoney(amount - sender.money))
        ]));
      }

      await Promise.all([
        usersData.set(senderID, { money: sender.money - amount }),
        usersData.set(targetID, { money: receiver.money + amount })
      ]);

      const receiverName = await usersData.getName(targetID);
      return message.reply(createFlatDisplay(getLang("transferComplete"), [
        getLang("to").replace(/{name}/g, receiverName),
        getLang("sent").replace(/{amount}/g, formatMoney(amount)),
        getLang("newBalance").replace(/{amount}/g, formatMoney(sender.money - amount))
      ]));
    }

    if (messageReply?.senderID && !args[0]) {
      const targetID = messageReply.senderID;
      const name = await usersData.getName(targetID);
      const money = await usersData.get(targetID, "money");
      return message.reply(createFlatDisplay(getLang("userBalance").replace(/{name}/g, name), [
        getLang("balance").replace(/{amount}/g, formatMoney(money))
      ]));
    }

    if (Object.keys(mentions).length > 0) {
      const balances = await Promise.all(
        Object.entries(mentions).map(async ([uid, name]) => {
          const money = await usersData.get(uid, "money");
          return `${name.replace('@', '')}: ${formatMoney(money)}`;
        })
      );
      return message.reply(createFlatDisplay(getLang("userBalances"), balances));
    }

    const userMoney = await usersData.get(senderID, "money");
    return message.reply(createFlatDisplay(getLang("yourBalance"), [
      `💵 ${formatMoney(userMoney)}`,
    ]));
  }
};
