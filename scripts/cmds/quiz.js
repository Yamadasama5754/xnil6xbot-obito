const axios = require("axios");

const baseApiUrl = async () => {
 const base = await axios.get(
 `https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`
 );
 return base.data.api;
};

module.exports = {
 config: {
 name: "quiz",
 aliases: ["qz", "اختبار"],
 version: "1.0",
 author: "Dipto",
 countDown: 0,
 role: 0,
 category: "game",
 description: {
   en: "Quiz game with rewards",
			ar: "لعبة اختبار مع مكافآت"
 },
 guide: {
   en: "{pn} \n{pn} bn \n{pn} en",
			ar: "{pn} \n{pn} bn - بنغالي\n{pn} en - إنجليزي"
 },
 },

 langs: {
   en: {
     replyToAnswer: "𝚁𝚎𝚙𝚕𝚢 𝚝𝚘 𝚝𝚑𝚒𝚜 𝚖𝚎𝚜𝚜𝚊𝚐𝚎 𝚠𝚒𝚝𝚑 𝚢𝚘𝚞𝚛 𝚊𝚗𝚜𝚠𝚎𝚛.",
     notYourGame: "Who are you? This is not your game!",
     maxAttempts: "🚫 | %1, you have reached the maximum number of attempts (2).\nThe correct answer is: %2",
     congratulations: "Congratulations, %1! 🌟🎉\n\nYou're a Quiz Champion! 🏆\n\nYou've earned %2 Coins 💰 and %3 EXP 🌟\n\nKeep up the great work! 🚀",
     wrongAnswer: "❌ | Wrong Answer. You have %1 attempts left.\n✅ | Try Again!"
   },
		ar: {},
   ar: {
     replyToAnswer: "رد على هذه الرسالة بإجابتك.",
     notYourGame: "من أنت؟ هذه ليست لعبتك!",
     maxAttempts: "🚫 | %1، لقد وصلت للحد الأقصى من المحاولات (2).\nالإجابة الصحيحة هي: %2",
     congratulations: "مبروك، %1! 🌟🎉\n\nأنت بطل الاختبار! 🏆\n\nلقد ربحت %2 عملة 💰 و %3 خبرة 🌟\n\nاستمر في العمل الرائع! 🚀",
     wrongAnswer: "❌ | إجابة خاطئة. لديك %1 محاولات متبقية.\n✅ | حاول مرة أخرى!"
   }
 },

 onStart: async function ({ api, event, usersData, args, getLang }) {
 const input = args.join('').toLowerCase() || "bn";
 let timeout = 300;
 let category = "bangla";
 if (input === "bn" || input === "bangla") {
 category = "bangla";
 } else if (input === "en" || input === "english") {
 category = "english";
 }

 try {
 const response = await axios.get(
 `${await baseApiUrl()}/quiz?category=${category}&q=random`,
 );

 const quizData = response.data.question;
 const { question, correctAnswer, options } = quizData;
 const { a, b, c, d } = options;
 const namePlayerReact = await usersData.getName(event.senderID);
 const quizMsg = {
 body: `\n╭──✦ ${question}\n├‣ 𝗔) ${a}\n├‣ 𝗕) ${b}\n├‣ 𝗖) ${c}\n├‣ 𝗗) ${d}\n╰──────────────────‣\n${getLang("replyToAnswer")}`,
 };

 api.sendMessage(
 quizMsg,
 event.threadID,
 (error, info) => {
 global.GoatBot.onReply.set(info.messageID, {
 type: "reply",
 commandName: this.config.name,
 author: event.senderID,
 messageID: info.messageID,
 dataGame: quizData,
 correctAnswer,
 nameUser: namePlayerReact,
 attempts: 0
 });
 setTimeout(() => {
 api.unsendMessage(info.messageID);
 }, timeout * 1000);
 },
 event.messageID,
 );
 } catch (error) {
 console.error("❌ | Error occurred:", error);
 api.sendMessage(error.message, event.threadID, event.messageID);
 }
 },

 onReply: async ({ event, api, Reply, usersData, getLang }) => {
const { correctAnswer, nameUser, author } = Reply;
 if (event.senderID !== author)
 return api.sendMessage(
 getLang("notYourGame"),
 event.threadID,
 event.messageID
 );
 const maxAttempts = 2;

 switch (Reply.type) {
 case "reply": {
 let userReply = event.body.toLowerCase();
 if (Reply.attempts >= maxAttempts) {
 await api.unsendMessage(Reply.messageID);
 return api.sendMessage(getLang("maxAttempts", nameUser, correctAnswer), event.threadID, event.messageID);
 }
 if (userReply === correctAnswer.toLowerCase()) {
 api.unsendMessage(Reply.messageID)
 .catch(console.error);
 let rewardCoins = 300;
 let rewardExp = 100;
 let userData = await usersData.get(author);
 await usersData.set(author, {
 money: userData.money + rewardCoins,
 exp: userData.exp + rewardExp,
 data: userData.data,
 });
 api.sendMessage(getLang("congratulations", nameUser, rewardCoins, rewardExp), event.threadID, event.messageID);
 } else {
 Reply.attempts += 1;
global.GoatBot.onReply.set(Reply.messageID, Reply);
 api.sendMessage(
 getLang("wrongAnswer", maxAttempts - Reply.attempts),
 event.threadID,
 event.messageID,
 );
 }
 break;
 }
 default:
 break;
 }
 },
};
