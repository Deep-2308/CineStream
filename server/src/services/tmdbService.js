import { env } from '../config/env.js';

const BASE_URL = 'https://api.themoviedb.org/3';

async function fetchWithRetry(url, options = {}, retries = 3, delayMs = 1000) {
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${env.tmdbAccessToken}`,
    'Accept': 'application/json'
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 429 && retries > 0) {
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : delayMs;
      
      console.warn(`[TMDB] 429 Rate Limit hit. Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      return fetchWithRetry(url, options, retries - 1, delayMs * 2);
    }

    if (!response.ok) {
      throw new Error(`TMDB API Error: ${response.status} ${response.statusText} for URL: ${url}`);
    }

    return await response.json();
  } catch (error) {
    if (retries > 0 && !error.message.includes('404')) {
      console.warn(`[TMDB] Fetch error: ${error.message}. Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return fetchWithRetry(url, options, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

export const tmdbService = {
  fetchPopular: async (page = 1) => {
    return fetchWithRetry(`${BASE_URL}/movie/popular?language=en-US&page=${page}`);
  },
  
  fetchTopRated: async (page = 1) => {
    return fetchWithRetry(`${BASE_URL}/movie/top_rated?language=en-US&page=${page}`);
  },
  
  fetchNowPlaying: async (page = 1) => {
    return fetchWithRetry(`${BASE_URL}/movie/now_playing?language=en-US&page=${page}`);
  },
  
  discover: async (page = 1, filters = {}) => {
    const params = new URLSearchParams({
      language: 'en-US',
      page: page.toString(),
      ...filters
    });
    return fetchWithRetry(`${BASE_URL}/discover/movie?${params.toString()}`);
  },
  
  fetchMovieDetails: async (id) => {
    return fetchWithRetry(`${BASE_URL}/movie/${id}?language=en-US&append_to_response=videos`);
  }
};
