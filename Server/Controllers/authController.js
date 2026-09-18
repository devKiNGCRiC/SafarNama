import UserModel from "../Models/userModel.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import {
  validatePasswordStrength,
  isPasswordCompromised,
  createSecureToken,
  logSecurityEvent,
  generatePasswordResetToken,
  hashToken,
} from "../utils/security.js";

// Create email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "7d",
  });
};

// Input validation helper
const validateRegistrationInput = (data) => {
  const errors = {};
  const { firstName, lastName, username, email, password } = data;

  // Reject non-string values (e.g. objects used for NoSQL injection)
  for (const [key, value] of Object.entries({
    firstName,
    lastName,
    username,
    email,
    password,
  })) {
    if (typeof value !== "string") {
      errors[key] = `${key} is required`;
    }
  }
  if (Object.keys(errors).length > 0) return errors;

  // Name validation
  if (!firstName || firstName.trim().length < 2) {
    errors.firstName = "First name must be at least 2 characters";
  }
  if (!lastName || lastName.trim().length < 2) {
    errors.lastName = "Last name must be at least 2 characters";
  }

  // Username validation
  if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    errors.username =
      "Username must be 3-20 characters and contain only letters, numbers, and underscores";
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.email = "Please provide a valid email address";
  }

  // Password validation
  if (!password || password.length < 8) {
    errors.password = "Password must be at least 8 characters long";
  } else {
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0]; // Show first error
    }
  }

  return errors;
};

// Register User
export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;
    const avatar =
      typeof req.body.avatar === "string" &&
      /^https?:\/\/\S{1,500}$/.test(req.body.avatar)
        ? req.body.avatar
        : "";

    // Input validation
    const validationErrors = validateRegistrationInput(req.body);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Check for compromised password
    if (await isPasswordCompromised(password)) {
      return res.status(400).json({
        success: false,
        message:
          "This password has been found in data breaches. Please choose a different password.",
        errors: { password: "Password has been compromised" },
      });
    }

    // Check if user exists
    const userExists = await UserModel.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message:
          userExists.email === email.toLowerCase()
            ? "Email already registered"
            : "Username already taken",
      });
    }

    // Generate email verification token
    // const verificationToken = crypto.randomBytes(32).toString('hex');
    // const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create new user
    const newUser = await UserModel.create({
      username,
      email: email.toLowerCase(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      isEmailVerified: true,
      avatar,
      // emailVerificationToken: verificationToken,
      // emailVerificationExpires: verificationExpires
    });

    // Generate token for the new user
    const token = createSecureToken(newUser._id, {
      userRole: newUser.role,
    });
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
      message: "Registration successful! Welcome to SafarNama.",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        avatar: newUser.avatar,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
      },
      token,
    });

    // Log security event
    logSecurityEvent("USER_REGISTERED", {
      userId: newUser._id,
      email: newUser.email,
      username: newUser.username,
      ip: req.ip,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

// Input validation helper for login
const validateLoginInput = (data) => {
  const errors = {};
  const { userIdentifier, password } = data;

  if (typeof userIdentifier !== "string" || userIdentifier.trim().length < 3) {
    errors.userIdentifier = "Please provide a valid email or username";
  }

  if (typeof password !== "string" || password.length < 6) {
    errors.password = "Password is required";
  }

  return errors;
};

// Login User
export const loginUser = async (req, res) => {
  try {
    const { userIdentifier, password } = req.body;

    // Input validation
    const validationErrors = validateLoginInput(req.body);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Find user by email or username
    const user = await UserModel.findOne({
      $or: [
        { email: userIdentifier.toLowerCase() },
        { username: userIdentifier },
      ],
    }).select("+password +loginAttempts +lockUntil +active");

    // Generic error message for security
    const genericErrorMessage = "Invalid credentials";

    if (!user) {
      return res.status(401).json({
        success: false,
        message: genericErrorMessage,
      });
    }

    // Check if user account is active
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated. Please contact support.",
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message:
          "Account is temporarily locked due to failed login attempts. Try again later.",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Log failed login attempt
      logSecurityEvent("USER_LOGIN_FAILED", {
        userIdentifier,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        reason: "Invalid password",
      });

      // Increment failed login attempts
      await user.incrementLoginAttempts();

      return res.status(401).json({
        success: false,
        message: genericErrorMessage,
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await UserModel.updateOne(
        { _id: user._id },
        {
          $set: {
            loginAttempts: 0,
            lastLogin: new Date(),
          },
          $unset: { lockUntil: 1 },
        },
      );
    } else {
      await UserModel.updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date() } },
      );
    }

    // Generate token
    const token = createSecureToken(user._id, {
      userRole: user.role,
    });

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
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
      token,
    });

    // Log successful login
    logSecurityEvent("USER_LOGIN_SUCCESS", {
      userId: user._id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// Verify Email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await UserModel.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Email verification failed",
    });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  // Same response whether or not the account exists, so the endpoint cannot
  // be used to find out which emails are registered.
  const genericResponse = {
    success: true,
    message:
      "If an account with that email exists, a password reset link has been sent.",
  };

  try {
    const email =
      typeof req.body.email === "string" ? req.body.email.toLowerCase() : "";
    const user = email ? await UserModel.findOne({ email }) : null;

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Only the SHA-256 hash is stored; the raw token goes in the email link.
    const { resetToken, hashedToken } = generatePasswordResetToken();
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await transporter.sendMail({
      to: user.email,
      subject: "Password Reset - SafarNama",
      html: `
                <h2>Password Reset Request</h2>
                <p>Click the link below to reset your password:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `,
    });

    res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send reset email",
    });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.errors[0],
        errors: { password: passwordValidation.errors[0] },
      });
    }

    const user = await UserModel.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // A reset also clears any lockout from failed login attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    // Here you can add any necessary cleanup on the server side
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Logout failed",
    });
  }
};
