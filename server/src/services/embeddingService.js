import OpenAI from 'openai';
import { env } from '../config/env.js';

const openai = new OpenAI({
  apiKey: env.openaiApiKey,
});

export const embeddingService = {
  /**
   * Embeds a batch of texts using text-embedding-3-small.
   * @param {string[]} texts 
   * @returns {Promise<number[][]>}
   */
  embedBatch: async (texts) => {
    if (!texts || texts.length === 0) return [];

    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
        dimensions: 1536,
      });

      // The response.data array is in the same order as the input
      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('[OpenAI] Failed to generate embeddings:', error.message);
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
