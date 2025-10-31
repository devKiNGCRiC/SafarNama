import jwt from 'jsonwebtoken';

export const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '30d' } // Token expires in 30 days
    );
};