import passport from 'passport';
import UserModel from '../Models/userModel.js';
import { generateToken } from '../utils/jwtHelper.js';
import axios from 'axios';

export const googleAuth = async (req, res) => {
    try {
        const { token } = req.body;
        // Verify token with Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const { email, name, picture } = ticket.getPayload();

        // Find or create user
        let user = await UserModel.findOne({ email });
        if (!user) {
            user = await UserModel.create({
                email,
                username: email.split('@')[0],
                firstName: name.split(' ')[0],
                lastName: name.split(' ')[1] || '',
                avatar: picture,
                isEmailVerified: true,
                authProvider: 'google'
            });
        }

        const jwtToken = generateToken(user._id);

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar
            },
            token: jwtToken
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ success: false, message: 'Google authentication failed' });
    }
};

export const facebookAuth = async (req, res) => {
    try {
        const { accessToken } = req.body;
        
        // Get user data from Facebook
        const response = await axios.get(
            `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
        );

        const { email, name, picture } = response.data;

        // Find or create user
        let user = await UserModel.findOne({ email });
        if (!user) {
            user = await UserModel.create({
                email,
                username: email.split('@')[0],
                firstName: name.split(' ')[0],
                lastName: name.split(' ')[1] || '',
                avatar: picture?.data?.url,
                isEmailVerified: true,
                authProvider: 'facebook'
            });
        }

        const jwtToken = generateToken(user._id);

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar
            },
            token: jwtToken
        });
    } catch (error) {
        console.error('Facebook auth error:', error);
        res.status(500).json({ success: false, message: 'Facebook authentication failed' });
    }
};