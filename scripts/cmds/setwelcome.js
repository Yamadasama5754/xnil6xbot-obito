const { drive, getStreamFromURL, getExtFromUrl, getTime } = global.utils;

module.exports = {
	config: {
		name: "setwelcome",
		aliases: ["setwc", "ترحيب"],
		version: "1.7",
		author: "NTKhang",
		countDown: 5,
		role: 1,
		description: {
			vi: "Chỉnh sửa nội dung tin nhắn chào mừng thành viên mới tham gia vào nhóm chat của bạn",
			en: "Edit welcome message content when new member join your group chat",
			ar: "تعديل محتوى رسالة الترحيب عند انضمام عضو جديد لمحادثتك الجماعية"
		},
		category: "custom",
		guide: {
			en: {
				body: "   {pn} text [<content> | reset]: edit text content or reset to default"
					+ "\n   {pn} file reset: delete attachments"
			},
			ar: {
				body: "   {pn} text [<محتوى> | reset]: تعديل محتوى النص أو إعادة تعيين للافتراضي"
					+ "\n   {pn} file reset: حذف الملفات المرفقة"
			}
		}
	},

	langs: {
		vi: {
			turnedOn: "Đã bật chức năng chào mừng thành viên mới",
			turnedOff: "Đã tắt chức năng chào mừng thành viên mới",
			missingContent: "Vui lùng nhập nội dung tin nhắn",
			edited: "Đã chỉnh sửa nội dung tin nhắn chào mừng của nhóm bạn thành: %1",
			reseted: "Đã reset nội dung tin nhắn chào mừng",
			noFile: "Không có tệp đính kèm tin nhắn chào mừng nào để xóa",
			resetedFile: "Đã reset tệp đính kèm thành công",
			missingFile: "Hãy phản hồi tin nhắn này kèm file ảnh/video/audio",
			addedFile: "Đã thêm %1 tệp đính kèm vào tin nhắn chào mừng của nhóm bạn"
		},
		en: {
			turnedOn: "Turned on welcome message",
			turnedOff: "Turned off welcome message",
			missingContent: "Please enter welcome message content",
			edited: "Edited welcome message content of your group to: %1",
			reseted: "Reseted welcome message content",
			noFile: "No file attachments to delete",
			resetedFile: "Reseted file attachments successfully",
			missingFile: "Please reply this message with image/video/audio file",
			addedFile: "Added %1 file attachments to your group welcome message"
		},
		ar: {
			turnedOn: "تم تفعيل رسالة الترحيب",
			turnedOff: "تم إيقاف رسالة الترحيب",
			missingContent: "يرجى إدخال محتوى رسالة الترحيب",
			edited: "تم تعديل محتوى رسالة الترحيب لمجموعتك إلى: %1",
			reseted: "تم إعادة تعيين محتوى رسالة الترحيب",
			noFile: "لا توجد ملفات مرفقة لحذفها",
			resetedFile: "تم إعادة تعيين الملفات المرفقة بنجاح",
			missingFile: "يرجى الرد على هذه الرسالة بملف صورة/فيديو/صوت",
			addedFile: "تم إضافة %1 ملف مرفق لرسالة ترحيبك"
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
					delete data.welcomeMessage;
				else
					data.welcomeMessage = body.slice(body.indexOf(args[0]) + args[0].length).trim();
				await threadsData.set(threadID, {
					data
				});
				message.reply(data.welcomeMessage ? getLang("edited", data.welcomeMessage) : getLang("reseted"));
				break;
			}
			case "file": {
				if (args[1] == "reset") {
					const { welcomeAttachment } = data;
					if (!welcomeAttachment)
						return message.reply(getLang("noFile"));
					try {
						await Promise.all(data.welcomeAttachment.map(fileId => drive.deleteFile(fileId)));
						delete data.welcomeAttachment;
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
				settings.welcomeMessage = true;
				await threadsData.set(threadID, {
					settings
				});
				message.reply(getLang("turnedOn"));
				break;
			}
			case "off": {
				settings.welcomeMessage = false;
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
