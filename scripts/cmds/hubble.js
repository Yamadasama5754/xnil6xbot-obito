const axios = require('axios');
const fs = require('fs-extra');

const { getStreamFromURL } = global.utils;

const pathData = __dirname + '/assets/hubble/nasa.json';
if (!fs.existsSync(__dirname + '/assets/hubble'))
	fs.mkdirSync(__dirname + '/assets/hubble');

let hubbleData;

module.exports = {
	config: {
		name: "هابل",
		aliases: ["hubble", "صورة_هابل"],
		version: "1.3",
		author: "Yamada KJ",
		countDown: 5,
		role: 0,
		description: "عرض صور تلسكوب هابل",
		category: "صور",
		guide: "{pn} [تاريخ (mm-dd)]"
	},

	langs: {
		ar: {
			invalidDate: "التاريخ الذي أدخلته غير صحيح، يرجى إدخاله بصيغة mm-dd",
			noImage: "لم يتم العثور على صور في هذا التاريخ"
		}
	},

	onLoad: async function () {
		if (!fs.existsSync(pathData)) {
			const res = await axios.get('https://raw.githubusercontent.com/ntkhang03/Goat-Bot-V2/main/scripts/cmds/assets/hubble/nasa.json');
			fs.writeFileSync(pathData, JSON.stringify(res.data, null, 2));
		}
		hubbleData = JSON.parse(fs.readFileSync(pathData));
	},

	onStart: async function ({ message, args, getLang }) {
		const date = args[0] || "";
		const dateText = checkValidDate(date);
		if (!date || !dateText)
			return message.reply(getLang('invalidDate'));
		const data = hubbleData.find(e => e.date.startsWith(dateText));
		if (!data)
			return message.reply(getLang('noImage'));
		const { image, name, caption, url } = data;
		const getImage = await getStreamFromURL('https://imagine.gsfc.nasa.gov/hst_bday/images/' + image);
		const msg = `📅 التاريخ: ${dateText}\n🌀 الاسم: ${name}\n📖 الشرح: ${caption}\n🔗 المصدر: ${url}`;
		message.reply({
			body: msg,
			attachment: getImage
		});
	}
};

function checkValidDate(date) {
	if (!date || date.length !== 5 || date[2] !== "-")
		return null;
	const [month, day] = date.split("-");
	const m = parseInt(month);
	const d = parseInt(day);
	if (isNaN(m) || isNaN(d) || m < 1 || m > 12 || d < 1 || d > 31)
		return null;
	return `${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
