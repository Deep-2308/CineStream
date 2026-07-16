import express from 'express';
import { resyncNowPlaying } from '../controllers/adminController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.post('/resync', asyncHandler(resyncNowPlaying));

export default router;
