import { body, validationResult, param } from "express-validator";
import rateLimit from "express-rate-limit";

// Validation rules for user registration
export const validateRegistration = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("First name can only contain letters and spaces"),

  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Last name can only contain letters and spaces"),

  body("username")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 and 20 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores")
    .custom((value) => {
      // Check for reserved usernames
      const reservedNames = [
        "admin",
        "root",
        "superuser",
        "administrator",
        "moderator",
        "support",
      ];
      if (reservedNames.includes(value.toLowerCase())) {
        throw new Error("Username is reserved");
      }
      return true;
    }),

  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage("Email cannot exceed 100 characters"),

  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
];

// Validation rules for user login
export const validateLogin = [
  body("userIdentifier")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Please provide a valid email or username"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be between 6 and 128 characters"),
];

// Validation rules for password reset
export const validatePasswordReset = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address"),
];

// Validation rules for new password
export const validateNewPassword = [
  param("token")
    .isHexadecimal()
    .isLength({ min: 64, max: 64 })
    .withMessage("Invalid reset token"),

  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
];

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = {};
    errors.array().forEach((error) => {
      formattedErrors[error.path] = error.msg;
    });

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
    });
  }

  next();
};

// Enhanced rate limiting for auth endpoints (relaxed for testing)
export const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Increased from 3 to 10 for testing
  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again after 15 minutes.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Rate limiting for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 password reset requests per hour
  message: {
    success: false,
    message: "Too many password reset requests. Please try again after 1 hour.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Sanitization middleware for text inputs
export const sanitizeInputs = (req, res, next) => {
  // Sanitize string inputs to prevent XSS
  const sanitizeString = (str) => {
    if (typeof str !== "string") return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "");
  };

  for (const key in req.body) {
    // Passwords must reach the controller untouched, otherwise a password that
    // happens to contain e.g. "on1=" would hash differently at login.
    if (key.toLowerCase().includes("password")) continue;
    if (typeof req.body[key] === "string") {
      req.body[key] = sanitizeString(req.body[key]);
    }
  }

  next();
};

// CSRF protection for state-changing operations (Origin/Referer allow-list)
export const csrfProtection = (req, res, next) => {
  const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
  ]
    .filter(Boolean)
    .map((url) => url.replace(/\/+$/, ""));
  const source = req.get("Origin") || req.get("Referer");

  if (req.method !== "GET" && req.method !== "HEAD") {
    let requestOrigin = null;
    try {
      requestOrigin = source ? new URL(source).origin : null;
    } catch {
      requestOrigin = null;
    }

    if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
      return res.status(403).json({
        success: false,
        message: "CSRF protection: Invalid origin",
      });
    }
  }

  next();
};
