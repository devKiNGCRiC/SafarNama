import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from "../Controllers/authController.js";

import {
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validateNewPassword,
  handleValidationErrors,
  strictAuthLimiter,
  passwordResetLimiter,
  sanitizeInputs,
  csrfProtection,
} from "../Middleware/validationMiddleWare.js";

const router = express.Router();

// Auth routes with enhanced security
// Registration is fully validated inside registerUser (names, username, email,
// password strength). The express-validator chain is not used here because its
// stricter name rules and email normalisation would disagree with login.
router.post("/register", strictAuthLimiter, sanitizeInputs, registerUser);

router.post(
  "/login",
  strictAuthLimiter,
  sanitizeInputs,
  csrfProtection,
  validateLogin,
  handleValidationErrors,
  loginUser,
);

router.post("/logout", logoutUser);

router.get("/verify-email/:token", verifyEmail);

router.post(
  "/forgot-password",
  passwordResetLimiter,
  sanitizeInputs,
  csrfProtection,
  validatePasswordReset,
  handleValidationErrors,
  forgotPassword,
);

router.post(
  "/reset-password/:token",
  sanitizeInputs,
  csrfProtection,
  validateNewPassword,
  handleValidationErrors,
  resetPassword,
);

export default router;
