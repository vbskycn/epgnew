const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * 计算文件的 MD5 哈希值
 * @param {string} filePath 文件路径
 * @returns {Promise<string>} MD5 哈希值
 */
async function calculateMD5(filePath) {
    try {
        const data = await fs.readFile(filePath);
        return crypto.createHash('md5').update(data).digest('hex');
    } catch (error) {
        console.error(`计算 MD5 失败: ${error.message}`);
        return null;
    }
}

/**
 * 计算字符串的 MD5 哈希值
 * @param {string} content 字符串内容
 * @returns {string} MD5 哈希值
 */
function calculateStringMD5(content) {
    return crypto.createHash('md5').update(content, 'utf8').digest('hex');
}

/**
 * 获取当前中国时间
 * @returns {string} 格式化的日期字符串 (YYYY-MM-DD)
 */
function getNowDate() {
    const utc_timestamp = Date.now();
    const china_time = new Date(utc_timestamp + 8 * 60 * 60 * 1000);
    const month = china_time.getMonth() + 1;
    const day = china_time.getDate();
    return `${china_time.getFullYear()}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
}

/**
 * 格式化时间字符串
 * @param {string} time 时间字符串 (格式: 20231129002400)
 * @returns {Object} 包含 date 和 time 的对象
 */
function getFormatTime(time) {
    let result = {
        date: '',
        time: ''
    };

    if (time.length < 8) {
        result['date'] = getNowDate();
        return result;
    }

    let year = time.substring(0, 4);
    let month = time.substring(4, 6);
    let day = time.substring(6, 8);
    result['date'] = year + '-' + month + '-' + day;

    if (time.length >= 12) {
        let hour = time.substring(8, 10);
        let minute = time.substring(10, 12);
        result['time'] = hour + ':' + minute;
    }
    return result;
}

/**
 * 确保目录存在，如果不存在则创建
 * @param {string} dirPath 目录路径
 */
async function ensureDirectory(dirPath) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

/**
 * 保存文件内容
 * @param {string} filePath 文件路径
 * @param {string|Buffer} content 文件内容
 */
async function saveFile(filePath, content) {
    try {
        await ensureDirectory(path.dirname(filePath));
        await fs.writeFile(filePath, content);
        console.log(`文件保存成功: ${filePath}`);
    } catch (error) {
        console.error(`保存文件失败 ${filePath}: ${error.message}`);
        throw error;
    }
}

/**
 * 读取文件内容
 * @param {string} filePath 文件路径
 * @returns {Promise<string>} 文件内容
 */
async function readFile(filePath) {
    try {
        return await fs.readFile(filePath, 'utf8');
    } catch (error) {
        console.error(`读取文件失败 ${filePath}: ${error.message}`);
        return null;
    }
}

/**
 * 检查文件是否存在
 * @param {string} filePath 文件路径
 * @returns {Promise<boolean>} 文件是否存在
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * 延迟执行函数
 * @param {number} ms 延迟毫秒数
 * @returns {Promise} Promise 对象
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 带重试的异步函数执行器
 * @param {Function} fn 要执行的异步函数
 * @param {number} maxRetries 最大重试次数
 * @param {number} delayMs 重试间隔毫秒数
 * @returns {Promise} 执行结果
 */
async function withRetry(fn, maxRetries = 3, delayMs = 1000) {
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries) {
                throw error;
            }
            console.log(`第 ${i + 1} 次尝试失败，${delayMs}ms 后重试: ${error.message}`);
            await delay(delayMs);
            delayMs *= 2; // 指数退避
        }
    }
}

module.exports = {
    calculateMD5,
    calculateStringMD5,
    getNowDate,
    getFormatTime,
    ensureDirectory,
    saveFile,
    readFile,
    fileExists,
    delay,
    withRetry
}; 