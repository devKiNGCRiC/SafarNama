import express from 'express';
import { processPayment } from '../Controllers/paymentController.js';
import { verifyToken } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, processPayment);
// Kept for the existing client, which posts to /api/v1/payment/payment
router.post('/payment', verifyToken, processPayment);

export default router;
