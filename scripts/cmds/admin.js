const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
	config: {
		name: "مشرف",
		aliases: ["admin", "ادمن"],
		version: "1.6",
		author: "Yamada KJ",
		cooldowns: 5,
		usePrefix: true,
		role: 2,
		description: "إضافة، حذف، تعديل صلاحيات المشرف",
		category: "المالك",
		guide: "{pn} [add | -a | اضافة] <uid | @tag>: إضافة صلاحية مشرف للمستخدم\n{pn} [remove | -r | حذف] <uid | @tag>: إزالة صلاحية مشرف من المستخدم\n{pn} [list | -l | قائمة]: عرض قائمة المشرفين"
	},

	onStart: async function ({ message, args, usersData, event }) {
		const getLang = (key, ...values) => {
			const messages = {
				added: `✅ تمت إضافة صلاحية مشرف لـ ${values[0]} مستخدم:\n${values[1]}`,
				alreadyAdmin: `\n⚠️ ${values[0]} مستخدم لديهم صلاحية مشرف بالفعل:\n${values[1]}`,
				missingIdAdd: "⚠️ يرجى إدخال ID أو الإشارة للمستخدم لإضافة صلاحية مشرف",
				removed: `✅ تمت إزالة صلاحية مشرف من ${values[0]} مستخدم:\n${values[1]}`,
				notAdmin: `⚠️ ${values[0]} مستخدم ليس لديهم صلاحية مشرف:\n${values[1]}`,
				missingIdRemove: "⚠️ يرجى إدخال ID أو الإشارة للمستخدم لإزالة صلاحية مشرف",
				listAdmin: `👑 قائمة المشرفين:\n${values[0]}`,
				noAdmins: "📭 لا يوجد مشرفين حالياً"
			};
			return messages[key] || key;
		};

		switch (args[0]) {
			case "add":
			case "-a":
			case "اضافة": {
				if (args[1]) {
					let uids = [];
					if (Object.keys(event.mentions).length > 0)
						uids = Object.keys(event.mentions);
					else if (event.messageReply)
						uids.push(event.messageReply.senderID);
					else
						uids = args.slice(1).filter(arg => !isNaN(arg));

					const notAdminIds = [];
					const adminIds = [];

					for (const uid of uids) {
						if (config.adminBot.includes(uid))
							adminIds.push(uid);
						else
							notAdminIds.push(uid);
					}

					config.adminBot.push(...notAdminIds);
					const getNames = await Promise.all(uids.map(uid => 
						usersData.getName(uid).then(name => ({ uid, name }))
					));

					writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

					let response = "";
					if (notAdminIds.length > 0) {
						response += getLang("added", 
							notAdminIds.length, 
							getNames
								.filter(({ uid }) => notAdminIds.includes(uid))
								.map(({ uid, name }) => `• ${name} (${uid})`)
								.join("\n")
						);
					}
					if (adminIds.length > 0) {
						response += getLang("alreadyAdmin", 
							adminIds.length, 
							getNames
								.filter(({ uid }) => adminIds.includes(uid))
								.map(({ uid, name }) => `• ${name} (${uid})`)
								.join("\n")
						);
					}

					return message.reply(response);
				}
				else
					return message.reply(getLang("missingIdAdd"));
			}

			case "remove":
			case "-r":
			case "حذف": {
				if (args[1]) {
					let uids = [];
					if (Object.keys(event.mentions).length > 0)
						uids = Object.keys(event.mentions);
					else if (event.messageReply)
						uids.push(event.messageReply.senderID);
					else
						uids = args.slice(1).filter(arg => !isNaN(arg));

					const notAdminIds = [];
					const adminIds = [];

					for (const uid of uids) {
						if (config.adminBot.includes(uid))
							adminIds.push(uid);
						else
							notAdminIds.push(uid);
					}

					for (const uid of adminIds)
						config.adminBot.splice(config.adminBot.indexOf(uid), 1);

					const getNames = await Promise.all(adminIds.map(uid => 
						usersData.getName(uid).then(name => ({ uid, name }))
					));

					writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

					let response = "";
					if (adminIds.length > 0) {
						response += getLang("removed", 
							adminIds.length, 
							getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")
						);
					}
					if (notAdminIds.length > 0) {
						response += getLang("notAdmin", 
							notAdminIds.length, 
							notAdminIds.map(uid => `• ${uid}`).join("\n")
						);
					}

					return message.reply(response);
				}
				else
					return message.reply(getLang("missingIdRemove"));
			}

			case "list":
			case "-l":
			case "قائمة": {
				if (config.adminBot.length === 0)
					return message.reply(getLang("noAdmins"));

				const getNames = await Promise.all(config.adminBot.map(uid => 
					usersData.getName(uid).then(name => ({ uid, name }))
				));
				return message.reply(getLang("listAdmin", 
					getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")
				));
			}

			default:
				return message.reply("❌ استخدام خاطئ!\n\nالأوامر:\n• /مشرف اضافة <@tag أو ID>: إضافة مشرف\n• /مشرف حذف <@tag أو ID>: حذف مشرف\n• /مشرف قائمة: عرض المشرفين");
		}
	}
};
