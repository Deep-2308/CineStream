import { tmdbService } from './tmdbService.js';
import { embeddingService } from './embeddingService.js';
import Movie from '../models/Movie.js';
import { invalidateCache } from '../config/redis.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const syncService = {
  fetchPages: async (fetchFn, startPage, endPage, label) => {
    const uniqueTmdbIds = new Set();
    for (let p = startPage; p <= endPage; p++) {
      try {
        const data = await fetchFn(p);
        if (data && data.results) {
          data.results.forEach(m => uniqueTmdbIds.add(m.id));
        }
        await sleep(25); // slight delay to pace basic list fetching
      } catch (err) {
        console.error(`Error fetching ${label} page ${p}:`, err.message);
      }
    }
    return Array.from(uniqueTmdbIds);
  },

  processMovies: async (uniqueTmdbIds) => {
    const moviesToEmbed = [];
    const failedIds = [];
    let processed = 0;
    let skippedEmpty = 0;
    let updatedExisting = 0;

    for (const id of uniqueTmdbIds) {
      try {
        const details = await tmdbService.fetchMovieDetails(id);
        
        // Skip if overview or poster is missing
        if (!details.overview || !details.poster_path) {
          skippedEmpty++;
          continue;
        }

        // Extract Trailer
        let trailerKey = null;
        if (details.videos && details.videos.results) {
          const trailer = details.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
          const teaser = details.videos.results.find(v => v.type === 'Teaser' && v.site === 'YouTube');
          trailerKey = trailer ? trailer.key : (teaser ? teaser.key : null);
        }

        const genres = details.genres ? details.genres.map(g => g.name) : [];
        
        const movieData = {
          tmdbId: details.id,
          title: details.title,
          overview: details.overview,
          genres,
          releaseDate: details.release_date ? new Date(details.release_date) : null,
          runtime: details.runtime,
          posterPath: details.poster_path,
          backdropPath: details.backdrop_path,
          trailerKey,
          voteAverage: details.vote_average,
          popularity: details.popularity,
        };

        // Check embedding using the correct query for select:false fields
        const existsWithEmbedding = await Movie.exists({ 
          tmdbId: details.id, 
          embedding: { $exists: true, $ne: [] } 
        });

        if (existsWithEmbedding) {
          // Upsert standard fields without touching the embedding
          await Movie.updateOne(
            { tmdbId: details.id },
            { $set: movieData },
            { upsert: true }
          );
          updatedExisting++;
        } else {
          // Queue for embedding
          moviesToEmbed.push({
            movieData,
            embedText: `${details.title}. ${details.overview} Genres: ${genres.join(', ')}`
          });
        }

        processed++;
        if (processed % 100 === 0) {
          console.log(`Processed ${processed} / ${uniqueTmdbIds.length} from TMDB...`);
        }
        
        await sleep(20); // Rate limit protection
      } catch (err) {
        console.error(`Failed to process movie ID ${id}:`, err.message);
        failedIds.push(id);
      }
    }

    console.log(`\nFinished processing TMDB. Skipped empty/no-poster: ${skippedEmpty}. Updated existing (no re-embed): ${updatedExisting}.`);
    console.log(`Movies needing embeddings: ${moviesToEmbed.length}\n`);

    let embeddingsGenerated = 0;
    // Batch generate embeddings and Bulk Write
    if (moviesToEmbed.length > 0) {
      // Changed to 50 due to OpenAI quota / rate limiting failures in previous run
      const BATCH_SIZE = 50; 
      
      for (let i = 0; i < moviesToEmbed.length; i += BATCH_SIZE) {
        const batch = moviesToEmbed.slice(i, i + BATCH_SIZE);
        const texts = batch.map(b => b.embedText);
        
        try {
          console.log(`Generating embeddings for batch ${i} to ${i + batch.length - 1}...`);
          const embeddings = await embeddingService.embedBatch(texts);
          embeddingsGenerated += embeddings.length;
          
          // Prepare bulk upsert
          const bulkOps = batch.map((item, index) => ({
            updateOne: {
              filter: { tmdbId: item.movieData.tmdbId },
              update: { 
                $set: { 
                  ...item.movieData, 
                  embedding: embeddings[index] 
                } 
              },
              upsert: true
            }
          }));

          await Movie.bulkWrite(bulkOps);
          await sleep(500); // Breathe between big batch writes
        } catch (err) {
          console.error(`Failed to generate embeddings or write batch starting at index ${i}:`, err.message);
        }
      }
      console.log(`Generated and saved ${embeddingsGenerated} new embeddings.`);
    }

    // Invalidate Catalogue Cache for popular and trending lists since data changed
    console.log('Invalidating catalogue cache...');
    await invalidateCache('catalogue:popular:*');
    await invalidateCache('catalogue:trending:*');

    return {
      updated: updatedExisting,
      inserted: embeddingsGenerated,
      skipped: skippedEmpty,
      failedIds
    };
  }
};
