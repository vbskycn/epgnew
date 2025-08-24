# EPG 数据同步项目

这是一个自动同步 EPG（电子节目指南）数据的项目，支持定时同步、MD5 验证和格式转换。使用 Python 实现可靠的 XML 解析和数据处理。

## 功能特性

- 🔄 **自动同步**：每3小时自动同步 EPG 数据
- 🛡️ **主备切换**：支持多个数据源，自动故障转移
- 🔍 **MD5 验证**：避免重复更新，节省资源
- 📊 **格式转换**：自动将 XML 转换为 JSON 格式
- 🤖 **Git 集成**：自动提交和推送更新
- 📝 **详细日志**：完整的执行日志和错误处理
- 🔧 **智能修复**：自动修复截断或损坏的 XML 文件
- 🐍 **Python 实现**：使用 Python 和 xmltodict 实现可靠的 XML 解析

## 数据源

### 主数据源
- `https://raw.githubusercontent.com/sparkssssssssss/epg/main/pp.xml`
- `https://raw.githubusercontent.com/sparkssssssssss/epg/main/pp.xml.gz`

### 备用数据源
- `https://epg.112114.xyz/pp.xml`
- `https://epg.112114.xyz/pp.xml.gz`

## 项目结构

```
epgnew/
├── .github/
│   └── workflows/
│       └── sync-epg.yml          # GitHub Actions 工作流
├── scripts/
│   ├── sync-epg.py               # 主同步脚本 (Python)
│   ├── sync-epg.js               # 备用同步脚本 (Node.js)
│   └── utils.js                  # 工具函数库 (Node.js)
├── worker.js                     # Cloudflare Worker 脚本
├── index.xml                     # 同步的 XML 数据
├── index.xml.gz                  # 同步的 GZ 压缩数据
├── index.json                    # 转换后的 JSON 数据
├── md5.txt                       # MD5 校验文件
├── requirements.txt              # Python 依赖
├── package.json                  # Node.js 依赖
└── README.md                     # 项目说明
```

## 工作原理

1. **定时触发**：GitHub Actions 每3小时自动运行
2. **数据下载**：从主数据源下载 EPG 数据，失败时自动切换到备用源
3. **智能处理**：自动检测文件类型，支持 XML 和 GZ 压缩格式
4. **智能修复**：自动检测和修复截断或损坏的 XML 文件
5. **MD5 验证**：计算新数据的 MD5 值，与本地文件比较
6. **格式转换**：将 XML 数据转换为 JSON 格式，同时将频道 ID 替换为频道名称
7. **文件保存**：保存 XML、GZ、JSON 和 MD5 文件
8. **Git 操作**：自动提交变更并推送到远程仓库

## 配置说明

### GitHub Actions 配置

工作流文件位于 `.github/workflows/sync-epg.yml`，主要配置：

- **定时执行**：`cron: '0 */3 * * *'` (每3小时)
- **运行环境**：Ubuntu 20.04
- **Python 版本**：3.9
- **依赖安装**：自动安装 requirements.txt 中的依赖

### 同步脚本配置

在 `scripts/sync-epg.py` 中可以调整：

- 数据源地址
- 重试次数和延迟
- 输出文件名
- 超时设置

## 使用方法

### 自动运行

项目配置完成后，GitHub Actions 会自动运行，无需手动干预。

### 手动触发

1. 进入 GitHub 仓库页面
2. 点击 "Actions" 标签
3. 选择 "Sync EPG Data" 工作流
4. 点击 "Run workflow" 按钮

### 本地测试

```bash
# 安装 Python 依赖
pip install -r requirements.txt

# 运行同步脚本
python scripts/sync-epg.py
```

### Node.js 版本（备用）

```bash
# 安装 Node.js 依赖
npm install

# 运行同步脚本
node scripts/sync-epg.js
```

## 输出文件

- **index.xml**：原始 EPG 数据（XML 格式）
- **index.xml.gz**：原始 EPG 数据（GZ 压缩格式）
- **index.json**：转换后的 EPG 数据（JSON 格式，包含频道名称映射）
- **md5.txt**：数据 MD5 校验值

## JSON 数据格式

转换后的 JSON 数据结构：
```json
[
  {
    "@channel": "CCTV1",
    "@start": "20240824000000 +0800",
    "@stop": "20240824003000 +0800",
    "title": {
      "@lang": "zh",
      "#text": "新闻联播"
    },
    "desc": {
      "@lang": "zh", 
      "#text": "节目描述"
    }
  }
]
```

## 依赖说明

### Python 依赖
- **requests**：HTTP 请求库
- **xmltodict**：XML 到字典转换库（比 xml2js 更可靠）

### Node.js 依赖（备用）
- **node-fetch@2**：HTTP 请求库
- **xml2js**：XML 到 JSON 转换库
- **simple-git**：Git 操作库

## 故障排除

### 常见问题

1. **数据源无法访问**
   - 检查网络连接
   - 验证数据源地址是否有效
   - 查看 GitHub Actions 日志

2. **XML 解析失败**
   - Python 版本会自动修复截断的 XML 文件
   - 检查 XML 格式是否严重损坏
   - 查看错误日志

3. **Git 操作失败**
   - 检查仓库权限设置
   - 验证 GitHub Token 配置
   - 确认分支保护规则

### 日志查看

所有执行日志都会在 GitHub Actions 中显示，包括：
- 下载进度
- XML 修复状态
- 转换状态
- 错误信息
- 执行时间

## 技术优势

- **可靠性**：Python 的 xmltodict 库比 Node.js 的 xml2js 更能处理格式问题
- **智能修复**：自动检测和修复截断的 XML 文件
- **多格式支持**：自动检测并处理 XML 和 GZ 压缩格式
- **性能优化**：只在数据变化时才进行更新
- **错误处理**：完善的重试机制和错误恢复
- **双语言支持**：同时提供 Python 和 Node.js 版本
- **存储优化**：同时保存原始 GZ 文件和解析后的 XML 文件

## 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。

## 许可证

本项目采用 MIT 许可证。 