import UserModel from '../Models/userModel.js';
import jwt from 'jsonwebtoken';

// Admin Login
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin user
        const admin = await UserModel.findOne({ 
            email,
            role: 'admin' 
        }).select('+password');

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin credentials"
            });
        }

        // Verify password
        const isPasswordValid = await admin.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin credentials"
            });
        }

        // Generate token
        const token = jwt.sign(
            { id: admin._id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '24h' } // Shorter expiry for admin tokens
        );

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        res.status(200).json({
            success: true,
            message: "Admin login successful",
            admin: {
                id: admin._id,
                email: admin.email,
                role: admin.role
            },
            token
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Admin login failed",
            error: error.message
        });
    }
};

// Get Admin Dashboard Stats
export const getDashboardStats = async (req, res) => {
    try {
        const stats = {
            totalUsers: await UserModel.countDocuments({ role: 'user' }),
            activeUsers: await UserModel.countDocuments({ 
                role: 'user',
                active: true 
            }),
            verifiedUsers: await UserModel.countDocuments({ 
                role: 'user',
                isEmailVerified: true 
            }),
            recentUsers: await UserModel.find({ role: 'user' })
                .select('username email createdAt')
                .sort({ createdAt: -1 })
                .limit(5)
        };

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get dashboard stats",
            error: error.message
        });
    }
};

// Get All Users
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
        
        const users = await UserModel.find({ role: 'user' })
            .select('-password')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await UserModel.countDocuments({ role: 'user' });

        res.status(200).json({
            success: true,
            data: users,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error.message
        });
    }
};

// Update User Status
export const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { active } = req.body;

        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.active = active;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${active ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update user status",
            error: error.message
        });
    }
};

// Get User Activity
export const getUserActivity = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await UserModel.findById(userId)
            .select('lastLogin loginAttempts createdAt');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get user activity",
            error: error.message
        });
    }
};

// Get System Analytics
export const getSystemAnalytics = async (req, res) => {
    try {
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);

        const analytics = {
            totalUsers: await UserModel.countDocuments(),
            newUsersThisMonth: await UserModel.countDocuments({
                createdAt: { $gte: lastMonth }
            }),
            verificationRate: await calculateVerificationRate(),
            userGrowth: await calculateUserGrowth()
        };

        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get analytics",
            error: error.message
        });
    }
};

// Helper Functions
const calculateVerificationRate = async () => {
    const totalUsers = await UserModel.countDocuments();
    const verifiedUsers = await UserModel.countDocuments({ isEmailVerified: true });
    return (verifiedUsers / totalUsers * 100).toFixed(2);
};

const calculateUserGrowth = async () => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
    const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2);

    const lastMonthUsers = await UserModel.countDocuments({
        createdAt: { 
            $gte: lastMonth,
            $lt: today 
        }
    });

    const previousMonthUsers = await UserModel.countDocuments({
        createdAt: { 
            $gte: twoMonthsAgo,
            $lt: lastMonth 
        }
    });

    const growth = ((lastMonthUsers - previousMonthUsers) / previousMonthUsers * 100).toFixed(2);
    return growth;
};