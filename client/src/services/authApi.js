import apiClient from '../lib/apiClient.js';

export const authApi = {
  signup: (name, email, password) =>
    apiClient.post('/api/auth/signup', { name, email, password }).then(r => r.data),

  login: (email, password) =>
    apiClient.post('/api/auth/login', { email, password }).then(r => r.data),

  googleAuth: (credential) =>
    apiClient.post('/api/auth/google', { credential }).then(r => r.data),

  logout: () =>
    apiClient.post('/api/auth/logout').then(r => r.data),

  me: () =>
    apiClient.get('/api/auth/me').then(r => r.data),
};
