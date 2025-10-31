// routes/ecoGuideRoutes.js
import express from 'express';
import {
  getAllGuides,
  createGuide,
  getGuideById
} from '../Controllers/ecoGuideController.js';

const router = express.Router();

router.get('/', getAllGuides);
router.post('/', createGuide);
router.get('/:id', getGuideById);

export default router;