const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "يوتيوب",
  category: "وسائط",
  author: "Yamada KJ & Alastor",
  cooldowns: 60,
  description: "تنزيل مقطع من YouTube",
  role: 0,
  aliases: ["يوتيب", "فيديو", "مقطع"]
};

module.exports.onStart = async function () {};

const youtubeApiKey = process.env.YOUTUBE_API_KEY || "AIzaSyC_CVzKGFtLAqxNdAZ_EyLbL0VRGJ-FaMU";

module.exports.run = async function ({ api, event, args }) {
  const input = event.body;
  const data = input.split(" ");

  if (data.length < 2) {
    return api.sendMessage("⚠️ | أرجوك قم بإدخال اسم المقطع.\n\n📝 | الاستخدام:\n• يوتيوب فيديو [اسم المقطع] - لتحميل الفيديو\n• يوتيوب صوت [اسم المقطع] - لتحميل الصوت فقط", event.threadID);
  }

  data.shift();
  let downloadType = data[0].toLowerCase();
  let videoName;

  // تحديد نوع التحميل
  if (downloadType === "فيديو" || downloadType === "صوت") {
    data.shift();
    videoName = data.join(" ");
  } else {
    // إذا لم يتم تحديد النوع، افتراضي فيديو
    downloadType = "فيديو";
    videoName = data.join(" ");
  }

  if (!videoName) {
    return api.sendMessage("⚠️ | أرجوك قم بإدخال اسم المقطع.", event.threadID);
  }

  try {
    const sentMessage = await api.sendMessage(`✔ | جاري البحث عن المقطع المطلوب "${videoName}". المرجو الانتظار...`, event.threadID);

    // البحث عن الفيديو في YouTube باستخدام API الجديد
    const encodedQuery = encodeURIComponent(videoName);
    const searchApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedQuery}&key=${youtubeApiKey}&type=video&maxResults=4`;
    
    console.log(`🔍 البحث عن الفيديو في YouTube: ${videoName}`);

    // البحث عن الفيديوهات
    const searchResponse = await axios.get(searchApiUrl, { timeout: 15000 });
    
    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      return api.sendMessage("⚠️ | لم يتم العثور على أي نتائج.", event.threadID);
    }

    const searchResults = searchResponse.data.items;
    let msg = `🎥 | تم العثور على المقاطع الأربعة التالية (${downloadType === "فيديو" ? "فيديو" : "صوت"}) :\n\n`;

    // الرموز التي تم طلبها للأرقام
    const numberSymbols = ['⓵', '⓶', '⓷', '⓸'];

    for (let i = 0; i < searchResults.length; i++) {
      const video = searchResults[i];
      const videoIndex = numberSymbols[i];
      const title = video.snippet.title;
      const channel = video.snippet.channelTitle;
      
      msg += `${videoIndex} ❀ العنوان: ${title}\n`;
      msg += `   📺 القناة: ${channel}\n\n`;
      
      // إضافة بيانات إضافية للاستخدام لاحقاً
      video.videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;
      video.thumbnail = video.snippet.thumbnails.default.url;
      video.downloadType = downloadType;
    }

    msg += '📥 | الرجاء الرد برقم المقطع الذي تود تنزيله.';

    api.unsendMessage(sentMessage.messageID);

    api.sendMessage(msg, event.threadID, (error, info) => {
      if (error) return console.error(error);

      global.client.onReply.set(info.messageID, {
        author: event.senderID,
        type: "pick",
        name: "يوتيوب",
        searchResults: searchResults,
        downloadType: downloadType,
        unsend: true
      });
    });

  } catch (error) {
    console.error('[ERROR]', error);
    api.sendMessage('🥱 ❀ حدث خطأ أثناء معالجة الأمر.', event.threadID);
  }
};

module.exports.onReply = async function ({ api, event, reply }) {
  if (reply.type !== 'pick') return;

  const { author, searchResults, downloadType } = reply;

  if (event.senderID !== author) {
    return api.sendMessage("⚠️ | هذا ليس لك.", event.threadID);
  }

  const selectedIndex = parseInt(event.body, 10) - 1;

  if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= searchResults.length) {
    return api.sendMessage("❌ | الرد غير صالح. يرجى الرد برقم صحيح.", event.threadID);
  }

  const video = searchResults[selectedIndex];
  const videoUrl = video.videoUrl;

  try {
    api.sendMessage(`⬇️ | جاري تحميل ${downloadType === "فيديو" ? "الفيديو" : "الصوت"}، المرجو الانتظار...`, event.threadID);

    if (downloadType === "فيديو") {
      await downloadYouTubeVideo(videoUrl, api, event, video);
    } else {
      await downloadYouTubeAudio(videoUrl, api, event, video);
    }

  } catch (error) {
    console.error('[ERROR]', error);
    api.sendMessage('🥱 ❀ حدث خطأ أثناء تحميل الملف.', event.threadID);
  }
};

async function downloadYouTubeVideo(url, api, event, videoInfo) {
  try {
    const { data } = await axios.get(`https://shizuapi.onrender.com/api/ytmp3?url=${encodeURIComponent(url)}&format=mp4`);
    if (!data.success || !data.directLink) throw new Error("فشل في الحصول على رابط تحميل الفيديو.");

    const cacheDir = path.join(process.cwd(), "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const tempPath = path.join(cacheDir, `yt_video_${event.senderID}_${Date.now()}.mp4`);
    const writer = fs.createWriteStream(tempPath);

    const res = await axios({ url: data.directLink, responseType: "stream" });
    res.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // التحقق من حجم الملف
    const fileStats = fs.statSync(tempPath);
    if (fileStats.size > 26214400) { // 25MB
      fs.unlinkSync(tempPath);
      return api.sendMessage('❌ | لا يمكن إرسال الملف لأن حجمه أكبر من 25 ميغابايت.', event.threadID);
    }

    const message = {
      body: `━━━━━━━◈✿◈━━━━━━━\n✅ | تـم تـحـمـيـل الـفـيـديو:\n❀ الـعـنـوان : ${videoInfo.snippet.title}\n📺 الـقـنـاة : ${videoInfo.snippet.channelTitle}\n━━━━━━━◈✿◈━━━━━━━`,
      attachment: fs.createReadStream(tempPath)
    };

    await api.sendMessage(message, event.threadID);
    
    // حذف الملف المؤقت
    setTimeout(() => {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }, 1000);

  } catch (error) {
    console.error('[ERROR] في تحميل الفيديو:', error);
    throw error;
  }
}

async function downloadYouTubeAudio(url, api, event, videoInfo) {
  try {
    const { data } = await axios.get(`https://shizuapi.onrender.com/api/ytmp3?url=${encodeURIComponent(url)}&format=mp3`);
    if (!data.success || !data.directLink) throw new Error("فشل في الحصول على رابط تحميل الصوت.");

    const cacheDir = path.join(process.cwd(), "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const tempPath = path.join(cacheDir, `yt_audio_${event.senderID}_${Date.now()}.mp3`);
    const writer = fs.createWriteStream(tempPath);

    const res = await axios({ url: data.directLink, responseType: "stream" });
    res.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // التحقق من حجم الملف
    const fileStats = fs.statSync(tempPath);
    if (fileStats.size > 26214400) { // 25MB
      fs.unlinkSync(tempPath);
      return api.sendMessage('❌ | لا يمكن إرسال الملف لأن حجمه أكبر من 25 ميغابايت.', event.threadID);
    }

    const message = {
      body: `━━━━━━━◈✿◈━━━━━━━\n✅ | تـم تـحـمـيـل الـصـوت:\n❀ الـعـنـوان : ${videoInfo.snippet.title}\n📺 الـقـنـاة : ${videoInfo.snippet.channelTitle}\n━━━━━━━◈✿◈━━━━━━━`,
      attachment: fs.createReadStream(tempPath)
    };

    await api.sendMessage(message, event.threadID);
    
    // حذف الملف المؤقت
    setTimeout(() => {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }, 1000);

  } catch (error) {
    console.error('[ERROR] في تحميل الصوت:', error);
    throw error;
  }
}
