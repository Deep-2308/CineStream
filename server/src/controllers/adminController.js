import { env } from '../config/env.js';
import crypto from 'crypto';
import { syncService } from '../services/syncService.js';
import { tmdbService } from '../services/tmdbService.js';

export const resyncNowPlaying = async (req, res) => {
  const providedSecret = req.headers['x-admin-secret'];
  
  if (!providedSecret || typeof providedSecret !== 'string') {
    return res.status(401).json({ message: 'Unauthorized: missing or invalid x-admin-secret' });
  }

  // Safe timing comparison
  const expectedBuf = Buffer.from(env.adminResyncSecret);
  const providedBuf = Buffer.from(providedSecret);

  if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
    return res.status(401).json({ message: 'Unauthorized: incorrect x-admin-secret' });
  }

  // Respond immediately, perform work asynchronously
  res.status(202).json({ message: 'Sync accepted and processing in background' });

  try {
    const ids = await syncService.fetchPages(tmdbService.fetchNowPlaying, 1, 5, 'Now Playing');
    if (ids.length > 0) {
      const results = await syncService.processMovies(ids);
      console.log(`[Admin Resync] Complete. Inserted: ${results.inserted}, Updated: ${results.updated}, Skipped: ${results.skipped}`);
    }
  } catch (err) {
    console.error('[Admin Resync] Error during async sync processing:', err.message);
  }
};
