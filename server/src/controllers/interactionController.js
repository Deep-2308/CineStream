import { validationResult } from 'express-validator';
import { interactionService } from '../services/interactionService.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const STARS_TO_RATING = (stars) => Math.round(stars * 2); // 1–5 → 2–10

/**
 * POST /api/movies/:id/rating
 * Body: { rating: 1–5 }
 */
export const rateMovie = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id: movieId } = req.params;
  const { rating: stars } = req.body;

  if (!mongoose.Types.ObjectId.isValid(movieId)) {
    return res.status(400).json({ message: 'Invalid movie ID' });
  }

  const rating = STARS_TO_RATING(stars);
  const result = await interactionService.rateMovie(req.user.id, movieId, rating);
  res.json(result);
};

/**
 * POST /api/watchlist       → toggle add/remove
 * GET  /api/watchlist       → get all
 * DELETE /api/watchlist/:id → direct remove (used by WatchlistPage)
 */
export const toggleWatchlist = async (req, res) => {
  const { movieId } = req.body;

  if (!movieId || !mongoose.Types.ObjectId.isValid(movieId)) {
    return res.status(400).json({ message: 'Valid movieId required' });
  }

  const result = await interactionService.toggleWatchlist(req.user.id, movieId);
  res.json(result);
};

export const getWatchlist = async (req, res) => {
  const result = await interactionService.getWatchlist(req.user.id);
  res.json(result);
};

export const removeFromWatchlist = async (req, res) => {
  const { id: movieId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(movieId)) {
    return res.status(400).json({ message: 'Invalid movie ID' });
  }

  await User.findByIdAndUpdate(
    new mongoose.Types.ObjectId(req.user.id),
    { $pull: { watchlist: new mongoose.Types.ObjectId(movieId) } }
  );

  res.json({ inWatchlist: false });
};

/**
 * POST /api/watch-progress
 * Body: { contentId, contentType, progressSeconds, durationSeconds }
 */
export const updateWatchProgress = async (req, res) => {
  const { contentId, contentType = 'movie', progressSeconds, durationSeconds } = req.body;

  if (!contentId || !mongoose.Types.ObjectId.isValid(contentId)) {
    return res.status(400).json({ message: 'Valid contentId required' });
  }

  const result = await interactionService.updateWatchProgress(
    req.user.id, contentId, contentType,
    Number(progressSeconds), Number(durationSeconds)
  );
  res.json(result);
};

/**
 * GET /api/continue-watching
 */
export const getContinueWatching = async (req, res) => {
  const { limit = 10 } = req.query;
  const result = await interactionService.getContinueWatching(
    req.user.id,
    Math.min(20, Math.max(1, parseInt(limit, 10)))
  );
  res.json(result);
};

/**
 * DELETE /api/watch-progress/:contentId
 */
export const removeWatchProgress = async (req, res) => {
  const { contentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(contentId)) {
    return res.status(400).json({ message: 'Invalid content ID' });
  }

  const result = await interactionService.removeWatchProgress(req.user.id, contentId);
  res.json(result);
};
