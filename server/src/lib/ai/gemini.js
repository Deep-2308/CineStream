import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';

const geminiClient = new GoogleGenAI({
  apiKey: env.geminiApiKey,
});

export default geminiClient;
