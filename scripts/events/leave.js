const { getTime, drive } = global.utils;

module.exports = {
	config: {
		name: "leave",
		version: "1.5",
		author: "Yamada KJ",
		category: "events"
	},

	langs: {
		ar: {
			session1: "الصباح",
			session2: "الظهيرة",
			session3: "بعد الظهر",
			session4: "المساء",
			leaveType1: "غادر",
			leaveType2: "تم طرده من",
			defaultLeaveMessage: "{userName} {type} المجموعة",
			leaveCustom: "ناقص واحد ناقص مشكلة 😺",
			kickCustom: "لاتنسى تسكر الباب وراك 🐢"
		}
	},

	onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
		if (event.logMessageType == "log:unsubscribe")
			return async function () {
				const { threadID } = event;
				const threadData = await threadsData.get(threadID);
				if (!threadData.settings.sendLeaveMessage)
					return;
				const { leftParticipantFbId } = event.logMessageData;
				if (leftParticipantFbId == api.getCurrentUserID())
					return;
				const hours = getTime("HH");

				const threadName = threadData.threadName;
				const userName = await usersData.getName(leftParticipantFbId);

				// تحديد نوع المغادرة (طوعية أو إجبارية)
				const isLeave = leftParticipantFbId == event.author;
				const reason = isLeave ? "leave" : "kick";
				
				// اختيار الرسالة المناسبة
				const customMessage = reason === "leave" ? getLang("leaveCustom") : getLang("kickCustom");
				let leaveMessage = threadData.data.leaveMessage || customMessage;

				const form = {
					mentions: leaveMessage.match(/\{userNameTag\}/g) ? [{
						tag: userName,
						id: leftParticipantFbId
					}] : null
				};

				leaveMessage = leaveMessage
					.replace(/\{userName\}|\{userNameTag\}/g, userName)
					.replace(/\{type\}/g, isLeave ? getLang("leaveType1") : getLang("leaveType2"))
					.replace(/\{threadName\}|\{boxName\}/g, threadName)
					.replace(/\{time\}/g, hours)
					.replace(/\{session\}/g, hours <= 10 ?
						getLang("session1") :
						hours <= 12 ?
							getLang("session2") :
							hours <= 18 ?
								getLang("session3") :
								getLang("session4")
					);

				form.body = leaveMessage;

				if (leaveMessage.includes("{userNameTag}")) {
					form.mentions = [{
						id: leftParticipantFbId,
						tag: userName
					}];
				}

				if (threadData.data.leaveAttachment) {
					const files = threadData.data.leaveAttachment;
					const attachments = files.reduce((acc, file) => {
						acc.push(drive.getFile(file, "stream"));
						return acc;
					}, []);
					form.attachment = (await Promise.allSettled(attachments)).map((i) => i.value).filter((i) => i);
				}

				return message.send(form);
			};
	}
};
