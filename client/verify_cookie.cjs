const http = require('http');

const req = http.request({
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/auth/signup',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:5173' }
}, (res) => {
  console.log('Status:', res.statusCode);
  const cookies = res.headers['set-cookie'];
  let isHttpOnly = false;
  let pathIsCorrect = false;

  if (cookies) {
    cookies.forEach(c => {
      console.log('Cookie:', c);
      if (c.includes('HttpOnly')) isHttpOnly = true;
      if (c.includes('Path=/api/auth/refresh')) pathIsCorrect = true;
    });
    
    if (isHttpOnly && pathIsCorrect) {
      console.log('✅ Cookie verification passed: HttpOnly + Path=/api/auth/refresh');
    } else {
      console.log('❌ Cookie verification failed');
    }
  } else {
    console.log('No set-cookie header');
  }
});
req.on('error', (e) => console.error(e));
req.write(JSON.stringify({ name: 'Verify User', email: `verify_${Date.now()}@example.com`, password: 'password123' }));
req.end();
