import express from 'express';
import rateLimit from 'express-rate-limit';
import { search } from '../controllers/searchController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per windowMs
  message: { message: 'Too many search requests, please try again later.' }
});

router.get('/', searchLimiter, asyncHandler(search));

export default router;
