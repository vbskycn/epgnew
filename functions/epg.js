// EdgeOne Pages Function - EPG 数据查询
// 支持根路径查询参数：/?ch=CCTV1&date=2025-08-24

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // 获取查询参数
  const channel = url.searchParams.get('ch');
  const date = url.searchParams.get('date');
  
  try {
    // 如果没有查询参数，返回 XML 数据
    if (!channel && !date) {
      const xmlData = await env.ASSETS.get('index.xml');
      if (xmlData) {
        return new Response(xmlData, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }
      return new Response('<?xml version="1.0" encoding="UTF-8"?><error><message>XML 文件不存在</message></error>', { 
        status: 404,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 有查询参数时，返回过滤后的 JSON 数据
    const jsonData = await env.ASSETS.get('index.json');
    if (!jsonData) {
      return new Response(JSON.stringify({ error: 'JSON 数据文件不存在' }), { 
        status: 404,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    const epgData = JSON.parse(jsonData);
    
    // 过滤数据
    let filteredData = epgData;
    
    // 按频道过滤
    if (channel) {
      filteredData = filteredData.filter(programme => 
        programme['@channel'] === channel
      );
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
    }
    
    // 返回过滤后的数据
    const response = {
      success: true,
      query: { channel, date },
      count: filteredData.length,
      data: filteredData
    };
    
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