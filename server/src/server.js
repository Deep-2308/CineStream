import mongoose from 'mongoose';
import app from './app.js';
import { env } from './config/env.js';

const PORT = env.port || 5000;

mongoose.connect(env.mongoUri)
  .then(() => {
    console.log('[MongoDB] Connected.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[MongoDB] Connection error:', err);
    process.exit(1);
  });
