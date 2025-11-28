const { removeHomeDir } = global.utils;

module.exports.config = {
  name: "تنفيذ",
  aliases: ["eval", "كود", "execute"],
  version: "2.0",
  author: "Yamada KJ | Enhanced",
  countDown: 5,
  role: 2,
  description: "اختبار وتنفيذ الكود بسرعة",
  category: "المالك",
  guide: "{pn} <الكود المراد اختباره>"
};

module.exports.langs = {
  ar: {
    error: "❌ خطأ:",
    warning: "⚠️ تحذير:",
    success: "✅ تم التنفيذ بنجاح",
    noCode: "❌ لم تقدم أي كود للتنفيذ!",
    noOutput: "✅ لا توجد نتيجة (undefined)",
    typeInfo: "📊 النوع",
    timeout: "❌ انتهت مهلة الوقت (Timeout) - الكود يستغرق وقتاً طويلاً",
    info: "ℹ️ معلومات:",
    usage: "💡 الاستخدام",
    line: "السطر",
    length: "الطول"
  },
  en: {
    error: "❌ Error:",
    warning: "⚠️ Warning:",
    success: "✅ Code executed successfully",
    noCode: "❌ No code provided to execute!",
    noOutput: "✅ No output (undefined)",
    typeInfo: "📊 Type",
    timeout: "❌ Timeout - Code takes too long",
    info: "ℹ️ Info:",
    usage: "💡 Usage",
    line: "Line",
    length: "Length"
  },
  vi: {
    error: "❌ Lỗi:",
    warning: "⚠️ Cảnh báo:",
    success: "✅ Mã được thực thi thành công",
    noCode: "❌ Không có mã nào để thực thi!",
    noOutput: "✅ Không có kết quả (undefined)",
    typeInfo: "📊 Loại",
    timeout: "❌ Hết thời gian - Mã mất quá lâu",
    info: "ℹ️ Thông tin:",
    usage: "💡 Cách sử dụng",
    line: "Dòng",
    length: "Độ dài"
  }
};

function formatOutput(value) {
  try {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    
    const type = typeof value;
    
    if (type === "string") return value;
    if (type === "number" || type === "boolean") return String(value);
    if (type === "function") return `[Function: ${value.name || "anonymous"}]`;
    
    if (value instanceof Date) return value.toISOString();
    if (value instanceof RegExp) return value.toString();
    if (value instanceof Map) {
      const obj = {};
      value.forEach((v, k) => obj[k] = v);
      return JSON.stringify(obj, null, 2);
    }
    if (value instanceof Set) return JSON.stringify(Array.from(value), null, 2);
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    if (Array.isArray(value)) return JSON.stringify(value, null, 2);
    if (type === "object") return JSON.stringify(value, null, 2);
    
    return String(value);
  } catch (err) {
    return `[Unable to format: ${err.message}]`;
  }
}

function getTypeInfo(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return `Array[${value.length}]`;
  if (value instanceof Map) return `Map(${value.size})`;
  if (value instanceof Set) return `Set(${value.size})`;
  if (value instanceof Date) return "Date";
  if (value instanceof RegExp) return "RegExp";
  if (value instanceof Error) return value.constructor.name;
  return typeof value;
}

function truncateString(str, maxLength = 2000) {
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + `\n\n...[مختصر - العدد الكامل: ${str.length} حرف]`;
  }
  return str;
}

module.exports.onStart = async function ({ api, args, message, event, getLang }) {
  try {
    // التحقق من وجود كود
    if (!args || args.length === 0) {
      return message.reply(getLang("noCode"));
    }

    const code = args.join(" ");
    const startTime = Date.now();

    // دالة الإخراج الآمنة
    let outputs = [];
    function output(msg) {
      outputs.push(msg);
    }
    function out(msg) {
      output(msg);
    }

    // تنفيذ الكود مع timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT")), 5000);
    });

    const executePromise = (async () => {
      try {
        const result = await eval(`
          (async () => {
            try {
              const result = await (async () => {
                ${code}
              })();
              return result;
            } catch (err) {
              throw err;
            }
          })()
        `);
        return result;
      } catch (err) {
        throw err;
      }
    })();

    let result;
    try {
      result = await Promise.race([executePromise, timeoutPromise]);
    } catch (err) {
      if (err.message === "TIMEOUT") {
        return message.reply(getLang("timeout"));
      }
      throw err;
    }

    const executionTime = Date.now() - startTime;

    // معالجة النتيجة
    let response = `${getLang("success")}\n`;
    response += `━━━━━━━━━━━━━━━━━━━━━━━\n`;

    if (outputs.length > 0) {
      outputs.forEach((out, i) => {
        const formatted = formatOutput(out);
        response += `📌 الإخراج ${i + 1}:\n${truncateString(formatted)}\n`;
      });
      response += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    }

    if (result !== undefined) {
      const formatted = formatOutput(result);
      const typeInfo = getTypeInfo(result);
      response += `📌 النتيجة:\n${truncateString(formatted)}\n`;
      response += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      response += `${getLang("typeInfo")}: ${typeInfo}\n`;
    } else if (outputs.length === 0) {
      response += getLang("noOutput") + "\n";
      response += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    }

    response += `⏱️ الوقت: ${executionTime}ms\n`;
    response += `📊 عدد السطور: ${code.split('\n').length}\n`;

    message.reply(response);

  } catch (error) {
    try {
      let errorMsg = `${getLang("error")}\n`;
      errorMsg += `━━━━━━━━━━━━━━━━━━━━━━\n`;

      if (error.name === "SyntaxError") {
        errorMsg += `🔴 خطأ في الصيغة (Syntax):\n`;
      } else if (error.name === "ReferenceError") {
        errorMsg += `🔴 خطأ في المرجع:\n`;
      } else if (error.name === "TypeError") {
        errorMsg += `🔴 خطأ في النوع:\n`;
      } else {
        errorMsg += `🔴 ${error.name}:\n`;
      }

      errorMsg += `${error.message}\n`;
      errorMsg += `━━━━━━━━━━━━━━━━━━━━━━\n`;

      if (error.stack) {
        const stackLines = error.stack.split('\n').slice(0, 3);
        errorMsg += `📍 المكان:\n${stackLines.map(line => line.trim()).join('\n')}\n`;
        errorMsg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      }

      errorMsg += `💡 ${getLang("info")} eval.js v2.0`;

      message.reply(truncateString(errorMsg, 1500));
    } catch (innerError) {
      console.error("[EVAL] Critical Error:", innerError);
      message.reply(`${getLang("error")}\n${innerError.message}`);
    }
  }
};
