#!/usr/bin/env node

const fetch = require('node-fetch');
const xml2js = require('xml2js');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs').promises;
const {
    calculateMD5,
    calculateStringMD5,
    getNowDate,
    getFormatTime,
    saveFile,
    readFile,
    fileExists,
    withRetry
} = require('./utils');

// 配置
const CONFIG = {
    // EPG 数据源（主备）
    primarySources: [
        'https://raw.githubusercontent.com/sparkssssssssss/epg/main/pp.xml',
        'https://raw.githubusercontent.com/sparkssssssssss/epg/main/pp.xml.gz'
    ],
    backupSources: [
        'https://epg.112114.xyz/pp.xml',
        'https://epg.112114.xyz/pp.xml.gz'
    ],
    // 输出文件
    outputFiles: {
        xml: 'epg.xml',
        json: 'epg.json',
        md5: 'epg.md5'
    },
    // 重试配置
    maxRetries: 3,
    retryDelay: 2000
};

/**
 * 下载文件内容
 * @param {string} url 下载地址
 * @returns {Promise<string>} 文件内容
 */
async function downloadFile(url) {
    console.log(`正在下载: ${url}`);
    
    const response = await fetch(url, {
        timeout: 30000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    console.log(`下载完成: ${url} (${content.length} 字符)`);
    return content;
}

/**
 * 尝试从多个数据源下载数据
 * @returns {Promise<string>} 下载的数据内容
 */
async function downloadEPGData() {
    const allSources = [...CONFIG.primarySources, ...CONFIG.backupSources];
    
    for (let i = 0; i < allSources.length; i++) {
        const source = allSources[i];
        try {
            console.log(`尝试数据源 ${i + 1}/${allSources.length}: ${source}`);
            const data = await withRetry(
                () => downloadFile(source),
                CONFIG.maxRetries,
                CONFIG.retryDelay
            );
            
            if (data && data.trim().length > 0) {
                console.log(`成功从 ${source} 下载数据`);
                return data;
            }
        } catch (error) {
            console.warn(`数据源 ${source} 失败: ${error.message}`);
            if (i === allSources.length - 1) {
                throw new Error(`所有数据源都失败了`);
            }
        }
    }
    
    throw new Error('无法从任何数据源下载数据');
}

/**
 * 修复损坏的 XML 内容
 * @param {string} xmlContent 原始 XML 内容
 * @returns {string} 修复后的 XML 内容
 */
function repairXmlContent(xmlContent) {
    console.log('正在修复 XML 内容...');
    
    let repairedXml = xmlContent.trim();
    
    // 检查是否以 </tv> 结尾
    if (!repairedXml.endsWith('</tv>')) {
        console.log('XML 缺少结束标签，尝试修复...');
        
        // 查找最后一个完整的 programme 标签
        const lastProgrammeEnd = repairedXml.lastIndexOf('</programme>');
        if (lastProgrammeEnd > 0) {
            // 截取到最后一个完整的 programme 标签
            repairedXml = repairedXml.substring(0, lastProgrammeEnd + 12);
            console.log('已截取到最后一个完整的 programme 标签');
        } else {
            // 如果没有找到完整的 programme 标签，尝试查找最后一个 programme 开始标签
            const lastProgrammeStart = repairedXml.lastIndexOf('<programme');
            if (lastProgrammeStart > 0) {
                // 查找这个 programme 标签的结束位置
                const nextTagStart = repairedXml.indexOf('<', lastProgrammeStart + 1);
                if (nextTagStart > 0) {
                    repairedXml = repairedXml.substring(0, nextTagStart);
                    console.log('已截取到最后一个 programme 标签的开始');
                }
            }
        }
        
        // 添加结束标签
        repairedXml += '\n</tv>';
        console.log('已添加结束标签 </tv>');
    }
    
    // 检查开始标签
    if (!repairedXml.startsWith('<?xml') && !repairedXml.startsWith('<tv')) {
        repairedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + repairedXml;
        console.log('已添加 XML 声明');
    }
    
    // 验证修复后的 XML 结构
    console.log(`修复后的 XML 长度: ${repairedXml.length} 字符`);
    console.log(`修复后的 XML 开始: ${repairedXml.substring(0, 200)}...`);
    console.log(`修复后的 XML 结束: ...${repairedXml.substring(repairedXml.length - 200)}`);
    
    // 检查基本结构
    const hasTvStart = repairedXml.includes('<tv');
    const hasTvEnd = repairedXml.includes('</tv>');
    const hasProgramme = repairedXml.includes('<programme');
    
    console.log(`XML 结构检查: tv开始=${hasTvStart}, tv结束=${hasTvEnd}, programme=${hasProgramme}`);
    
    return repairedXml;
}

/**
 * 智能修复损坏的 XML 内容
 * @param {string} xmlContent 原始 XML 内容
 * @returns {string} 修复后的 XML 内容
 */
function smartRepairXml(xmlContent) {
    console.log('正在使用智能模式修复 XML 内容...');
    
    let repairedXml = xmlContent.trim();
    
    // 查找最后一个完整的 programme 标签
    const lastProgrammeEnd = repairedXml.lastIndexOf('</programme>');
    if (lastProgrammeEnd > 0) {
        // 截取到最后一个完整的 programme 标签
        repairedXml = repairedXml.substring(0, lastProgrammeEnd + 12);
        console.log('已截取到最后一个完整的 programme 标签');
        
        // 添加结束标签
        repairedXml += '\n</tv>';
        console.log('已添加结束标签 </tv>');
        
        return repairedXml;
    }
    
    // 如果没有找到完整的 programme 标签，尝试查找最后一个 programme 开始标签
    const lastProgrammeStart = repairedXml.lastIndexOf('<programme');
    if (lastProgrammeStart > 0) {
        // 查找这个 programme 标签的结束位置
        const nextTagStart = repairedXml.indexOf('<', lastProgrammeStart + 1);
        if (nextTagStart > 0) {
            repairedXml = repairedXml.substring(0, nextTagStart);
            console.log('已截取到最后一个 programme 标签的开始');
            
            // 添加结束标签
            repairedXml += '\n</tv>';
            console.log('已添加结束标签 </tv>');
            
            return repairedXml;
        }
    }
    
    // 如果都失败了，尝试最基本的修复
    console.log('尝试最基本的 XML 修复...');
    if (!repairedXml.endsWith('</tv>')) {
        repairedXml += '\n</tv>';
    }
    
    return repairedXml;
}

/**
 * 将 XML 转换为 JSON 格式
 * @param {string} xmlContent XML 内容
 * @returns {Promise<Object>} JSON 对象
 */
async function convertXmlToJson(xmlContent) {
    console.log('正在转换 XML 到 JSON...');
    
    try {
        // 检查 XML 内容
        console.log(`XML 内容长度: ${xmlContent.length} 字符`);
        console.log(`XML 开始: ${xmlContent.substring(0, 200)}...`);
        console.log(`XML 结束: ...${xmlContent.substring(xmlContent.length - 200)}`);
        
        // 首先尝试智能修复
        let repairedXml = smartRepairXml(xmlContent);
        
        // 验证修复后的 XML 结构
        console.log(`修复后的 XML 长度: ${repairedXml.length} 字符`);
        console.log(`修复后的 XML 开始: ${repairedXml.substring(0, 200)}...`);
        console.log(`修复后的 XML 结束: ...${repairedXml.substring(repairedXml.length - 200)}`);
        
        // 检查基本结构
        const hasTvStart = repairedXml.includes('<tv');
        const hasTvEnd = repairedXml.includes('</tv>');
        const hasProgramme = repairedXml.includes('<programme');
        
        console.log(`XML 结构检查: tv开始=${hasTvStart}, tv结束=${hasTvEnd}, programme=${hasProgramme}`);
        
        const parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true,
            attrNamePrefix: '@',
            ignoreAttrs: false,
            trim: true,
            normalize: true,
            normalizeTags: false,
            explicitChildren: false,
            preserveChildrenOrder: false,
            charsAsChildren: false,
            includeWhiteChars: false,
            strict: false,
            explicitRoot: true,
            validator: null,
            xmlns: false,
            explicitChildren: false,
            childkey: '__children__',
            charkey: '__text__',
            renderOpts: {
                pretty: false,
                indent: '',
                newline: ''
            }
        });
        
        const result = await parser.parseStringPromise(repairedXml);
        
        if (!result.tv || !result.tv.programme) {
            throw new Error('XML 格式无效：缺少 tv 或 programme 元素');
        }
        
        console.log(`转换完成，找到 ${result.tv.programme.length} 个节目`);
        return result;
    } catch (error) {
        console.error('XML 转换失败:', error.message);
        
        // 尝试更宽松的解析
        try {
            console.log('尝试使用宽松模式解析...');
            const parser = new xml2js.Parser({
                explicitArray: false,
                mergeAttrs: true,
                attrNamePrefix: '@',
                strict: false,
                ignoreAttrs: false,
                trim: true
            });
            
            const result = await parser.parseStringPromise(xmlContent);
            
            if (result.tv && result.tv.programme) {
                console.log(`宽松模式解析成功，找到 ${result.tv.programme.length} 个节目`);
                return result;
            } else {
                throw new Error('宽松模式解析后仍无法找到有效数据');
            }
        } catch (retryError) {
            console.error('宽松模式解析也失败了:', retryError.message);
            throw new Error(`XML 解析失败: ${error.message}`);
        }
    }
}

/**
 * 检查数据是否需要更新
 * @param {string} newContent 新数据内容
 * @returns {Promise<boolean>} 是否需要更新
 */
async function needsUpdate(newContent) {
    const md5File = CONFIG.outputFiles.md5;
    
    if (!(await fileExists(md5File))) {
        console.log('MD5 文件不存在，需要更新');
        return true;
    }
    
    try {
        const oldMD5 = await readFile(md5File);
        const newMD5 = calculateStringMD5(newContent);
        
        if (oldMD5.trim() === newMD5) {
            console.log('数据未变化，无需更新');
            return false;
        }
        
        console.log(`数据已变化，旧 MD5: ${oldMD5.trim()}, 新 MD5: ${newMD5}`);
        return true;
    } catch (error) {
        console.warn('检查 MD5 失败，将进行更新:', error.message);
        return true;
    }
}

/**
 * 保存所有输出文件
 * @param {string} xmlContent XML 内容
 * @param {Object} jsonData JSON 数据
 */
async function saveOutputFiles(xmlContent, jsonData) {
    console.log('正在保存输出文件...');
    
    // 保存 XML 文件
    await saveFile(CONFIG.outputFiles.xml, xmlContent);
    
    // 保存 JSON 文件
    const jsonContent = JSON.stringify(jsonData, null, 2);
    await saveFile(CONFIG.outputFiles.json, jsonContent);
    
    // 保存 MD5 文件
    const md5Content = calculateStringMD5(xmlContent);
    await saveFile(CONFIG.outputFiles.md5, md5Content);
    
    console.log('所有输出文件保存完成');
}

/**
 * 执行 Git 操作
 */
async function performGitOperations() {
    console.log('正在执行 Git 操作...');
    
    try {
        const git = simpleGit();
        
        // 检查是否有变更
        const status = await git.status();
        if (status.files.length === 0) {
            console.log('没有文件变更，跳过 Git 操作');
            return;
        }
        
        // 添加所有文件
        await git.add('.');
        console.log('文件已添加到 Git');
        
        // 提交变更
        const commitMessage = `Auto-sync EPG data ${new Date().toISOString()}`;
        await git.commit(commitMessage);
        console.log('变更已提交');
        
        // 推送到远程仓库
        await git.push();
        console.log('变更已推送到远程仓库');
        
    } catch (error) {
        console.error('Git 操作失败:', error.message);
        throw error;
    }
}

/**
 * 主函数
 */
async function main() {
    const startTime = Date.now();
    console.log('=== EPG 数据同步开始 ===');
    console.log(`开始时间: ${new Date().toISOString()}`);
    
    try {
        // 1. 下载 EPG 数据
        const xmlContent = await downloadEPGData();
        
        // 2. 检查是否需要更新
        if (!(await needsUpdate(xmlContent))) {
            console.log('数据无需更新，同步完成');
            return;
        }
        
        // 3. 转换 XML 到 JSON
        const jsonData = await convertXmlToJson(xmlContent);
        
        // 4. 保存输出文件
        await saveOutputFiles(xmlContent, jsonData);
        
        // 5. 执行 Git 操作
        await performGitOperations();
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        console.log(`=== EPG 数据同步完成 ===`);
        console.log(`完成时间: ${new Date().toISOString()}`);
        console.log(`总耗时: ${duration.toFixed(2)} 秒`);
        
    } catch (error) {
        console.error('EPG 数据同步失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(error => {
        console.error('未捕获的错误:', error);
        process.exit(1);
    });
}

module.exports = {
    downloadEPGData,
    convertXmlToJson,
    needsUpdate,
    saveOutputFiles,
    performGitOperations
}; 