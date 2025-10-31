// routes/itineraryRoutes.js
import express from 'express';
import rateLimit from 'express-rate-limit';


import {
  createItinerary,
  getAllItineraries,
  getItinerary,
  updateItinerary,
  deleteItinerary,
  getItinerariesByDestination,
  getUserItineraries
} from '../Controllers/itineraryController.js';
import { verifyToken, isAdmin } from '../Middleware/authMiddleware.js'; // Assuming you have authentication middleware

const router = express.Router();

// Create rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });

// Apply rate limiting to all itinerary routes
router.use(limiter);

// Public routes
router.get('/', getAllItineraries);
router.get('/:id', getItinerary);
router.get('/destination/:destinationId', getItinerariesByDestination);

// Protected routes (require authentication)
router.use(verifyToken); // Apply authentication to all routes below

// User specific routes
// Protected routes
router.post('/', verifyToken, createItinerary);
router.get('/user/:userId', verifyToken, getUserItineraries);
router.put('/:id', verifyToken, updateItinerary);
router.delete('/:id', verifyToken, deleteItinerary);

// Admin only routes
router.use(isAdmin); // Apply admin check to all routes below

router.get('/admin/all', verifyToken, isAdmin, getAllItineraries); // Get all itineraries with sensitive data
router.delete('/admin/:id', verifyToken, isAdmin, deleteItinerary);
 // Admin can delete any itinerary


export default router;