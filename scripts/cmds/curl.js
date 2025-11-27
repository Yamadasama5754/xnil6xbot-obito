const axios = require('axios');

module.exports = {
	config: {
		name: "تحويل_curl",
		aliases: ["curl"],
		version: "1.5",
		author: "Yamada KJ",
		countDown: 5,
		role: 0,
		usePrefix: true,
		description: "تحويل أوامر curl إلى طلبات Axios",
		category: "أدوات",
		guide: "{pn} [أمر_curl]"
	},

	langs: {
		ar: {
			provideCommand: "⚠️ يرجى إدخال أمر curl.\nمثال: {pn} curl -X POST -H \"Content-Type: application/json\" -d '{\"key\":\"value\"}' https://example.com/api",
			success: "✅",
			error: "❌ خطأ: %1"
		}
	},

	onStart: async function ({ message, args, getLang }) {
		const curlCommand = args.join(" ");
		if (!curlCommand) {
			return message.reply(getLang("provideCommand"));
		}

		try {
			const axiosCode = this.convertCurlToAxios(curlCommand);
			message.reply(`✅\n\n\`\`\`javascript\n${axiosCode}\n\`\`\``);
		} catch (error) {
			message.reply(getLang("error", error.message));
		}
	},

	convertCurlToAxios: function (curlCommand) {
		const parsed = this.parseCurl(curlCommand);

		const headersString = Object.keys(parsed.headers).length
			? `headers: ${JSON.stringify(parsed.headers, null, 2).replace(/^/gm, ' ')},\n`
			: '';

		const dataString = parsed.data
			? `data: ${typeof parsed.data === 'object'
				? JSON.stringify(parsed.data, null, 2).replace(/^/gm, ' ')
				: `'${parsed.data.replace(/'/g, "\\'")}'`
			},\n`
			: '';

		return `const axios = require('axios');

async function makeRequest() {
	try {
		const response = await axios({
			method: '${parsed.method.toLowerCase()}',
			url: '${parsed.url}',
${headersString}${dataString}		});
		console.log(response.data);
	} catch (error) {
		console.error('خطأ:', error.response?.data || error.message);
	}
}

makeRequest();`;
	},

	parseCurl: function (curlCommand) {
		const result = {
			method: 'GET',
			url: '',
			headers: {},
			data: null
		};

		const urlMatch = curlCommand.match(/(?:^|\s)(https?:\/\/[^\s'"]+)/);
		if (!urlMatch) throw new Error('لم يتم العثور على رابط');
		result.url = urlMatch[1];

		const methodMatch = curlCommand.match(/-X\s+(\w+)/i);
		if (methodMatch) result.method = methodMatch[1].toUpperCase();

		const headerMatches = curlCommand.matchAll(/-H\s+['"]([^'"]+)['"]/g);
		for (const match of headerMatches) {
			const [key, ...valueParts] = match[1].split(/:\s*/);
			result.headers[key.trim()] = valueParts.join(':').trim();
		}

		const dataMatch = curlCommand.match(/-d\s+(['"])(.*?)\1/);
		if (dataMatch) {
			const rawData = dataMatch[2];
			try {
				result.data = JSON.parse(rawData);
			} catch {
				result.data = rawData;
			}
		}

		return result;
	}
};
