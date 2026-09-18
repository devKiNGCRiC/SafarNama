// Update Routes/destinationRoutes.js
import express from 'express';
import { 
  createDestination, 
  updateDestination, 
  deleteDestination, 
  getAllDestinations, 
  getDestination,
  getFeaturedDestinations,
  getDestinationsByCategory,
  getNearbyDestinations,
  getDestinationsInBounds,
  getFilteredDestinations
} from '../Controllers/destinationController.js';
import { verifyToken, isAdmin } from '../Middleware/authMiddleware.js';


const router = express.Router();
// New routes for featured and category
router.get('/featured', getFeaturedDestinations);
router.get('/category/:category', getDestinationsByCategory);

//Crud routes
router.get('/', getAllDestinations);
router.get('/:id', getDestination);
// Only admins may change the destination catalogue
router.post('/', verifyToken, isAdmin, createDestination);
router.put('/:id', verifyToken, isAdmin, updateDestination);
router.delete('/:id', verifyToken, isAdmin, deleteDestination);

// Add new map-related routes
router.get('/map/nearby', getNearbyDestinations);
router.get('/map/bounds', getDestinationsInBounds);
router.get('/map/filtered', getFilteredDestinations);

export default router;