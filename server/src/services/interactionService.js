import Interaction from '../models/Interaction.js';
import Movie from '../models/Movie.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const COMPLETION_THRESHOLD = 0.95; // >95% watched = complete
const MIN_PROGRESS_SECONDS = 5;    // ignore trivially small updates

export const interactionService = {
  /**
   * Upsert a 1–10 rating for a movie.
   * UI sends 1–5 stars, controller multiplies by 2 before calling this.
   * Atomically keeps Movie.ratingCount and Movie.ratingSum in sync.
   */
  rateMovie: async (userId, movieId, rating) => {
    const userObjId  = new mongoose.Types.ObjectId(userId);
    const movieObjId = new mongoose.Types.ObjectId(movieId);

    // Find existing rating to compute delta
    const existing = await Interaction.findOne({
      user: userObjId, movie: movieObjId, type: 'rating'
    }).lean();

    // Upsert the interaction (partial unique index prevents duplicates)
    await Interaction.findOneAndUpdate(
      { user: userObjId, movie: movieObjId, type: 'rating' },
      { $set: { rating } },
      { upsert: true }
    );

    // Atomically update movie aggregate stats
    let ratingCountDelta = existing ? 0 : 1;
    let ratingSumDelta   = existing ? (rating - existing.rating) : rating;

    await Movie.findByIdAndUpdate(movieObjId, {
      $inc: { ratingCount: ratingCountDelta, ratingSum: ratingSumDelta }
    });

    // Return fresh average
    const movie = await Movie.findById(movieObjId).select('ratingCount ratingSum').lean();
    const ratingAverage = movie.ratingCount > 0
      ? movie.ratingSum / movie.ratingCount
      : 0;

    return { ratingAverage: parseFloat(ratingAverage.toFixed(1)), userRating: rating };
  },

  /**
   * Toggle a movie in/out of the user's watchlist.
   * Logs a watchlist_add Interaction when adding.
   */
  toggleWatchlist: async (userId, movieId) => {
    const userObjId  = new mongoose.Types.ObjectId(userId);
    const movieObjId = new mongoose.Types.ObjectId(movieId);

    const user = await User.findById(userObjId).select('watchlist').lean();
    const alreadyIn = user.watchlist.some(id => id.equals(movieObjId));

    if (alreadyIn) {
      await User.findByIdAndUpdate(userObjId, { $pull: { watchlist: movieObjId } });
      return { inWatchlist: false };
    } else {
      await User.findByIdAndUpdate(userObjId, { $addToSet: { watchlist: movieObjId } });
      // Log the add interaction as a recommendation signal
      await Interaction.create({
        user: userObjId,
        movie: movieObjId,
        type: 'watchlist_add',
      });
      return { inWatchlist: true };
    }
  },

  /**
   * Return the user's watchlist with full movie details.
   */
  getWatchlist: async (userId) => {
    const user = await User.findById(userId)
      .select('watchlist')
      .populate({
        path: 'watchlist',
        select: '-embedding -__v',
        options: { lean: true }
      })
      .lean();

    return { items: user?.watchlist ?? [] };
  },

  /**
   * Upsert watch progress. Ignores tiny updates.
   * Deletes the record if ≥ 95% complete.
   * contentType: 'movie' | 'original'
   */
  updateWatchProgress: async (userId, contentId, contentType = 'movie', progressSeconds, durationSeconds) => {
    if (!progressSeconds || progressSeconds < MIN_PROGRESS_SECONDS) return { saved: false };

    const userObjId    = new mongoose.Types.ObjectId(userId);
    const contentObjId = new mongoose.Types.ObjectId(contentId);

    // Check for completion
    if (durationSeconds > 0 && progressSeconds / durationSeconds >= COMPLETION_THRESHOLD) {
      await Interaction.deleteOne({ user: userObjId, movie: contentObjId, type: 'watch_progress' });
      return { saved: false, completed: true };
    }

    await Interaction.findOneAndUpdate(
      { user: userObjId, movie: contentObjId, type: 'watch_progress' },
      {
        $set: {
          progressSeconds,
          // Store contentType as a tag so getContinueWatching can distinguish
          searchQuery: contentType, // reusing the only spare string field
        }
      },
      { upsert: true }
    );

    return { saved: true };
  },

  /**
   * Return unfinished titles for the Continue Watching row.
   * Most recent first. Excludes entries without progress.
   */
  getContinueWatching: async (userId, limit = 10) => {
    const userObjId = new mongoose.Types.ObjectId(userId);

    const interactions = await Interaction.find({
      user: userObjId,
      type: 'watch_progress',
      progressSeconds: { $gt: MIN_PROGRESS_SECONDS },
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate({ path: 'movie', select: '-embedding -__v' })
      .lean();

    const items = interactions
      .filter(i => i.movie) // guard against deleted movies
      .map(i => ({
        ...i.movie,
        _progressSeconds: i.progressSeconds,
      }));

    return { items };
  },

  /**
   * Remove a single watch-progress record (e.g. after completion).
   */
  removeWatchProgress: async (userId, contentId) => {
    const userObjId    = new mongoose.Types.ObjectId(userId);
    const contentObjId = new mongoose.Types.ObjectId(contentId);

    await Interaction.deleteOne({
      user: userObjId, movie: contentObjId, type: 'watch_progress'
    });

    return { removed: true };
  },
};
