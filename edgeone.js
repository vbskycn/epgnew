// EdgeOne Pages 部署配置
// 尝试实现动态功能

export default {
  // 路由配置
  routes: [
    {
      // 根路径处理
      path: '/',
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      },
      response: {
        status: 200,
        body: '<?xml version="1.0" encoding="UTF-8"?><tv><channel id="CCTV1"><display-name>CCTV1</display-name></channel><programme channel="CCTV1" start="20250824000000 +0800" stop="20250824003000 +0800"><title>测试节目</title></programme></tv>'
      }
    }
  ],

  // 全局配置
  global: {
    // 默认响应头
    defaultHeaders: {
      'Access-Control-Allow-Origin': '*',
      'X-Powered-By': 'EdgeOne Pages'
    }
  }
}; 