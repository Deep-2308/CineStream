const BASE = 'https://image.tmdb.org/t/p';

/**
 * Builds a TMDB image URL for posters.
 * @param {string} path - The image path from TMDB (e.g. "/q6y0Go...jpg")
 * @param {string} size - The TMDB size segment (e.g. "w342", "w500")
 * @returns {string|null}
 */
export const posterUrl = (path, size = 'w342') => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE}/${size}${path}`;
};

/**
 * Builds a TMDB image URL for backdrops.
 * @param {string} path - The image path from TMDB
 * @param {string} size - The TMDB size segment (e.g. "w1280", "original")
 * @returns {string|null}
 */
export const backdropUrl = (path, size = 'w1280') => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE}/${size}${path}`;
};
