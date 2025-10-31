// routes/eventRoutes.js
import express from 'express';
import {
  createEvent,
  getAllEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration
} from '../Controllers/eventController.js';
import { verifyToken, isAdmin } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllEvents);
router.get('/:id', getEvent);

// Protected routes
router.use(verifyToken);

// User routes
router.post('/register/:id', registerForEvent);
router.delete('/register/:id', cancelRegistration);

// Admin and organizer routes
router.post('/', isAdmin, createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;