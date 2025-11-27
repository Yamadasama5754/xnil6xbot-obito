const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair",
    author: "xnil",
    role: 0,
    description: {
      en: "Create romantic pairing",
			ar: "إنشاء إقران رومانسي"
    },
    category: "love",
    guide: {
      en: "{pn}",
			ar: "{pn}"
    }
  },

  langs: {
    en: {
      noSuitable: "❌ No suitable person to pair with in this chat.",
      romanticMatch: "❤️ Romantic Match ❤️",
      pairFound: "💘 Romantic Pair Found 💘\n\n%1 + %2 = ❤️\n\nCompatibility Score: %3%",
      compatibility: "Compatibility"
    },
		ar: {},
    ar: {
      noSuitable: "❌ لا توجد شخصية مناسبة للإقران معها في هذه المحادثة.",
      romanticMatch: "❤️ تطابق رومانسي ❤️",
      pairFound: "💘 تم العثور على إقران رومانسي 💘\n\n%1 + %2 = ❤️\n\nمستوى التوافق: %3%",
      compatibility: "التوافق"
    }
  },

  onStart: async function ({ api, event, usersData, getLang }) {
    try {
      const id1 = event.senderID;
      const name1 = await usersData.getName(id1);
      const ThreadInfo = await api.getThreadInfo(event.threadID);
      const all = ThreadInfo.userInfo;

      const botID = api.getCurrentUserID();
      const senderGender = all.find(u => u.id === id1)?.gender || "unknown";

      let candidates = all.filter(u => u.id !== id1 && u.id !== botID && u.gender && u.gender !== senderGender);

      if (candidates.length === 0) {
        return api.sendMessage(getLang("noSuitable"), event.threadID);
      }

      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      const id2 = chosen.id;
      const name2 = await usersData.getName(id2);

      const canvas = createCanvas(1000, 600);
      const ctx = canvas.getContext("2d");

      const createRomanticBackground = () => {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, "#ff9a9e");
        gradient.addColorStop(0.5, "#fad0c4");
        gradient.addColorStop(1, "#fbc2eb");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "rgba(255,255,255,0.3)";
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          const radius = Math.random() * 5 + 2;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.font = "bold 60px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(getLang("romanticMatch"), canvas.width / 2, 80);
      };

      createRomanticBackground();

      const [avatar1, avatar2] = await Promise.all([
        axios.get(`https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
        axios.get(`https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })
      ]);

      const tempDir = path.join(__dirname, "temp");
      await fs.ensureDir(tempDir);
      const avatar1Path = path.join(tempDir, `av1_${Date.now()}.png`);
      const avatar2Path = path.join(tempDir, `av2_${Date.now()}.png`);

      await Promise.all([
        fs.writeFile(avatar1Path, Buffer.from(avatar1.data)),
        fs.writeFile(avatar2Path, Buffer.from(avatar2.data))
      ]);

      const [img1, img2] = await Promise.all([
        loadImage(avatar1Path),
        loadImage(avatar2Path)
      ]);

      const drawRoundedImage = (img, x, y, size) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      };

      drawRoundedImage(img1, 150, 150, 250);
      drawRoundedImage(img2, 600, 150, 250);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 30px Arial";
      ctx.fillText(name1, 150 + 125, 150 + 280);
      ctx.fillText(name2, 600 + 125, 150 + 280);

      const score = Math.floor(Math.random() * 41) + 60;
      ctx.font = "bold 40px Arial";
      ctx.fillText(`${getLang("compatibility")}: ${score}%`, canvas.width / 2, 500);

      const resultPath = path.join(tempDir, `result_${Date.now()}.png`);
      await fs.writeFile(resultPath, canvas.toBuffer());

      await api.sendMessage({
        body: getLang("pairFound", name1, name2, score),
        mentions: [
          { tag: name1, id: id1 },
          { tag: name2, id: id2 }
        ],
        attachment: fs.createReadStream(resultPath)
      }, event.threadID);

      await fs.remove(avatar1Path);
      await fs.remove(avatar2Path);
      await fs.remove(resultPath);

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ خطأ: " + error.message, event.threadID);
    }
  }
};
