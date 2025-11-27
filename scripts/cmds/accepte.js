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

    const success = [];
    const failed = [];

    let targetIDs = args.slice(1);

    if (args[1] === "جميع" || args[1] === "all") {
      targetIDs = Array.from({ length: listRequest.length }, (_, i) => i + 1);
    }

    const isAccepting = args[0] === "قبول" || args[0] === "add";
    const actionType = isAccepting ? "accept" : "delete";
    const actionAr = isAccepting ? "قبول" : "رفض";

    for (const stt of targetIDs) {
      const user = listRequest[parseInt(stt) - 1];
      if (!user) {
        failed.push(`🚫 لم يتم العثور على الطلب #${stt}`);
        continue;
      }

      try {
        const userId = user.node.id;
        
        // محاولة استخدام API بسيط مباشر
        if (isAccepting) {
          // accept friend request
          await api.httpPost("https://www.facebook.com/api/graphql/", {
            av: api.getCurrentUserID(),
            fb_api_caller_class: "RelayModern",
            fb_api_req_friendly_name: "FriendingCometFriendRequestConfirmMutation",
            doc_id: "3147613905362928",
            variables: JSON.stringify({
              input: {
                source: "friends_tab",
                actor_id: api.getCurrentUserID(),
                friend_requester_id: userId,
                client_mutation_id: Math.round(Math.random() * 19).toString()
              },
              scale: 3
            })
          });
        } else {
          // delete friend request
          await api.httpPost("https://www.facebook.com/api/graphql/", {
            av: api.getCurrentUserID(),
            fb_api_caller_class: "RelayModern",
            fb_api_req_friendly_name: "FriendingCometFriendRequestDeleteMutation",
            doc_id: "4108254489275063",
            variables: JSON.stringify({
              input: {
                source: "friends_tab",
                actor_id: api.getCurrentUserID(),
                friend_requester_id: userId,
                client_mutation_id: Math.round(Math.random() * 19).toString()
              },
              scale: 3
            })
          });
        }

        success.push(`✅ ${user.node.name}`);
      } catch (err) {
        failed.push(`❌ ${user.node.name}`);
        console.error(`Error processing ${user.node.name}:`, err.message);
      }
    }

    let replyMsg = "";
    if (success.length > 0) {
      replyMsg += `✨ تم بنجاح ${actionAr} ${success.length} طلب(طلبات):\n${success.join("\n")}\n\n`;
    }
    if (failed.length > 0) {
      replyMsg += `⚠️ لم يتم معالجة ${failed.length} طلب(طلبات):\n${failed.join("\n")}`;
    }

    if (!replyMsg) {
      replyMsg = "❌ أمر غير صحيح. الاستخدام:\n• قبول جميع\n• رفض جميع\n• قبول 1\n• رفض 2";
    }

    api.sendMessage(replyMsg, event.threadID, event.messageID);
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
