import crypto from "crypto";
import jwt from "jsonwebtoken";

// Generate secure random token
export const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

// Generate password reset token
export const generatePasswordResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash the token for storage in database
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  return {
    resetToken, // Send this to user
    hashedToken, // Store this in database
  };
};

// Hash password reset token for comparison
export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Generate email verification token
export const generateEmailVerificationToken = () => {
  return generateSecureToken(32);
};

// Validate strong password
export const validatePasswordStrength = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (password.length > 128) {
    errors.push("Password cannot exceed 128 characters");
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push(
      "Password must contain at least one special character (@$!%*?&)",
    );
  }

  // Check for common weak passwords
  const weakPasswords = [
    "password",
    "password123",
    "123456",
    "123456789",
    "qwerty",
    "abc123",
    "password1",
    "admin",
    "welcome",
    "login",
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push("Password is too common and easily guessable");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Check if password has been compromised (basic check)
export const isPasswordCompromised = async (password) => {
  // This would ideally check against HaveIBeenPwned API
  // For now, just basic weak password detection
  const commonPasswords = [
    "password",
    "123456",
    "123456789",
    "qwerty",
    "password123",
    "abc123",
    "password1",
    "admin123",
    "welcome123",
    "letmein",
    "monkey",
    "1234567890",
    "dragon",
    "sunshine",
    "princess",
  ];

  return commonPasswords.includes(password.toLowerCase());
};

// Sanitize user input to prevent XSS
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove on* event handlers
    .trim();
};

// Generate secure session ID
export const generateSessionId = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Create secure JWT token with additional claims
export const createSecureToken = (userId, options = {}) => {
  const payload = {
    id: userId,
    iat: Math.floor(Date.now() / 1000),
    jti: generateSessionId(), // Unique token identifier
    ...options,
  };

  return jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    expiresIn: options.expiresIn || "7d",
    issuer: "SafarNama",
    audience: "SafarNama-Users",
  });
};

// Verify JWT token with additional security checks
export const verifySecureToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY, {
      issuer: "SafarNama",
      audience: "SafarNama-Users",
    });

    return {
      valid: true,
      decoded,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
};

// Check if request is from allowed origin
export const isAllowedOrigin = (origin) => {
  const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
  ];

  return allowedOrigins.some((allowed) => origin && origin.startsWith(allowed));
};

// Rate limiting helper
export const createRateLimitKey = (req, identifier) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get("User-Agent") || "unknown";

  return `${identifier}:${ip}:${Buffer.from(userAgent).toString("base64").slice(0, 10)}`;
};

// Log security events
export const logSecurityEvent = (event, details = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    details,
    severity: details.severity || "info",
  };

  // In production, this should write to a secure log file or monitoring service
  console.log(`[SECURITY] ${timestamp} - ${event}:`, details);

  return logEntry;
};

export default {
  generateSecureToken,
  generatePasswordResetToken,
  hashToken,
  generateEmailVerificationToken,
  validatePasswordStrength,
  isPasswordCompromised,
  sanitizeInput,
  generateSessionId,
  createSecureToken,
  verifySecureToken,
  isAllowedOrigin,
  createRateLimitKey,
  logSecurityEvent,
};
