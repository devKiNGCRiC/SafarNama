import express from 'express';
import { addFeedback } from '../Controllers/feedbackController.js';

const router = express.Router();

router.post('/feedback', addFeedback);

export default router;
