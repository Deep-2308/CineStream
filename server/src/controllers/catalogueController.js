import { catalogueService } from '../services/catalogueService.js';
import { withCache } from '../config/redis.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

export const getPopular = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { page = 1, limit = 20 } = req.query;
  const key = `catalogue:popular:page=${page}:limit=${limit}`;
  const ttl = 6 * 60 * 60; // 6 hours

  const data = await withCache(key, ttl, () => catalogueService.getPopular({ page, limit }));
  res.json(data);
};

export const getTrending = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { limit = 20 } = req.query;
  const key = `catalogue:trending:limit=${limit}`;
  const ttl = 6 * 60 * 60; // 6 hours

  const data = await withCache(key, ttl, () => catalogueService.getTrending({ limit }));
  res.json(data);
};

export const getByGenre = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { genre } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const key = `catalogue:genre=${genre}:page=${page}:limit=${limit}`;
  const ttl = 24 * 60 * 60; // 24 hours

  const data = await withCache(key, ttl, () => catalogueService.getByGenre({ genre, page, limit }));
  res.json(data);
};

export const getById = async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid movie ID format' });
  }

  const movie = await catalogueService.getById(id);
  if (!movie) {
    return res.status(404).json({ message: 'Movie not found' });
  }
  
  res.json({ movie });
};
