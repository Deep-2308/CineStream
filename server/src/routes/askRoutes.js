import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { askController } from '../controllers/askController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Strict rate limiting: 10 requests per 10 minutes per IP
const askLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    error: {
      message: 'You have asked too many questions recently. Please wait a few minutes before asking again.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/',
  askLimiter,
  [
    body('query')
      .trim()
      .notEmpty().withMessage('Query is required')
      .isLength({ max: 500 }).withMessage('Query must not exceed 500 characters'),
    body('history')
      .optional()
      .isArray({ max: 10 }).withMessage('History must be an array of max 10 items'),
    body('history.*.role')
      .isIn(['user', 'assistant']).withMessage('Invalid role in history'),
    body('history.*.content')
      .isString().withMessage('History content must be string')
  ],
  asyncHandler(askController.answer)
);

export default router;
