import mongoose from 'mongoose';
import { aiClient } from '../lib/ai/client.js';
import { embeddingService } from './embeddingService.js';
import Movie from '../models/Movie.js';

const SYSTEM_PROMPT = `You are CineStream AI, a movie recommendation assistant.
You must strictly follow these rules:
1. ONLY recommend movies provided in the user's <CONTEXT>.
2. NEVER invent, hallucinate, or mention any movies outside the <CONTEXT>.
3. If the user asks for something completely unrelated to movies, politely steer them back.
4. If no movies in the <CONTEXT> match, say you don't have any good matches right now.
5. Return your response in STRICT JSON format matching this schema:
{
  "message": "A short conversational response acknowledging the request.",
  "recommendations": [
    {
      "movieId": "string (the exact _id from context)",
      "reason": "One short sentence explaining why it fits."
    }
  ]
}`;

export const askService = {
  /**
   * Generates a conversational response and recommendations using a RAG pipeline.
   * @param {string} query The user's latest message
   * @param {Array<{role: string, content: string}>} history Previous conversation turns
   * @returns {Promise<{message: string, recommendations: Array<{movieId: string, reason: string}>}>}
   */
  answer: async (query, history = []) => {
    let topCandidates = [];
    
    // 1. Generate Embedding
    try {
      const queryEmbedding = await embeddingService.embedSingle(query);

      // 2. Vector Search (Top 15)
      topCandidates = await Movie.aggregate([
        {
          $vectorSearch: {
            index: 'movie_embedding_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 150,
            limit: 15
          }
        },
        {
          $project: {
            embedding: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            cast: 0,
            crew: 0
          }
        }
      ]);
    } catch (error) {
      console.warn('[AskService] Embedding/Vector Search failed:', error.message);
      // If embedding fails, we can't search. We must throw to let controller handle.
      throw new Error('Unable to process query at this time.');
    }

    if (!topCandidates || topCandidates.length === 0) {
      return {
        message: "I couldn't find any movies matching that description in our catalogue.",
        recommendations: []
      };
    }

    // 3. Build Context String
    const contextString = topCandidates.map(m => `
ID: ${m._id}
Title: ${m.title}
Year: ${m.releaseDate ? new Date(m.releaseDate).getFullYear() : 'Unknown'}
Genres: ${m.genres?.join(', ')}
Runtime: ${m.runtime} min
Rating: ${m.voteAverage ? m.voteAverage.toFixed(1) : 'N/A'}/10
Overview: ${m.overview}
`).join('\n---\n');

    const contents = [
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      { 
        role: 'user', 
        parts: [{ text: `<CONTEXT>\n${contextString}\n</CONTEXT>\n\nUser Query: ${query}` }]
      }
    ];

    // 4. Call Gemini
    let parsedResponse = null;
    let retries = 1;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        let content = await aiClient.generateChat({
          systemInstruction: SYSTEM_PROMPT,
          contents,
          jsonMode: true
        });

        // Strip markdown code fences if Gemini returned them
        if (content.startsWith('```')) {
          content = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        }

        parsedResponse = JSON.parse(content);

        // Basic schema validation
        if (parsedResponse.recommendations && Array.isArray(parsedResponse.recommendations)) {
          break; // Success
        } else {
          throw new Error("Invalid JSON schema returned");
        }
      } catch (err) {
        console.warn(`[AskService] Gemini Chat attempt ${attempt + 1} failed:`, err.message);
        if (attempt === retries) {
          parsedResponse = null;
        }
      }
    }

    // 5. Fallback if Gemini failed entirely or parsing failed twice
    if (!parsedResponse) {
      console.log('[AskService] Falling back to raw vector results');
      return {
        message: "Here are some movies that match what you're looking for:",
        recommendations: topCandidates.slice(0, 4).map(m => ({
          movieId: m._id.toString(),
          reason: "This movie strongly matches your description based on our semantic search."
        }))
      };
    }

    // 6. Validate IDs (Anti-hallucination guard)
    const validCandidateIds = new Set(topCandidates.map(m => m._id.toString()));
    const safeRecommendations = [];

    for (const rec of (parsedResponse.recommendations || [])) {
      if (rec.movieId && validCandidateIds.has(rec.movieId.toString())) {
        safeRecommendations.push({
          movieId: rec.movieId.toString(),
          reason: rec.reason || "I think you'll enjoy this one."
        });
      } else {
        console.warn(`[AskService] Stripped hallucinated ID: ${rec.movieId}`);
      }
    }

    return {
      message: parsedResponse.message || "Here is what I found.",
      recommendations: safeRecommendations
    };
  }
};
