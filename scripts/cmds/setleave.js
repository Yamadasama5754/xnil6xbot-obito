const { drive, getStreamFromURL, getExtFromUrl, getTime } = global.utils;

module.exports = {
	config: {
		name: "setleave",
		aliases: ["setl", "وداع"],
		version: "1.7",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: {
			vi: "Chỉnh sửa nội dung/bật/tắt tin nhắn tạm biệt thành viên rời khỏi nhóm chat của bạn",
			en: "Edit content/turn on/off leave message when member leave your group chat",
			ar: "أمر",
			ar: "تعديل محتوى/تشغيل/إيقاف رسالة الوداع عند مغادرة عضو لمحادثتك الجماعية"
		},
		category: "custom",
		guide: {
			en: "   {pn} on: Turn on leave message\n   {pn} off: Turn off leave message\n   {pn} text [<content>]: edit message",
			ar: "{pn}",
			ar: "   {pn} on: تفعيل رسالة الوداع\n   {pn} off: إيقاف رسالة الوداع\n   {pn} text [<محتوى>]: تعديل الرسالة"
		}
	},

	langs: {
		vi: {
			turnedOn: "Bật tin nhắn tạm biệt thành công",
			turnedOff: "Tắt tin nhắn tạm biệt thành công",
			missingContent: "Vui lùng nhập nội dung tin nhắn",
			edited: "Đã chỉnh sửa nội dung tin nhắn tạm biệt của nhóm bạn thành:\n%1",
			reseted: "Đã reset nội dung tin nhắn tạm biệt",
			noFile: "Không có tệp đính kèm tin nhắn tạm biệt nào để xóa",
			resetedFile: "Đã reset tệp đính kèm thành công",
			missingFile: "Hãy phản hồi tin nhắn này kèm file ảnh/video/audio",
			addedFile: "Đã thêm %1 tệp đính kèm vào tin nhắn tạm biệt của nhóm bạn"
		},
		en: {
			turnedOn: "Turned on leave message successfully",
			turnedOff: "Turned off leave message successfully",
			missingContent: "Please enter content",
			edited: "Edited leave message content of your group to:\n%1",
			reseted: "Reseted leave message content",
			noFile: "No leave message attachment file to reset",
			resetedFile: "Reseted leave message attachment file successfully",
			missingFile: "Please reply this message with image/video/audio file",
			addedFile: "Added %1 attachment file to your leave message"
		},
		ar: {
			turnedOn: "تم تفعيل رسالة الوداع بنجاح",
			turnedOff: "تم إيقاف رسالة الوداع بنجاح",
			missingContent: "يرجى إدخال المحتوى",
			edited: "تم تعديل محتوى رسالة الوداع لمجموعتك إلى:\n%1",
			reseted: "تم إعادة تعيين محتوى رسالة الوداع",
			noFile: "لا توجد ملفات مرفقة لحذفها",
			resetedFile: "تم إعادة تعيين ملفات الرسالة بنجاح",
			missingFile: "يرجى الرد على هذه الرسالة بملف صورة/فيديو/صوت",
			addedFile: "تم إضافة %1 ملف مرفق لرسالة وداعك"
		}
	},

	onStart: async function ({ args, threadsData, message, event, commandName, getLang }) {
		const { threadID, senderID, body } = event;
		const { data, settings } = await threadsData.get(threadID);

		switch (args[0]) {
			case "text": {
				if (!args[1])
					return message.reply(getLang("missingContent"));
				else if (args[1] == "reset")
					delete data.leaveMessage;
				else
					data.leaveMessage = body.slice(body.indexOf(args[0]) + args[0].length).trim();
				await threadsData.set(threadID, {
					data
				});
				message.reply(data.leaveMessage ? getLang("edited", data.leaveMessage) : getLang("reseted"));
				break;
			}
			case "file": {
				if (args[1] == "reset") {
					const { leaveAttachment } = data;
					if (!leaveAttachment)
						return message.reply(getLang("noFile"));
					try {
						await Promise.all(data.leaveAttachment.map(fileId => drive.deleteFile(fileId)));
						delete data.leaveAttachment;
					}
					catch (e) { }

					await threadsData.set(threadID, {
						data
					});
					message.reply(getLang("resetedFile"));
				}
				break;
			}
			case "on": {
				settings.leaveMessage = true;
				await threadsData.set(threadID, {
					settings
				});
				message.reply(getLang("turnedOn"));
				break;
			}
			case "off": {
				settings.leaveMessage = false;
				await threadsData.set(threadID, {
					settings
				});
				message.reply(getLang("turnedOff"));
				break;
			}
			default:
				return message.SyntaxError();
		}
	}
};
