import axios from 'axios';

async function verify() {
  try {
    const signupRes = await axios.post('http://localhost:5000/api/auth/signup', {
      name: 'Verify User',
      email: `verify_${Date.now()}@example.com`,
      password: 'password123'
    }, {
      headers: { 'Origin': 'http://localhost:5173' }
    });
    
    // Check if cookie is set properly in login response
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: signupRes.data.user.email,
      password: 'password123'
    }, {
      headers: { 'Origin': 'http://localhost:5173' }
    });
    
    const cookies = loginRes.headers['set-cookie'];
    if (!cookies) {
      console.log('❌ Cookie verification failed: No set-cookie header');
      return;
    }
    
    let isHttpOnly = false;
    let pathIsCorrect = false;
    
    cookies.forEach(c => {
      console.log('Cookie received:', c);
      if (c.includes('HttpOnly')) isHttpOnly = true;
      if (c.includes('Path=/api/auth/refresh')) pathIsCorrect = true;
    });
    
    if (isHttpOnly && pathIsCorrect) {
      console.log('✅ Cookie verification passed: HttpOnly + Path=/api/auth/refresh');
    } else {
      console.log('❌ Cookie verification failed');
    }
  } catch (err) {
    console.error('Error during verification:', err.response?.data || err.message);
  }
}

verify();
