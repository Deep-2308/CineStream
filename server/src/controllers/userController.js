import User from '../models/User.js';
import { validationResult } from 'express-validator';

const ALLOWED_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Fantasy', 'Horror', 'Music',
  'Mystery', 'Romance', 'Science Fiction', 'Thriller',
  'Western', 'Family', 'History', 'War'
];

const ALLOWED_DECADES = ['1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];

/**
 * PATCH /api/users/me
 * Body: { name?, preferences: { favoriteGenres?, favoriteLanguage?, favoriteDecade? } }
 */
export const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, preferences, onboardingCompleted } = req.body;
  const update = {};

  if (onboardingCompleted !== undefined) {
    update.onboardingCompleted = Boolean(onboardingCompleted);
  }

  if (name !== undefined) {
    update.name = name.trim().slice(0, 50);
  }

  if (preferences) {
    if (Array.isArray(preferences.favoriteGenres)) {
      // Sanitize: only allow known genre strings
      update['preferences.favoriteGenres'] = preferences.favoriteGenres
        .filter(g => ALLOWED_GENRES.includes(g));
    }
    if (preferences.favoriteLanguage !== undefined) {
      update['preferences.favoriteLanguage'] = preferences.favoriteLanguage || undefined;
    }
    if (preferences.favoriteDecade !== undefined) {
      // Validate decade value
      const decade = preferences.favoriteDecade;
      update['preferences.favoriteDecade'] = ALLOWED_DECADES.includes(decade) ? decade : undefined;
    }
    if (Array.isArray(preferences.languages)) {
      update['preferences.languages'] = preferences.languages.filter(l => typeof l === 'string');
    }
    if (preferences.contentPrefs) {
      if (typeof preferences.contentPrefs.eraFrom === 'number') {
        update['preferences.contentPrefs.eraFrom'] = preferences.contentPrefs.eraFrom;
      }
      if (typeof preferences.contentPrefs.runtimeMax === 'number') {
        update['preferences.contentPrefs.runtimeMax'] = preferences.contentPrefs.runtimeMax;
      }
    }
    if (typeof preferences.accentColor === 'string') {
      update['preferences.accentColor'] = preferences.accentColor;
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: update },
    { new: true, select: '-passwordHash -refreshTokenHash' }
  ).lean();

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({ user });
};
