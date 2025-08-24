// EdgeOne Pages 部署配置
// 主要配置在 edgeone.json 中

export default {
  // 全局配置
  global: {
    // 默认响应头
    defaultHeaders: {
      'Access-Control-Allow-Origin': '*',
      'X-Powered-By': 'EdgeOne Pages'
    }
  },

  // 安全配置
  security: {
    // 允许的请求方法
    allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
    
    // 请求频率限制
    rateLimit: {
      window: 60,
      max: 100
    },
    
    // 安全头
    securityHeaders: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    }
  }
}; 