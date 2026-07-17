import apiClient from '../lib/apiClient.js';

export const originalsApi = {
  getOriginals: (params = {}) =>
    apiClient.get('/api/originals', { params }).then(r => r.data),

  getById: (id) =>
    apiClient.get(`/api/originals/${id}`).then(r => r.data),
};
