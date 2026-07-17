import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../models/User.js';

async function runMigration() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(env.mongoUri);
  console.log('Connected.');

  try {
    const result = await User.updateMany(
      {}, // all users
      { $set: { onboardingCompleted: true } }
    );
    
    console.log(`Migration complete. Modified ${result.modifiedCount} users.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
    process.exit(0);
  }
}

runMigration();
