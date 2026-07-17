import axios from 'axios';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const api = axios.create({ baseURL: 'http://localhost:5000/api' });
let refreshCallCount = 0;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log(`[Interceptor] 401 received for req. _retry=${originalRequest._retry}, isRefreshing=${isRefreshing}`);

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        console.log(`[Interceptor] isRefreshing is true, queuing request.`);
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      console.log(`[Interceptor] Triggering refresh...`);

      try {
        refreshCallCount++;
        await new Promise(r => setTimeout(r, 500));
        const token = 'new_token_123';
        processQueue(null, token);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

async function testSimultaneous401() {
  const req1 = api.get('/auth/me').catch(e => console.log('req1 catch'));
  const req2 = api.get('/auth/me').catch(e => console.log('req2 catch'));
  await Promise.all([req1, req2]);
  console.log(`Total /refresh calls made: ${refreshCallCount}`);
}

testSimultaneous401();
