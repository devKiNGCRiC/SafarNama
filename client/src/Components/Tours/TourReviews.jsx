// src/Components/Tours/TourReviews.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, ThumbsUp, Filter } from 'lucide-react';
import './TourReviews.css';

const TourReviews = ({ tourId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState({
    rating: 0,
    comment: '',
    photos: []
  });
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    fetchReviews();
  }, [tourId, filter, sort]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/v1/tours/${tourId}/reviews`, {
        params: { filter, sort }
      });
      
      if (response.data.success) {
        setReviews(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (rating) => {
    setUserReview(prev => ({ ...prev, rating }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Please login to submit a review');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('rating', userReview.rating);
      formData.append('comment', userReview.comment);
      userReview.photos.forEach(photo => {
        formData.append('photos', photo);
      });

      const response = await axios.post(
        `http://localhost:5000/api/v1/tours/${tourId}/reviews`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        alert('Review submitted successfully!');
        setUserReview({ rating: 0, comment: '', photos: [] });
        fetchReviews();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit review');
    }
  };

  const renderRatingStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star 
        key={index}
        size={20}
        className={index < rating ? 'star-filled' : 'star-empty'}
      />
    ));
  };

  if (loading) return <div className="reviews-loading">Loading reviews...</div>;

  return (
    <div className="tour-reviews">
      <div className="reviews-header">
        <h2>Tour Reviews</h2>
        <div className="reviews-filters">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Reviews</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars & Up</option>
            <option value="3">3 Stars & Up</option>
          </select>
          <select 
            value={sort} 
            onChange={(e) => setSort(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      </div>

      {/* Review Form */}
      <form onSubmit={handleSubmitReview} className="review-form">
        <h3>Write a Review</h3>
        <div className="rating-input">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={24}
              onClick={() => handleRatingClick(star)}
              className={star <= userReview.rating ? 'star-filled' : 'star-empty'}
            />
          ))}
        </div>
        <textarea
          value={userReview.comment}
          onChange={(e) => setUserReview(prev => ({ ...prev, comment: e.target.value }))}
          placeholder="Share your experience..."
          required
        />
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setUserReview(prev => ({ ...prev, photos: Array.from(e.target.files) }))}
        />
        <button type="submit" className="submit-review-btn">Submit Review</button>
      </form>

      {/* Reviews List */}
      <div className="reviews-list">
        {reviews.map(review => (
          <div key={review._id} className="review-card">
            <div className="review-header">
              <div className="reviewer-info">
                <img src={review.user.avatar || '/default-avatar.png'} alt="Reviewer" />
                <div>
                  <h4>{review.user.name}</h4>
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="review-rating">
                {renderRatingStars(review.rating)}
              </div>
            </div>
            <p className="review-comment">{review.comment}</p>
            {review.photos?.length > 0 && (
              <div className="review-photos">
                {review.photos.map((photo, index) => (
                  <img key={index} src={photo} alt={`Review ${index + 1}`} />
                ))}
              </div>
            )}
            <div className="review-footer">
              <button className="helpful-btn">
                <ThumbsUp size={16} />
                Helpful ({review.helpfulCount})
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TourReviews;