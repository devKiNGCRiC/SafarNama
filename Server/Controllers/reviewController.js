import mongoose from "mongoose";
import Tour from "../Models/TourModel.js";
import Review from "../Models/ReviewModel.js";

export const createReview = async (req, res) => {
  const tourId = req.params.tourId;

  if (!mongoose.isValidObjectId(tourId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid tour id" });
  }

  // The tour page sends `comment`; the homepage/API clients send `reviewText`
  const reviewText = req.body.reviewText ?? req.body.comment;
  const rating = Number(req.body.rating);

  if (typeof reviewText !== "string" || !reviewText.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Review text is required" });
  }
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    return res
      .status(400)
      .json({ success: false, message: "Rating must be between 0 and 5" });
  }

  try {
    // Reviewer name and tour come from the token / URL, never from the body
    const savedReview = await new Review({
      productId: tourId,
      username: req.user.username,
      reviewText: reviewText.trim(),
      rating,
    }).save();

    // after creating a new review now update the reviews array of the tour
    await Tour.findByIdAndUpdate(tourId, {
      $push: { reviews: savedReview._id },
    });

    res.status(200).json({
      success: true,
      message: "Review submitted",
      data: savedReview,
    });
  } catch (err) {
    console.error("createReview error:", err);
    res.status(500).json({ success: false, message: "failed to submit" });
  }
};

// Get all reviews (with optional limit for homepage)
export const getAllReviews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 0;
    const reviews = await Review.find()
      .populate("productId", "name")
      .sort({ createdAt: -1 })
      .limit(limit);

    const totalReviews = await Review.countDocuments();
    const avgRating = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      totalReviews,
      averageRating: avgRating[0]?.avgRating || 0,
      data: reviews,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch reviews" });
  }
};

// Get reviews for a specific tour
export const getTourReviews = async (req, res) => {
  const tourId = req.params.tourId;

  if (!mongoose.isValidObjectId(tourId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid tour id" });
  }

  try {
    const reviews = await Review.find({ productId: tourId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch tour reviews" });
  }
};
