module.exports = {
  config: {
    name: "رصيد",
    aliases: ["bal", "$", "cash", "balance"],
    version: "3.2",
    author: "Yamada KJ",
    countDown: 3,
    role: 0,
    description: "💰 نظام اقتصادي متميز بعرض أنيق",
    category: "اقتصاد",
    guide: "╔════✦ دليل الاستخدام ✦════╗\n║ ➤ {pn} - تحقق من رصيدك\n║ ➤ {pn} @مستخدم - تحقق من رصيد غيرك\n║ ➤ {pn} t @مستخدم المبلغ - تحويل أموال\n║ ➤ {pn} [رد] - تحقق من رصيد المستخدم بالرد\n╚══════════════════════╝"
  },

  langs: {
    ar: {
      invalidUsage: "استخدام غير صحيح",
      usageGuide: "استخدم: {prefix}رصيد t @مستخدم المبلغ",
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
