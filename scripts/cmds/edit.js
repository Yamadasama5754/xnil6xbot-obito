const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const Jimp = require('jimp');

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

// Image enhancement using Jimp
async function enhanceImageWithJimp(imagePath, enhancementType = "enhance") {
  try {
    const image = await Jimp.read(imagePath);
    
    // Different enhancement options
    switch(enhancementType.toLowerCase()) {
      case "brightness":
        image.brightness(0.1);
        break;
      case "contrast":
        image.contrast(0.2);
        break;
      case "sharpen":
        image.sharpen();
        break;
      case "normalize":
        image.normalize();
        break;
      default:
        // Default enhancement: improve quality
        image.brightness(0.05);
        image.contrast(0.15);
        image.sharpen();
        break;
    }

    const outputPath = imagePath.replace('.png', '_enhanced.png').replace('.jpg', '_enhanced.jpg');
    await image.write(outputPath);
    return outputPath;
  } catch (err) {
    console.error("[EDIT] Jimp enhancement error:", err);
    throw err;
  }
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

    // Download the original image
    const imageDownloadResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const cacheDir = path.join(process.cwd(), "cache");
    await fs.ensureDir(cacheDir);

    const originalImagePath = path.join(cacheDir, `original_${Date.now()}.png`);
    await fs.writeFile(originalImagePath, imageDownloadResponse.data);

    console.log(`[EDIT] Original image saved to: ${originalImagePath}`);

    // Enhance the image
    const enhancedImagePath = await enhanceImageWithJimp(originalImagePath, editPrompt);
    
    console.log(`[EDIT] Enhanced image saved to: ${enhancedImagePath}`);

    // Send the edited image
    api.sendMessage({
      body: `✅ تم تعديل الصورة بنجاح\n📝 النوع: ${editPrompt}`,
      attachment: fs.createReadStream(enhancedImagePath)
    }, event.threadID, (err) => {
      // Clean up after message is sent
      setTimeout(() => {
        try {
          if (fs.existsSync(originalImagePath)) {
            fs.unlinkSync(originalImagePath);
          }
          if (fs.existsSync(enhancedImagePath)) {
            fs.unlinkSync(enhancedImagePath);
          }
        } catch (e) {
          console.error("[EDIT] Error cleaning temp files:", e.message);
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
      errorMessage = `خطأ: ${error.response.status}`;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = "انتهت مهلة الانتظار - قد تكون الصورة كبيرة جداً";
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = "خطأ في الاتصال بالإنترنت";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return message.reply(`❌ ${errorMessage}`);
  }
};
