module.exports.config = {
  name: "تيد",
  version: "1.0",
  author: "Yamada KJ & Alastor",
  countDown: 5,
  role: 0,
  description: {
    en: "عرض معرف المجموعة"
  },
  category: "معلومات",
  guide: {
    en: "   {pn}: عرض معرف المجموعة الحالية"
  },
  aliases: ["threadid", "ايدي_المجموعة"]
};

module.exports.onStart = async function ({ api, event, message }) {
  try {
    const threadID = event.threadID.toString();
    message.reply(`📍 معرف المجموعة:\n${threadID}`);
  } catch (err) {
    message.reply("❌ حدث خطأ أثناء جلب معرف المجموعة!");
  }
};
