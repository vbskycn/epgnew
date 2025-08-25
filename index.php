<?php
/**
 * EPG数据查询处理脚本
 * 支持两种访问方式：
 * 1. 根路径访问：返回index.xml内容
 * 2. 带参数访问：从index.json中查询特定频道和日期的数据
 */

// 设置响应头
header('Content-Type: text/html; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range');

// 获取查询参数
$channel = $_GET['ch'] ?? '';
$date = $_GET['date'] ?? '';

// 如果没有参数，返回XML文件
if (empty($channel) && empty($date)) {
    // 检查index.xml.gz是否存在，如果存在则返回压缩版本
    if (file_exists('index.xml.gz')) {
        header('Content-Type: application/xml; charset=utf-8');
        header('Content-Encoding: gzip');
        header('Cache-Control: public, max-age=3600');
        readfile('index.xml.gz');
        exit;
    } 
    // 否则返回普通XML文件
    elseif (file_exists('index.xml')) {
        header('Content-Type: application/xml; charset=utf-8');
        header('Cache-Control: public, max-age=3600');
        readfile('index.xml');
        exit;
    } else {
        http_response_code(404);
        echo 'EPG数据文件不存在';
        exit;
    }
}

// 如果有参数，处理JSON查询
if (!empty($channel) || !empty($date)) {
    // 检查index.json是否存在
    if (!file_exists('index.json')) {
        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'EPG数据文件不存在'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    try {
        // 读取JSON数据
        $jsonContent = file_get_contents('index.json');
        $epgData = json_decode($jsonContent, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('JSON数据格式错误: ' . json_last_error_msg());
        }

        // 过滤数据
        $filteredData = filterEpgData($epgData, $channel, $date);
        
        // 返回JSON响应
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: public, max-age=1800');
        echo json_encode($filteredData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        
    } catch (Exception $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

/**
 * 过滤EPG数据
 * @param array $epgData EPG数据
 * @param string $channel 频道名称
 * @param string $date 日期
 * @return array 过滤后的数据
 */
function filterEpgData($epgData, $channel, $date) {
    $result = [
        'channel_name' => $channel ?: '未知频道',
        'date' => $date ?: date('Y-m-d'),
        'url' => 'https://github.com/taksssss/iptv-tool',
        'icon' => $channel ? "https://gcore.jsdelivr.net/gh/taksssss/tv/icon/{$channel}.png" : '',
        'epg_data' => []
    ];

    // 如果没有频道和日期参数，返回所有数据
    if (empty($channel) && empty($date)) {
        $result['epg_data'] = $epgData;
        return $result;
    }

    // 过滤数据
    foreach ($epgData as $programme) {
        $includeProgramme = true;
        
        // 频道过滤
        if (!empty($channel) && isset($programme['@channel'])) {
            $programmeChannel = $programme['@channel'];
            if (is_array($programmeChannel)) {
                $programmeChannel = $programmeChannel['#text'] ?? '';
            }
            // 精确匹配频道名称
            if ($programmeChannel !== $channel) {
                $includeProgramme = false;
            }
        }
        
        // 日期过滤
        if (!empty($date) && isset($programme['@start'])) {
            $startTime = $programme['@start'];
            if (is_string($startTime)) {
                // 检查时间字符串是否包含指定日期
                // 格式如: "20250825000000 +0800"
                $dateStr = str_replace('-', '', $date); // 将 2025-08-25 转换为 20250825
                if (strpos($startTime, $dateStr) === false) {
                    $includeProgramme = false;
                }
            }
        }
        
        if ($includeProgramme) {
            $epgItem = [
                'start' => formatTime($programme['@start'] ?? ''),
                'end' => formatTime($programme['@stop'] ?? ''),
                'title' => $programme['title'] ?? '',
                'desc' => $programme['desc'] ?? ''
            ];
            
            $result['epg_data'][] = $epgItem;
        }
    }

    return $result;
}

/**
 * 格式化时间字符串
 * @param string $timeString 时间字符串 (格式: "20250825000000 +0800")
 * @return string 格式化后的时间 (格式: "00:00")
 */
function formatTime($timeString) {
    if (empty($timeString) || !is_string($timeString)) {
        return '';
    }
    
    // 提取时间部分 (前8位是日期，接下来6位是时间)
    if (preg_match('/^(\d{8})(\d{2})(\d{2})(\d{2})/', $timeString, $matches)) {
        $hour = $matches[3];
        $minute = $matches[4];
        return sprintf('%02d:%02d', $hour, $minute);
    }
    
    // 如果格式不匹配，返回原字符串
    return $timeString;
}
?> 