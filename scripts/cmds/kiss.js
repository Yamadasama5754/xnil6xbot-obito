const DIG = require("discord-image-generation");
const fs = require("fs-extra");


module.exports = {
    config: {
        name: "قبلة",
        aliases: ["مواح"],
        version: "1.0",
        author: "NIB",
        countDown: 5,
        role: 0,
        shortDescription: "قبلة أو بوسة أو بيزو",
        longDescription: "",
        category: "حب",
        guide: "{pn}"
    },



    onStart: async function ({ api, message, event, args, usersData }) {
      try {
        let one, two;
        const mention = Object.keys(event.mentions);
        
        // التحقق من الرد على الرسالة
        if (event.messageReply && event.messageReply.senderID) {
          one = event.senderID;
          two = event.messageReply.senderID;
        } else if (mention && mention.length > 0) {
          one = event.senderID;
          two = mention[0];
        } else {
          return message.reply("المرجو عمل منشن للشخص الذي تريد تقبيله أو الرد على رسالته");
        }

        // الحصول على معلومات الجنس
        api.getUserInfo([one, two], async (err, userInfo) => {
          if (err) {
            return message.reply("❌ حدث خطأ في الحصول على معلومات المستخدمين");
          }

          // تحديد الجنس (من id.js: 1 = فتاة بنت، 2 = ولد ذكر)
          const gender1 = userInfo[one]?.gender;
          const gender2 = userInfo[two]?.gender;

          // ترتيب الصورة: الرجل (2) أولاً، ثم البنت (1)
          let firstUser = one;
          let secondUser = two;

          // إذا كان الأول بنت (1) والثاني ولد (2)، اعكسهم
          if (gender1 === 1 && gender2 === 2) {
            firstUser = two;
            secondUser = one;
          }

          const avatarURL1 = await usersData.getAvatarUrl(firstUser);
          const avatarURL2 = await usersData.getAvatarUrl(secondUser);
          const img = await new DIG.Kiss().getImage(avatarURL1, avatarURL2);
          const pathSave = `${__dirname}/tmp/${firstUser}_${secondUser}kiss.png`;
          fs.writeFileSync(pathSave, Buffer.from(img));
          const content = "😘😘"
          message.reply({
            body: `${(content || "يا لها من قبلة حلوة 🥺🤭")}`,
            attachment: fs.createReadStream(pathSave)
          }, () => fs.unlinkSync(pathSave));
        });
      } catch (error) {
        console.error("❌ خطأ في أمر قبلة:", error);
        message.reply("❌ حدث خطأ في الأمر: " + error.message);
      }
    }
};
