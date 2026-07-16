import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Movie from '../models/Movie.js';
import { tmdbService } from '../services/tmdbService.js';
import { embeddingService } from '../services/embeddingService.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(env.mongoUri);
  console.log('Connected.');

  console.log('Fetching movie lists...');
  const uniqueTmdbIds = new Set();
  
  const fetchPages = async (fetchFn, startPage, endPage, label) => {
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
  };

  // Fetch from Popular, Top Rated, and Discover
  await fetchPages(tmdbService.fetchPopular, 1, 100, 'Popular');
  console.log(`Unique IDs after Popular: ${uniqueTmdbIds.size}`);
  
  await fetchPages(tmdbService.fetchTopRated, 1, 100, 'Top Rated');
  console.log(`Unique IDs after Top Rated: ${uniqueTmdbIds.size}`);
  
  await fetchPages(p => tmdbService.discover(p, { include_adult: false, 'vote_count.gte': 100 }), 1, 100, 'Discover');
  console.log(`Total Unique IDs to process: ${uniqueTmdbIds.size}`);

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
        console.log(`Processed ${processed} / ${uniqueTmdbIds.size} from TMDB...`);
      }
      
      await sleep(20); // Rate limit protection
    } catch (err) {
      console.error(`Failed to process movie ID ${id}:`, err.message);
      failedIds.push(id);
    }
  }

  console.log(`\nFinished processing TMDB. Skipped empty/no-poster: ${skippedEmpty}. Updated existing (no re-embed): ${updatedExisting}.`);
  console.log(`Movies needing embeddings: ${moviesToEmbed.length}\n`);

  // Batch generate embeddings and Bulk Write
  if (moviesToEmbed.length > 0) {
    const BATCH_SIZE = 100;
    let embeddingsGenerated = 0;
    
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

  console.log('\n--- SYNC COMPLETE ---');
  if (failedIds.length > 0) {
    console.log(`Failed TMDB IDs: ${failedIds.join(', ')}`);
  }

  console.log(`
=========================================================
MongoDB Atlas Vector Search Index Instructions
=========================================================
To enable vector search in Phase 4, you MUST create a 
Vector Search Index in the MongoDB Atlas UI.

1. Go to your Atlas cluster -> "Atlas Search" -> "Create Index"
2. Choose "JSON Editor"
3. Select Database (e.g. "test") and Collection: "movies"
4. Enter EXACTLY this name for the index: 
   movie_embedding_index
5. Paste the following JSON configuration:

{
  "fields": [
    {
      "numDimensions": 1536,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    }
  ]
}

6. Click "Next" and "Create Search Index".
Wait for the status to change from "Initial Sync" to "Active".
=========================================================
`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
