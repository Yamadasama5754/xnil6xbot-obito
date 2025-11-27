module.exports = {
  config: {
    name: "bank",
    aliases: ["بنك"],
    version: "1.9",
    author: "X Nil",
    countDown: 5,
    role: 0,
    description: {
      en: "Bank system with wallet, bank, loan, etc.",
			ar: "نظام البنك مع المحفظة والقروض وغيرها"
    },
    category: "economy",
    guide: {
      en: "{pn} balance\n{pn} deposit <amount>\n{pn} withdraw <amount>\n{pn} loan\n{pn} preloan\n{pn} top",
			ar: "{pn} balance - عرض الرصيد\n{pn} deposit <مبلغ> - إيداع\n{pn} withdraw <مبلغ> - سحب\n{pn} loan - قرض\n{pn} preloan - سداد القرض\n{pn} top - الترتيب"
    }
  },

  langs: {
    en: {
      commands: "🏦 Bank Commands:\n• balance\n• deposit <amount>\n• withdraw <amount>\n• loan\n• preloan\n• top",
      summary: "🏦 Your Bank Account Summary:\n💰 Wallet: {wallet},
		ar: {}\n🏦 Bank: {bank}\n💳 Loan: {loan}",
      invalidAmount: "❌ Provide a valid amount to deposit.",
      notEnoughWallet: "❌ You only have {amount} in your wallet.",
      deposited: "✅ Deposited {amount}\n🏦 Bank: {bank}\n💰 Wallet: {wallet}",
      invalidWithdraw: "❌ Provide a valid amount to withdraw.",
      notEnoughBank: "❌ You only have {amount} in your bank.",
      withdrew: "✅ Withdrew {amount}\n💰 Wallet: {wallet}\n🏦 Bank: {bank}",
      existingLoan: "⛔ You already have a loan of {amount}. Repay it first.",
      loanApproved: "✅ Loan approved: {amount} added to your wallet. Remember to repay it!",
      noLoan: "✅ You have no active loan.",
      needMoreForLoan: "❌ You need {amount} to repay.",
      loanRepaid: "✅ Loan fully repaid. You are debt-free!",
      noUsersInBank: "❌ No users found with money in bank.",
      topUsers: "🏆 Top 10 Users by Bank Balance:\n",
      invalidCommand: "❓ Invalid subcommand. Try: balance, deposit, withdraw, loan, preloan, top",
      error: "❌ An error occurred. Please try again later."
    },
    ar: {
      commands: "🏦 أوامر البنك:\n• balance - الرصيد\n• deposit <مبلغ> - إيداع\n• withdraw <مبلغ> - سحب\n• loan - قرض\n• preloan - سداد القرض\n• top - الترتيب",
      summary: "🏦 ملخص حسابك البنكي:\n💰 المحفظة: {wallet}\n🏦 البنك: {bank}\n💳 القرض: {loan}",
      invalidAmount: "❌ يرجى إدخال مبلغ صالح للإيداع.",
      notEnoughWallet: "❌ لديك فقط {amount} في محفظتك.",
      deposited: "✅ تم الإيداع {amount}\n🏦 البنك: {bank}\n💰 المحفظة: {wallet}",
      invalidWithdraw: "❌ يرجى إدخال مبلغ صالح للسحب.",
      notEnoughBank: "❌ لديك فقط {amount} في البنك.",
      withdrew: "✅ تم السحب {amount}\n💰 المحفظة: {wallet}\n🏦 البنك: {bank}",
      existingLoan: "⛔ لديك قرض بالفعل بقيمة {amount}. سدده أولاً.",
      loanApproved: "✅ تمت الموافقة على القرض: {amount} أضيف لمحفظتك. تذكر أن تسدده!",
      noLoan: "✅ ليس لديك قرض نشط.",
      needMoreForLoan: "❌ تحتاج {amount} للسداد.",
      loanRepaid: "✅ تم سداد القرض بالكامل. أنت خالٍ من الديون!",
      noUsersInBank: "❌ لا يوجد مستخدمين لديهم أموال في البنك.",
      topUsers: "🏆 أفضل 10 مستخدمين حسب رصيد البنك:\n",
      invalidCommand: "❓ أمر فرعي غير صالح. جرب: balance, deposit, withdraw, loan, preloan, top",
      error: "❌ حدث خطأ. يرجى المحاولة لاحقاً."
    }
  },

  formatMoney(amount) {
    if (amount === 0) return "0";
    const abs = Math.abs(amount);
    if (abs >= 1e15) return (amount / 1e15).toFixed(2).replace(/\.00$/, "") + "qt";
    if (abs >= 1e12) return (amount / 1e12).toFixed(2).replace(/\.00$/, "") + "treelion";
    if (abs >= 1e9) return (amount / 1e9).toFixed(2).replace(/\.00$/, "") + "bilon";
    if (abs >= 1e6) return (amount / 1e6).toFixed(2).replace(/\.00$/, "") + "milon";
    if (abs >= 1e3) return (amount / 1e3).toFixed(2).replace(/\.00$/, "") + "k";
    return amount.toString();
  },

  onStart: async function ({ message, args, event, usersData, getLang }) {
    try {
      const senderID = event.senderID;
      const cmd = args[0]?.toLowerCase();
      const format = this.formatMoney;

      if (!cmd) {
        return message.reply(getLang("commands"));
      }

      let userData = await usersData.get(senderID);
      if (!userData.data) userData.data = {};
      if (!userData.data.bankdata) userData.data.bankdata = { bank: 0, loan: 0 };
      
      let wallet = userData.money || 0;
      let bankData = userData.data.bankdata;

      if (cmd === "balance") {
        return message.reply(
          getLang("summary")
            .replace(/{wallet}/g, format(wallet))
            .replace(/{bank}/g, format(bankData.bank))
            .replace(/{loan}/g, format(bankData.loan))
        );
      }

      if (cmd === "deposit") {
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) {
          return message.reply(getLang("invalidAmount"));
        }
        if (wallet < amount) {
          return message.reply(getLang("notEnoughWallet").replace(/{amount}/g, format(wallet)));
        }
        wallet -= amount;
        bankData.bank += amount;
        await usersData.set(senderID, {
          money: wallet,
          data: userData.data
        });
        return message.reply(
          getLang("deposited")
            .replace(/{amount}/g, format(amount))
            .replace(/{bank}/g, format(bankData.bank))
            .replace(/{wallet}/g, format(wallet))
        );
      }

      if (cmd === "withdraw") {
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) {
          return message.reply(getLang("invalidWithdraw"));
        }
        if (bankData.bank < amount) {
          return message.reply(getLang("notEnoughBank").replace(/{amount}/g, format(bankData.bank)));
        }
        bankData.bank -= amount;
        wallet += amount;
        await usersData.set(senderID, {
          money: wallet,
          data: userData.data
        });
        return message.reply(
          getLang("withdrew")
            .replace(/{amount}/g, format(amount))
            .replace(/{wallet}/g, format(wallet))
            .replace(/{bank}/g, format(bankData.bank))
        );
      }

      if (cmd === "loan") {
        const loanLimit = 1000000;
        if (bankData.loan > 0) {
          return message.reply(getLang("existingLoan").replace(/{amount}/g, format(bankData.loan)));
        }
        bankData.loan = loanLimit;
        wallet += loanLimit;
        await usersData.set(senderID, {
          money: wallet,
          data: userData.data
        });
        return message.reply(getLang("loanApproved").replace(/{amount}/g, format(loanLimit)));
      }

      if (cmd === "preloan") {
        if (bankData.loan === 0) {
          return message.reply(getLang("noLoan"));
        }
        if (wallet < bankData.loan) {
          return message.reply(getLang("needMoreForLoan").replace(/{amount}/g, format(bankData.loan)));
        }
        wallet -= bankData.loan;
        bankData.loan = 0;
        await usersData.set(senderID, {
          money: wallet,
          data: userData.data
        });
        return message.reply(getLang("loanRepaid"));
      }

      if (cmd === "top") {
        const allUsers = await usersData.getAll();
        const topUsers = allUsers
          .filter(u => u?.data?.bankdata?.bank > 0)
          .sort((a, b) => b.data.bankdata.bank - a.data.bankdata.bank)
          .slice(0, 10);

        if (topUsers.length === 0) {
          return message.reply(getLang("noUsersInBank"));
        }

        let msg = getLang("topUsers");
        for (let i = 0; i < topUsers.length; i++) {
          const user = topUsers[i];
          msg += `${i + 1}. ${user.name || "Unknown"}: ${format(user.data.bankdata.bank)}\n`;
        }

        return message.reply(msg.trim());
      }

      return message.reply(getLang("invalidCommand"));

    } catch (error) {
      console.error("Bank command error:", error);
      return message.reply(getLang("error"));
    }
  }
};
