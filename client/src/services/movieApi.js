import apiClient from '../lib/apiClient.js';

export const movieApi = {
  getPopular: (params = {}) =>
    apiClient.get('/api/movies', { params }).then(r => r.data),

  getTrending: (params = {}) =>
    apiClient.get('/api/movies/trending', { params }).then(r => r.data),

  getByGenre: (genre, params = {}) =>
    apiClient.get(`/api/movies/genre/${encodeURIComponent(genre)}`, { params }).then(r => r.data),

  getById: (id) =>
    apiClient.get(`/api/movies/${id}`).then(r => r.data),
};
