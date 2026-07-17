import { aiClient } from '../lib/ai/client.js';

export const embeddingService = {
  /**
   * Embeds a batch of texts using text-embedding-3-small.
   * @param {string[]} texts 
   * @returns {Promise<number[][]>}
   */
  embedBatch: async (texts) => {
    if (!texts || texts.length === 0) return [];

    try {
      return await aiClient.generateEmbeddings(texts);
    } catch (error) {
      console.error('[Gemini] Failed to generate embeddings:', error.message);
      throw error;
    }
  },

  /**
   * Convenience wrapper for a single text.
   * @param {string} text 
   * @returns {Promise<number[]>}
   */
  embedSingle: async (text) => {
    const embeddings = await embeddingService.embedBatch([text]);
    return embeddings[0];
  }
};
