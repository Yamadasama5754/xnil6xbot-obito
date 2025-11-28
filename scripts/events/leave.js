const { getTime, drive } = global.utils;

module.exports = {
        config: {
                name: "leave",
                version: "1.4",
                author: "Yamada KJ",
                category: "events"
        },

        langs: {
                ar: {
                        session1: "الصباح",
                        session2: "الظهيرة",
                        session3: "بعد الظهر",
                        session4: "المساء",
                        leaveType1: "غادر {userName} كان صنما لم نكن بحاجته اصلا لاتنسى تسكر الباب وراك 🐢🔱",
                        leaveType2: "تم طرده من المجموعة {userName} خذوه عبرة 😺📜",
                        defaultLeaveMessage: "{type}"
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

                                let { leaveMessage = getLang("defaultLeaveMessage") } = threadData.data;
                                const form = {
                                        mentions: leaveMessage.match(/\{userNameTag\}/g) ? [{
                                                tag: userName,
                                                id: leftParticipantFbId
                                        }] : null
                                };

                                const typeMessage = leftParticipantFbId == event.author ? getLang("leaveType1") : getLang("leaveType2");
                                
                                leaveMessage = leaveMessage
                                        .replace(/\{userName\}|\{userNameTag\}/g, userName)
                                        .replace(/\{type\}/g, typeMessage)
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
                                        form.attachment = (await Promise.allSettled(attachments))
                                                .filter(({ status }) => status == "fulfilled")
                                                .map(({ value }) => value);
                                }
                                message.send(form);
                        };
        }
};
