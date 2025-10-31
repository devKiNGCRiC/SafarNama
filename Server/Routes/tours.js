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

const router = express.Router();

// Routes for tours
router.route('/')
  .get(getAllTours)        // Get all tours
  .post(createTour);       // Create a new tour

router.route('/:id')
  .get(getTour)            // Get a specific tour by ID
  .patch(updateTour)       // Update a specific tour
  .delete(deleteTour);     // Delete a specific tour

// In tourRoutes.js
router.get('/similar', getSimilarTours);
// Route for getting tours by destination
router.get('/destination/:destinationId', getDestinationTours);

// Route for checking availability
router.get('/availability', checkAvailability);

// Route for getting tour statistics
router.get('/stats', getTourStats);

// Route for getting monthly schedule
router.get('/schedule/monthly', getMonthlySchedule);

export default router;
