const axios = require('axios');
const baseApiUrl = async () => {
    return "https://www.noobs-api.rf.gd/dipto";
};

module.exports.config = {
    name: "دردشة",
    aliases: ["baby", "bby", "بوت", "حبيبي"],
    version: "6.9.0",
    author: "Yamada KJ",
    countDown: 0,
    role: 0,
    description: "دردشة ذكية مع البوت",
    category: "دردشة",
    guide: "{pn} [رسالة] أو\nteach [رسالتك] - [رد1], [رد2]... أو\nremove [رسالتك] أو\nlist أو\nedit [رسالتك] - [رسالة جديدة]"
};

module.exports.langs = {
    ar: {
        askMe: ["قل لي شيء", "نعم؟", "اكتب help bby", "اكتب !دردشة مرحبا"],
        invalidFormat: "❌ صيغة غير صحيحة!",
        repliesAdded: "✅ تمت إضافة الردود %1\nالمعلم: %2\nعدد التعليمات: %3",
        totalTeach: "إجمالي التعليمات = %1\n👑 قائمة معلمي البوت\n%2",
        message: "الرسالة %1 = %2",
        changed: "تم التغيير %1",
        checkConsole: "تحقق من الكونسول للخطأ",
        error: "خطأ: %1"
    }
};

module.exports.onStart = async ({
    api,
    event,
    args,
    usersData,
    getLang
}) => {
    const link = `${await baseApiUrl()}/baby`;
    const dipto = args.join(" ").toLowerCase();
    const uid = event.senderID;
    let command, comd, final;

    try {
        if (!args[0]) {
            const ran = getLang("askMe");
            return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, event.messageID);
        }

        if (args[0] === 'remove' || args[0] === 'حذف') {
            const fina = dipto.replace("remove ", "").replace("حذف ", "");
            const dat = (await axios.get(`${link}?remove=${fina}&senderID=${uid}`)).data.message;
            return api.sendMessage(dat, event.threadID, event.messageID);
        }

        if (args[0] === 'rm' && dipto.includes('-')) {
            const [fi, f] = dipto.replace("rm ", "").split(' - ');
            const da = (await axios.get(`${link}?remove=${fi}&index=${f}`)).data.message;
            return api.sendMessage(da, event.threadID, event.messageID);
        }

        if (args[0] === 'list' || args[0] === 'قائمة') {
            if (args[1] === 'all' || args[1] === 'الكل') {
                const data = (await axios.get(`${link}?list=all`)).data;
                const teachers = await Promise.all(data.teacher.teacherList.map(async (item) => {
                    const number = Object.keys(item)[0];
                    const value = item[number];
                    const name = (await usersData.get(number)).name;
                    return {
                        name,
                        value
                    };
                }));
                teachers.sort((a, b) => b.value - a.value);
                const output = teachers.map((t, i) => `${i + 1}/ ${t.name}: ${t.value}`).join('\n');
                return api.sendMessage(`إجمالي التعليمات = ${data.length}\n👑 قائمة معلمي البوت\n${output}`, event.threadID, event.messageID);
            } else {
                const d = (await axios.get(`${link}?list=all`)).data.length;
                return api.sendMessage(`إجمالي التعليمات = ${d}`, event.threadID, event.messageID);
            }
        }

        if (args[0] === 'msg' || args[0] === 'رسالة') {
            const fuk = dipto.replace("msg ", "").replace("رسالة ", "");
            const d = (await axios.get(`${link}?list=${fuk}`)).data.data;
            return api.sendMessage(`الرسالة ${fuk} = ${d}`, event.threadID, event.messageID);
        }

        if (args[0] === 'edit' || args[0] === 'تعديل') {
            const command = dipto.split(' - ')[1];
            if (command.length < 2) return api.sendMessage('❌ صيغة غير صحيحة! استخدم edit [رسالتك] - [الرد الجديد]', event.threadID, event.messageID);
            const dA = (await axios.get(`${link}?edit=${args[1]}&replace=${command}&senderID=${uid}`)).data.message;
            return api.sendMessage(`تم التغيير ${dA}`, event.threadID, event.messageID);
        }

        if ((args[0] === 'teach' || args[0] === 'علم') && args[1] !== 'amar' && args[1] !== 'react') {
            [comd, command] = dipto.split(' - ');
            final = comd.replace("teach ", "").replace("علم ", "");
            if (command.length < 2) return api.sendMessage('❌ صيغة غير صحيحة!', event.threadID, event.messageID);
            const re = await axios.get(`${link}?teach=${final}&reply=${command}&senderID=${uid}`);
            const tex = re.data.message;
            const teacher = (await usersData.get(re.data.teacher)).name;
            return api.sendMessage(`✅ تمت إضافة الردود ${tex}\nالمعلم: ${teacher}\nعدد التعليمات: ${re.data.teachs}`, event.threadID, event.messageID);
        }

        if ((args[0] === 'teach' || args[0] === 'علم') && args[1] === 'react') {
            [comd, command] = dipto.split(' - ');
            final = comd.replace("teach react ", "").replace("علم react ", "");
            if (command.length < 2) return api.sendMessage('❌ صيغة غير صحيحة!', event.threadID, event.messageID);
            const tex = (await axios.get(`${link}?teach=${final}&react=${command}`)).data.message;
            return api.sendMessage(`✅ تمت إضافة الردود ${tex}`, event.threadID, event.messageID);
        }

        const d = (await axios.get(`${link}?text=${dipto}&senderID=${uid}&font=1`)).data.reply;
        api.sendMessage(d, event.threadID, (error, info) => {
            global.GoatBot.onReply.set(info.messageID, {
                commandName: this.config.name,
                type: "reply",
                messageID: info.messageID,
                author: event.senderID,
                d,
                apiUrl: link
            });
        }, event.messageID);

    } catch (e) {
        console.log(e);
        api.sendMessage("تحقق من الكونسول للخطأ", event.threadID, event.messageID);
    }
};

module.exports.onReply = async ({
    api,
    event,
    Reply
}) => {
    try {
        if (event.type == "message_reply") {
            const a = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(event.body?.toLowerCase())}&senderID=${event.senderID}&font=1`)).data.reply;
            await api.sendMessage(a, event.threadID, (error, info) => {
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    type: "reply",
                    messageID: info.messageID,
                    author: event.senderID,
                    a
                });
            }, event.messageID);
        }
    } catch (err) {
        return api.sendMessage(`خطأ: ${err.message}`, event.threadID, event.messageID);
    }
};

module.exports.onChat = async ({
    api,
    event,
    message
}) => {
    try {
        const body = event.body ? event.body?.toLowerCase() : ""
        if (body.startsWith("baby") || body.startsWith("bby") || body.startsWith("bot") || body.startsWith("بوت") || body.startsWith("حبيبي") || body.startsWith("دردشة")) {
            const arr = body.replace(/^\S+\s*/, "")
            const randomReplies = ["😚", "نعم 😀، أنا هنا", "ماذا تريد؟", "قل لي ماذا تحتاج"];
            if (!arr) {

                await api.sendMessage(randomReplies[Math.floor(Math.random() * randomReplies.length)], event.threadID, (error, info) => {
                    if (!info) message.reply("info obj not found")
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        type: "reply",
                        messageID: info.messageID,
                        author: event.senderID
                    });
                }, event.messageID)
            }
            const a = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(arr)}&senderID=${event.senderID}&font=1`)).data.reply;
            await api.sendMessage(a, event.threadID, (error, info) => {
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    type: "reply",
                    messageID: info.messageID,
                    author: event.senderID,
                    a
                });
            }, event.messageID)
        }
    } catch (err) {
        return api.sendMessage(`خطأ: ${err.message}`, event.threadID, event.messageID);
    }
};
