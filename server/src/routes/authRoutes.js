import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const signupValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').trim().toLowerCase().isEmail().withMessage('Must be a valid email'),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters')
];

const loginValidation = [
  body('email').trim().toLowerCase().isEmail().withMessage('Must be a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/signup', signupValidation, asyncHandler(authController.signup));
router.post('/login', loginValidation, asyncHandler(authController.login));
router.post('/google', asyncHandler(authController.google));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/logout', authenticate, asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.me));

export default router;
