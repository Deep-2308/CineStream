import { validationResult } from 'express-validator';
import { OAuth2Client } from 'google-auth-library';
import { authService } from '../services/authService.js';
import User from '../models/User.js';

const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  path: '/api/auth/refresh'
});

export const authController = {
  signup: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Validation failed');
      err.name = 'ValidationError';
      err.message = errors.array().map(e => e.msg).join(', ');
      throw err;
    }

    const { name, email, password } = req.body;
    const user = await authService.signup(name, email, password);
    
    res.status(201).json({ user });
  },

  login: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Validation failed');
      err.name = 'ValidationError';
      err.message = errors.array().map(e => e.msg).join(', ');
      throw err;
    }

    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.login(email, password);

    res.cookie('refreshToken', refreshToken, getCookieOptions());
    res.json({ accessToken, user });
  },

  google: async (req, res) => {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: { message: 'Missing Google credential' } });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    let payload;
    
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      return res.status(401).json({ error: { message: 'Invalid Google credential', details: error.message } });
    }

    if (payload.email_verified !== true) {
      return res.status(403).json({ error: { message: 'Google email is not verified. Cannot securely link account.' } });
    }

    const { accessToken, refreshToken, user, isNewUser } = await authService.googleSignOn(payload);

    res.cookie('refreshToken', refreshToken, getCookieOptions());
    res.json({ accessToken, user, isNewUser });
  },

  refresh: async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        error: { message: 'No refresh token provided', code: 'TOKEN_MISSING' }
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(refreshToken);

    res.cookie('refreshToken', newRefreshToken, getCookieOptions());
    res.json({ accessToken });
  },

  logout: async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      // Decode user from req.user (if called with auth middleware) or fallback
      // Since logout might be called with just the cookie, we should rely on req.user
      // which is set by the authenticate middleware
      if (req.user && req.user.id) {
        await authService.logout(req.user.id);
      }
    }
    
    res.clearCookie('refreshToken', getCookieOptions());
    res.json({ message: 'Logged out successfully' });
  },

  me: async (req, res) => {
    // req.user is set by authenticate middleware
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found', code: 'USER_NOT_FOUND' } });
    }
    res.json({ user });
  }
};
