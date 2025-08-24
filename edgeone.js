// EdgeOne Pages 部署配置
// 使用 Pages Functions 处理根路径请求

export default {
  // 路由配置 - 静态文件服务
  routes: [],

  // 全局配置
  global: {
    // 默认响应头
    defaultHeaders: {
      'Access-Control-Allow-Origin': '*',
      'X-Powered-By': 'EdgeOne Pages'
    }
  },

  // 缓存配置
  cache: {
    // 根路径缓存 1 小时
    '/': {
      maxAge: 3600,
      staleWhileRevalidate: 300
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