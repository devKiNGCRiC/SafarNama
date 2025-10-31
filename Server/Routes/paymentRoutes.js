import express from 'express';
import { processPayment } from '../Controllers/paymentController.js';

const router = express.Router();

router.post('/payment', processPayment);

export default router;
