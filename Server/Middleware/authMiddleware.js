import jwt from "jsonwebtoken";
import UserModel from "../Models/userModel.js";

// Verify Token Middleware
export const verifyToken = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No authentication token, access denied",
      });
    }

    // Remove Bearer from token if present
    if (token.startsWith("Bearer ")) {
      token = token.slice(7);
    }

    // Verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Get user from token
    const user = await UserModel.findById(verified.id).select(
      "-password +active",
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user changed password after the token was issued
    if (user.changedPasswordAfter && user.changedPasswordAfter(verified.iat)) {
      return res.status(401).json({
        success: false,
        message: "User recently changed password. Please log in again.",
      });
    }

    if (!user.active) {
      return res.status(401).json({
        success: false,
        message: "User account is deactivated",
      });
    }

    // Check account status
    if (user.accountStatus === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Account has been suspended. Please contact support.",
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

// Admin Authorization Middleware
export const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Admin authorization failed",
    });
  }
};

// Email Verification Check Middleware
export const isEmailVerified = async (req, res, next) => {
  try {
    if (!req.user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Email verification check failed",
    });
  }
};

// Allow the request only if the authenticated user owns the resource
// (their id equals `req.params[paramName]`) or is an admin.
export const isSelfOrAdmin =
  (paramName = "id") =>
  (req, res, next) => {
    if (
      req.user &&
      (req.user.role === "admin" ||
        req.user._id.toString() === req.params[paramName])
    ) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: "You can only access your own account",
    });
  };
