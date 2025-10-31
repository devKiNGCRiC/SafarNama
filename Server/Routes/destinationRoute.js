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


const router = express.Router();
// New routes for featured and category
router.get('/featured', getFeaturedDestinations);
router.get('/category/:category', getDestinationsByCategory);

//Crud routes
router.get('/', getAllDestinations);
router.get('/:id', getDestination);
router.post('/', createDestination);
router.put('/:id', updateDestination);
router.delete('/:id', deleteDestination);

// Add new map-related routes
router.get('/map/nearby', getNearbyDestinations);
router.get('/map/bounds', getDestinationsInBounds);
router.get('/map/filtered', getFilteredDestinations);

export default router;