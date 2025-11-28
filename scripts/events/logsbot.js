const fs = require("fs-extra");
const path = require("path");

const logsFile = path.join(process.cwd(), "database/logs.json");

const getLogs = () => {
	try {
		return fs.readJsonSync(logsFile) || [];
	} catch {
		return [];
	}
};

const saveLogs = (logs) => {
	try {
		fs.writeFileSync(logsFile, JSON.stringify(logs, null, 2));
	} catch (err) {
		console.error("Error saving logs:", err);
	}
};

module.exports = {
	config: {
		name: "logsbot",
		version: "1.0",
		author: "Yamada KJ",
		category: "events"
	},

	onStart: async ({ event, api }) => {
		try {
			if (!event.logMessageType) return;

			const logs = getLogs();
			const timestamp = new Date().toISOString();

			const logEntry = {
				timestamp,
				type: event.logMessageType,
				threadID: event.threadID,
				author: event.author,
				data: event.logMessageData
			};

			logs.push(logEntry);

			if (logs.length > 1000) {
				logs.shift();
			}

			saveLogs(logs);
		} catch (err) {
			console.error("[LOGSBOT] Error:", err.message);
		}
	}
};
