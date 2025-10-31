import UserModel from '../Models/userModel.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '7d' }
    );
};

// Register User
export const registerUser = async (req, res) => {
    try {
        console.log('Processing registration for:', req.body);
        const { firstName, lastName , username, email, password , avatar } = req.body;

        // Check if user exists
        const userExists = await UserModel.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (userExists) {
            return res.status(400).json({
                success: false,
                message: userExists.email === email ? 
                    "Email already registered" : 
                    "Username already taken"
            });
        }

        // Generate email verification token
        // const verificationToken = crypto.randomBytes(32).toString('hex');
        // const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        // Create new user
        const newUser = await UserModel.create({
            username,
            email,
            password,
            firstName,
            lastName,
            isEmailVerified: true ,
            avatar
            // emailVerificationToken: verificationToken,
            // emailVerificationExpires: verificationExpires
        });

        // Generate token for the new user
        const token = generateToken(newUser._id);
        // const token = jwt.sign(
        //     { id: newUser._id },
        //     process.env.JWT_SECRET_KEY,
        //     { expiresIn: '7d' }
        // );

        // Send verification email
        // const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
        // await transporter.sendMail({
        //     to: email,
        //     subject: 'Verify Your Email - SafarNama',
        //     html: `
        //         <h2>Welcome to SafarNama!</h2>
        //         <p>Please click the link below to verify your email address:</p>
        //         <a href="${verificationUrl}">${verificationUrl}</a>
        //         <p>This link will expire in 24 hours.</p>
        //     `
        // });

        res.status(201).json({
            success: true,
            message: "Registration successful! Please check your email for verification.",
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                avatar: newUser.avatar
            },
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error.message
        });
    }
};

// Login User
export const loginUser = async (req, res) => {
    try {
        const { userIdentifier, password } = req.body;

        // Log the search criteria
        console.log('Searching for user with:', { userIdentifier });

        // Find user by email or username
        const user = await UserModel.findOne({
            $or: [
                { email: userIdentifier },
                { username: userIdentifier }
            ]
        }).select('+password '); //+loginAttempts +lockUntil

        console.log('User found:', user ? 'Yes' : 'No');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if account is locked
        if (user.isLocked()) {
            return res.status(403).json({
                success: false,
                message: "Account is temporarily locked. Try again later"
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            //await user.incrementLoginAttempts();
            
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Reset login attempts on successful login
        await UserModel.updateOne(
            { _id: user._id },
            {
                $set: { 
                    loginAttempts: 0,
                    lastLogin: new Date()
                },
                $unset: { lockUntil: 1 }
            }
        );

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                avatar: user.avatar
            },
            token,
            message: "Login successful"
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message
        });
    }
};

// Verify Email
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await UserModel.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification token"
            });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Email verified successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Email verification failed",
            error: error.message
        });
    }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
        await user.save();

        // Send reset email
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        await transporter.sendMail({
            to: email,
            subject: 'Password Reset - SafarNama',
            html: `
                <h2>Password Reset Request</h2>
                <p>Click the link below to reset your password:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });

        res.status(200).json({
            success: true,
            message: "Password reset email sent"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to send reset email",
            error: error.message
        });
    }
};

// Reset Password
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await UserModel.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successful"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Password reset failed",
            error: error.message
        });
    }
};

export const logoutUser = async (req, res) => {
    try {
        // Here you can add any necessary cleanup on the server side
        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Logout failed"
        });
    }
};