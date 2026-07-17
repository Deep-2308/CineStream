/**
 * seedOriginals.js — one-time (safely re-runnable) seed for CineStream Originals.
 *
 * Run with:  npm run seed:originals
 *
 * Contract:
 *  - upsert key: hlsManifestUrl (unique index in schema)
 *  - all mock entries are marked `licenseNote: "MOCK — replace before demo"`
 *  - every hlsManifestUrl is validated https:// at seed-time; non-https entries
 *    are skipped with a warning so bad data never reaches the DB
 */

import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Original from '../models/Original.js';

// ---------------------------------------------------------------------------
// Seed data — public-domain / open-licensed sample streams for DEV only.
// Replace every entry before the Phase 13 demo (diary Section 4.1).
// ---------------------------------------------------------------------------
const MOCK_ORIGINALS = [
  {
    title: 'Big Buck Bunny',
    description:
      'A large and loveable rabbit deals with three tiny bullies, ultimately facing his fears and finding courage.',
    posterPath:    '/uO2yU3QiGHvVp0L5e5IatTVRkYk.jpg',
    backdropPath:  '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    hlsManifestUrl:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    durationSeconds: 596,
    releaseYear:   2008,
    genres:        ['Animation', 'Comedy', 'Family'],
    language:      'en',
    featured:      true,
    licenseNote:   'MOCK — replace before demo | CC BY 3.0 Blender Foundation',
  },
  {
    title: 'Tears of Steel',
    description:
      'In a wrecked future Amsterdam, a group of warriors fight to reclaim the world from machines—a sci-fi short.',
    posterPath:    '/1eOWn4wPZc2kivH464R6r4UqT7D.jpg',
    backdropPath:  '/x7vY7K7g9N5P1S1F4T7R3T0Z6.jpg',
    hlsManifestUrl:'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    durationSeconds: 734,
    releaseYear:   2012,
    genres:        ['Action', 'Science Fiction'],
    language:      'en',
    featured:      true,
    licenseNote:   'MOCK — replace before demo | CC BY 3.0 Blender Foundation',
  },
  {
    title: 'Elephants Dream',
    description:
      'Two characters explore a mechanical world — the first open-source animated film.',
    posterPath:    '/gA3P3wH8gN5P1S1F4T7R3T0Z6.jpg',
    backdropPath:  '/x7vY7K7g9N5P1S1F4T7R3T0Z6.jpg',
    hlsManifestUrl:'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    durationSeconds: 1068,
    releaseYear:   2006,
    genres:        ['Animation', 'Drama'],
    language:      'en',
    featured:      false,
    licenseNote:   'MOCK — replace before demo | CC BY 2.5 Blender Foundation',
  },
  {
    title: 'Sintel',
    description:
      'A lone girl battles to find her lost dragon companion in a harsh world.',
    posterPath:    '/qM6TbbAEvzUeG0zPZ5E8Gg75hYp.jpg',
    backdropPath:  '/aJv3C2Q6K3j2U3A6Uq0U2Q0GvH.jpg',
    hlsManifestUrl:'https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
    durationSeconds: 888,
    releaseYear:   2010,
    genres:        ['Animation', 'Fantasy', 'Drama'],
    language:      'en',
    featured:      false,
    licenseNote:   'MOCK — replace before demo | CC BY 3.0 Blender Foundation',
  },
  {
    title: 'Cosmos Laundromat',
    description:
      'A despondent sheep named Franck, on the verge of an existential collapse, encounters a mysterious guide.',
    posterPath:    '/4V8M3U6Q8U6F1M3H6C3P6V1T6.jpg',
    backdropPath:  '/b1M3U6Q8U6F1M3H6C3P6V1T6.jpg',
    hlsManifestUrl:'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8',
    durationSeconds: 1308,
    releaseYear:   2015,
    genres:        ['Animation', 'Comedy', 'Fantasy'],
    language:      'en',
    featured:      false,
    licenseNote:   'MOCK — replace before demo | CC BY 4.0 Blender Foundation',
  },
];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function isValidHttpsUrl(url) {
  return typeof url === 'string' && url.startsWith('https://');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(env.mongoUri);
  console.log('Connected.\n');

  const ops = [];
  const skipped = [];

  for (const entry of MOCK_ORIGINALS) {
    if (!isValidHttpsUrl(entry.hlsManifestUrl)) {
      skipped.push(entry.title);
      console.warn(`[SKIP] "${entry.title}" — hlsManifestUrl must be https: ${entry.hlsManifestUrl}`);
      continue;
    }

    ops.push({
      updateOne: {
        filter: { hlsManifestUrl: entry.hlsManifestUrl },
        update:  { $set: entry },
        upsert:  true,
      },
    });
  }

  if (ops.length === 0) {
    console.log('No valid entries to process. Exiting.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const result = await Original.bulkWrite(ops, { ordered: false });

  console.log('--- SEED COMPLETE ---');
  console.log(`  Inserted : ${result.upsertedCount}`);
  console.log(`  Updated  : ${result.modifiedCount}`);
  console.log(`  Unchanged: ${result.matchedCount - result.modifiedCount}`);
  if (skipped.length > 0) {
    console.log(`  Skipped  : ${skipped.length} (non-https URLs) → ${skipped.join(', ')}`);
  }
  console.log('\n⚠  All entries are MOCK data. Replace with real HLS manifests before Phase 13 demo.');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
