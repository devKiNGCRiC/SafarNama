// validationMiddleWare.js
import { check, validationResult } from 'express-validator';

// Validation middleware
const validate = validations => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    };
};

// Registration validation rules
export const validateRegistration = validate([
    check('username')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters long'),
    check('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email'),
    check('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    check('firstname')
        .trim()
        .notEmpty()
        .withMessage('First name is required'),
    check('lastname')
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
]);

// Login validation rules
export const validateLogin = validate([
    check('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email'),
    check('password')
        .notEmpty()
        .withMessage('Password is required')
]);