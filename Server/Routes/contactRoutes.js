import express from 'express';
import rateLimit from 'express-rate-limit';
import { addContact } from '../Controllers/contactController.js';

const router = express.Router();

// Public form - limit spam
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many messages sent. Please try again later.' },
});

// Mounted at /api/v1/contact (was /api/v1/contact/contact)
router.post('/', contactLimiter, addContact);

export default router;
