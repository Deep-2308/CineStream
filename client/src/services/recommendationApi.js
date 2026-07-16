import apiClient from '../lib/apiClient.js';

export const recommendationApi = {
  getHome: (params = {}) =>
    apiClient.get('/api/recommendations/home', { params }).then(r => r.data),

  getSimilar: (movieId, params = {}) =>
    apiClient.get(`/api/recommendations/${movieId}/similar`, { params }).then(r => r.data),
};
