import { http } from '../config/api';
// Get all reviews with optional limit
export const getAllReviews = (limit) => {
  const params = limit ? { limit } : {};
  return http.get("/api/v1/review", { params });
};

// Get reviews for a specific tour
export const getTourReviews = (tourId) => http.get(`/api/v1/review/${tourId}`);

// Create a new review (requires authentication)
export const createReview = (tourId, reviewData) =>
  http.post(`/api/v1/review/${tourId}`, reviewData);
