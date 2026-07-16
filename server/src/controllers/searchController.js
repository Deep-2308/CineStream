import { searchService } from '../services/searchService.js';
import { withCache } from '../config/redis.js';

export const search = async (req, res) => {
  const { q, limit = 20 } = req.query;
  
  if (!q) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const key = `search:q=${encodeURIComponent(q.trim().toLowerCase())}:limit=${parsedLimit}`;
  const ttl = 15 * 60; // 15 minutes

  const data = await withCache(key, ttl, () => searchService.hybridSearch(q, parsedLimit));
  res.json(data);
};
