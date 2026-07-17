import geminiClient from './gemini.js';
import { env } from '../../config/env.js';

export const aiClient = {
  /**
   * Generates chat responses
   * @param {Object} options
   * @param {string} options.systemInstruction 
   * @param {Array<{role: string, parts: Array<{text: string}>}>} options.contents 
   * @param {boolean} [options.jsonMode=false]
   */
  generateChat: async ({ systemInstruction, contents, jsonMode = false }) => {
    const config = {
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstruction }]
      }
    };

    if (jsonMode) {
      config.responseMimeType = "application/json";
    }

    const response = await geminiClient.models.generateContent({
      model: env.geminiChatModel,
      contents,
      config
    });

    return response.text;
  },

  /**
   * Generates embeddings for an array of texts
   * @param {string[]} texts
   * @returns {Promise<number[][]>}
   */
  generateEmbeddings: async (texts) => {
    if (!texts || texts.length === 0) return [];

    const results = [];

    for (const text of texts) {
      const response = await geminiClient.models.embedContent({
        model: env.geminiEmbeddingModel,
        contents: text,
        config: {
          outputDimensionality: env.embeddingDimensions
        }
      });

      if (
        !response.embeddings ||
        !Array.isArray(response.embeddings) ||
        response.embeddings.length === 0
      ) {
        throw new Error("No embedding returned from Gemini.");
      }

      results.push(response.embeddings[0].values);
    }

    return results;
  }
};
