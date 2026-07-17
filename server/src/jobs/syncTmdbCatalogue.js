import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { tmdbService } from '../services/tmdbService.js';
import { syncService } from '../services/syncService.js';

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(env.mongoUri);
  console.log('Connected.');

  console.log('Fetching movie lists...');
  const uniqueTmdbIds = new Set();
  
  const addIds = (ids) => ids.forEach(id => uniqueTmdbIds.add(id));

  // Fetch from Popular, Top Rated, and Discover
  const popularIds = await syncService.fetchPages(tmdbService.fetchPopular, 1, 2, 'Popular');
  addIds(popularIds);
  console.log(`Unique IDs after Popular: ${uniqueTmdbIds.size}`);
  
  const topRatedIds = await syncService.fetchPages(tmdbService.fetchTopRated, 1, 2, 'Top Rated');
  addIds(topRatedIds);
  console.log(`Unique IDs after Top Rated: ${uniqueTmdbIds.size}`);
  
  const discoverIds = await syncService.fetchPages(p => tmdbService.discover(p, { include_adult: false, 'vote_count.gte': 100 }), 1, 2, 'Discover');
  addIds(discoverIds);
  console.log(`Total Unique IDs to process: ${uniqueTmdbIds.size}`);

  const results = await syncService.processMovies(Array.from(uniqueTmdbIds));

  console.log('\n--- SYNC COMPLETE ---');
  if (results.failedIds.length > 0) {
    console.log(`Failed TMDB IDs: ${results.failedIds.join(', ')}`);
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
      "numDimensions": ${env.embeddingDimensions},
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
