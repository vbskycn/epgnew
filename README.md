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



## 工作原理

1. **定时触发**：GitHub Actions 每3小时自动运行
2. **数据下载**：从主数据源下载 EPG 数据，失败时自动切换到备用源
3. **智能处理**：自动检测文件类型，支持 XML 和 GZ 压缩格式
4. **智能修复**：自动检测和修复截断或损坏的 XML 文件
5. **MD5 验证**：计算新数据的 MD5 值，与本地文件比较
6. **格式转换**：将 XML 数据转换为 JSON 格式，同时将频道 ID 替换为频道名称
7. **文件保存**：保存 XML、GZ、JSON 和 MD5 文件
8. **Git 操作**：自动提交变更并推送到远程仓库

### 本地测试

```bash
# 安装 Python 依赖
pip install -r requirements.txt

# 运行同步脚本
python scripts/sync-epg.py
```

## 输出文件

- **index.xml**：原始 EPG 数据（XML 格式）
- **index.xml.gz**：原始 EPG 数据（GZ 压缩格式）
- **index.json**：转换后的 EPG 数据（JSON 格式，包含频道名称映射）
- **md5.txt**：数据 MD5 校验值

## JSON 数据格式

#### 支持diyp&百川

```
https://youdomain.com/?ch=CCTV1&date=2025-08-25
```

#### 转换后的 JSON 数据结构：

```json
{
    "channel_name": "CCTV1",
    "date": "2025-08-25",
    "epg_data": [
        {
            "start": "01:00",
            "end": "01:32",
            "title": "纪录片瞬间中国-农耕探文明4",
            "desc": ""
        },
        {
            "start": "23:23",
            "end": "23:59",
            "title": "非遗里的中国（第三季）-9",
            "desc": ""
        }
    ]
}
```

## 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。

## 许可证

本项目采用 MIT 许可证。 