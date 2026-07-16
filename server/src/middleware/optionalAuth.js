import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.jwtAccessSecret);
      req.user = { id: decoded.sub };
    } catch (err) {
      // Invalid token, just ignore and proceed as anonymous
    }
  }
  
  next();
};
