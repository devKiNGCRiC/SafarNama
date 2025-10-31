import Express from "express";
import bodyParser from "body-parser";
import Mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import colors  from "colors";
import cookieParser from 'cookie-parser';
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import xss from "xss-clean";

// Import error handling middleware
import errorHandler from './Middleware/errorHandler.js';
import AppError from './utils/AppError.js';

//env convig
dotenv.config()


//Routes
import AuthRoute from "./Routes/authRoutes.js";
import adminRoutes from './Routes/adminRoutes.js';
import UserRoute from "./Routes/UserRoute.js";
import profileRoutes from './Routes/profileRoutes.js';
import PostRoute from "./Routes/PostRoute.js";
import ForumPostRoute from "./Routes/ForumPostRoute.js";
import UploadRoute from "./Routes/UploadRoute.js";
import bookingRoutes from './Routes/bookingRoutes.js';
import feedbackRoutes from './Routes/feedbackRoutes.js';
import contactRoutes from './Routes/contactRoutes.js';
import paymentRoutes from './Routes/paymentRoutes.js';
import blogRoutes from './Routes/BlogRoutes.js';
import tourRoute from './Routes/tours.js';
import reviewRoute from './Routes/reviews.js';
import destinationRoutes from './Routes/destinationRoute.js';
import ecoGuideRoutes from './Routes/ecoGuideRoutes.js';
import itineraryRoutes from './Routes/itineraryRoutes.js';
import eventRoutes from './Routes/eventRoutes.js';
import WebSocketService from './services/websocketService.js';

import connectDB from "./config/db.js";
//import DestinationsRouter from "./Routes/DestinationsRoute.js";



//mongodb connection
connectDB();

//rest object
const app = Express();

//to serve images for public
app.use(Express.static('public'));
app.use('/images', Express.static("images"));
app.use('/uploads', Express.static('uploads'));

// =============================================================================
// SECURITY MIDDLEWARE (ADDED FOR PRODUCTION READINESS)
// =============================================================================

// 1. Set security HTTP headers
app.use(helmet({
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
}));

// 2. Rate limiting - General API protection
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Rate limiting - Auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login/signup attempts per 15 minutes
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Apply general rate limiter to all API routes
app.use('/api', generalLimiter);

// 4. Body parser with size limits (prevent large payload attacks)
app.use(Express.json({ limit: '10mb' })); // Reduced from 40mb for security
app.use(bodyParser.json({ limit: '10mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// 5. Data sanitization against NoSQL injection
app.use(mongoSanitize()); // Removes $ and . from request data

// 6. Data sanitization against XSS (Cross-Site Scripting)
app.use(xss()); // Cleans user input from malicious HTML

// 7. Prevent HTTP Parameter Pollution
app.use(hpp({
  whitelist: ['price', 'rating', 'duration'] // Allow duplicates for these params
}));

// 8. CORS Configuration (Restricted to specific origin)
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 9. Cookie parser
app.use(cookieParser());

// 10. Logging (only in development)
if (process.env.DEV_MODE === 'development') {
  app.use(morgan('dev'));
}


//Port
const PORT = process.env.PORT || 5000;

Mongoose.connect(process.env.MONGO_DB)
  .then(() => app.listen(PORT , () => console.log(`Server Running on ${process.env.DEV_MODE} mode at ${PORT}`))
        ).catch((error) => console.log(error));


      // // Initialize WebSocket service
      // const wsService = new WebSocketService(server);

      // // Export wsService for use in other parts of the application
      // export { wsService };


  //usage of routes
  app.use('/api/v1/profile', profileRoutes);
  
  // Apply stricter rate limiting to auth routes
  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/signup', authLimiter);
  app.use('/api/v1/auth/register', authLimiter);
  app.use('/api/v1/auth', AuthRoute);
  app.use('/admin', adminRoutes);
  app.use('/user', UserRoute);
  app.use('/posts', PostRoute);
  app.use('/forum-posts', ForumPostRoute);
  app.use('/upload', UploadRoute);
  // Routes
  app.use('/api/v1/booking', bookingRoutes);
  app.use('/api/v1/feedback', feedbackRoutes);
  app.use('/api/v1/contact', contactRoutes);
  app.use('/api/v1/payment', paymentRoutes);  
  app.use("/api/v1/tours", tourRoute);
  app.use("/api/v1/review", reviewRoute);
  //app.use('/destinations', DestinationsRouter);
  
  //Destination routes
  app.use('/api/v1/destinations', destinationRoutes);
  app.use('/api/v1/eco-guides', ecoGuideRoutes);
  app.use('/api/v1/itineraries', itineraryRoutes);
  app.use('/api/v1/events' , eventRoutes);
  app.use('/api/v1/itineraries', itineraryRoutes);
  //Blog Routes
  app.use('/api/v1/blog', blogRoutes);

  // Handle undefined routes
app.all('*', (req, res, next) => {
      next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
    
// Error handling middleware
app.use(errorHandler);