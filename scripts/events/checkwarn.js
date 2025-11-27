module.exports = {
	config: {
		name: "checkwarn",
		version: "1.3",
		author: "Yamada KJ",
		category: "events"
	},

	langs: {
		ar: {
			warn: "تم تحذير العضو %1 3 مرات وتم حظره من المجموعة\n- الاسم: %1\n- المعرف: %2\n- لإزالة الحظر استخدم: \"%3warn unban <uid>\"",
			needPermission: "البوت يحتاج صلاحيات مشرف لطرد العضو المحظور"
		}
	},

	onStart: async ({ threadsData, message, event, api, client, getLang }) => {
		if (event.logMessageType == "log:subscribe")
			return async function () {
				const { threadID } = event;
				const { data } = await threadsData.get(event.threadID);
				const { warn: warnList } = data;
				if (!warnList)
					return;
				const { addedParticipants } = event.logMessageData;
				for (const user of addedParticipants) {
					const findUser = warnList.find(user => user.userID == user.userID);
					if (findUser && findUser.list >= 3) {
						const userName = user.fullName;
						const uid = user.userFbId;
						message.send({
							body: getLang("warn", userName, uid, client.getPrefix(threadID)),
							mentions: [{
								tag: userName,
								id: uid
							}]
						}, function () {
							api.removeUserFromGroup(uid, threadID, (err) => {
								if (err)
									return message.send(getLang("needPermission"));
							});
						});
					}
				}
			};
	}
};
