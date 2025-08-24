// EdgeOne Pages Function - EPG 数据查询
// 支持根路径查询参数：/?ch=CCTV1&date=2025-08-24

// 尝试使用不同的导出方式
export async function onRequest(context) {
  return handleRequest(context);
}

export async function handleRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  console.log('=== Pages Function 被调用 ===');
  console.log('完整 URL:', url.toString());
  console.log('路径:', url.pathname);
  console.log('查询参数:', Object.fromEntries(url.searchParams.entries()));
  
  // 获取查询参数
  const channel = url.searchParams.get('ch');
  const date = url.searchParams.get('date');
  
  try {
    // 如果没有查询参数，返回 XML 数据
    if (!channel && !date) {
      console.log('无查询参数，返回 XML 数据');
      
      // 尝试读取 XML 文件
      const xmlData = await env.ASSETS.get('index.xml');
      if (xmlData) {
        console.log('XML 数据读取成功，长度:', xmlData.length);
        return new Response(xmlData, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }
      
      console.log('XML 数据读取失败');
      return new Response('<?xml version="1.0" encoding="UTF-8"?><error><message>XML 文件不存在</message></error>', { 
        status: 404,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 有查询参数时，返回过滤后的 JSON 数据
    console.log('有查询参数，返回 JSON 数据');
    const jsonData = await env.ASSETS.get('index.json');
    if (!jsonData) {
      console.log('JSON 数据读取失败');
      return new Response(JSON.stringify({ error: 'JSON 数据文件不存在' }), { 
        status: 404,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    const epgData = JSON.parse(jsonData);
    console.log('JSON 数据解析成功，原始数据条数:', epgData.length);
    
    // 过滤数据
    let filteredData = epgData;
    
    // 按频道过滤
    if (channel) {
      filteredData = filteredData.filter(programme => 
        programme['@channel'] === channel
      );
      console.log('按频道过滤后，数据条数:', filteredData.length);
    }
    
    // 按日期过滤
    if (date) {
      const targetDate = date.replace(/-/g, ''); // 将 2025-08-24 转换为 20250824
      filteredData = filteredData.filter(programme => {
        const startTime = programme['@start'];
        if (startTime && startTime.length >= 8) {
          const programmeDate = startTime.substring(0, 8); // 提取日期部分
          return programmeDate === targetDate;
        }
        return false;
      });
      console.log('按日期过滤后，数据条数:', filteredData.length);
    }
    
    // 返回过滤后的数据
    const response = {
      success: true,
      query: { channel, date },
      count: filteredData.length,
      data: filteredData
    };
    
    console.log('返回响应，数据条数:', filteredData.length);
    return new Response(JSON.stringify(response, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    });
    
  } catch (error) {
    console.error('EPG 查询错误:', error);
    return new Response(JSON.stringify({ 
      error: '查询失败', 
      message: error.message
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 