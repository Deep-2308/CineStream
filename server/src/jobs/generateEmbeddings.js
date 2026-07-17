import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Movie from '../models/Movie.js';
import { embeddingService } from '../services/embeddingService.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  let isInterrupted = false;

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nCaught interrupt signal (SIGINT). Will save current batch and exit gracefully...');
    isInterrupted = true;
  });

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.mongoUri, { dbName: 'cinestream' });
    console.log('Connected.\n');

    // Parse arguments
    const args = process.argv.slice(2);
    const force = args.includes('--force');

    // Find movies without embeddings
    const query = force ? {} : { 
      $or: [
        { embedding: { $exists: false } },
        { embedding: { $size: 0 } }
      ]
    };

    const totalToProcess = await Movie.countDocuments(query);
    console.log(`Found ${totalToProcess} movies needing embeddings${force ? ' (FORCE ALL)' : ''}.`);

    if (totalToProcess === 0) {
      console.log('Nothing to do. Exiting.');
      process.exit(0);
    }

    // Process in small batches
    const BATCH_SIZE = 50; // 50-100 per batch as requested
    const MAX_RETRIES = 4;
    let processed = 0;
    let successCount = 0;
    let failedCount = 0;

    // Use a cursor to fetch them memory-efficiently
    const cursor = Movie.find(query).cursor();
    let currentBatch = [];

    const processBatch = async (batch) => {
      const texts = batch.map(m => {
        const genresStr = m.genres ? m.genres.join(', ') : '';
        return `${m.title}. ${m.overview} Genres: ${genresStr}`;
      });

      let attempt = 0;
      while (attempt <= MAX_RETRIES) {
        try {
          console.log(`\nGenerating embeddings for batch of ${batch.length}... (Attempt ${attempt + 1})`);
          const embeddings = await embeddingService.embedBatch(texts);
          
          if (embeddings.length !== batch.length) {
             throw new Error(`Mismatch: got ${embeddings.length} embeddings for ${batch.length} texts`);
          }

          // Update MongoDB in bulk
          const bulkOps = batch.map((movie, idx) => ({
            updateOne: {
              filter: { _id: movie._id },
              update: { $set: { embedding: embeddings[idx] } }
            }
          }));

          await Movie.bulkWrite(bulkOps);
          successCount += batch.length;
          console.log(`Successfully saved ${batch.length} embeddings. (Total: ${successCount}/${totalToProcess})`);
          
          // Sleep to respect rate limits
          await sleep(1000);
          return; // Success, break out of retry loop

        } catch (error) {
          attempt++;
          const msg = error.message || String(error);
          console.error(`Batch failed: ${msg}`);
          
          // If it's a 429 rate limit or potentially transient error
          if (attempt <= MAX_RETRIES) {
            const backoffMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s, 8s
            console.log(`Retrying in ${backoffMs / 1000} seconds...`);
            await sleep(backoffMs);
          } else {
            console.error(`Max retries reached for this batch. Skipping.`);
            failedCount += batch.length;
          }
        }
      }
    };

    for await (const doc of cursor) {
      if (isInterrupted) {
        console.log('Interruption detected, breaking out of main loop...');
        break;
      }

      currentBatch.push(doc);

      if (currentBatch.length >= BATCH_SIZE) {
        await processBatch(currentBatch);
        processed += currentBatch.length;
        currentBatch = [];
      }
    }

    // Process remaining if any
    if (currentBatch.length > 0 && !isInterrupted) {
      await processBatch(currentBatch);
      processed += currentBatch.length;
    }

    console.log('\n--- EMBEDDING GENERATION COMPLETE ---');
    console.log(`Successfully embedded: ${successCount}`);
    console.log(`Failed / Skipped: ${failedCount}`);
    if (isInterrupted) {
      console.log('Process was paused. Run script again to resume from where it left off.');
    }

  } catch (err) {
    console.error('Fatal error during embedding generation:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
