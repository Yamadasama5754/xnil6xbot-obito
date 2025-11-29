const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "تعديل",
  category: "وسائط",
  author: "Yamada KJ & Alastor",
  countDown: 15,
  description: "تحسين وتعديل الصور",
  role: 0,
  aliases: ["edit", "imgedit", "enhance"]
};

function extractImageUrl(args, event) {
  let imageUrl = args.find(arg => arg.startsWith('http'));

  if (!imageUrl && event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
    const imageAttachment = event.messageReply.attachments.find(att => att.type === 'photo' || att.type === 'image');
    if (imageAttachment && imageAttachment.url) {
      imageUrl = imageAttachment.url;
    }
  }
  return imageUrl;
}

function extractEditPrompt(rawArgs, imageUrl) {
  let prompt = rawArgs.join(" ");

  if (imageUrl) {
    prompt = prompt.replace(imageUrl, '').trim();
  }

  if (prompt.includes('|')) {
    prompt = prompt.split('|')[0].trim();
  }

  return prompt || "تحسين الجودة";
}

// Try multiple APIs for image enhancement
async function enhanceImageViaAPI(imageUrl, prompt) {
  const apis = [
    {
      name: "tawsif",
      url: `https://tawsif.is-a.dev/gemini/nano-banana?prompt=${encodeURIComponent(prompt)}&image=${encodeURIComponent(imageUrl)}`
    },
    {
      name: "direct-download",
      url: imageUrl
    }
  ];

  for (const api of apis) {
    try {
      console.log(`[EDIT] Trying API: ${api.name}`);
      const response = await axios.get(api.url, {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0"
        },
        responseType: api.name === "direct-download" ? 'arraybuffer' : 'json'
      });

      if (api.name === "direct-download") {
        return { data: response.data, source: "direct" };
      }

      if (response.data && response.data.imageUrl) {
        // Download the processed image
        const imgResponse = await axios.get(response.data.imageUrl, {
          timeout: 10000,
          responseType: 'arraybuffer',
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        return { data: imgResponse.data, source: "tawsif" };
      }
    } catch (err) {
      console.log(`[EDIT] API ${api.name} failed:`, err.message);
      continue;
    }
  }

  throw new Error("فشلت جميع محاولات تحسين الصورة");
}

module.exports.onStart = async function ({ api, event, args, message }) {
  const imageUrl = extractImageUrl(args, event);
  const editPrompt = extractEditPrompt(args, imageUrl);

  if (!imageUrl) {
    return message.reply("❌ يرجى توفير رابط صورة أو الرد على صورة لتعديلها");
  }

  if (!editPrompt) {
    return message.reply("❌ يرجى توفير وصف التعديل الذي تريده");
  }

  try {
    const msgReply = await api.sendMessage("⏳ جاري معالجة الصورة...", event.threadID);

    console.log(`[EDIT] Processing image with prompt: ${editPrompt}`);
    console.log(`[EDIT] Image URL: ${imageUrl}`);

    // Try to enhance via API
    const { data: imageData, source } = await enhanceImageViaAPI(imageUrl, editPrompt);

    const cacheDir = path.join(process.cwd(), "cache");
    await fs.ensureDir(cacheDir);

    const imagePath = path.join(cacheDir, `edited_${Date.now()}.png`);
    await fs.writeFile(imagePath, imageData);

    console.log(`[EDIT] Image saved from ${source} to: ${imagePath}`);

    // Send the edited image
    api.sendMessage({
      body: `✅ تم تحسين الصورة بنجاح\n📝 الطلب: ${editPrompt}`,
      attachment: fs.createReadStream(imagePath)
    }, event.threadID, (err) => {
      // Clean up after message is sent
      setTimeout(() => {
        try {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        } catch (e) {
          console.error("[EDIT] Error cleaning temp file:", e.message);
        }
      }, 2000);
    });

    // Delete loading message
    api.unsendMessage(msgReply.messageID);

  } catch (error) {
    console.error("[EDIT] Error:", error);

    let errorMessage = "حدث خطأ أثناء تعديل الصورة";
    if (error.response) {
      console.error("[EDIT] API Response Error:", error.response.status);
      errorMessage = `خطأ API: ${error.response.status}`;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = "انتهت مهلة الانتظار - حاول لاحقاً";
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = "خطأ في الاتصال - تحقق من الإنترنت";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return message.reply(`❌ ${errorMessage}`);
  }
};
