import React, { useEffect, useRef, useState } from "react";
import "./Review.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { getAllReviews } from "../../api/reviewRequest";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { ensureAos } from "../../config/aos";

// Imported icons
import {
  FaStar,
  FaUserCircle,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

const Review = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    ensureAos();
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await getAllReviews(10); // Get latest 10 reviews
      if (response.data.success && response.data.data.length > 0) {
        setReviews(response.data.data);
        setStats({
          totalReviews: response.data.totalReviews,
          averageRating: response.data.averageRating,
        });
      } else {
        setReviews([]); // no real reviews yet: the section stays hidden
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };


  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        className={index < Math.floor(rating) ? "icon filled" : "icon"}
      />
    ));
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const options = { year: "numeric", month: "short" };
    return d.toLocaleDateString("en-US", options);
  };

  if (loading) {
    return (
      <div className="reviews section container">
        <div className="loading-state" data-aos="fade-up">
          <div className="spinner"></div>
          <p>Loading reviews...</p>
        </div>
      </div>
    );
  }

  // Nothing to show until real travellers have left reviews (no invented testimonials)
  if (reviews.length === 0) return null;

  return (
    <div className="reviews section container">
      <div className="secContainer">
        {/* Header Section */}
        <div className="reviewsHeader" data-aos="fade-up">
          <span className="redText">TRAVELER TESTIMONIALS</span>
          <h2 className="mainTitle">
            Real Stories From Our{" "}
            <span className="highlight">Incredible Journey</span>
          </h2>
          <p className="subtitle">
            Discover what makes Safarnama special through the eyes of our
            travelers
          </p>
        </div>

        {/* Stats Section */}
        <div className="reviewStats" data-aos="fade-up" data-aos-delay="100">
          <div className="statCard">
            <div className="statNumber">{stats.averageRating.toFixed(1)}</div>
            <div className="statLabel">Average Rating</div>
            <div className="stars">{renderStars(stats.averageRating)}</div>
          </div>
          <div className="statCard">
            <div className="statNumber">{stats.totalReviews}</div>
            <div className="statLabel">{stats.totalReviews === 1 ? "Review" : "Reviews"}</div>
          </div>
        </div>

        {/* Reviews Carousel */}
        <div
          className="reviewsCarousel"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          {reviews.length > 0 ? (
            <>
              <button
                className="review-nav prev"
                ref={prevRef}
                aria-label="Previous testimonial"
              >
                <FaChevronLeft />
              </button>
              <button
                className="review-nav next"
                ref={nextRef}
                aria-label="Next testimonial"
              >
                <FaChevronRight />
              </button>
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={24}
                slidesPerView={1}
                centeredSlides={false}
                autoplay={{
                  delay: 5000,
                  disableOnInteraction: false,
                }}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                }}
                navigation={{
                  prevEl: prevRef.current,
                  nextEl: nextRef.current,
                }}
                onBeforeInit={(swiper) => {
                  swiper.params.navigation.prevEl = prevRef.current;
                  swiper.params.navigation.nextEl = nextRef.current;
                }}
                loop={reviews.length > 1}
                breakpoints={{
                  640: {
                    slidesPerView: 1,
                    spaceBetween: 20,
                  },
                  768: {
                    slidesPerView: 2,
                    spaceBetween: 24,
                  },
                  1024: {
                    slidesPerView: 2,
                    spaceBetween: 30,
                  },
                }}
                className="reviewSwiper"
              >
                {reviews.map((review) => (
                  <SwiperSlide key={review._id}>
                    <div className="reviewCard glass-card">
                      <div className="reviewHeader">
                        <div className="userInfo">
                          <div className="userAvatar">
                            <FaUserCircle />
                          </div>
                          <div className="userDetails">
                            <h4 className="userName">{review.username}</h4>
                            {(review.productId?.name ||
                              review.productId?.tourName) && (
                              <span className="tourName">
                                {review.productId.name ||
                                  review.productId.tourName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="reviewRating">
                          <div className="stars">
                            {renderStars(review.rating)}
                          </div>
                          <span className="ratingNumber">
                            {review.rating}.0
                          </span>
                        </div>
                      </div>

                      <div className="reviewBody">
                        <p className="reviewText">{review.reviewText}</p>
                      </div>

                      <div className="reviewFooter">
                        <span className="reviewDate">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </>
          ) : (
            <div className="noReviews">
              <p>No reviews yet. Be the first to share your experience!</p>
            </div>
          )}
        </div>

        {/* Trust Badges */}
        <div className="trustBadges" data-aos="fade-up" data-aos-delay="300">
          <div className="badge">
            <FaStar className="badgeIcon" />
            <span>{stats.averageRating.toFixed(1)} average rating</span>
          </div>
          <div className="badge">
            <FaUserCircle className="badgeIcon" />
            <span>Written by real travellers</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Review;
