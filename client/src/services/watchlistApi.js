import apiClient from '../lib/apiClient.js';

export const watchlistApi = {
  getWatchlist: (params = {}) =>
    apiClient.get('/api/watchlist', { params }).then(r => r.data),

  addToWatchlist: (movieId) =>
    apiClient.post('/api/watchlist', { movieId }).then(r => r.data),

  removeFromWatchlist: (movieId) =>
    apiClient.delete(`/api/watchlist/${movieId}`).then(r => r.data),
};
