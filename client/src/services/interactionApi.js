import apiClient from '../lib/apiClient.js';

export const interactionApi = {
  /**
   * Rate a movie (1–5 stars; backend converts to 1–10).
   */
  rateMovie: (movieId, rating) =>
    apiClient.post(`/api/movies/${movieId}/rating`, { rating }).then(r => r.data),

  /**
   * Toggle watchlist membership.
   * Returns { inWatchlist: boolean }.
   */
  toggleWatchlist: (movieId) =>
    apiClient.post('/api/watchlist', { movieId }).then(r => r.data),

  /**
   * Save watch progress to the backend.
   * Throttle calls at the call-site — backend ignores < 5s.
   */
  saveProgress: (contentId, contentType, progressSeconds, durationSeconds) =>
    apiClient
      .post('/api/watch-progress', { contentId, contentType, progressSeconds, durationSeconds })
      .then(r => r.data),

  /**
   * Fetch Continue Watching list (unfinished titles, newest first).
   */
  getContinueWatching: (limit = 10) =>
    apiClient.get('/api/continue-watching', { params: { limit } }).then(r => r.data),

  /**
   * Delete a watch-progress entry (called after >95% completion).
   */
  removeProgress: (contentId) =>
    apiClient.delete(`/api/watch-progress/${contentId}`).then(r => r.data),

  /**
   * Update user profile (name, preferences).
   */
  updateProfile: (data) =>
    apiClient.patch('/api/users/me', data).then(r => r.data),
};
