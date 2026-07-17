import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  rateMovie,
  toggleWatchlist,
  getWatchlist,
  removeFromWatchlist,
  updateWatchProgress,
  getContinueWatching,
  removeWatchProgress,
} from '../controllers/interactionController.js';
import { updateProfile } from '../controllers/userController.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ── Ratings ────────────────────────────────────────────────────
router.post(
  '/movies/:id/rating',
  [
    param('id').isMongoId().withMessage('Invalid movie ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  ],
  asyncHandler(rateMovie)
);

// ── Watchlist ──────────────────────────────────────────────────
router.get('/watchlist', asyncHandler(getWatchlist));
router.post('/watchlist', asyncHandler(toggleWatchlist));
router.delete('/watchlist/:id', asyncHandler(removeFromWatchlist));

// ── Watch Progress ─────────────────────────────────────────────
router.post(
  '/watch-progress',
  [
    body('contentId').isMongoId().withMessage('Valid contentId required'),
    body('progressSeconds').isFloat({ min: 0 }).withMessage('progressSeconds must be a non-negative number'),
  ],
  asyncHandler(updateWatchProgress)
);

router.get(
  '/continue-watching',
  [query('limit').optional().isInt({ min: 1, max: 20 })],
  asyncHandler(getContinueWatching)
);

router.delete('/watch-progress/:contentId', asyncHandler(removeWatchProgress));

// ── Profile ────────────────────────────────────────────────────
router.patch(
  '/users/me',
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
  ],
  asyncHandler(updateProfile)
);

export default router;
