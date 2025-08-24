// EdgeOne Pages 部署配置
// 用于腾讯 Pages 服务，自动设置 XML 标头并加载 index.xml

export default {
  // 路由配置
  routes: [
    {
      // 根路径自动重定向到 index.xml
      path: '/',
      redirect: '/index.xml'
    },
    {
      // XML 文件路由 - 读取实际文件内容
      path: '/index.xml',
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      },
      response: {
        status: 200,
        body: await fetch('/index.xml').then(res => res.text())
      }
    },
    {
      // JSON 文件路由 - 读取实际文件内容
      path: '/index.json',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      },
      response: {
        status: 200,
        body: await fetch('/index.json').then(res => res.text())
      }
    },
    {
      // GZ 文件路由 - 读取实际文件内容
      path: '/index.xml.gz',
      headers: {
        'Content-Type': 'application/gzip',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
        'Content-Encoding': 'gzip'
      },
      response: {
        status: 200,
        body: await fetch('/index.xml.gz').then(res => res.arrayBuffer())
      }
    },
    {
      // MD5 文件路由 - 读取实际文件内容
      path: '/md5.txt',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      },
      response: {
        status: 200,
        body: await fetch('/md5.txt').then(res => res.text())
      }
    }
  ],

  // 全局配置
  global: {
    // 默认响应头
    defaultHeaders: {
      'Access-Control-Allow-Origin': '*',
      'X-Powered-By': 'EdgeOne Pages'
    },
    
    // 错误处理
    errorPages: {
      404: {
        status: 404,
        body: '<?xml version="1.0" encoding="UTF-8"?><error><message>File not found</message></error>',
        headers: {
          'Content-Type': 'application/xml; charset=utf-8'
        }
      },
      500: {
        status: 500,
        body: '<?xml version="1.0" encoding="UTF-8"?><error><message>Internal server error</message></error>',
        headers: {
          'Content-Type': 'application/xml; charset=utf-8'
        }
      }
    }
  },

  // 缓存配置
  cache: {
    // XML 文件缓存 1 小时
    '/index.xml': {
      maxAge: 3600,
      staleWhileRevalidate: 300
    },
    // JSON 文件缓存 1 小时
    '/index.json': {
      maxAge: 3600,
      staleWhileRevalidate: 300
    },
    // GZ 文件缓存 1 小时
    '/index.xml.gz': {
      maxAge: 3600,
      staleWhileRevalidate: 300
    },
    // MD5 文件缓存 5 分钟
    '/md5.txt': {
      maxAge: 300,
      staleWhileRevalidate: 60
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