#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import hashlib
import json
import os
import sys
import time
from datetime import datetime
import xmltodict
import subprocess

# 配置
CONFIG = {
    # EPG 数据源（主备）
    'primary_sources': [
        'https://raw.githubusercontent.com/sparkssssssssss/epg/main/pp.xml',
        'https://raw.githubusercontent.com/sparkssssssssss/epg/main/pp.xml.gz'
    ],
    'backup_sources': [
        'https://epg.112114.xyz/pp.xml',
        'https://epg.112114.xyz/pp.xml.gz'
    ],
    # 输出文件
    'output_files': {
        'xml': 'index.xml',
        'xml_gz': 'index.xml.gz',
        'json': 'index.json',
        'md5': 'md5.txt'
    },
    # 重试配置
    'max_retries': 3,
    'retry_delay': 2,
    'timeout': 30
}

def download_file(url):
    """下载文件内容"""
    print(f"正在下载: {url}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    response = requests.get(url, headers=headers, timeout=CONFIG['timeout'])
    response.raise_for_status()
    
    # 检查是否是 gz 文件
    if url.endswith('.gz'):
        # 保存 gz 文件
        gz_filename = CONFIG['output_files']['xml_gz']
        with open(gz_filename, 'wb') as f:
            f.write(response.content)
        print(f"GZ 文件保存成功: {gz_filename}")
        
        # 解压并返回 XML 内容
        import gzip
        try:
            xml_content = gzip.decompress(response.content).decode('utf-8')
            print(f"GZ 文件解压成功，XML 内容长度: {len(xml_content)} 字符")
            return xml_content
        except Exception as e:
            print(f"GZ 文件解压失败: {e}")
            # 如果解压失败，尝试直接读取内容
            return response.text
    else:
        # 普通 XML 文件
        content = response.text
        print(f"下载完成: {url} ({len(content)} 字符)")
        return content

def download_epg_data():
    """尝试从多个数据源下载数据"""
    all_sources = CONFIG['primary_sources'] + CONFIG['backup_sources']
    
    for i, source in enumerate(all_sources):
        try:
            print(f"尝试数据源 {i + 1}/{len(all_sources)}: {source}")
            
            for retry in range(CONFIG['max_retries']):
                try:
                    data = download_file(source)
                    if data and data.strip():
                        print(f"成功从 {source} 下载数据")
                        return data
                except Exception as e:
                    print(f"第 {retry + 1} 次尝试失败: {e}")
                    if retry < CONFIG['max_retries'] - 1:
                        time.sleep(CONFIG['retry_delay'] * (2 ** retry))
                    
        except Exception as error:
            print(f"数据源 {source} 失败: {error}")
            if i == len(all_sources) - 1:
                raise Exception("所有数据源都失败了")
    
    raise Exception('无法从任何数据源下载数据')

def calculate_md5(content):
    """计算字符串的 MD5 哈希值"""
    return hashlib.md5(content.encode('utf-8')).hexdigest()

def needs_update(new_content):
    """检查数据是否需要更新"""
    md5_file = CONFIG['output_files']['md5']
    
    if not os.path.exists(md5_file):
        print('MD5 文件不存在，需要更新')
        return True
    
    try:
        with open(md5_file, 'r', encoding='utf-8') as f:
            old_md5 = f.read().strip()
        
        new_md5 = calculate_md5(new_content)
        
        if old_md5 == new_md5:
            print('数据未变化，无需更新')
            return False
        
        print(f'数据已变化，旧 MD5: {old_md5}, 新 MD5: {new_md5}')
        return True
    except Exception as error:
        print(f'检查 MD5 失败，将进行更新: {error}')
        return True

def repair_xml_content(xml_content):
    """修复损坏的 XML 内容"""
    print('正在修复 XML 内容...')
    
    repaired_xml = xml_content.strip()
    
    # 检查是否以 </tv> 结尾
    if not repaired_xml.endswith('</tv>'):
        print('XML 缺少结束标签，尝试修复...')
        
        # 查找最后一个完整的 programme 标签
        last_programme_end = repaired_xml.rfind('</programme>')
        if last_programme_end > 0:
            # 截取到最后一个完整的 programme 标签
            repaired_xml = repaired_xml[:last_programme_end + 12]
            print('已截取到最后一个完整的 programme 标签')
        else:
            # 如果没有找到完整的 programme 标签，尝试查找最后一个 programme 开始标签
            last_programme_start = repaired_xml.rfind('<programme')
            if last_programme_start > 0:
                # 截取到这个位置之前
                repaired_xml = repaired_xml[:last_programme_start]
                print('已截取到最后一个 programme 标签之前')
        
        # 添加结束标签
        repaired_xml += '\n</tv>'
        print('已添加结束标签 </tv>')
    
    # 检查开始标签
    if not repaired_xml.startswith('<?xml') and not repaired_xml.startswith('<tv'):
        repaired_xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + repaired_xml
        print('已添加 XML 声明')
    
    print(f'修复后的 XML 长度: {len(repaired_xml)} 字符')
    return repaired_xml

def convert_xml_to_json(xml_content):
    """将 XML 转换为 JSON 格式"""
    print('正在转换 XML 到 JSON...')
    
    try:
        # 首先尝试修复 XML 内容
        repaired_xml = repair_xml_content(xml_content)
        
        # 解析 XML
        xml_dict = xmltodict.parse(repaired_xml)
        
        if 'tv' not in xml_dict:
            raise Exception('XML 格式无效：缺少 tv 元素')
        
        tv_data = xml_dict['tv']
        
        if 'programme' not in tv_data:
            raise Exception('XML 格式无效：缺少 programme 元素')
        
        # 获取频道和节目数据
        channels = tv_data.get('channel', [])
        programmes = tv_data.get('programme', [])
        
        # 确保 channels 和 programmes 是列表
        if not isinstance(channels, list):
            channels = [channels]
        if not isinstance(programmes, list):
            programmes = [programmes]
        
        print(f'找到 {len(channels)} 个频道，{len(programmes)} 个节目')
        
        # 将频道 ID 替换为频道名称
        for programme in programmes:
            for channel in channels:
                if channel.get('@id') == programme.get('@channel'):
                    # 获取频道显示名称
                    display_name = channel.get('display-name', {})
                    if isinstance(display_name, dict):
                        programme['@channel'] = display_name.get('#text', programme.get('@channel'))
                    elif isinstance(display_name, str):
                        programme['@channel'] = display_name
                    break
        
        print(f'转换完成，处理了 {len(programmes)} 个节目')
        return programmes
        
    except Exception as error:
        print(f'XML 转换失败: {error}')
        raise

def save_output_files(xml_content, json_data):
    """保存所有输出文件"""
    print('正在保存输出文件...')
    
    # 保存 XML 文件
    with open(CONFIG['output_files']['xml'], 'w', encoding='utf-8') as f:
        f.write(xml_content)
    print(f"XML 文件保存成功: {CONFIG['output_files']['xml']}")
    
    # 保存 JSON 文件
    with open(CONFIG['output_files']['json'], 'w', encoding='utf-8') as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)
    print(f"JSON 文件保存成功: {CONFIG['output_files']['json']}")
    
    # 保存 MD5 文件
    md5_content = calculate_md5(xml_content)
    with open(CONFIG['output_files']['md5'], 'w', encoding='utf-8') as f:
        f.write(md5_content)
    print(f"MD5 文件保存成功: {CONFIG['output_files']['md5']}")
    
    print('所有输出文件保存完成')

def perform_git_operations():
    """执行 Git 操作"""
    print('正在执行 Git 操作...')
    
    try:
        # 检查是否有变更
        result = subprocess.run(['git', 'status', '--porcelain'], 
                              capture_output=True, text=True, check=True)
        
        if not result.stdout.strip():
            print('没有文件变更，跳过 Git 操作')
            return
        
        # 添加所有文件
        subprocess.run(['git', 'add', '.'], check=True)
        print('文件已添加到 Git')
        
        # 提交变更
        commit_message = f'Auto-sync EPG data {datetime.now().isoformat()}'
        subprocess.run(['git', 'commit', '-m', commit_message], check=True)
        print('变更已提交')
        
        # 推送到远程仓库
        subprocess.run(['git', 'push'], check=True)
        print('变更已推送到远程仓库')
        
    except subprocess.CalledProcessError as error:
        print(f'Git 操作失败: {error}')
        raise
    except Exception as error:
        print(f'Git 操作失败: {error}')
        raise

def main():
    """主函数"""
    start_time = time.time()
    print('=== EPG 数据同步开始 ===')
    print(f'开始时间: {datetime.now().isoformat()}')
    
    try:
        # 1. 下载 EPG 数据
        xml_content = download_epg_data()
        
        # 2. 检查是否需要更新
        if not needs_update(xml_content):
            print('数据无需更新，同步完成')
            return
        
        # 3. 转换 XML 到 JSON
        json_data = convert_xml_to_json(xml_content)
        
        # 4. 保存输出文件
        save_output_files(xml_content, json_data)
        
        # 5. 执行 Git 操作
        perform_git_operations()
        
        end_time = time.time()
        duration = end_time - start_time
        print(f'=== EPG 数据同步完成 ===')
        print(f'完成时间: {datetime.now().isoformat()}')
        print(f'总耗时: {duration:.2f} 秒')
        
    except Exception as error:
        print(f'EPG 数据同步失败: {error}')
        sys.exit(1)

if __name__ == '__main__':
    main() 