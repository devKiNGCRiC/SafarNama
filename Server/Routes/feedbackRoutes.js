import express from 'express';
import rateLimit from 'express-rate-limit';
import { addFeedback } from '../Controllers/feedbackController.js';

const router = express.Router();

// Public form - limit spam
const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many submissions. Please try again later.' },
});

// Mounted at /api/v1/feedback (was /api/v1/feedback/feedback)
router.post('/', feedbackLimiter, addFeedback);

export default router;
