import { validationResult } from 'express-validator';
import { askService } from '../services/askService.js';

export const askController = {
  /**
   * POST /api/ask
   * Body: { query: string, history: Array<{role: string, content: string}> }
   */
  answer: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { query, history = [] } = req.body;

    try {
      const response = await askService.answer(query, history);
      res.json(response);
    } catch (error) {
      // If service throws (e.g. Gemini embedding failed), return a graceful error
      // that the client can show inline in the chat.
      res.status(503).json({ 
        error: { 
          message: error.message || 'The AI service is currently unavailable. Please try again later.' 
        } 
      });
    }
  }
};
