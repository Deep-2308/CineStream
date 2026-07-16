import express from 'express';
import { query } from 'express-validator';
import { getPopular, getTrending, getByGenre, getById } from '../controllers/catalogueController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be an integer >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be an integer between 1 and 100')
];

// CRITICAL ROUTE ORDER: Specific routes before dynamic params (/:id)
router.get('/trending', validatePagination, asyncHandler(getTrending));
router.get('/genre/:genre', validatePagination, asyncHandler(getByGenre));

router.get('/', validatePagination, asyncHandler(getPopular));
router.get('/:id', asyncHandler(getById));

export default router;
