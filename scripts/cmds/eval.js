const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "تنفيذ",
  aliases: ["eval", "كود", "execute", "run"],
  version: "3.0",
  author: "Enhanced",
  countDown: 5,
  role: 2,
  description: "تنفيذ الكود بلغات برمجة مختلفة",
  category: "المالك",
  guide: "{pn} [js/python/go/rust/rb] <الكود>"
};

module.exports.langs = {
  ar: {
    error: "❌ خطأ:",
    success: "✅ تم التنفيذ بنجاح",
    noCode: "❌ لم تقدم أي كود للتنفيذ!",
    noOutput: "✅ لا توجد نتيجة",
    timeout: "❌ انتهت مهلة الوقت (5 ثوان فقط)",
    info: "ℹ️ معلومات:",
    usage: "💡 الاستخدام",
    execution: "⏱️ الوقت",
    typeInfo: "📊 النوع",
    invalidLang: "❌ لغة برمجة غير مدعومة!",
    supported: "🔧 اللغات المدعومة",
    syntaxError: "🔴 خطأ في الصيغة",
    runtime: "🔴 خطأ في التشغيل",
    unavailable: "❌ اللغة غير متاحة في النظام"
  }
};

const supportedLanguages = {
  js: { name: 'JavaScript', ext: '.js', runner: 'node' },
  python: { name: 'Python', ext: '.py', runner: 'python3' },
  py: { name: 'Python', ext: '.py', runner: 'python3' },
  go: { name: 'Go', ext: '.go', runner: 'go run' },
  rust: { name: 'Rust', ext: '.rs', runner: 'rustc' },
  rb: { name: 'Ruby', ext: '.rb', runner: 'ruby' },
  sh: { name: 'Bash', ext: '.sh', runner: 'bash' }
};

function detectLanguage(arg) {
  return supportedLanguages[arg?.toLowerCase()] || supportedLanguages.js;
}

function executeCode(code, language) {
  const tempDir = path.join(process.cwd(), 'cache', 'eval_temp');
  fs.ensureDirSync(tempDir);
  
  const filename = `eval_${Date.now()}${language.ext}`;
  const filepath = path.join(tempDir, filename);

  try {
    fs.writeFileSync(filepath, code);

    let command;
    if (language.runner === 'go run') {
      command = `cd ${tempDir} && go run ${filename}`;
    } else if (language.runner === 'rustc') {
      const outfile = filepath.replace(language.ext, '');
      command = `rustc ${filepath} -o ${outfile} && ${outfile}`;
    } else {
      command = `${language.runner} ${filepath}`;
    }

    const result = execSync(command, {
      timeout: 5000,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });

    return { success: true, output: result, error: null };
  } catch (err) {
    let errorMsg = err.stderr || err.stdout || err.message || String(err);
    return { success: false, output: null, error: errorMsg };
  } finally {
    try {
      fs.removeSync(filepath);
    } catch (e) {}
  }
}

function truncateString(str, maxLength = 1500) {
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + `\n\n...[مختصر - الكامل: ${str.length} حرف]`;
  }
  return str;
}

module.exports.onStart = async function ({ api, args, message, getLang }) {
  try {
    if (!args || args.length === 0) {
      const supported = Object.entries(supportedLanguages)
        .map(([key, lang]) => `• ${key} → ${lang.name}`)
        .join('\n');
      return message.reply(
        `${getLang("noCode")}\n\n${getLang("supported")}:\n${supported}\n\n${getLang("usage")}:\n.تنفيذ js console.log("مرحبا")`
      );
    }

    let language = detectLanguage(args[0]);
    let codeArgs = args;

    // إذا بدأ بلغة معروفة
    if (supportedLanguages[args[0]?.toLowerCase()]) {
      language = supportedLanguages[args[0]?.toLowerCase()];
      codeArgs = args.slice(1);
    }

    if (codeArgs.length === 0) {
      return message.reply(getLang("noCode"));
    }

    const code = codeArgs.join(" ");
    const startTime = Date.now();

    // معالجة خاصة بـ JavaScript
    if (language.runner === 'node') {
      let outputs = [];
      function output(msg) {
        outputs.push(msg);
      }
      function out(msg) {
        output(msg);
      }

      try {
        const result = await eval(`
          (async () => {
            try {
              ${code}
            } catch (err) {
              throw err;
            }
          })()
        `);

        const executionTime = Date.now() - startTime;
        let response = `${getLang("success")}\n━━━━━━━━━━━━━━━━━━━━━━\n`;

        if (outputs.length > 0) {
          outputs.forEach((out, i) => {
            const formatted = typeof out === 'object' ? JSON.stringify(out, null, 2) : String(out);
            response += `📌 الإخراج ${i + 1}:\n${truncateString(formatted)}\n`;
          });
          response += `━━━━━━━━━━━━━━━━━━━━━━\n`;
        }

        response += `⏱️ ${getLang("execution")}: ${executionTime}ms\n`;
        response += `🔧 ${language.name}`;

        return message.reply(response);
      } catch (err) {
        const executionTime = Date.now() - startTime;
        let errorMsg = `${getLang("error")}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
        errorMsg += `🔴 ${err.name}:\n${err.message}\n`;
        errorMsg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
        errorMsg += `⏱️ ${getLang("execution")}: ${executionTime}ms\n`;
        errorMsg += `🔧 ${language.name}`;

        return message.reply(truncateString(errorMsg, 1500));
      }
    }

    // تنفيذ لغات أخرى
    const result = executeCode(code, language);
    const executionTime = Date.now() - startTime;

    if (result.success) {
      let response = `${getLang("success")}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      response += `📌 النتيجة:\n${truncateString(result.output)}\n`;
      response += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      response += `⏱️ ${getLang("execution")}: ${executionTime}ms\n`;
      response += `🔧 ${language.name}`;

      return message.reply(response);
    } else {
      let errorMsg = `${getLang("error")}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      errorMsg += `🔴 ${language.name}:\n${truncateString(result.error)}\n`;
      errorMsg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      errorMsg += `⏱️ ${getLang("execution")}: ${executionTime}ms\n`;
      errorMsg += `🔧 ${language.name}`;

      return message.reply(truncateString(errorMsg, 1500));
    }

  } catch (error) {
    console.error("[EVAL] Critical Error:", error);
    return message.reply(`${getLang("error")}\n${error.message}`);
  }
};
