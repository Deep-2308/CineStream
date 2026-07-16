import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
  'PORT',
  'CLIENT_ORIGIN',
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'TMDB_ACCESS_TOKEN',
  'OPENAI_API_KEY'
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
  openaiApiKey: process.env.OPENAI_API_KEY,
};
