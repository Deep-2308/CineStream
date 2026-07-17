import Original from '../models/Original.js';
import { withCache } from '../config/redis.js';
import mongoose from 'mongoose';

/**
 * GET /api/originals
 * Query params: page, limit, sort, featured
 */
export const getOriginals = async (req, res) => {
  const {
    page    = 1,
    limit   = 20,
    sort    = 'featured',  // 'featured' | 'newest' | 'oldest'
    featured,              // '1' | 'true' to filter featured only
  } = req.query;

  const pageNum  = Math.max(1, parseInt(page,  10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip     = (pageNum - 1) * limitNum;

  const filter = {};
  if (featured === '1' || featured === 'true') {
    filter.featured = true;
  }

  const sortMap = {
    featured: { featured: -1, createdAt: -1 },
    newest:   { releaseYear: -1 },
    oldest:   { releaseYear:  1 },
  };
  const sortObj = sortMap[sort] ?? sortMap.featured;

  const cacheKey = `originals:page=${pageNum}:limit=${limitNum}:sort=${sort}:featured=${featured ?? 'all'}`;
  const ttl      = 24 * 60 * 60; // 24 h — originals shelf changes ~never

  const data = await withCache(cacheKey, ttl, async () => {
    const [items, totalItems] = await Promise.all([
      Original.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Original.countDocuments(filter),
    ]);

    return {
      items,
      page:       pageNum,
      totalPages: Math.ceil(totalItems / limitNum),
      totalItems,
    };
  });

  res.json(data);
};

/**
 * GET /api/originals/:id
 */
export const getOriginalById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid original ID format' });
  }

  const original = await Original.findById(id).lean();
  if (!original) {
    return res.status(404).json({ message: 'Original not found' });
  }

  res.json({ original });
};
