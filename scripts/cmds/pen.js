module.exports = {
	config: {
		name: "قيد_الانتظار",
		aliases: ["pen", "pending"],
		version: "1.1",
		author: "Yamada KJ",
		countDown: 5,
		role: 2,
		description: "إدارة طلبات المجموعات المعلقة",
		category: "المالك",
		guide: "{pn} - عرض القائمة المعلقة\n{pn} approve <أرقام> - الموافقة على المجموعات المختارة\n{pn} cancel <أرقام> - رفض المجموعات المختارة"
	},

	langs: {
		ar: {
			invalidNumber: "⚠️ | إدخال غير صحيح\n━━━━━━━━━━━━━━\n\n» %1 ليس رقماً صحيحاً",
			cancelSuccess: "❌ | تم الرفض\n━━━━━━━━━━━━━━\n\n» تم رفض %1 طلب(ات) بنجاح",
			approveSuccess: "✅ | تم الموافقة\n━━━━━━━━━━━━━━\n\n» تم الموافقة على %1 مجموعة(ات) بنجاح",
			cantGetPendingList: "⚠️ | خطأ\n━━━━━━━━━━━━━━\n\n» فشل جلب القائمة المعلقة",
			returnListPending: "📋 | المجموعات المعلقة (%1)\n━━━━━━━━━━━━━━\n\n%2",
			returnListClean: "ℹ️ | لا توجد مجموعات معلقة",
			noSelection: "⚠️ | إدخال مفقود",
			instruction: "📝 | تعليمات\n━━━━━━━━━━━━━━\n\n1. عرض المجموعات المعلقة\n2. موافقة: {pn} approve <أرقام>\n3. رفض: {pn} cancel <أرقام>"
		}
	},

	onStart: async function({ api, event, getLang, commandName, args }) {
		const { threadID, messageID } = event;

		if (args[0]?.toLowerCase() === 'help') {
			return api.sendMessage(getLang("instruction").replace(/{pn}/g, commandName), threadID, messageID);
		}

		try {
			const [spam, pending] = await Promise.all([
				api.getThreadList(100, null, ["OTHER"]).catch(() => []),
				api.getThreadList(100, null, ["PENDING"]).catch(() => [])
			]);

			const list = [...spam, ...pending]
				.filter(group => group.isSubscribed && group.isGroup)
				.map((group, index) => ({
					...group,
					displayIndex: index + 1
				}));

			if (list.length === 0) {
				return api.sendMessage(getLang("returnListClean"), threadID, messageID);
			}

			const msg = list.map(group => 
				`╭───────────────\n` +
				`│ ${group.displayIndex}. ${group.name || 'مجموعة بدون اسم'}\n` +
				`│ 👥 الأعضاء: ${group.participantIDs.length}\n` +
				`│ 🆔 الآيدي: ${group.threadID}\n` +
				`╰───────────────`
			).join('\n\n');

			return api.sendMessage(getLang("returnListPending", list.length, msg), threadID, messageID);
		} catch (error) {
			return api.sendMessage(getLang("cantGetPendingList"), threadID, messageID);
		}
	}
};
