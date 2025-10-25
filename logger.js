// logger.js - 插件的内存日志记录器

const logCache = [];
const MAX_LOGS = 500; // 限制日志数量，防止内存溢出

/**
 * 格式化当前时间为 HH:MM:SS.ms
 * @returns {string} 格式化后的时间字符串
 */
function getTimeStamp() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * 记录一条日志到内存缓存，并同时输出到控制台。
 * @param {string} message - 日志消息.
 * @param  {...any} data - 附加数据，将被JSON序列化.
 */
export function log(message, ...data) {
    const formattedMessage = `[${getTimeStamp()}] ${message}`;

    let dataString = '';
    if (data.length > 0) {
        try {
            const cache = new Set();
            const replacer = (key, value) => {
                // 1. 避免循环引用
                if (typeof value === 'object' && value !== null) {
                    if (cache.has(value)) {
                        return '[Circular Reference]';
                    }
                    cache.add(value);
                }

                // 2. 摘要化 DOM 元素
                if (value && typeof value.tagName === 'string') {
                    return `[HTMLElement <${value.tagName.toLowerCase()} id='${value.id}' class='${value.className}'>]`;
                }

                // 3. 截断特别长的字符串，尤其是脚本内容
                if (typeof value === 'string' && value.length > 300) {
                    // 对JSR脚本内容进行特殊标记
                    if (key === 'content') {
                        return `[Script content, length: ${value.length}]`;
                    }
                    return value.substring(0, 300) + '...[truncated]';
                }

                return value;
            };
            dataString = data.map(d => JSON.stringify(d, replacer, 2)).join('\n');

        } catch (error) {
            dataString = `[Error serializing data: ${error.message}]`;
        }
    }

    const finalLog = dataString ? `${formattedMessage}\n${dataString}` : formattedMessage;

    if (logCache.length >= MAX_LOGS) {
        logCache.shift(); // 移除最旧的日志
    }
    logCache.push(finalLog);

    // 也在控制台打印，方便本地调试
    console.log(`[QRQ Debug] ${message}`, ...data);
}

/**
 * 获取所有缓存的日志，并以字符串形式返回。
 * @returns {string} 所有日志拼接成的字符串
 */
export function getLogs() {
    return logCache.join('\n\n');
}

/**
 * 清空日志缓存
 */
export function clearLogs() {
    logCache.length = 0;
    log('Log cache cleared.');
}
