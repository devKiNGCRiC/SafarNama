import express from 'express';
import { 
    registerUser, 
    loginUser, 
    logoutUser ,
    verifyEmail,
    forgotPassword,
    resetPassword
} from '../Controllers/authController.js';

const router = express.Router();

// Auth routes
router.post('/register', registerUser);
router.post('/login', async (req, res) => {
    console.log('Received login request:', req.body);
    try {
        await loginUser(req, res);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
});
//router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;