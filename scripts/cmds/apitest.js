const axios = require("axios");

module.exports = {
 config: {
 name: "اختبار_api",
 aliases: ["apitest"],
 version: "1.0",
 author: "Yamada KJ",
 role: 4,
 usePrefix: false,
 description: {
   en: "Test any public API via GET or POST",
   ar: "اختبار أي API عام عبر GET أو POST"
 },
 guide: {
   en: "{pn} get <url> | {pn} post <url> <body>",
   ar: "{pn} get <رابط> | {pn} post <رابط> <بيانات>"
 },
 category: "أدوات",
 cooldowns: 3
 },

 
        langs: {
                en: {},
                ar: { command: "أمر", error: "خطأ", success: "نجح", usage: "الاستخدام", invalid: "غير صالح" }
        },

        onStart: async function ({ api, event, args }) {
 const method = args[0]?.toLowerCase();
 const url = args[1];
 const bodyInput = args.slice(2).join(" ");

 if (!method || !url) {
 return api.sendMessage("Usage:\n/apitest get <url>\n/apitest post <url> <json-body>", event.threadID, event.messageID);
 }

 try {
 let res;
 if (method === "get") {
 res = await axios.get(url);
 } else if (method === "post") {
 let data = {};
 try {
 data = bodyInput ? JSON.parse(bodyInput) : {};
 } catch (e) {
 return api.sendMessage("Invalid JSON body for POST request.", event.threadID, event.messageID);
 }
 res = await axios.post(url, data);
 } else {
 return api.sendMessage("Only GET and POST methods are supported.", event.threadID, event.messageID);
 }

 const reply = JSON.stringify(res.data, null, 2);
 return api.sendMessage(reply.length > 19000 ? "Response too long." : reply, event.threadID, event.messageID);
 } catch (err) {
 return api.sendMessage("Error: " + (err.response?.data?.message || err.message), event.threadID, event.messageID);
 }
 }
};