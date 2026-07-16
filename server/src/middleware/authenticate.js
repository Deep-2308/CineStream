import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        message: 'Access token missing or malformed',
        code: 'TOKEN_MISSING'
      }
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret);
    req.user = { id: decoded.sub };
    next();
  } catch (error) {
    let code = 'TOKEN_INVALID';
    let message = 'Invalid access token';

    if (error.name === 'TokenExpiredError') {
      code = 'TOKEN_EXPIRED';
      message = 'Access token expired';
    }

    return res.status(401).json({
      error: {
        message,
        code
      }
    });
  }
};
