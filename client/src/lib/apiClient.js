import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

const API_URL = import.meta.env.VITE_API_URL;

// Main intercepted client — all app requests go through here
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Bare client for auth refresh — NOT intercepted, prevents infinite loops
const refreshClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- 401 Refresh Queue ---
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401s, and never retry a request twice
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If a refresh is already in-flight, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest._retry = true;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await refreshClient.post('/api/auth/refresh');
      const newToken = data.accessToken;

      // Fetch user profile with the new token
      const { data: meData } = await refreshClient.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${newToken}` }
      });

      useAuthStore.getState().setAuth(newToken, meData.user);
      processQueue(null, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().clearAuth();

      // Only hard-redirect to /login if we're not already there
      // and the page seems like it needs auth
      // (don't bounce anonymous visitors on public pages)
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * Bootstrap: called once on app startup.
 * Attempts a silent refresh using the httpOnly cookie.
 * If no cookie or expired → anonymous browsing, no redirect.
 */
export const bootstrapAuth = async () => {
  try {
    const { data } = await refreshClient.post('/api/auth/refresh');
    const newToken = data.accessToken;

    const { data: meData } = await refreshClient.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${newToken}` }
    });

    useAuthStore.getState().setAuth(newToken, meData.user);
  } catch {
    // No valid session — that's fine, browse anonymously
    useAuthStore.getState().clearAuth();
  }
};

export default apiClient;
