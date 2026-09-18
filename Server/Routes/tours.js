import express from 'express';
import {
  getAllTours,
  getDestinationTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  checkAvailability,
  getTourStats,
  getSimilarTours,
  getMonthlySchedule
} from '../Controllers/tourController.js';
import { getTourReviews, createReview } from '../Controllers/reviewController.js';
import { verifyToken, isAdmin } from '../Middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();

// Review submissions from the tour page arrive as multipart/form-data (they can
// carry photos). Photos are not stored yet, so only the text fields are read.
const parseReviewForm = multer().none();

// NOTE: fixed-path routes must be declared before '/:id', otherwise Express
// treats e.g. "similar" or "stats" as a tour id.
router.get('/similar', getSimilarTours);
router.get('/availability', checkAvailability);
router.get('/stats', getTourStats);
router.get('/schedule/monthly', getMonthlySchedule);
router.get('/destination/:destinationId', getDestinationTours);

// Reviews for a tour
router.get('/:tourId/reviews', getTourReviews);
router.post('/:tourId/reviews', verifyToken, parseReviewForm, createReview);

// Routes for tours
router.route('/')
  .get(getAllTours)                              // Get all tours
  .post(verifyToken, isAdmin, createTour);       // Create a new tour (admin)

router.route('/:id')
  .get(getTour)                                  // Get a specific tour by ID
  .patch(verifyToken, isAdmin, updateTour)       // Update a tour (admin)
  .delete(verifyToken, isAdmin, deleteTour);     // Delete a tour (admin)

export default router;
