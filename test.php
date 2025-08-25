<?php
/**
 * EPG查询功能测试脚本
 */

echo "<h1>EPG查询功能测试</h1>";

// 测试1: 无参数访问
echo "<h2>测试1: 无参数访问 (应该返回XML)</h2>";
echo "<p>访问: <a href='index.php' target='_blank'>index.php</a></p>";

// 测试2: 带频道参数访问
echo "<h2>测试2: 带频道参数访问</h2>";
echo "<p>访问: <a href='index.php?ch=CCTV1' target='_blank'>index.php?ch=CCTV1</a></p>";

// 测试3: 带频道和日期参数访问
echo "<h2>测试3: 带频道和日期参数访问</h2>";
echo "<p>访问: <a href='index.php?ch=CCTV1&date=2025-08-25' target='_blank'>index.php?ch=CCTV1&date=2025-08-25</a></p>";

// 测试4: 测试其他频道
echo "<h2>测试4: 其他频道</h2>";
echo "<p>访问: <a href='index.php?ch=4K健身&date=2025-08-25' target='_blank'>index.php?ch=4K健身&date=2025-08-25</a></p>";

// 测试5: 检查文件是否存在
echo "<h2>测试5: 文件检查</h2>";
$files = ['index.xml', 'index.xml.gz', 'index.json'];
foreach ($files as $file) {
    if (file_exists($file)) {
        $size = filesize($file);
        echo "<p>✓ {$file} 存在 (大小: " . number_format($size) . " 字节)</p>";
    } else {
        echo "<p>✗ {$file} 不存在</p>";
    }
}

// 测试6: JSON数据结构检查
echo "<h2>测试6: JSON数据结构检查</h2>";
if (file_exists('index.json')) {
    $jsonContent = file_get_contents('index.json');
    $epgData = json_decode($jsonContent, true);
    
    if (json_last_error() === JSON_ERROR_NONE) {
        echo "<p>✓ JSON格式正确</p>";
        echo "<p>数据条数: " . count($epgData) . "</p>";
        
        if (count($epgData) > 0) {
            $firstItem = $epgData[0];
            echo "<p>第一条数据示例:</p>";
            echo "<pre>" . json_encode($firstItem, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "</pre>";
        }
    } else {
        echo "<p>✗ JSON格式错误: " . json_last_error_msg() . "</p>";
    }
} else {
    echo "<p>✗ index.json 文件不存在</p>";
}
?> 