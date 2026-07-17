import Movie from '../models/Movie.js';
import Interaction from '../models/Interaction.js';
import { catalogueService } from './catalogueService.js';
import mongoose from 'mongoose';

const enforceDiversity = (movies, targetLimit) => {
  const finalRow = [];
  const prefixCounts = new Map();
  
  for (const movie of movies) {
    if (finalRow.length >= targetLimit) break;
    
    // Heuristic: Prefix is either text before a colon, or the first two words
    let prefix = movie.title.split(':')[0].trim().toLowerCase();
    if (prefix === movie.title.toLowerCase()) {
       prefix = movie.title.split(' ').slice(0, 2).join(' ').toLowerCase();
    }

    const count = prefixCounts.get(prefix) || 0;
    
    // Avoid recommending more than two movies from the same franchise/prefix
    if (count < 2) {
      finalRow.push(movie);
      prefixCounts.set(prefix, count + 1);
    }
  }
  return finalRow;
};

export const recommendationService = {
  getContentBasedSimilar: async (movieId, limit) => {
    try {
      const movie = await Movie.findById(movieId).select('+embedding').lean();
      if (!movie || !movie.embedding || movie.embedding.length === 0) return [];

      const numCandidates = limit * 10;
      const pipeline = [
        {
          $vectorSearch: {
            index: 'movie_embedding_index',
            path: 'embedding',
            queryVector: movie.embedding,
            numCandidates,
            limit: limit + 1 // Add 1 because we will exclude the source movie
          }
        },
        {
          $match: {
            _id: { $ne: new mongoose.Types.ObjectId(movieId) }
          }
        },
        {
          $project: {
            embedding: 0,
            __v: 0
          }
        },
        { $limit: limit }
      ];

      return await Movie.aggregate(pipeline);
    } catch (err) {
      console.warn('[Content-Based Error] Gracefully handling vector failure:', err.message);
      return [];
    }
  },

  getCollaborative: async (userId, limit) => {
    try {
      const userLikedInteractions = await Interaction.find({ 
        user: userId, 
        type: 'rating', 
        rating: { $gte: 4 } 
      }).lean();
      const userLikedMovieIds = userLikedInteractions.map(i => i.movie);
      
      if (userLikedMovieIds.length === 0) return [];

      // Find other users who highly rated at least 2 of these same movies
      const collaborativeUsers = await Interaction.aggregate([
        { $match: { movie: { $in: userLikedMovieIds }, type: 'rating', rating: { $gte: 4 }, user: { $ne: new mongoose.Types.ObjectId(userId) } } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
        { $match: { count: { $gte: 2 } } }
      ]);
      const similarUserIds = collaborativeUsers.map(u => u._id);

      if (similarUserIds.length === 0) return [];

      // Find movies these similar users liked, that our current user HAS NOT interacted with
      const userAllInteractions = await Interaction.find({ user: userId, movie: { $exists: true } }).lean();
      const userAllMovieIds = userAllInteractions.map(i => i.movie);

      const recommendedMovies = await Interaction.aggregate([
        { $match: { user: { $in: similarUserIds }, type: 'rating', rating: { $gte: 4 }, movie: { $nin: userAllMovieIds } } },
        { $group: { _id: "$movie", count: { $sum: 1 }, avgRating: { $avg: "$rating" } } },
        { $sort: { count: -1, avgRating: -1 } },
        { $limit: limit * 2 }, // Fetch extra for diversity pruning
        {
          $lookup: {
            from: "movies",
            localField: "_id",
            foreignField: "_id",
            as: "movieData"
          }
        },
        { $unwind: "$movieData" },
        { $replaceRoot: { newRoot: "$movieData" } },
        { $project: { embedding: 0, __v: 0 } }
      ]);

      return recommendedMovies;
    } catch (err) {
      console.warn('[Collaborative Error] Handling failure:', err.message);
      return [];
    }
  },

  getTrendingFallback: async (limit, languages = null) => {
    let matchStage = null;
    if (languages && languages.length > 0) {
      matchStage = { originalLanguage: { $in: languages } };
    }
    
    if (matchStage) {
      // If we need a custom match, we have to bypass catalogueService's simple trending 
      // and do a direct query so we can filter by language.
      const items = await Movie.find(matchStage)
        .sort({ popularity: -1 })
        .limit(limit)
        .select('-embedding -__v')
        .lean();
      return items;
    } else {
      const res = await catalogueService.getTrending({ limit });
      return res.items;
    }
  },

  /**
   * Home Recommendations Logic:
   * 
   * - Anonymous User (No token): Returns Trending
   * - New User (Interactions < 3): Returns Trending
   * - Active User: 
   *    - 60% Collaborative
   *    - 30% Content-Based (using their latest highly rated movie)
   *    - 10% Trending
   * 
   * If Collaborative isn't enough to fill its 60%, the gap is filled 
   * sequentially by Content-Based and then Trending. Duplicates are removed 
   * and a diversity heuristic prevents too many sequels.
   */
  getHomeRecommendations: async (userId, limit = 20) => {
    if (!userId) {
      return recommendationService.getTrendingFallback(limit);
    }

    const userObj = await mongoose.model('User').findById(userId).lean();
    const userLanguages = userObj?.preferences?.languages || null;
    const favoriteGenres = userObj?.preferences?.favoriteGenres || [];

    const interactionCount = await Interaction.countDocuments({ user: userId });
    if (interactionCount < 3) {
      if (favoriteGenres.length > 0) {
        // Use catalogueService genre fetch logic for the first favorite genre
        // OR we can do an aggregation to blend favorite genres, but simplest is a query:
        const items = await Movie.find({ genres: { $in: favoriteGenres } })
          .sort({ popularity: -1 })
          .limit(limit)
          .select('-embedding -__v')
          .lean();
        
        // If not enough items, pad with trending
        if (items.length < limit) {
          const trendingPadding = await recommendationService.getTrendingFallback(limit - items.length, userLanguages);
          return enforceDiversity([...items, ...trendingPadding], limit);
        }
        return enforceDiversity(items, limit);
      }
      return recommendationService.getTrendingFallback(limit, userLanguages);
    }

    // Determine target allocations
    const collabTarget = Math.floor(limit * 0.6);
    let contentTarget = Math.floor(limit * 0.3);
    
    const [collabRaw, recentHighInteraction] = await Promise.all([
      recommendationService.getCollaborative(userId, limit * 2), // Fetch extra
      Interaction.findOne({ user: userId, type: 'rating', rating: { $gte: 4 } }).sort({ createdAt: -1 }).lean()
    ]);

    const blended = [];
    const seenIds = new Set();

    const addMovies = (movies, maxAdd) => {
      let added = 0;
      for (const m of movies) {
        if (added >= maxAdd) break;
        if (!seenIds.has(m._id.toString())) {
          blended.push(m);
          seenIds.add(m._id.toString());
          added++;
        }
      }
      return added;
    };

    // 1. Collaborative
    const collabAdded = addMovies(collabRaw, collabTarget);
    
    // Carry over unused allocations
    contentTarget += (collabTarget - collabAdded);
    
    // 2. Content-Based
    if (recentHighInteraction) {
      const contentRaw = await recommendationService.getContentBasedSimilar(recentHighInteraction.movie, limit * 2);
      const contentAdded = addMovies(contentRaw, contentTarget);
      // Remaining unfilled slots go to Trending
    }
    
    // 3. Trending Fill
    if (blended.length < limit) {
      const remainingSlots = limit - blended.length;
      const trendingRaw = await recommendationService.getTrendingFallback(limit * 2, userLanguages);
      addMovies(trendingRaw, limit * 2); // Dump as much as needed to reach the final cap
    }

    return enforceDiversity(blended, limit);
  }
};
