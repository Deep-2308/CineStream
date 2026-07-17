import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { env } from '../config/env.js';

const hashRefreshToken = async (token) => {
  const sha256 = crypto.createHash('sha256').update(token).digest('hex');
  return await bcrypt.hash(sha256, 12);
};

const compareRefreshToken = async (token, hashed) => {
  const sha256 = crypto.createHash('sha256').update(token).digest('hex');
  return await bcrypt.compare(sha256, hashed);
};

const generateTokens = async (userId) => {
  const accessToken = jwt.sign({ sub: userId }, env.jwtAccessSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: userId }, env.jwtRefreshSecret, { expiresIn: '7d' });
  const refreshTokenHash = await hashRefreshToken(refreshToken);
  
  return { accessToken, refreshToken, refreshTokenHash };
};

export const authService = {
  signup: async (name, email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);
    
    try {
      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash
      });
      
      const userObj = user.toObject();
      delete userObj.passwordHash;
      
      return userObj;
    } catch (error) {
      if (error.code === 11000) {
        const err = new Error('Email already in use');
        err.statusCode = 409;
        err.code = 'DUPLICATE_EMAIL';
        throw err;
      }
      throw error;
    }
  },

  login: async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    if (!user.passwordHash) {
      const err = new Error(user.authProviders?.includes('google') ? 'This account uses Google Sign-In' : 'Invalid email or password');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const { accessToken, refreshToken, refreshTokenHash } = await generateTokens(user._id);
    
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.refreshTokenHash;

    return { accessToken, refreshToken, user: userObj };
  },

  googleSignOn: async (payload) => {
    const { sub: googleId, email, name, picture: avatarUrl } = payload;
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try finding by Google ID
    let user = await User.findOne({ googleId });
    let isNewUser = false;

    if (user) {
      // Always refresh avatar on every Google sign-in (URLs can rotate)
      if (avatarUrl && user.avatarUrl !== avatarUrl) {
        user.avatarUrl = avatarUrl;
        await user.save();
      }
    } else {
      // 2. Try finding by email (Account Linking)
      user = await User.findOne({ email: normalizedEmail });
      if (user) {
        user.googleId = googleId;
        if (avatarUrl) user.avatarUrl = avatarUrl;
        if (!user.authProviders.includes('google')) {
          user.authProviders.push('google');
        }
        await user.save();
      } else {
        // 3. Create new user
        isNewUser = true;
        user = await User.create({
          name: name || email.split('@')[0],
          email: normalizedEmail,
          googleId,
          avatarUrl,
          authProviders: ['google'],
          onboardingCompleted: false
        });
      }
    }

    const { accessToken, refreshToken, refreshTokenHash } = await generateTokens(user._id);
    
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.refreshTokenHash;

    return { accessToken, refreshToken, user: userObj, isNewUser };
  },

  refresh: async (refreshToken) => {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
    } catch (error) {
      const err = new Error('Invalid or expired refresh token');
      err.statusCode = 401;
      err.code = 'TOKEN_INVALID_OR_EXPIRED';
      throw err;
    }

    const user = await User.findById(decoded.sub).select('+refreshTokenHash');
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    // Reuse detection
    if (!user.refreshTokenHash) {
      const err = new Error('Refresh token reuse detected or user logged out');
      err.statusCode = 403;
      err.code = 'TOKEN_REUSE_DETECTED';
      throw err;
    }

    const isValid = await compareRefreshToken(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      // Refresh token reuse detected (valid signature, but hash mismatch)
      user.refreshTokenHash = undefined;
      await user.save();
      const err = new Error('Refresh token reuse detected. Session invalidated.');
      err.statusCode = 403;
      err.code = 'TOKEN_REUSE_DETECTED';
      throw err;
    }

    // Valid and match -> Rotate
    const { accessToken: newAccessToken, refreshToken: newRefreshToken, refreshTokenHash } = await generateTokens(user._id);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  logout: async (userId) => {
    await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
  }
};
