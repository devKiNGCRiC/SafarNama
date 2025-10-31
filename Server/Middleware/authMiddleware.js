import jwt from 'jsonwebtoken';
import UserModel from '../Models/userModel.js';

// Verify Token Middleware
export const verifyToken = async (req, res, next) => {
    try {
        let token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No authentication token, access denied"
            });
        }

        // Remove Bearer from token if present
        if (token.startsWith('Bearer ')) {
            token = token.slice(7);
        }

        // Log token for debugging
        console.log('Token being verified:', token);

        // Verify token
        const verified = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log('Verified token data:', verified);

        // Get user from token
        const user = await UserModel.findById(verified.id).select('-password +active');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

         if (!user.active) {
            return res.status(401).json({
                success: false,
                message: "User account is deactivated"
            });
        }

        // Add user to request object
        req.user = user;
        next();

    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};

// Admin Authorization Middleware
export const isAdmin = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Admin access required"
            });
        }
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Admin authorization failed"
        });
    }
};

// Email Verification Check Middleware
export const isEmailVerified = async (req, res, next) => {
    try {
        if (!req.user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email first"
            });
        }
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Email verification check failed"
        });
    }
};

// Rate Limiting Middleware
export const rateLimiter = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
};