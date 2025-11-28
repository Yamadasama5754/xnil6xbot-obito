const fs = require("fs-extra");
const path = require("path");

const warnsFile = path.join(process.cwd(), "database/warns.json");

const getWarns = (threadID) => {
  try {
    const data = fs.readJsonSync(warnsFile);
    return data[threadID] || {};
  } catch {
    return {};
  }
};

const saveWarns = (threadID, warns) => {
  try {
    const data = fs.readJsonSync(warnsFile);
    data[threadID] = warns;
    fs.writeFileSync(warnsFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("خطأ في حفظ التحذيرات:", err);
  }
};

const isValidUserID = (id) => {
  return /^\d+$/.test(id) && id.length >= 5;
};

module.exports.config = {
  name: "تحذير",
  version: "2.0",
  author: "Yamada KJ & Alastor",
  countDown: 3,
  role: 1,
  description: {
    en: "نظام التحذيرات المتكامل - تحذير، عرض القائمة، إزالة"
  },
  category: "إدارة",
  guide: {
    en: "{pn} [معرف] [السبب]: تحذير عضو\n{pn} قائمة: عرض قائمة المحذورين\n{pn} إزالة [معرف] [العدد]: إزالة تحذيرات\n{pn}: الرد على رسالة لتحذير صاحبها"
  }
};

module.exports.langs = {
  ar: {
    invalidID: "❌ معرف العضو غير صحيح! يجب أن يكون رقماً",
    cantWarnBot: "🔒 | لا يمكن تحذير البوت! فقط المطور يقدر يحذره.",
    botNotAdmin: "❌ البوت يجب أن يكون أدمن لاستخدام هذا الأمر",
    notInGroup: "⚠️ | هذا الأمر يعمل فقط في المجموعات.",
    warned: "⚠️ تم تحذير العضو!",
    userID: "🆔 المعرف: %1",
    reason: "📋 السبب: %1",
    warnCount: "🔢 عدد التحذيرات: %1/3",
    kicked: "\n🚫 تم طرد العضو بسبب الوصول إلى 3 تحذيرات!",
    kickFailed: "\n⚠️ فشل طرد العضو: %1",
    noWarns: "⚠️ هذا العضو ليس لديه تحذيرات",
    removeSuccess: "✅ تم إزالة التحذير!",
    removeCount: "📉 من %1 إلى %2 تحذير",
    listEmpty: "✅ لا توجد أي تحذيرات في هذه المجموعة",
    listTitle: "📋 | قائمة المحذورين في المجموعة\n\n═══════════════════════",
    listItem: "\n%1️⃣ المعرف: %2\n   🔢 التحذيرات: %3/3\n   ⏰ آخر تحذير: %4\n   📝 آخر سبب: %5%6\n   ─────────────────────",
    listKicked: "\n   🚫 حالة: تم طرده بسبب تحذيرات",
    listFooter: "\n═══════════════════════\n📊 إجمالي المحذورين: %1"
  }
};

module.exports.onStart = async function ({ message, event, args, getLang, api }) {
  try {
    // التحقق: هل هذا في مجموعة؟
    const threadInfo = await api.getThreadInfo(event.threadID);
    if (!threadInfo.isGroup) {
      return message.reply(getLang("notInGroup"));
    }

    const { threadID, senderID } = event;
    const subCommand = args[0]?.toLowerCase() || "help";

    // التحقق من أن البوت أدمن
    const botID = api.getCurrentUserID();
    const isBotAdmin = threadInfo.adminIDs?.some(admin => admin.id === botID);

    if (!isBotAdmin) {
      return message.reply(getLang("botNotAdmin"));
    }

    const developerID = "100092990751389";

    // عرض القائمة
    if (subCommand === "قائمة" || subCommand === "list") {
      const warns = getWarns(threadID);
      const warnedUsers = Object.entries(warns).filter(([_, data]) => data.count > 0);

      if (warnedUsers.length === 0) {
        return message.reply(getLang("listEmpty"));
      }

      let msg = getLang("listTitle");

      warnedUsers.forEach(([userID, data], index) => {
        const lastWarnDate = new Date(data.warnedAt[data.warnedAt.length - 1]).toLocaleString('ar-SA');
        const lastReason = data.reasons[data.reasons.length - 1];
        const kickedStatus = data.kicked ? getLang("listKicked") : "";
        
        msg += getLang("listItem", 
          index + 1, 
          userID, 
          data.count, 
          lastWarnDate, 
          lastReason,
          kickedStatus
        );
      });

      msg += getLang("listFooter", warnedUsers.length);
      return message.reply(msg);
    }

    // إزالة التحذير
    if (subCommand === "إزالة" || subCommand === "remove") {
      const targetID = args[1];
      const amount = parseInt(args[2]) || 1;

      if (!targetID) {
        return message.SyntaxError();
      }

      if (!isValidUserID(targetID)) {
        return message.reply(getLang("invalidID"));
      }

      let warns = getWarns(threadID);

      if (!warns[targetID] || warns[targetID].count === 0) {
        return message.reply(getLang("noWarns"));
      }

      const oldCount = warns[targetID].count;
      warns[targetID].count = Math.max(0, warns[targetID].count - amount);

      if (warns[targetID].count === 0) {
        warns[targetID].reasons = [];
        warns[targetID].warnedBy = [];
        warns[targetID].warnedAt = [];
      } else {
        warns[targetID].reasons = warns[targetID].reasons.slice(0, warns[targetID].count);
        warns[targetID].warnedBy = warns[targetID].warnedBy.slice(0, warns[targetID].count);
        warns[targetID].warnedAt = warns[targetID].warnedAt.slice(0, warns[targetID].count);
      }

      if (warns[targetID].kicked && warns[targetID].count < 3) {
        warns[targetID].kicked = false;
      }

      saveWarns(threadID, warns);

      let msg = getLang("removeSuccess") + "\n\n";
      msg += getLang("userID", targetID) + "\n";
      msg += getLang("removeCount", oldCount, warns[targetID].count);

      return message.reply(msg);
    }

    // تحذير عضو بالمعرف (الأمر الرئيسي)
    if (subCommand !== "help" && subCommand !== "مساعدة" && args.length > 0) {
      const targetID = subCommand;
      const reason = args.slice(1).join(" ") || "لا يوجد سبب";

      // التحقق من صحة المعرف
      if (!isValidUserID(targetID)) {
        return message.reply(getLang("invalidID"));
      }

      // 🚫 منع تحذير البوت (فقط المطور)
      if (targetID === botID) {
        if (senderID !== developerID) {
          return message.reply(getLang("cantWarnBot"));
        }
      }

      let warns = getWarns(threadID);
      if (!warns[targetID]) {
        warns[targetID] = {
          count: 0,
          reasons: [],
          warnedBy: [],
          warnedAt: []
        };
      }

      warns[targetID].count += 1;
      warns[targetID].reasons.push(reason);
      warns[targetID].warnedBy.push(senderID);
      warns[targetID].warnedAt.push(new Date().toISOString());

      saveWarns(threadID, warns);

      const warnCount = warns[targetID].count;
      let msg = getLang("warned") + "\n\n";
      msg += getLang("userID", targetID) + "\n";
      msg += getLang("reason", reason) + "\n";
      msg += getLang("warnCount", warnCount);

      if (warnCount >= 3) {
        try {
          await api.removeUserFromGroup(targetID, threadID);
          msg += getLang("kicked");
          warns[targetID].kicked = true;
          warns[targetID].kickedDate = new Date().toISOString();
          saveWarns(threadID, warns);
        } catch (err) {
          msg += getLang("kickFailed", err.message);
        }
      }

      return message.reply(msg);
    }

    // عندما لا يتم إدخال أي شيء
    return message.SyntaxError();

  } catch (error) {
    console.error("[WARNING] Error:", error.message);
    message.reply("❌ | حدث خطأ في الأمر");
  }
};

module.exports.onReply = async function ({ message, event, args, getLang, Reply, api }) {
  try {
    const { threadID, senderID, body, type } = event;

    if (Reply.author !== senderID) {
      return;
    }

    // التحقق: هل هذا رد على رسالة؟
    if (type !== "message_reply") {
      return;
    }

    const replyToUserID = event.messageReply.senderID;

    // لا يمكن تحذير نفسك
    if (replyToUserID === senderID) {
      return message.reply("❌ | لا يمكنك تحذير نفسك", () => message.unsend(Reply.messageID));
    }

    // التحقق من أن البوت أدمن
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const isBotAdmin = threadInfo.adminIDs?.some(admin => admin.id === botID);

    if (!isBotAdmin) {
      message.reply(getLang("botNotAdmin"));
      return message.unsend(Reply.messageID);
    }

    const developerID = "100092990751389";

    // 🚫 منع تحذير البوت (فقط المطور)
    if (replyToUserID === botID) {
      if (senderID !== developerID) {
        message.reply(getLang("cantWarnBot"));
        return message.unsend(Reply.messageID);
      }
    }

    // تحليل الرسالة
    const cleanBody = body.trim();
    const parts = cleanBody.split(/\s+/);
    
    // تجاوز الأمر (البارت الأول: .تحذير أو تحذير)
    let contentParts = parts.slice(1);
    const firstParam = contentParts[0]?.toLowerCase();

    // إزالة تحذير برد
    if (firstParam === "إزالة" || firstParam === "remove") {
      const amount = parseInt(contentParts[1]) || 1;

      let warns = getWarns(threadID);
      if (!warns[replyToUserID] || warns[replyToUserID].count === 0) {
        message.reply(getLang("noWarns"));
        return message.unsend(Reply.messageID);
      }

      const oldCount = warns[replyToUserID].count;
      warns[replyToUserID].count = Math.max(0, warns[replyToUserID].count - amount);

      if (warns[replyToUserID].count === 0) {
        warns[replyToUserID].reasons = [];
        warns[replyToUserID].warnedBy = [];
        warns[replyToUserID].warnedAt = [];
      } else {
        warns[replyToUserID].reasons = warns[replyToUserID].reasons.slice(0, warns[replyToUserID].count);
        warns[replyToUserID].warnedBy = warns[replyToUserID].warnedBy.slice(0, warns[replyToUserID].count);
        warns[replyToUserID].warnedAt = warns[replyToUserID].warnedAt.slice(0, warns[replyToUserID].count);
      }

      if (warns[replyToUserID].kicked && warns[replyToUserID].count < 3) {
        warns[replyToUserID].kicked = false;
      }

      saveWarns(threadID, warns);

      let msg = getLang("removeSuccess") + "\n\n";
      msg += getLang("userID", replyToUserID) + "\n";
      msg += getLang("removeCount", oldCount, warns[replyToUserID].count);

      message.reply(msg);
      return message.unsend(Reply.messageID);
    }

    // تحذير عضو برد - السبب هو جميع الكلمات بعد الأمر
    const reason = contentParts.join(" ") || "لا يوجد سبب";

    let warns = getWarns(threadID);
    if (!warns[replyToUserID]) {
      warns[replyToUserID] = {
        count: 0,
        reasons: [],
        warnedBy: [],
        warnedAt: []
      };
    }

    warns[replyToUserID].count += 1;
    warns[replyToUserID].reasons.push(reason);
    warns[replyToUserID].warnedBy.push(senderID);
    warns[replyToUserID].warnedAt.push(new Date().toISOString());

    saveWarns(threadID, warns);

    const warnCount = warns[replyToUserID].count;
    let msg = getLang("warned") + "\n\n";
    msg += getLang("userID", replyToUserID) + "\n";
    msg += getLang("reason", reason) + "\n";
    msg += getLang("warnCount", warnCount);

    if (warnCount >= 3) {
      try {
        await api.removeUserFromGroup(replyToUserID, threadID);
        msg += getLang("kicked");
        warns[replyToUserID].kicked = true;
        warns[replyToUserID].kickedDate = new Date().toISOString();
        saveWarns(threadID, warns);
      } catch (err) {
        msg += getLang("kickFailed", err.message);
      }
    }

    message.reply(msg);
    message.unsend(Reply.messageID);

  } catch (error) {
    console.error("[WARNING] onReply Error:", error.message);
    message.reply("❌ | حدث خطأ في الأمر");
  }
};
