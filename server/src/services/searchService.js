import Movie from '../models/Movie.js';
import { embeddingService } from './embeddingService.js';

const normalizeQuery = (query) => {
  if (!query) return '';
  return query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' '); // collapse spaces
};

export const searchService = {
  lexicalSearch: async (query, limit) => {
    const normalized = normalizeQuery(query);
    if (!normalized) return [];

    return Movie.find(
      { $text: { $search: normalized } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .select('-embedding -__v')
      .lean();
  },

  semanticSearch: async (query, limit) => {
    const normalized = normalizeQuery(query);
    if (!normalized) return [];

    try {
      const [embedding] = await embeddingService.embedBatch([normalized]);
      if (!embedding) return [];

      const numCandidates = limit * 20;

      const pipeline = [
        {
          $vectorSearch: {
            index: 'movie_embedding_index',
            path: 'embedding',
            queryVector: embedding,
            numCandidates,
            limit
          }
        },
        {
          $project: {
            embedding: 0,
            __v: 0,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ];

      const results = await Movie.aggregate(pipeline);
      // Exclude results below ~0.70 threshold
      return results.filter(r => r.score >= 0.70);
    } catch (err) {
      console.error('[Semantic Search Error]', err.message);
      return []; // Graceful fallback
    }
  },

  hybridSearch: async (query, limit) => {
    const normalized = normalizeQuery(query);
    if (!normalized) return { items: [], total: 0 };

    const [lexicalResults, semanticResults] = await Promise.all([
      searchService.lexicalSearch(query, limit),
      searchService.semanticSearch(query, limit)
    ]);

    const movieMap = new Map();

    const addWithRank = (movie, defaultPriority, textScore = 0, semanticScore = 0) => {
      const id = movie._id.toString();
      const existing = movieMap.get(id);

      let priority = defaultPriority;
      const movieTitle = normalizeQuery(movie.title);

      if (movieTitle === normalized) priority = 1;
      else if (movieTitle.startsWith(normalized)) priority = 2;

      // Keep the one with better priority, or higher score
      if (
        !existing || 
        priority < existing.priority || 
        (priority === existing.priority && Math.max(textScore, semanticScore) > Math.max(existing.textScore, existing.semanticScore))
      ) {
        movieMap.set(id, {
          ...movie,
          priority,
          textScore: Math.max(textScore, existing ? existing.textScore : 0),
          semanticScore: Math.max(semanticScore, existing ? existing.semanticScore : 0)
        });
      }
    };

    // 3 for text priority, 4 for semantic priority
    lexicalResults.forEach(m => addWithRank(m, 3, m.score || 0, 0));
    semanticResults.forEach(m => addWithRank(m, 4, 0, m.score || 0));

    let items = Array.from(movieMap.values());
    
    // Sort by priority, then respective scores
    items.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.priority === 3) return b.textScore - a.textScore;
      return b.semanticScore - a.semanticScore;
    });

    items = items.slice(0, limit);

    // Strip internal properties
    items.forEach(item => {
      delete item.priority;
      delete item.textScore;
      delete item.semanticScore;
      delete item.score;
    });

    return { items, total: items.length };
  }
};
