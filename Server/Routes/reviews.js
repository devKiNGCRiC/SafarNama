import express from "express";
import {
  createReview,
  getAllReviews,
  getTourReviews,
} from "./../Controllers/reviewController.js";
import { verifyToken } from "../Middleware/authMiddleware.js";

const router = express.Router();

// Get all reviews (homepage featured reviews)
router.get("/", getAllReviews);

// Get reviews for specific tour
router.get("/:tourId", getTourReviews);

// Create a review (requires authentication)
router.post("/:tourId", verifyToken, createReview);

export default router;
