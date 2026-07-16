import { recommendationService } from '../services/recommendationService.js';
import { withCache } from '../config/redis.js';
import mongoose from 'mongoose';

export const getSimilar = async (req, res) => {
  const { id } = req.params;
  const { limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid movie ID format' });
  }

  const parsedLimit = Math.min(30, Math.max(1, parseInt(limit, 10)));
  const items = await recommendationService.getContentBasedSimilar(id, parsedLimit);
  
  res.json({ items });
};

export const getHome = async (req, res) => {
  const { limit = 20 } = req.query;
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));
  
  if (req.user && req.user.id) {
    // Authenticated user - do NOT cache personalized recommendations
    const items = await recommendationService.getHomeRecommendations(req.user.id, parsedLimit);
    return res.json({ items });
  }

  // Anonymous user - Cache for 30 mins
  const key = `recommendations:home:anonymous:limit=${parsedLimit}`;
  const ttl = 30 * 60;

  const items = await withCache(key, ttl, async () => {
    return recommendationService.getHomeRecommendations(null, parsedLimit);
  });

  res.json({ items });
};
