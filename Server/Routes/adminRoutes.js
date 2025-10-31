import express from 'express';
import { 
    adminLogin, 
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
    getUserActivity,
    getSystemAnalytics
} from '../Controllers/adminController.js';
import { verifyToken, isAdmin } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Public admin routes
router.post('/login', adminLogin);

// Protected admin routes
router.use(verifyToken, isAdmin);  // Middleware for all routes below
router.get('/dashboard-stats', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:userId/status', updateUserStatus);
router.get('/users/:userId/activity', getUserActivity);
router.get('/analytics', getSystemAnalytics);

export default router;