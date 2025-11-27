const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "قبول",
    aliases: ["acp", "accept", "الموافقة"],
    version: "1.0",
    author: "Yamada KJ",
    cooldowns: 8,
    role: 2,
    description: "إدارة طلبات الصداقة بأناقة",
    category: "أدوات",
    guide: "{pn} [قبول|رفض] [رقم|جميع]"
  },

  onReply: async function ({ message, Reply, event, api, commandName }) {
    const { author, listRequest, messageID } = Reply;
    if (author !== event.senderID) return;
    const args = event.body.trim().toLowerCase().split(/\s+/);

    clearTimeout(Reply.unsendTimeout);

    const form = {
      av: api.getCurrentUserID(),
      fb_api_caller_class: "RelayModern",
      variables: {
        input: {
          source: "friends_tab",
          actor_id: api.getCurrentUserID(),
          client_mutation_id: Math.round(Math.random() * 19).toString()
        },
        scale: 3,
        refresh_num: 0
      }
    };

    const success = [];
    const failed = [];

    if (args[0] === "قبول" || args[0] === "add") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      form.doc_id = "3147613905362928";
    }
    else if (args[0] === "رفض" || args[0] === "del") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      form.doc_id = "4108254489275063";
    }
    else {
      return api.sendMessage("❌ أمر غير صحيح. الاستخدام: <قبول|رفض> <رقم|جميع>", event.threadID, event.messageID);
    }

    let targetIDs = args.slice(1);

    if (args[1] === "جميع" || args[1] === "all") {
      targetIDs = Array.from({ length: listRequest.length }, (_, i) => i + 1);
    }

    const newTargetIDs = [];
    const promiseFriends = [];

    for (const stt of targetIDs) {
      const user = listRequest[parseInt(stt) - 1];
      if (!user) {
        failed.push(`🚫 لم يتم العثور على الطلب #${stt}`);
        continue;
      }
      form.variables.input.friend_requester_id = user.node.id;
      form.variables = JSON.stringify(form.variables);
      newTargetIDs.push(user);
      promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", form));
      form.variables = JSON.parse(form.variables);
    }

    const results = await Promise.allSettled(promiseFriends);
    
    results.forEach((result, index) => {
      const user = newTargetIDs[index];
      if (result.status === "fulfilled" && !JSON.parse(result.value).errors) {
        success.push(`✅ ${user.node.name} (${user.node.id})`);
      } else {
        failed.push(`❌ ${user.node.name} (${user.node.id})`);
      }
    });

    let replyMsg = "";
    if (success.length > 0) {
      const actionText = (args[0] === "قبول" || args[0] === "add") ? "قبول" : "رفض";
      replyMsg += `✨ تم بنجاح ${actionText} ${success.length} طلب(طلبات):\n${success.join("\n")}\n\n`;
    }
    if (failed.length > 0) {
      replyMsg += `⚠️ فشل في معالجة ${failed.length} طلب(طلبات):\n${failed.join("\n")}`;
    }

    if (replyMsg) {
      api.sendMessage(replyMsg, event.threadID, event.messageID);
    } else {
      api.unsendMessage(messageID);
      api.sendMessage("❌ لم يتم معالجة أي طلبات صالحة.", event.threadID);
    }

    api.unsendMessage(messageID);
  },

  onStart: async function ({ event, api, commandName }) {
    try {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
        fb_api_caller_class: "RelayModern",
        doc_id: "4499164963466303",
        variables: JSON.stringify({ input: { scale: 3 } })
      };
      
      const response = await api.httpPost("https://www.facebook.com/api/graphql/", form);
      const listRequest = JSON.parse(response).data.viewer.friending_possibilities.edges;
      
      if (!listRequest || listRequest.length === 0) {
        return api.sendMessage("🌟 ليس لديك أي طلبات صداقة معلقة!", event.threadID);
      }

      let msg = "📩 طلبات صداقة معلقة:\n\n";
      listRequest.forEach((user, index) => {
        msg += `🔹 ${index + 1}. ${user.node.name}\n`;
      });

      msg += "\n👇 الخيارات:\n";
      msg += "قبول رقم - لقبول طلب واحد\n";
      msg += "قبول جميع - لقبول جميع الطلبات\n";
      msg += "رفض رقم - لرفض طلب واحد\n";
      msg += "رفض جميع - لرفض جميع الطلبات";

      api.sendMessage(msg, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "قبول",
          author: event.senderID,
          messageID: info.messageID,
          listRequest,
          unsendTimeout: setTimeout(() => api.unsendMessage(info.messageID), 60000)
        });
      });
    } catch (e) {
      api.sendMessage(`❌ حدث خطأ: ${e.message}`, event.threadID);
    }
  }
};
