import apiClient from './src/lib/apiClient.js';
import { useAuthStore } from './src/store/authStore.js';
import axios from 'axios';

async function testQueue() {
  console.log("Starting 401 retry queue test...");

  // 1. Manually login to get a refresh cookie
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test_user_unique_1@example.com',
      password: 'password123'
    }, {
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });
    const cookie = loginRes.headers['set-cookie']?.join('; ');
    console.log("Logged in, got cookie:", cookie ? "YES" : "NO");
    
    // We don't use this valid token, we want to simulate 401
    useAuthStore.getState().setAuth('expired_token', { name: 'Test User' });

    // Patch the apiClient to send the cookie (since Node doesn't do it automatically like browsers)
    apiClient.defaults.headers.Cookie = cookie;
    
    // Also patch refreshClient (which is not exported, we need to export it or just trust it works).
    // Actually, we can just patch global axios defaults for this test.
    axios.defaults.headers.common['Cookie'] = cookie;
  } catch (err) {
    console.log("Login failed (probably didn't create account). Error:", err.response?.data || err.message);
  }
}

testQueue();
