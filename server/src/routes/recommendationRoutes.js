import express from 'express';
import { getSimilar, getHome } from '../controllers/recommendationController.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/home', optionalAuth, asyncHandler(getHome));
router.get('/:id/similar', asyncHandler(getSimilar));

export default router;
