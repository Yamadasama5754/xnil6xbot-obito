const axios = require("axios");
const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");
const { client } = global;

const { configCommands } = global.GoatBot;
const { log, loading, removeHomeDir } = global.utils;

function getDomain(url) {
	const regex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/im;
	const match = url.match(regex);
	return match ? match[1] : null;
}

function isURL(str) {
	try {
		new URL(str);
		return true;
	}
	catch (e) {
		return false;
	}
}

module.exports = {
	config: {
		name: "امر",
		aliases: ["cmd", "أمر"],
		version: "1.17",
		author: "Yamada KJ",
		countDown: 5,
		role: 3,
		description: "إدارة ملفات الأوامر الخاصة بك",
		category: "المالك",
		guide: "{pn} load <اسم ملف الأمر>\n{pn} loadAll\n{pn} install <رابط> <اسم الملف>: تحميل وتثبيت ملف أمر من رابط\n{pn} install <اسم الملف> <كود>: تحميل وتثبيت ملف أمر من كود"
	},

	langs: {
		ar: {
			missingFileName: "⚠️ | يرجى إدخال اسم الأمر الذي تريد إعادة تحميله",
			loaded: "✅ | تم تحميل الأمر \"%1\" بنجاح",
			loadedError: "❌ | فشل تحميل الأمر \"%1\" مع خطأ\n%2: %3",
			loadedSuccess: "✅ | تم تحميل (%1) أمر بنجاح",
			loadedFail: "❌ | فشل تحميل (%1) أمر\n%2",
			openConsoleToSeeError: "👀 | افتح وحدة التحكم لرؤية تفاصيل الخطأ",
			missingCommandNameUnload: "⚠️ | يرجى إدخال اسم الأمر الذي تريد إلغاء تحميله",
			unloaded: "✅ | تم إلغاء تحميل الأمر \"%1\" بنجاح",
			unloadedError: "❌ | فشل إلغاء تحميل الأمر \"%1\" مع خطأ\n%2: %3",
			missingUrlCodeOrFileName: "⚠️ | يرجى إدخال الرابط أو الكود واسم ملف الأمر الذي تريد تثبيته",
			missingUrlOrCode: "⚠️ | يرجى إدخال رابط أو كود ملف الأمر الذي تريد تثبيته",
			missingFileNameInstall: "⚠️ | يرجى إدخال اسم الملف لحفظ الأمر (بامتداد .js)",
			invalidUrl: "⚠️ | يرجى إدخال رابط صالح",
			invalidUrlOrCode: "⚠️ | غير قادر على الحصول على كود الأمر",
			alreadExist: "⚠️ | ملف الأمر موجود بالفعل، هل أنت متأكد أنك تريد الكتابة فوق ملف الأمر القديم؟\nأضف تفاعل على هذه الرسالة للمتابعة",
			installed: "✅ | تم تثبيت الأمر \"%1\" بنجاح، ملف الأمر محفوظ في %2",
			installedError: "❌ | فشل تثبيت الأمر \"%1\" مع خطأ\n%2: %3",
			missingFile: "⚠️ | ملف الأمر \"%1\" غير موجود",
			invalidFileName: "⚠️ | اسم ملف الأمر غير صالح",
			unloadedFile: "✅ | تم إلغاء تحميل الأمر \"%1\""
		}
	},

	onStart: async ({ args, message, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, event, commandName, getLang }) => {
		const { unloadScripts, loadScripts } = global.utils;
		if (
			args[0] == "load"
			&& args.length == 2
		) {
			if (!args[1])
				return message.reply(getLang("missingFileName"));
			const infoLoad = loadScripts("cmds", args[1], log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang);
			if (infoLoad.status == "success")
				message.reply(getLang("loaded", infoLoad.name));
			else {
				message.reply(
					getLang("loadedError", infoLoad.name, infoLoad.error.name, infoLoad.error.message)
					+ "\n" + infoLoad.error.stack
				);
				console.log(infoLoad.errorWithThoutRemoveHomeDir);
			}
		}
		else if (
			(args[0] || "").toLowerCase() == "loadall"
			|| (args[0] == "load" && args.length > 2)
		) {
			const fileNeedToLoad = args[0].toLowerCase() == "loadall" ?
				fs.readdirSync(__dirname)
					.filter(file =>
						file.endsWith(".js") &&
						!file.match(/(eg)\.js$/g) &&
						(process.env.NODE_ENV == "development" ? true : !file.match(/(dev)\.js$/g)) &&
						!configCommands.commandUnload?.includes(file)
					)
					.map(item => item = item.split(".")[0]) :
				args.slice(1);
			const arraySucces = [];
			const arrayFail = [];

			for (const fileName of fileNeedToLoad) {
				const infoLoad = loadScripts("cmds", fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang);
				if (infoLoad.status == "success")
					arraySucces.push(fileName);
				else
					arrayFail.push(` ❗ ${fileName} => ${infoLoad.error.name}: ${infoLoad.error.message}`);
			}

			let msg = "";
			if (arraySucces.length > 0)
				msg += getLang("loadedSuccess", arraySucces.length);
			if (arrayFail.length > 0) {
				msg += (msg ? "\n" : "") + getLang("loadedFail", arrayFail.length, arrayFail.join("\n"));
				msg += "\n" + getLang("openConsoleToSeeError");
			}

			message.reply(msg);
		}
		else if (args[0] == "unload") {
			if (!args[1])
				return message.reply(getLang("missingCommandNameUnload"));
			const infoUnload = unloadScripts("cmds", args[1], configCommands, getLang);
			infoUnload.status == "success" ?
				message.reply(getLang("unloaded", infoUnload.name)) :
				message.reply(getLang("unloadedError", infoUnload.name, infoUnload.error.name, infoUnload.error.message));
		}
		else if (args[0] == "install") {
			let url = args[1];
			let fileName = args[2];
			let rawCode;

			if (!url || !fileName)
				return message.reply(getLang("missingUrlCodeOrFileName"));

			if (
				url.endsWith(".js")
				&& !isURL(url)
			) {
				const tmp = fileName;
				fileName = url;
				url = tmp;
			}

			if (url.match(/(https?:\/\/(?:www\.|(?!www)))/)) {
				global.utils.log.dev("install", "url", url);
				if (!fileName || !fileName.endsWith(".js"))
					return message.reply(getLang("missingFileNameInstall"));

				const domain = getDomain(url);
				if (!domain)
					return message.reply(getLang("invalidUrl"));

				if (domain == "pastebin.com") {
					const regex = /https:\/\/pastebin\.com\/(?!raw\/)(.*)/;
					if (url.match(regex))
						url = url.replace(regex, "https://pastebin.com/raw/$1");
					if (url.endsWith("/"))
						url = url.slice(0, -1);
				}
				else if (domain == "github.com") {
					const regex = /https:\/\/github\.com\/(.*)\/blob\/(.*)/;
					if (url.match(regex))
						url = url.replace(regex, "https://raw.githubusercontent.com/$1/$2");
				}

				rawCode = (await axios.get(url)).data;

				if (domain == "savetext.net") {
					const $ = cheerio.load(rawCode);
					rawCode = $("#content").text();
				}
			}
			else {
				global.utils.log.dev("install", "code", args.slice(1).join(" "));
				if (args[args.length - 1].endsWith(".js")) {
					fileName = args[args.length - 1];
					rawCode = event.body.slice(event.body.indexOf('install') + 7, event.body.indexOf(fileName) - 1);
				}
				else if (args[1].endsWith(".js")) {
					fileName = args[1];
					rawCode = event.body.slice(event.body.indexOf(fileName) + fileName.length + 1);
				}
				else
					return message.reply(getLang("missingFileNameInstall"));
			}

			if (!rawCode)
				return message.reply(getLang("invalidUrlOrCode"));

			if (fs.existsSync(path.join(__dirname, fileName)))
				return message.reply(getLang("alreadExist"), (err, info) => {
					global.GoatBot.onReaction.set(info.messageID, {
						commandName,
						messageID: info.messageID,
						type: "install",
						author: event.senderID,
						data: {
							fileName,
							rawCode
						}
					});
				});
			else {
				const infoLoad = loadScripts("cmds", fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode);
				infoLoad.status == "success" ?
					message.reply(getLang("installed", infoLoad.name, path.join(__dirname, fileName).replace(process.cwd(), ""))) :
					message.reply(getLang("installedError", infoLoad.name, infoLoad.error.name, infoLoad.error.message));
			}
		}
		else
			message.SyntaxError();
	},

	onReaction: async function ({ Reaction, message, event, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang }) {
		const { loadScripts } = global.utils;
		const { author, data: { fileName, rawCode } } = Reaction;
		if (event.userID != author)
			return;
		const infoLoad = loadScripts("cmds", fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode);
		infoLoad.status == "success" ?
			message.reply(getLang("installed", infoLoad.name, path.join(__dirname, fileName).replace(process.cwd(), ""))) :
			message.reply(getLang("installedError", infoLoad.name, infoLoad.error.name, infoLoad.error.message));
	}
};

const packageAlready = [];
const spinner = "\\|/-";
let count = 0;

function loadScripts(folder, fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode) {
	const storageCommandFilesPath = global.GoatBot[folder == "cmds" ? "commandFilesPath" : "eventCommandsFilesPath"];

	try {
		if (rawCode) {
			fileName = fileName.slice(0, -3);
			fs.writeFileSync(path.normalize(`${process.cwd()}/scripts/${folder}/${fileName}.js`), rawCode);
		}
		const regExpCheckPackage = /require(\s+|)\((\s+|)[`'"]([^`'"]+)[`'"](\s+|)\)/g;
		const { GoatBot } = global;
		const { onFirstChat: allOnFirstChat, onChat: allOnChat, onEvent: allOnEvent, onAnyEvent: allOnAnyEvent } = GoatBot;
		let setMap, typeEnvCommand, commandType;
		if (folder == "cmds") {
			typeEnvCommand = "envCommands";
			setMap = "commands";
			commandType = "أمر";
		}
		else if (folder == "events") {
			typeEnvCommand = "envEvents";
			setMap = "eventCommands";
			commandType = "حدث أمر";
		}
		let pathCommand;
		if (process.env.NODE_ENV == "development") {
			const devPath = path.normalize(process.cwd() + `/scripts/${folder}/${fileName}.dev.js`);
			if (fs.existsSync(devPath))
				pathCommand = devPath;
			else
				pathCommand = path.normalize(process.cwd() + `/scripts/${folder}/${fileName}.js`);
		}
		else
			pathCommand = path.normalize(process.cwd() + `/scripts/${folder}/${fileName}.js`);

		const contentFile = fs.readFileSync(pathCommand, "utf8");
		let allPackage = contentFile.match(regExpCheckPackage);
		if (allPackage) {
			allPackage = allPackage
				.map(p => p.match(/[`'"]([^`'"]+)[`'"]/)[1])
				.filter(p => p.indexOf("/") !== 0 && p.indexOf("./") !== 0 && p.indexOf("../") !== 0 && p.indexOf(__dirname) !== 0);
			for (let packageName of allPackage) {
				if (packageName.startsWith('@'))
					packageName = packageName.split('/').slice(0, 2).join('/');
				else
					packageName = packageName.split('/')[0];

				if (!packageAlready.includes(packageName)) {
					packageAlready.push(packageName);
					if (!fs.existsSync(`${process.cwd()}/node_modules/${packageName}`)) {
						let wating;
						try {
							wating = setInterval(() => {
								count++;
								loading.info("حزمة", `جاري تثبيت ${packageName} ${spinner[count % spinner.length]}`);
							}, 80);
							execSync(`npm install ${packageName} --save`, { stdio: "pipe" });
							clearInterval(wating);
							process.stderr.clearLine();
						}
						catch (error) {
							clearInterval(wating);
							process.stderr.clearLine();
							throw new Error(`لا يمكن تثبيت الحزمة ${packageName}`);
						}
					}
				}
			}
		}
		const oldCommand = require(pathCommand);
		const oldCommandName = oldCommand?.config?.name;
		if (!oldCommandName) {
			if (GoatBot[setMap].get(oldCommandName)?.location != pathCommand)
				throw new Error(`اسم ${commandType} "${oldCommandName}" موجود بالفعل في الأمر "${removeHomeDir(GoatBot[setMap].get(oldCommandName)?.location || "")}"`);
		}
		if (oldCommand.config.aliases) {
			let oldAliases = oldCommand.config.aliases;
			if (typeof oldAliases == "string")
				oldAliases = [oldAliases];
			for (const alias of oldAliases)
				GoatBot.aliases.delete(alias);
		}
		delete require.cache[require.resolve(pathCommand)];

		const command = require(pathCommand);
		command.location = pathCommand;
		const configCommand = command.config;
		if (!configCommand || typeof configCommand != "object")
			throw new Error("إعدادات الأمر يجب أن تكون كائن");
		const scriptName = configCommand.name;

		const indexOnChat = allOnChat.findIndex(item => item == oldCommandName);
		if (indexOnChat != -1)
			allOnChat.splice(indexOnChat, 1);

		const indexOnFirstChat = allOnChat.findIndex(item => item == oldCommandName);
		let oldOnFirstChat;
		if (indexOnFirstChat != -1) {
			oldOnFirstChat = allOnFirstChat[indexOnFirstChat];
			allOnFirstChat.splice(indexOnFirstChat, 1);
		}

		const indexOnEvent = allOnEvent.findIndex(item => item == oldCommandName);
		if (indexOnEvent != -1)
			allOnEvent.splice(indexOnEvent, 1);

		const indexOnAnyEvent = allOnAnyEvent.findIndex(item => item == oldCommandName);
		if (indexOnAnyEvent != -1)
			allOnAnyEvent.splice(indexOnAnyEvent, 1);

		return { status: "success", name: scriptName };
	}
	catch (error) {
		return {
			status: "fail",
			name: fileName,
			error: {
				name: error.name,
				message: removeHomeDir(error.message),
				stack: removeHomeDir(error.stack)
			},
			errorWithThoutRemoveHomeDir: error
		};
	}
}
