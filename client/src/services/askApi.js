import apiClient from '../lib/apiClient.js';

export const askApi = {
  /**
   * Ask the CineStream AI for recommendations.
   * @param {string} query The user's query
   * @param {Array<{role: string, content: string}>} history Conversation history
   * @param {AbortSignal} [signal] Optional abort signal
   */
  ask: async (query, history = [], signal) => {
    const response = await apiClient.post('/api/ask', { query, history }, { signal });
    return response.data;
  }
};
