const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "قبول",
    aliases: ['acp', 'accept'],
    version: "1.0",
    author: "Yamada KJ",
    countDown: 8,
    role: 2,
    description: "إدارة طلبات الصداقة بأناقة",
    category: "أدوات",
    guide: "{pn} [add|del] [رقم|جميع]"
  },

  langs: {
    ar: {
      invalidCommand: "❌ أمر غير صحيح. الاستخدام: <add|del> <رقم|جميع>",
      cannotFind: "🚫 لم يتم العثور على الطلب #%1",
      acceptedFailed: "قبول",
      rejectedFailed: "رفض",
      successfully: "✨ تم بنجاح %1 %2 طلب(طلبات):\n%3\n\n",
      failedProcess: "⚠️ فشل في معالجة %1 طلب(طلبات):\n%2",
      noValid: "❌ لم يتم معالجة أي طلبات صالحة.",
      noPending: "🌟 ليس لديك أي طلبات صداقة معلقة!",
      pendingHeader: "📩 طلبات صداقة معلقة:\n\n",
      userItem: "🔹 %1. %2\n",
      instructions: "\n.قبول add <رقم> أو .قبول add جميع - لقبول الطلبات\n.قبول del <رقم> أو .قبول del جميع - لرفض الطلبات",
      error: "❌ حدث خطأ: %1"
    }
  },

  onReply: async function ({ message, Reply, event, api, commandName, getLang }) {
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

    if (args[0] === "add") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      form.doc_id = "3147613905362928";
    }
    else if (args[0] === "del") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      form.doc_id = "4108254489275063";
    }
    else {
      return api.sendMessage(getLang("invalidCommand"), event.threadID, event.messageID);
    }

    let targetIDs = args.slice(1);

    if (args[1] === "all" || args[1] === "جميع") {
      targetIDs = Array.from({ length: listRequest.length }, (_, i) => i + 1);
    }

    const newTargetIDs = [];
    const promiseFriends = [];

    for (const stt of targetIDs) {
      const user = listRequest[parseInt(stt) - 1];
      if (!user) {
        failed.push(getLang("cannotFind", stt));
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
      const actionText = args[0] === 'add' ? getLang("acceptedFailed") : getLang("rejectedFailed");
      replyMsg += getLang("successfully", actionText, success.length, success.join("\n"));
    }
    if (failed.length > 0) {
      replyMsg += getLang("failedProcess", failed.length, failed.join("\n"));
    }

    if (replyMsg) {
      api.sendMessage(replyMsg, event.threadID, event.messageID);
    } else {
      api.unsendMessage(messageID);
      api.sendMessage(getLang("noValid"), event.threadID);
    }

    api.unsendMessage(messageID);
  },

  onStart: async function ({ event, api, commandName, getLang }) {
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
        return api.sendMessage(getLang("noPending"), event.threadID);
      }

      let msg = getLang("pendingHeader");
      listRequest.forEach((user, index) => {
        msg += getLang("userItem", index + 1, user.node.name);
      });

      msg += getLang("instructions");

      api.sendMessage(msg, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          author: event.senderID,
          messageID: info.messageID,
          listRequest,
          unsendTimeout: setTimeout(() => api.unsendMessage(info.messageID), 60000)
        });
      });
    } catch (e) {
      api.sendMessage(getLang("error", e.message), event.threadID);
    }
  }
};
