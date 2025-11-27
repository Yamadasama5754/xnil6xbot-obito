const { randomString, getTime, convertTime } = global.utils;
const { createCanvas } = require('canvas');
const rows = [
	{
		col: 4,
		row: 10,
		rewardPoint: 1
	},
	{
		col: 5,
		row: 12,
		rewardPoint: 2
	},
	{
		col: 6,
		row: 15,
		rewardPoint: 3
	}
];

module.exports = {
	config: {
		name: "تخمين_الأرقام",
		aliases: ["guessnumber", "guessnum", "خمن"],
		version: "1.1",
		author: "Yamada KJ",
		countDown: 5,
		role: 0,
		description: "لعبة تخمين الأرقام",
		category: "ألعاب",
		guide: "{pn} [4 | 5 | 6] [single | multi]: إنشاء لعبة جديدة، حيث:\n    4 5 6 هو عدد أرقام الرقم المطلوب تخمينه، الافتراضي هو 4.\n    single | multi هو وضع اللعب، single لاعب واحد، multi لاعبين متعددين، الافتراضي هو single.\n   مثال:\n    {pn}\n    {pn} 4 single\n\n   طريقة اللعب: يرد اللاعب على رسالة البوت بالقواعد التالية:\n   لديك " + rows.map(item => `${item.row} محاولة (${item.col} أرقام)`).join("، ") + ".\n   بعد كل تخمين، ستحصل على تلميحات إضافية عن عدد الأرقام الصحيحة (على اليسار) وعدد الأرقام في المكان الصحيح (على اليمين).\n   ملاحظة: الرقم مكون من أرقام من 0 إلى 9، كل رقم يظهر مرة واحدة فقط ويمكن أن يبدأ بـ 0.\n\n   {pn} rank <صفحة>: عرض الترتيب.\n   {pn} info [<uid> | <@إشارة> | <رد> | <فارغ>]: عرض معلومات ترتيبك أو ترتيب شخص آخر.\n   {pn} reset: إعادة تعيين الترتيب (مشرف البوت فقط)."
	},

	langs: {
		ar: {
			charts: "🏆 | الترتيب:\n%1",
			pageInfo: "صفحة %1/%2",
			noScore: "⭕ | لا يوجد أحد سجل نقاط بعد.",
			noPermissionReset: "⚠️ | ليس لديك صلاحية إعادة تعيين الترتيب.",
			notFoundUser: "⚠️ | لم يتم العثور على مستخدم بالمعرف %1 في الترتيب.",
			userRankInfo: "🏆 | معلومات الترتيب:\nالاسم: %1\nالنقاط: %2\nعدد المباريات: %3\nعدد الانتصارات: %4\n%5\nعدد الخسائر: %6\nنسبة الفوز: %7%\nإجمالي وقت اللعب: %8",
			digits: "%1 أرقام: %2",
			resetRankSuccess: "✅ | تم إعادة تعيين الترتيب بنجاح.",
			invalidCol: "⚠️ | يرجى إدخال عدد الأرقام 4 أو 5 أو 6",
			invalidMode: "⚠️ | يرجى إدخال وضع اللعب single أو multi",
			created: "✅ | تم إنشاء اللعبة بنجاح.",
			gameName: "لعبة تخمين الأرقام",
			gameGuide: "⏳ | طريقة اللعب:\nلديك %1 تخمينات.\nبعد كل تخمين، ستحصل على تلميحات إضافية عن عدد الأرقام الصحيحة (على اليسار) وعدد الأرقام في المكان الصحيح (على اليمين).",
			gameNote: "📄 | ملاحظة:\nالرقم مكون من أرقام من 0 إلى 9، كل رقم يظهر مرة واحدة فقط ويمكن أن يبدأ بـ 0.",
			replyToPlayGame: "🎮 | رد على الرسالة أدناه مع صورة %1 أرقام تخمنها للعب اللعبة.",
			invalidNumbers: "⚠️ | يرجى إدخال %1 أرقام تريد تخمينها",
			win: "🎉 | مبروك! لقد خمنت الرقم %1 بعد %2 تخمينات وحصلت على %3 نقاط مكافأة.",
			loss: "🤦‍♂️ | خسرت، الرقم الصحيح هو %1."
		}
	},

	onStart: async function ({ message, event, getLang, commandName, args, globalData, usersData, role }) {
		if (args[0] == "rank" || args[0] == "ترتيب") {
			const rankGuessNumber = await globalData.get("rankGuessNumber", "data", []);
			if (!rankGuessNumber.length)
				return message.reply(getLang("noScore"));

			const page = parseInt(args[1]) || 1;
			const maxUserOnePage = 30;

			let rankGuessNumberHandle = await Promise.all(rankGuessNumber.slice((page - 1) * maxUserOnePage, page * maxUserOnePage).map(async item => {
				const userName = await usersData.getName(item.id);
				return {
					...item,
					userName,
					winNumber: item.wins?.length || 0,
					lossNumber: item.losses?.length || 0
				};
			}));

			rankGuessNumberHandle = rankGuessNumberHandle.sort((a, b) => b.winNumber - a.winNumber);
			const medals = ["🥇", "🥈", "🥉"];
			const rankGuessNumberText = rankGuessNumberHandle.map((item, index) => {
				const medal = medals[index] || index + 1;
				return `${medal} ${item.userName} - ${item.winNumber} فوز - ${item.lossNumber} خسارة`;
			}).join("\n");

			return message.reply(getLang("charts", rankGuessNumberText || getLang("noScore")) + "\n" + getLang("pageInfo", page, Math.ceil(rankGuessNumber.length / maxUserOnePage)));
		}
		else if (args[0] == "info" || args[0] == "معلومات") {
			const rankGuessNumber = await globalData.get("rankGuessNumber", "data", []);
			let targetID;
			if (Object.keys(event.mentions).length)
				targetID = Object.keys(event.mentions)[0];
			else if (event.messageReply)
				targetID = event.messageReply.senderID;
			else if (!isNaN(args[1]))
				targetID = args[1];
			else
				targetID = event.senderID;

			const userDataGuessNumber = rankGuessNumber.find(item => item.id == targetID);
			if (!userDataGuessNumber)
				return message.reply(getLang("notFoundUser", targetID));

			const userName = await usersData.getName(targetID);
			const pointsReceived = userDataGuessNumber.points;
			const winNumber = userDataGuessNumber.wins?.length || 0;
			const playNumber = winNumber + (userDataGuessNumber.losses?.length || 0);
			const lossNumber = userDataGuessNumber.losses?.length || 0;
			const winRate = (winNumber / playNumber * 100).toFixed(2);
			const winInfo = {};
			for (const item of userDataGuessNumber.wins || [])
				winInfo[item.col] = winInfo[item.col] ? winInfo[item.col] + 1 : 1;
			const playTime = convertTime(userDataGuessNumber.wins.reduce((a, b) => a + b.timeSuccess, 0) + userDataGuessNumber.losses.reduce((a, b) => a + b.timeSuccess, 0));
			return message.reply(getLang("userRankInfo", userName, pointsReceived, playNumber, winNumber, Object.keys(winInfo).map(item => `  + ${getLang("digits", item, winInfo[item])}`).join("\n"), lossNumber, winRate, playTime));
		}
		else if (args[0] == "reset" || args[0] == "إعادة") {
			if (role < 2)
				return message.reply(getLang("noPermissionReset"));
			await globalData.set("rankGuessNumber", [], "data");
			return message.reply(getLang("resetRankSuccess"));
		}

		const col = parseInt(args.join(" ").match(/(\d+)/)?.[1] || 4);
		const levelOfDifficult = rows.find(item => item.col == col);
		if (!levelOfDifficult)
			return message.reply(getLang("invalidCol"));
		const mode = args.join(" ").match(/(single|multi|-s|-m)/)?.[1] || "single";
		const row = levelOfDifficult.row || 10;

		const options = {
			col,
			row,
			timeStart: parseInt(getTime("x")),
			numbers: [],
			tryNumber: 0,
			ctx: null,
			canvas: null,
			answer: randomString(col, true, "0123456789"),
			gameName: getLang("gameName"),
			gameGuide: getLang("gameGuide", row),
			gameNote: getLang("gameNote")
		};

		const gameData = guessNumberGame(options);
		gameData.mode = mode;

		const messageData = message.reply(`${getLang("created")}\n\n${getLang("gameGuide", row)}\n\n${getLang("gameNote")}\n\n${getLang("replyToPlayGame", col)}`);
		gameData.messageData = messageData;

		message.reply({
			attachment: gameData.imageStream
		}, (err, info) => {
			global.GoatBot.onReply.set(info.messageID, {
				commandName,
				messageID: info.messageID,
				author: event.senderID,
				gameData
			});
		});
	},

	onReply: async ({ message, Reply, event, getLang, commandName, globalData }) => {
		const { gameData: oldGameData } = Reply;
		if (event.senderID != Reply.author && oldGameData.mode == "single")
			return;

		const numbers = (event.body || "").split("").map(item => item.trim()).filter(item => item != "" && !isNaN(item));
		if (numbers.length != oldGameData.col)
			return message.reply(getLang("invalidNumbers", oldGameData.col));
		global.GoatBot.onReply.delete(Reply.messageID);

		oldGameData.numbers = numbers;
		const gameData = guessNumberGame(oldGameData);

		if (gameData.isWin == null) {
			message.reply({
				attachment: gameData.imageStream
			}, (err, info) => {
				message.unsend(Reply.messageID);
				global.GoatBot.onReply.set(info.messageID, {
					commandName,
					messageID: info.messageID,
					author: event.senderID,
					gameData
				});
			});
		}
		else {
			const rankGuessNumber = await globalData.get("rankGuessNumber", "data", []);
			const rewardPoint = rows.find(item => item.col == gameData.col)?.rewardPoint || 0;
			const messageText = gameData.isWin ?
				getLang("win", gameData.answer, gameData.tryNumber - 1, rewardPoint) :
				getLang("loss", gameData.answer);
			message.unsend((await oldGameData.messageData).messageID);
			message.unsend(Reply.messageID);
			message.reply({
				body: messageText,
				attachment: gameData.imageStream
			});

			if (gameData.isWin != null) {
				const userIndex = rankGuessNumber.findIndex(item => item.id == event.senderID);
				const data = {
					tryNumber: gameData.tryNumber - 1,
					timeSuccess: parseInt(getTime("x") - oldGameData.timeStart),
					date: getTime(),
					col: gameData.col
				};

				if (gameData.isWin == true) {
					if (userIndex == -1)
						rankGuessNumber.push({
							id: event.senderID,
							wins: [data],
							losses: [],
							points: rewardPoint
						});
					else {
						rankGuessNumber[userIndex].wins.push(data);
						rankGuessNumber[userIndex].points += rewardPoint;
					}
				}
				else {
					delete data.tryNumber;
					if (userIndex == -1)
						rankGuessNumber.push({
							id: event.senderID,
							wins: [],
							losses: [data],
							points: 0
						});
					else
						rankGuessNumber[userIndex].losses.push(data);
				}
				await globalData.set("rankGuessNumber", rankGuessNumber, "data");
			}
		}
	}
};


function wrapTextGetHeight(ctx, text, maxWidth, lineHeight, margin = 0) {
	const lines = text.split('\n');
	let height = 0;
	let count = 0;
	for (let i = 0; i < lines.length; i++) {
		let line = '';
		const words = lines[i].split(' ');
		for (let n = 0; n < words.length; n++) {
			const textLine = line + words[n] + ' ';
			const textWidth = ctx.measureText(textLine).width;
			if (textWidth > maxWidth && n > 0) {
				line = words[n] + ' ';
				height += lineHeight;
				count++;
			}
			else {
				line = textLine;
			}
		}
		height += lineHeight;
		count++;
	}
	return height + margin * count;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
	const yStart = y;
	const lines = text.split('\n');
	for (let i = 0; i < lines.length; i++) {
		let line = '';
		const words = lines[i].split(' ');
		for (let n = 0; n < words.length; n++) {
			const textLine = line + words[n] + ' ';
			const metrics = ctx.measureText(textLine);
			const textWidth = metrics.width;
			if (textWidth > maxWidth && n > 0) {
				ctx.fillText(line, x, y);
				line = words[n] + ' ';
				y += lineHeight;
			}
			else {
				line = textLine;
			}
		}
		ctx.fillText(line, x, y);
		y += lineHeight;
	}
	return y - yStart;
}

function drawBorderSquareRadius(ctx, x, y, width, height, radius = 5, lineWidth = 1, strokeStyle = '#000', fill) {
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
	if (fill) {
		ctx.fillStyle = strokeStyle;
		ctx.fill();
	}
	else {
		ctx.strokeStyle = strokeStyle;
		ctx.lineWidth = lineWidth;
		ctx.stroke();
	}
	ctx.restore();
}

function drawWrappedText(ctx, text, startY, wrapWidth, lineHeight, boldFirstLine, margin, marginText) {
	const splitText = text.split('\n');
	let y = startY;
	for (let i = 0; i < splitText.length; i++) {
		if (i === 0 && boldFirstLine)
			ctx.font = `bold ${ctx.font}`;
		else
			ctx.font = ctx.font.replace('bold ', '');
		const height = wrapText(ctx, splitText[i], margin / 2, y, wrapWidth, lineHeight);
		y += height + marginText;
	}
	return y;
}

function getPositionOfSquare(x, y, sizeOfOneSquare, distance, marginX, marginY, lineWidth, heightGameName) {
	const xOutSide = marginX + x * (sizeOfOneSquare + distance) + lineWidth / 2;
	const yOutSide = marginY + y * (sizeOfOneSquare + distance) + lineWidth / 2 + heightGameName;
	const xInSide = xOutSide + lineWidth;
	const yInSide = yOutSide + lineWidth;

	return {
		xOutSide,
		yOutSide,
		xInSide,
		yInSide
	};
}

function guessNumberGame(options) {
	let { numbers, ctx, canvas, tryNumber, row, ctxNumbers, canvasNumbers, ctxHightLight, canvasHightLight } = options;
	const { col, answer, gameName, gameGuide, gameNote } = options;
	tryNumber--;
	if (Array.isArray(numbers))
		tryNumber++;

	const lineWidth = 4;
	const sizeOfOneSquare = 80;
	const distance = 10;
	const marginX = 40;
	const marginY = 30;
	const radius = 10;
	const fontSize = 40;
	const lineHeightGuideText = 25;
	const marginText = 10;

	if (!ctx) {
		const heightGameName = 50;
		const widthGuide = (sizeOfOneSquare + distance) * (col + 2) + marginX * 2 - distance;
		const ctxTemp = createCanvas(1, 1).getContext('2d');
		ctxTemp.font = `20px Arial`;
		const heightGuide = wrapTextGetHeight(ctxTemp, gameGuide, widthGuide - marginX, lineHeightGuideText, marginText);
		const heightNote = wrapTextGetHeight(ctxTemp, gameNote, widthGuide - marginX, lineHeightGuideText, marginText);
		const width = widthGuide;
		const height = (sizeOfOneSquare + distance) * row + marginY * 2 - distance + heightGameName + heightGuide + heightNote + marginText * 2;

		canvas = createCanvas(width, height);
		ctx = canvas.getContext('2d');

		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, width, height);

		ctx.fillStyle = '#000';
		ctx.font = `bold 30px Arial`;
		ctx.fillText(gameName, marginX / 2, marginY);

		ctx.font = `20px Arial`;
		const yGuide = drawWrappedText(ctx, gameGuide, marginY + heightGameName - 15, width - marginX, lineHeightGuideText, true, marginX, marginText);
		drawWrappedText(ctx, gameNote, yGuide, width - marginX, lineHeightGuideText, true, marginX, marginText);

		const widthNumbers = (sizeOfOneSquare + distance) * col + marginX - distance;
		const heightNumbers = (sizeOfOneSquare + distance) * row + marginY - distance;
		canvasNumbers = createCanvas(widthNumbers, heightNumbers);
		ctxNumbers = canvasNumbers.getContext('2d');

		canvasHightLight = createCanvas(widthNumbers, heightNumbers);
		ctxHightLight = canvasHightLight.getContext('2d');

		for (let y = 0; y < row; y++) {
			for (let x = 0; x < col; x++) {
				const { xOutSide, yOutSide } = getPositionOfSquare(x, y, sizeOfOneSquare, distance, 0, 0, lineWidth, 0);
				drawBorderSquareRadius(ctxNumbers, xOutSide, yOutSide, sizeOfOneSquare, sizeOfOneSquare, radius, lineWidth, '#000');
			}
		}
	}

	let isWin = null;
	if (Array.isArray(numbers) && numbers.length === col) {
		let countCorrect = 0;
		let countCorrectPosition = 0;
		for (let i = 0; i < col; i++) {
			if (answer.includes(numbers[i]))
				countCorrect++;
			if (answer[i] === numbers[i])
				countCorrectPosition++;
		}

		if (countCorrectPosition === col)
			isWin = true;
		else if (tryNumber >= row)
			isWin = false;

		for (let x = 0; x < col; x++) {
			const { xOutSide, yOutSide, xInSide, yInSide } = getPositionOfSquare(x, tryNumber - 1, sizeOfOneSquare, distance, 0, 0, lineWidth, 0);
			const fillColor = isWin === true ? '#00ff00' : (isWin === false ? '#ff0000' : '#fff');
			drawBorderSquareRadius(ctxNumbers, xOutSide, yOutSide, sizeOfOneSquare, sizeOfOneSquare, radius, lineWidth, fillColor, true);
			drawBorderSquareRadius(ctxNumbers, xOutSide, yOutSide, sizeOfOneSquare, sizeOfOneSquare, radius, lineWidth, '#000');

			ctxNumbers.fillStyle = '#000';
			ctxNumbers.font = `bold ${fontSize}px Arial`;
			ctxNumbers.fillText(numbers[x], xInSide + sizeOfOneSquare / 2 - fontSize / 2 - 5, yInSide + sizeOfOneSquare / 2 + fontSize / 2 - 10);
		}

		const { xOutSide: xOutSideLeft, yOutSide: yOutSideLeft } = getPositionOfSquare(col, tryNumber - 1, sizeOfOneSquare, distance, 0, 0, lineWidth, 0);
		drawBorderSquareRadius(ctxHightLight, xOutSideLeft, yOutSideLeft, sizeOfOneSquare, sizeOfOneSquare, radius, lineWidth, '#87CEEB', true);
		drawBorderSquareRadius(ctxHightLight, xOutSideLeft, yOutSideLeft, sizeOfOneSquare, sizeOfOneSquare, radius, lineWidth, '#000');
		ctxHightLight.fillStyle = '#000';
		ctxHightLight.font = `bold ${fontSize}px Arial`;
		ctxHightLight.fillText(countCorrect, xOutSideLeft + sizeOfOneSquare / 2 - fontSize / 2 + 5, yOutSideLeft + sizeOfOneSquare / 2 + fontSize / 2 - 10);

		const { xOutSide: xOutSideRight, yOutSide: yOutSideRight } = getPositionOfSquare(col + 1, tryNumber - 1, sizeOfOneSquare, distance, 0, 0, lineWidth, 0);
		drawBorderSquareRadius(ctxHightLight, xOutSideRight, yOutSideRight, sizeOfOneSquare, sizeOfOneSquare, radius, lineWidth, '#FFD700', true);
		drawBorderSquareRadius(ctxHightLight, xOutSideRight, yOutSideRight, sizeOfOneSquare, sizeOfOneSquare, radius, lineWidth, '#000');
		ctxHightLight.fillStyle = '#000';
		ctxHightLight.font = `bold ${fontSize}px Arial`;
		ctxHightLight.fillText(countCorrectPosition, xOutSideRight + sizeOfOneSquare / 2 - fontSize / 2 + 5, yOutSideRight + sizeOfOneSquare / 2 + fontSize / 2 - 10);
	}

	const heightGameName = 50;
	const widthGuide = (sizeOfOneSquare + distance) * (col + 2) + marginX * 2 - distance;
	const ctxTemp = createCanvas(1, 1).getContext('2d');
	ctxTemp.font = `20px Arial`;
	const heightGuide = wrapTextGetHeight(ctxTemp, gameGuide, widthGuide - marginX, lineHeightGuideText, marginText);
	const heightNote = wrapTextGetHeight(ctxTemp, gameNote, widthGuide - marginX, lineHeightGuideText, marginText);

	ctx.drawImage(canvasNumbers, marginX / 2, marginY + heightGameName + heightGuide + heightNote + marginText);
	ctx.drawImage(canvasHightLight, marginX / 2, marginY + heightGameName + heightGuide + heightNote + marginText);

	return {
		imageStream: canvas.createPNGStream(),
		isWin,
		tryNumber: tryNumber + 1,
		answer,
		col,
		row,
		ctx,
		canvas,
		ctxNumbers,
		canvasNumbers,
		ctxHightLight,
		canvasHightLight,
		gameName,
		gameGuide,
		gameNote
	};
}
