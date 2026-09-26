import Express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import colors from "colors";
import cookieParser from "cookie-parser";
import path from "path";
import http from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import xss from "xss-clean";

// Import error handling middleware
import errorHandler from "./Middleware/errorHandler.js";
import AppError from "./utils/AppError.js";

//env convig
dotenv.config();

// Refuse to start with a broken configuration, and say exactly what is wrong.
{
  const { errors, warnings } = validateEnv();
  warnings.forEach((w) => console.warn(`[config] warning: ${w}`));
  if (errors.length > 0) {
    errors.forEach((e) => console.error(`[config] ERROR: ${e}`));
    process.exit(1);
  }
}

//Routes
import AuthRoute from "./Routes/authRoutes.js";
import adminRoutes from "./Routes/adminRoutes.js";
import UserRoute from "./Routes/UserRoute.js";
import profileRoutes from "./Routes/profileRoutes.js";
import ForumPostRoute from "./Routes/ForumPostRoute.js";
import bookingRoutes from "./Routes/bookingRoutes.js";
import feedbackRoutes from "./Routes/feedbackRoutes.js";
import contactRoutes from "./Routes/contactRoutes.js";
import paymentRoutes from "./Routes/paymentRoutes.js";
import blogRoutes from "./Routes/BlogRoutes.js";
import safargramRoutes from "./Routes/safargramRoutes.js";
import newsletterRoutes from "./Routes/newsletterRoutes.js";
import publicStatsRoutes from "./Routes/publicStatsRoutes.js";
import notificationRoutes from "./Routes/notificationRoutes.js";
import { configureNotifier } from "./services/notifier.js";
import tourRoute from "./Routes/tours.js";
import reviewRoute from "./Routes/reviews.js";
import destinationRoutes from "./Routes/destinationRoute.js";
import ecoGuideRoutes from "./Routes/ecoGuideRoutes.js";
import itineraryRoutes from "./Routes/itineraryRoutes.js";
import eventRoutes from "./Routes/eventRoutes.js";
import { createChatRouter } from "./Routes/chatRoutes.js";
import { attachChatSocket } from "./services/chatSocket.js";

import connectDB from "./config/db.js";
import { trustProxySetting, validateEnv } from "./config/env.js";
import { featureGate } from "./Middleware/featureGate.js";
import { createHealthRouter } from "./Routes/healthRoutes.js";
import mongoose from "mongoose";
//import DestinationsRouter from "./Routes/DestinationsRoute.js";

//rest object
const app = Express();

// Behind a host's proxy the real client IP comes from X-Forwarded-For; without this every
// visitor shares one IP and the per-IP rate limits would lock everybody out together.
app.set("trust proxy", trustProxySetting());

// Health check for the hosting platform / uptime monitor
app.use("/health", createHealthRouter({ isDbReady: () => mongoose.connection.readyState === 1 }));

//to serve images for public
app.use(Express.static("public"));
app.use("/images", Express.static("images"));
app.use("/uploads", Express.static("uploads"));

// =============================================================================
// SECURITY MIDDLEWARE (ADDED FOR PRODUCTION READINESS)
// =============================================================================

// 1. Set security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// 2. Rate limiting - General API protection
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // A single page load fires several API calls, so 100 per window was hit
  // almost immediately. Override with RATE_LIMIT_MAX if needed.
  max: Number(process.env.RATE_LIMIT_MAX) || 600,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Rate limiting - Auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login/signup attempts per 15 minutes
  message: {
    success: false,
    message:
      "Too many authentication attempts from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Apply general rate limiter to all API routes
app.use("/api", generalLimiter);

// 4. Body parser with size limits (prevent large payload attacks)
app.use(Express.json({ limit: "10mb" })); // Reduced from 40mb for security
app.use(Express.urlencoded({ limit: "10mb", extended: true }));

// 5. Data sanitization against NoSQL injection
app.use(mongoSanitize()); // Removes $ and . from request data

// 6. Data sanitization against XSS (Cross-Site Scripting)
app.use(xss()); // Cleans user input from malicious HTML

// 7. Prevent HTTP Parameter Pollution
app.use(
  hpp({
    whitelist: ["price", "rating", "duration"], // Allow duplicates for these params
  }),
);

// 8. CORS Configuration (Restricted to specific origins)
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];
const corsOptions = {
  origin: allowedOrigins,
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// 9. Cookie parser
app.use(cookieParser());

// 10. Logging (only in development)
if (process.env.DEV_MODE === "development") {
  app.use(morgan("dev"));
}

// HTTP server shared by Express and the chat sockets (socket.io needs the raw server)
const server = http.createServer(app);
const realtime = attachChatSocket(server, { origins: allowedOrigins });
configureNotifier(realtime); // lets likes/comments/follows push notifications live

//usage of routes
app.use("/api/v1/profile", profileRoutes);

// Apply stricter rate limiting to auth routes
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/signup", authLimiter);
app.use("/api/v1/auth/register", authLimiter);
app.use("/admin/login", authLimiter);
app.use("/api/v1/auth", AuthRoute);
app.use("/admin", adminRoutes);
app.use("/user", UserRoute);
app.use("/forum-posts", ForumPostRoute);
// Routes
// Booking and payment are not finished yet: switched off unless ENABLE_BOOKING=true
app.use("/api/v1/booking", featureGate("ENABLE_BOOKING", "Booking"), bookingRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/payment", featureGate("ENABLE_BOOKING", "Payment"), paymentRoutes);
app.use("/api/v1/tours", tourRoute);
app.use("/api/v1/review", reviewRoute);
//app.use('/destinations', DestinationsRouter);

//Destination routes
app.use("/api/v1/destinations", destinationRoutes);
app.use("/api/v1/eco-guides", ecoGuideRoutes);
app.use("/api/v1/itineraries", itineraryRoutes);
app.use("/api/v1/events", eventRoutes);
//Blog Routes
app.use("/api/v1/blog", blogRoutes);
app.use("/api/v1/safargram", safargramRoutes);
app.use("/api/v1/newsletter", newsletterRoutes);
app.use("/api/v1/public-stats", publicStatsRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/chat", createChatRouter({ realtime }));

// Handle undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware
app.use(errorHandler);

// Connect to MongoDB once (connectDB exits the process on failure), then listen
const PORT = process.env.PORT || 5000;
connectDB().then(() =>
  server.listen(PORT, () =>
    console.log(`Server Running on ${process.env.DEV_MODE} mode at ${PORT}`),
  ),
);
