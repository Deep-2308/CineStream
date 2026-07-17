import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
  'PORT',
  'CLIENT_ORIGIN',
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'TMDB_ACCESS_TOKEN',
  'GEMINI_API_KEY',
  'GEMINI_CHAT_MODEL',
  'GEMINI_EMBEDDING_MODEL',
  'EMBEDDING_DIMENSIONS',
  'REDIS_URL',
  'ADMIN_RESYNC_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`ERROR: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

export const env = {
  port: process.env.PORT,
  clientOrigin: process.env.CLIENT_ORIGIN,
  mongoUri: process.env.MONGODB_URI,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  tmdbAccessToken: process.env.TMDB_ACCESS_TOKEN,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiChatModel: process.env.GEMINI_CHAT_MODEL,
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL,
  embeddingDimensions: parseInt(process.env.EMBEDDING_DIMENSIONS, 10) || 768,
  redisUrl: process.env.REDIS_URL,
  adminResyncSecret: process.env.ADMIN_RESYNC_SECRET
};
