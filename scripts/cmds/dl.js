const axios = require("axios");

module.exports = {
 config: {
 name: "dl",
 version: "1.0",
 author: "xnil6x",
 countDown: 5,
 role: 0,
 description: {
   en: "Stream media from URL",
			ar: "بث الوسائط من رابط"
 },
 category: "utility",
 guide: {
   en: "{pn} <media_url>",
			ar: "{pn} <رابط_الوسائط>"
 }
 },

 langs: {
   en: {
     invalidUrl: "❌ Please provide a valid media URL.\nExample: {pn},
		ar: {} https://example.com/image.jpg",
     unsupportedType: "❌ Unsupported media type. Only direct image or video links are allowed.",
     streaming: "🔗 Streaming: {url}",
     failed: "❌ Failed to stream media. The link may be invalid or blocked."
   },
   ar: {
     invalidUrl: "❌ يرجى تقديم رابط وسائط صالح.\nمثال: {pn} https://example.com/image.jpg",
     unsupportedType: "❌ نوع وسائط غير مدعوم. يُسمح فقط بروابط الصور أو الفيديو المباشرة.",
     streaming: "🔗 جاري البث: {url}",
     failed: "❌ فشل في بث الوسائط. قد يكون الرابط غير صالح أو محظور."
   }
 },

 onStart: async function ({ api, event, args, getLang }) {
 const url = args[0];

 if (!url || !/^https?:\/\//.test(url)) {
 return api.sendMessage(getLang("invalidUrl"), event.threadID, event.messageID);
 }

 try {
 const res = await axios.get(url, { responseType: "stream" });
 const contentType = res.headers["content-type"];

 if (!["image", "video"].some(type => contentType.startsWith(type))) {
 return api.sendMessage(getLang("unsupportedType"), event.threadID, event.messageID);
 }

 api.sendMessage({
 body: getLang("streaming").replace(/{url}/g, url),
 attachment: res.data
 }, event.threadID, event.messageID);

 } catch (e) {
 api.sendMessage(getLang("failed"), event.threadID, event.messageID);
 }
 }
};
