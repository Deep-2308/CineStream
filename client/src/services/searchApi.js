import apiClient from '../lib/apiClient.js';

export const searchApi = {
  search: (q, params = {}) =>
    apiClient.get('/api/search', { params: { q, ...params } }).then(r => r.data),
};
