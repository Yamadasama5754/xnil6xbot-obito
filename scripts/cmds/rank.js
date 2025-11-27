const Canvas = require("canvas");
const { uploadZippyshare } = global.utils;

const defaultFontName = "BeVietnamPro-SemiBold";
const defaultPathFontName = `${__dirname}/assets/font/BeVietnamPro-SemiBold.ttf`;
const { randomString } = global.utils;
const percentage = total => total / 100;

Canvas.registerFont(`${__dirname}/assets/font/BeVietnamPro-Bold.ttf`, {
	family: "BeVietnamPro-Bold"
});
Canvas.registerFont(defaultPathFontName, {
	family: defaultFontName
});

let deltaNext;
const expToLevel = (exp, deltaNextLevel = deltaNext) => Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNextLevel)) / 2);
const levelToExp = (level, deltaNextLevel = deltaNext) => Math.floor(((Math.pow(level, 2) - level) * deltaNextLevel) / 2);
global.client.makeRankCard = makeRankCard;

module.exports = {
	config: {
		name: "المرتبة",
		aliases: ["rank", "مستوى", "رتبة"],
		version: "1.7",
		author: "Yamada KJ",
		countDown: 5,
		role: 0,
		description: "عرض مستواك أو مستوى الشخص المُشار إليه. يمكنك إشارة عدة أشخاص",
		category: "المرتبة",
		guide: "{pn} [فارغ | @إشارات]",
		envConfig: {
			deltaNext: 5
		}
	},

	langs: {
		ar: {
			rankCard: "بطاقة المرتبة",
			level: "المستوى",
			exp: "الخبرة",
			rank: "المرتبة"
		}
	},

	onStart: async function ({ message, event, usersData, threadsData, commandName, envCommands, api }) {
		deltaNext = envCommands[commandName].deltaNext;
		let targetUsers;
		const arrayMentions = Object.keys(event.mentions);

		if (arrayMentions.length == 0)
			targetUsers = [event.senderID];
		else
			targetUsers = arrayMentions;

		const rankCards = await Promise.all(targetUsers.map(async userID => {
			const rankCard = await makeRankCard(userID, usersData, threadsData, event.threadID, deltaNext, api);
			rankCard.path = `${randomString(10)}.png`;
			return rankCard;
		}));

		return message.reply({
			attachment: rankCards
		});
	},

	onChat: async function ({ usersData, event }) {
		let { exp } = await usersData.get(event.senderID);
		if (isNaN(exp) || typeof exp != "number")
			exp = 0;
		try {
			await usersData.set(event.senderID, {
				exp: exp + 1
			});
		}
		catch (e) { }
	}
};

const defaultDesignCard = {
	widthCard: 2000,
	heightCard: 500,
	main_color: "#474747",
	sub_color: "rgba(255, 255, 255, 0.5)",
	alpha_subcard: 0.9,
	exp_color: "#e1e1e1",
	expNextLevel_color: "#3f3f3f",
	text_color: "#000000"
};

async function makeRankCard(userID, usersData, threadsData, threadID, deltaNext, api = global.GoatBot.fcaApi) {
	const { exp } = await usersData.get(userID);
	const levelUser = expToLevel(exp, deltaNext);

	const expNextLevel = levelToExp(levelUser + 1, deltaNext) - levelToExp(levelUser, deltaNext);
	const currentExp = expNextLevel - (levelToExp(levelUser + 1, deltaNext) - exp);

	const allUser = await usersData.getAll();
	allUser.sort((a, b) => b.exp - a.exp);
	const rank = allUser.findIndex(user => user.userID == userID) + 1;

	const customRankCard = await threadsData.get(threadID, "data.customRankCard") || {};
	const dataLevel = {
		exp: currentExp,
		expNextLevel,
		name: allUser[rank - 1].name,
		rank: `#${rank}/${allUser.length}`,
		level: levelUser,
		avatar: await usersData.getAvatarUrl(userID)
	};

	const configRankCard = {
		...defaultDesignCard,
		...customRankCard
	};

	const checkImagKey = [
		"main_color",
		"sub_color",
		"line_color",
		"exp_color",
		"expNextLevel_color"
	];

	for (const key of checkImagKey) {
		if (!isNaN(configRankCard[key]))
			configRankCard[key] = await api.resolvePhotoUrl(configRankCard[key]);
	}

	const image = new RankCard({
		...configRankCard,
		...dataLevel
	});
	return await image.buildCard();
}


class RankCard {
	constructor(options) {
		this.widthCard = 2000;
		this.heightCard = 500;
		this.main_color = "#474747";
		this.sub_color = "rgba(255, 255, 255, 0.5)";
		this.alpha_subcard = 0.9;
		this.exp_color = "#e1e1e1";
		this.expNextLevel_color = "#3f3f3f";
		this.text_color = "#000000";
		this.fontName = "BeVietnamPro-Bold";
		this.textSize = 0;

		for (const key in options)
			this[key] = options[key];
	}

	registerFont(path, name) {
		Canvas.registerFont(path, {
			family: name
		});
		return this;
	}

	setFontName(fontName) {
		this.fontName = fontName;
		return this;
	}

	increaseTextSize(size) {
		if (isNaN(size))
			throw new Error("Size must be a number");
		if (size < 0)
			throw new Error("Size must be greater than 0");
		this.textSize = size;
		return this;
	}

	decreaseTextSize(size) {
		if (isNaN(size))
			throw new Error("Size must be a number");
		if (size < 0)
			throw new Error("Size must be greater than 0");
		this.textSize = -size;
		return this;
	}

	setWidthCard(widthCard) {
		if (isNaN(widthCard))
			throw new Error("Width card must be a number");
		if (widthCard < 0)
			throw new Error("Width card must be greater than 0");
		this.widthCard = Number(widthCard);
		return this;
	}

	setHeightCard(heightCard) {
		if (isNaN(heightCard))
			throw new Error("Height card must be a number");
		if (heightCard < 0)
			throw new Error("Height card must be greater than 0");
		this.heightCard = Number(heightCard);
		return this;
	}

	setAlphaSubCard(alpha_subcard) {
		if (isNaN(alpha_subcard))
			throw new Error("Alpha subcard must be a number");
		if (alpha_subcard < 0 || alpha_subcard > 1)
			throw new Error("Alpha subcard must be between 0 and 1");
		this.alpha_subcard = Number(alpha_subcard);
		return this;
	}

	setMainColor(main_color) {
		if (typeof main_color !== "string" && !Array.isArray(main_color))
			throw new Error("Main color must be a string or array");
		checkFormatColor(main_color);
		this.main_color = main_color;
		return this;
	}

	setSubColor(sub_color) {
		if (typeof sub_color !== "string" && !Array.isArray(sub_color))
			throw new Error("Sub color must be a string or array");
		checkFormatColor(sub_color);
		this.sub_color = sub_color;
		return this;
	}

	setExpColor(exp_color) {
		if (typeof exp_color !== "string" && !Array.isArray(exp_color))
			throw new Error("Exp color must be a string or array");
		checkFormatColor(exp_color);
		this.exp_color = exp_color;
		return this;
	}

	setExpBarColor(expNextLevel_color) {
		if (typeof expNextLevel_color !== "string" && !Array.isArray(expNextLevel_color))
			throw new Error("Exp next level color must be a string");
		checkFormatColor(expNextLevel_color);
		this.expNextLevel_color = expNextLevel_color;
		return this;
	}

	setTextColor(text_color) {
		if (typeof text_color !== "string" && !Array.isArray(text_color))
			throw new Error("Text color must be a string or an array of string");
		checkFormatColor(text_color, false);
		this.text_color = text_color;
		return this;
	}

	setNameColor(name_color) {
		if (typeof name_color !== "string" && !Array.isArray(name_color))
			throw new Error("Name color must be a string or an array of string");
		checkFormatColor(name_color, false);
		this.name_color = name_color;
		return this;
	}

	setLevelColor(level_color) {
		if (typeof level_color !== "string" && !Array.isArray(level_color))
			throw new Error("Level color must be a string or an array of string");
		checkFormatColor(level_color, false);
		this.level_color = level_color;
		return this;
	}

	setExpTextColor(exp_text_color) {
		if (typeof exp_text_color !== "string" && !Array.isArray(exp_text_color))
			throw new Error("Exp text color must be a string or an array of string");
		checkFormatColor(exp_text_color, false);
		this.exp_text_color = exp_text_color;
		return this;
	}

	setRankColor(rank_color) {
		if (typeof rank_color !== "string" && !Array.isArray(rank_color))
			throw new Error("Rank color must be a string or an array of string");
		checkFormatColor(rank_color, false);
		this.rank_color = rank_color;
		return this;
	}

	setLineColor(line_color) {
		if (typeof line_color !== "string" && !Array.isArray(line_color))
			throw new Error("Line color must be a string or an array of string");
		this.line_color = line_color;
		return this;
	}

	setExp(exp) {
		this.exp = exp;
		return this;
	}

	setExpNextLevel(expNextLevel) {
		this.expNextLevel = expNextLevel;
		return this;
	}

	setLevel(level) {
		this.level = level;
		return this;
	}

	setRank(rank) {
		this.rank = rank;
		return this;
	}

	setName(name) {
		this.name = name;
		return this;
	}

	setAvatar(avatar) {
		this.avatar = avatar;
		return this;
	}


	async buildCard() {
		let {
			widthCard,
			heightCard
		} = this;
		const {
			main_color,
			sub_color,
			alpha_subcard,
			exp_color,
			expNextLevel_color,
			text_color,
			name_color,
			level_color,
			rank_color,
			line_color,
			exp_text_color,
			exp,
			expNextLevel,
			name,
			level,
			rank,
			avatar,
			fontName,
			textSize
		} = this;
		const marginRatio = percentage(widthCard);
		const heightCardRatio = percentage(heightCard);

		const canvas = Canvas.createCanvas(widthCard, heightCard);
		const ctx = canvas.getContext("2d");

		const radius = 30;
		ctx.beginPath();
		ctx.moveTo(radius, 0);
		ctx.lineTo(widthCard - radius, 0);
		ctx.quadraticCurveTo(widthCard, 0, widthCard, radius);
		ctx.lineTo(widthCard, heightCard - radius);
		ctx.quadraticCurveTo(widthCard, heightCard, widthCard - radius, heightCard);
		ctx.lineTo(radius, heightCard);
		ctx.quadraticCurveTo(0, heightCard, 0, heightCard - radius);
		ctx.lineTo(0, radius);
		ctx.quadraticCurveTo(0, 0, radius, 0);
		ctx.closePath();
		ctx.clip();

		if (Array.isArray(main_color)) {
			const gradient = ctx.createLinearGradient(0, 0, widthCard, 0);
			const step = 1 / (main_color.length - 1);
			main_color.forEach((color, index) => {
				gradient.addColorStop(index * step, color);
			});
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, widthCard, heightCard);
		}
		else if (main_color.startsWith("http")) {
			const image = await Canvas.loadImage(main_color);
			ctx.drawImage(image, 0, 0, widthCard, heightCard);
		}
		else {
			ctx.fillStyle = main_color;
			ctx.fillRect(0, 0, widthCard, heightCard);
		}

		ctx.globalAlpha = alpha_subcard;
		const margin = 2.5 * marginRatio;
		const widthSubCard = widthCard - margin * 2;
		const heightSubCard = heightCard - margin * 2;
		const xSubCard = margin;
		const ySubCard = margin;
		const radiusSubCard = 30;

		ctx.beginPath();
		ctx.moveTo(xSubCard + radiusSubCard, ySubCard);
		ctx.lineTo(xSubCard + widthSubCard - radiusSubCard, ySubCard);
		ctx.quadraticCurveTo(xSubCard + widthSubCard, ySubCard, xSubCard + widthSubCard, ySubCard + radiusSubCard);
		ctx.lineTo(xSubCard + widthSubCard, ySubCard + heightSubCard - radiusSubCard);
		ctx.quadraticCurveTo(xSubCard + widthSubCard, ySubCard + heightSubCard, xSubCard + widthSubCard - radiusSubCard, ySubCard + heightSubCard);
		ctx.lineTo(xSubCard + radiusSubCard, ySubCard + heightSubCard);
		ctx.quadraticCurveTo(xSubCard, ySubCard + heightSubCard, xSubCard, ySubCard + heightSubCard - radiusSubCard);
		ctx.lineTo(xSubCard, ySubCard + radiusSubCard);
		ctx.quadraticCurveTo(xSubCard, ySubCard, xSubCard + radiusSubCard, ySubCard);
		ctx.closePath();
		ctx.save();
		ctx.clip();

		if (Array.isArray(sub_color)) {
			const gradient = ctx.createLinearGradient(0, 0, widthCard, 0);
			const step = 1 / (sub_color.length - 1);
			sub_color.forEach((color, index) => {
				gradient.addColorStop(index * step, color);
			});
			ctx.fillStyle = gradient;
			ctx.fillRect(xSubCard, ySubCard, widthSubCard, heightSubCard);
		}
		else if (sub_color.startsWith("http")) {
			const image = await Canvas.loadImage(sub_color);
			ctx.drawImage(image, xSubCard, ySubCard, widthSubCard, heightSubCard);
		}
		else {
			ctx.fillStyle = sub_color;
			ctx.fillRect(xSubCard, ySubCard, widthSubCard, heightSubCard);
		}

		ctx.restore();
		ctx.globalAlpha = 1;

		const widthAvatar = 75 * heightCardRatio;
		const heightAvatar = widthAvatar;
		const marginAvatar = 5 * marginRatio;
		const xAvatar = marginAvatar;
		const yAvatar = heightCard / 2 - heightAvatar / 2;

		if (avatar) {
			ctx.save();
			ctx.beginPath();
			ctx.arc(xAvatar + widthAvatar / 2, yAvatar + heightAvatar / 2, widthAvatar / 2, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.clip();
			const avatarImage = await Canvas.loadImage(avatar);
			ctx.drawImage(avatarImage, xAvatar, yAvatar, widthAvatar, heightAvatar);
			ctx.restore();
		}

		const lineX = xAvatar + widthAvatar + marginAvatar;
		const lineY = ySubCard + 20 * heightCardRatio;
		const lineHeight = heightSubCard - 40 * heightCardRatio;
		const lineWidth = 2;

		if (line_color) {
			ctx.beginPath();
			ctx.moveTo(lineX, lineY);
			ctx.lineTo(lineX, lineY + lineHeight);
			if (Array.isArray(line_color)) {
				const gradient = ctx.createLinearGradient(0, lineY, 0, lineY + lineHeight);
				const step = 1 / (line_color.length - 1);
				line_color.forEach((color, index) => {
					gradient.addColorStop(index * step, color);
				});
				ctx.strokeStyle = gradient;
			}
			else if (line_color.startsWith("http")) {
				const pattern = await Canvas.loadImage(line_color);
				ctx.strokeStyle = ctx.createPattern(pattern, "repeat");
			}
			else
				ctx.strokeStyle = line_color;
			ctx.lineWidth = lineWidth;
			ctx.stroke();
		}

		const marginTextArea = 3 * marginRatio;
		const xTextArea = lineX + marginTextArea;
		const widthTextArea = widthSubCard - xTextArea;

		const sizeTextName = 60 + textSize;
		ctx.font = `${sizeTextName}px ${fontName}`;
		const yTextName = ySubCard + 33 * heightCardRatio + sizeTextName;
		if (name_color) {
			if (Array.isArray(name_color)) {
				const gradient = ctx.createLinearGradient(xTextArea, 0, xTextArea + widthTextArea, 0);
				const step = 1 / (name_color.length - 1);
				name_color.forEach((color, index) => {
					gradient.addColorStop(index * step, color);
				});
				ctx.fillStyle = gradient;
			}
			else
				ctx.fillStyle = name_color;
		}
		else
			ctx.fillStyle = text_color;
		ctx.fillText(name, xTextArea, yTextName);

		const sizeTextLevelRank = 45 + textSize;
		ctx.font = `${sizeTextLevelRank}px ${fontName}`;

		const yTextLevelRank = yTextName + sizeTextLevelRank + 10 * heightCardRatio;
		const textLevel = `المستوى ${level}`;
		if (level_color) {
			if (Array.isArray(level_color)) {
				const gradient = ctx.createLinearGradient(xTextArea, 0, xTextArea + widthTextArea, 0);
				const step = 1 / (level_color.length - 1);
				level_color.forEach((color, index) => {
					gradient.addColorStop(index * step, color);
				});
				ctx.fillStyle = gradient;
			}
			else
				ctx.fillStyle = level_color;
		}
		else
			ctx.fillStyle = text_color;
		ctx.fillText(textLevel, xTextArea, yTextLevelRank);

		const marginTextRank = 3 * marginRatio;
		const textRank = `المرتبة ${rank}`;
		const widthTextRank = ctx.measureText(textRank).width;
		const xTextRank = widthCard - marginTextRank - widthTextRank - margin;
		if (rank_color) {
			if (Array.isArray(rank_color)) {
				const gradient = ctx.createLinearGradient(xTextRank, 0, xTextRank + widthTextRank, 0);
				const step = 1 / (rank_color.length - 1);
				rank_color.forEach((color, index) => {
					gradient.addColorStop(index * step, color);
				});
				ctx.fillStyle = gradient;
			}
			else
				ctx.fillStyle = rank_color;
		}
		else
			ctx.fillStyle = text_color;
		ctx.fillText(textRank, xTextRank, yTextLevelRank);

		const heightExpBar = 30 * heightCardRatio;
		const widthExpBar = widthSubCard - xTextArea - marginTextRank - margin;
		const xExpBar = xTextArea;
		const yExpBar = yTextLevelRank + 15 * heightCardRatio;
		const radiusExpBar = 10 * heightCardRatio;

		ctx.beginPath();
		ctx.moveTo(xExpBar + radiusExpBar, yExpBar);
		ctx.lineTo(xExpBar + widthExpBar - radiusExpBar, yExpBar);
		ctx.quadraticCurveTo(xExpBar + widthExpBar, yExpBar, xExpBar + widthExpBar, yExpBar + radiusExpBar);
		ctx.lineTo(xExpBar + widthExpBar, yExpBar + heightExpBar - radiusExpBar);
		ctx.quadraticCurveTo(xExpBar + widthExpBar, yExpBar + heightExpBar, xExpBar + widthExpBar - radiusExpBar, yExpBar + heightExpBar);
		ctx.lineTo(xExpBar + radiusExpBar, yExpBar + heightExpBar);
		ctx.quadraticCurveTo(xExpBar, yExpBar + heightExpBar, xExpBar, yExpBar + heightExpBar - radiusExpBar);
		ctx.lineTo(xExpBar, yExpBar + radiusExpBar);
		ctx.quadraticCurveTo(xExpBar, yExpBar, xExpBar + radiusExpBar, yExpBar);
		ctx.closePath();
		ctx.save();
		ctx.clip();

		if (Array.isArray(expNextLevel_color)) {
			const gradient = ctx.createLinearGradient(xExpBar, 0, xExpBar + widthExpBar, 0);
			const step = 1 / (expNextLevel_color.length - 1);
			expNextLevel_color.forEach((color, index) => {
				gradient.addColorStop(index * step, color);
			});
			ctx.fillStyle = gradient;
		}
		else if (expNextLevel_color.startsWith("http")) {
			const image = await Canvas.loadImage(expNextLevel_color);
			ctx.drawImage(image, xExpBar, yExpBar, widthExpBar, heightExpBar);
		}
		else {
			ctx.fillStyle = expNextLevel_color;
		}
		ctx.fillRect(xExpBar, yExpBar, widthExpBar, heightExpBar);

		const widthExp = widthExpBar * (exp / expNextLevel);

		if (Array.isArray(exp_color)) {
			const gradient = ctx.createLinearGradient(xExpBar, 0, xExpBar + widthExpBar, 0);
			const step = 1 / (exp_color.length - 1);
			exp_color.forEach((color, index) => {
				gradient.addColorStop(index * step, color);
			});
			ctx.fillStyle = gradient;
		}
		else if (exp_color.startsWith("http")) {
			const image = await Canvas.loadImage(exp_color);
			ctx.drawImage(image, xExpBar, yExpBar, widthExp, heightExpBar);
		}
		else {
			ctx.fillStyle = exp_color;
		}
		ctx.fillRect(xExpBar, yExpBar, widthExp, heightExpBar);
		ctx.restore();

		const sizeTextExp = 30 + textSize;
		ctx.font = `${sizeTextExp}px ${fontName}`;
		const textExp = `${exp}/${expNextLevel}`;
		const widthTextExp = ctx.measureText(textExp).width;
		const xTextExp = xExpBar + widthExpBar / 2 - widthTextExp / 2;
		const yTextExp = yExpBar + heightExpBar / 2 + sizeTextExp / 2 - 5;
		if (exp_text_color) {
			if (Array.isArray(exp_text_color)) {
				const gradient = ctx.createLinearGradient(xTextExp, 0, xTextExp + widthTextExp, 0);
				const step = 1 / (exp_text_color.length - 1);
				exp_text_color.forEach((color, index) => {
					gradient.addColorStop(index * step, color);
				});
				ctx.fillStyle = gradient;
			}
			else
				ctx.fillStyle = exp_text_color;
		}
		else
			ctx.fillStyle = text_color;
		ctx.fillText(textExp, xTextExp, yTextExp);

		return canvas.createPNGStream();
	}
}


function checkFormatColor(color, checkUrl = true) {
	const regexHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
	const regexRgb = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/;
	const regexRgba = /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d(\.\d+)?\s*\)$/;
	const isUrl = checkUrl && ((typeof color == "string" && color.startsWith("http")) || color.startsWith("data:image"));
	if (Array.isArray(color)) {
		for (const c of color) {
			if (!regexHex.test(c) && !regexRgb.test(c) && !regexRgba.test(c) && !isUrl)
				throw new Error(`Invalid color format: ${c}`);
		}
	}
	else if (!regexHex.test(color) && !regexRgb.test(color) && !regexRgba.test(color) && !isUrl)
		throw new Error(`Invalid color format: ${color}`);
}
