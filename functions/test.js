// 最简单的测试函数
export async function onRequest(context) {
  return new Response('Hello from Pages Function!', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
} 