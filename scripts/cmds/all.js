module.exports = {
        config: {
                name: "الكل",
                aliases: ["all", "منشن"],
                version: "1.2",
                author: "Yamada KJ",
                countDown: 5,
                role: 1,
                description: {
                        vi: "Tag tất cả thành viên trong nhóm chat của bạn",
                        en: "Tag all members in your group chat",
                        ar: "منشن جميع أعضاء المجموعة"
                },
                category: "المحادثة",
                guide: {
                        vi: "   {pn} [nội dung | để trống]",
                        en: "   {pn} [content | empty]",
                        ar: "   {pn} [المحتوى | اتركه فارغاً]"
                }
        },

        

        langs: {
                en: {},
                ar: { command: "أمر", error: "خطأ", success: "نجح", usage: "الاستخدام", invalid: "غير صالح" },
                ar: { command: "أمر", error: "خطأ", success: "نجح", usage: "الاستخدام", invalid: "غير صالح" }
        },

        onStart: async function ({ message, event, args }) {
                const { participantIDs } = event;
                const lengthAllUser = participantIDs.length;
                const mentions = [];
                let body = args.join(" ") || "@all";
                let bodyLength = body.length;
                let i = 0;
                for (const uid of participantIDs) {
                        let fromIndex = 0;
                        if (bodyLength < lengthAllUser) {
                                body += body[bodyLength - 1];
                                bodyLength++;
                        }
                        if (body.slice(0, i).lastIndexOf(body[i]) != -1)
                                fromIndex = i;
                        mentions.push({
                                tag: body[i],
                                id: uid, fromIndex
                        });
                        i++;
                }
                message.reply({ body, mentions });
        }
};