// routes/ecoGuideRoutes.js
import express from 'express';
import {
  getAllGuides,
  createGuide,
  getGuideById
} from '../Controllers/ecoGuideController.js';
import { verifyToken } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllGuides);
router.post('/', verifyToken, createGuide);
router.get('/:id', getGuideById);

export default router;