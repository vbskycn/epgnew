// 最简单的测试函数
export async function onRequest() {
  return new Response('Pages Function is working!', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
} 