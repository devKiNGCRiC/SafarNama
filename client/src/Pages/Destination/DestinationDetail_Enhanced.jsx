import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './DestinationDetail.scss';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';
import Footer from '../../Components/Footer/Footer';
import Loader from '../../Components/Loader/Loader';
import Aos from 'aos';
import 'aos/dist/aos.css';

// Importing Icons
import { 
  FiMapPin, FiCalendar, FiClock, FiUsers, FiTrendingUp,
  FiAward, FiHeart, FiShare2, FiBookmark, FiChevronDown,
  FiSun, FiCloud, FiDroplet, FiWind, FiAlertCircle,
  FiNavigation, FiPhone, FiMail, FiExternalLink, FiCamera,
  FiDollarSign, FiInfo, FiStar, FiThumbsUp, FiMessageCircle
} from 'react-icons/fi';
import { 
  MdRestaurant, MdDirectionsBike, MdLocalActivity, 
  MdEco, MdSecurity, FiLocalHospital, MdPeople,
  MdEventAvailable, MdAccessible, MdPlace, MdHotel,
  MdLocalTaxi, MdTrain, MdFlight, MdDirectionsBus,
  MdPhotoCameraFront, MdAttachMoney, MdLocationCity
} from 'react-icons/md';
import { 
  GiMountainClimbing, GiHiking, GiCampingTent, 
  GiForestCamp, GiMeditation, GiWallet, GiMoneyStack,
  GiCompass
} from 'react-icons/gi';
import { 
  BiRupee, BiDollar, BiTrendingUp, BiMap, BiVideo
} from 'react-icons/bi';
import { 
  AiOutlineSwapRight, AiFillStar, AiOutlineStar
} from 'react-icons/ai';
import { 
  BsCamera, BsImages, BsCameraVideo, BsShieldCheck
} from 'react-icons/bs';
import { 
  FaHotel, FaRegLightbulb, FaRoute, FaMapMarkedAlt
} from 'react-icons/fa';

// Configure Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ====================================
// HERO SECTION WITH FULL DATA
// ====================================
const HeroSection = ({ destination }) => {
  const [isSaved, setIsSaved] = useState(false);
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: destination.name,
        text: destination.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };
  
  const handleSave = () => {
    setIsSaved(!isSaved);
    // Add logic to save to user's wishlist
  };
  
  return (
    <section className="hero-section">
      <div className="hero-image-container">
        <img 
          src={destination.images?.[0] || '/placeholder.jpg'} 
          alt={destination.name} 
          className="hero-image"
        />
        <div className="hero-overlay"></div>
      </div>
      
      <div className="hero-content">
        <div className="hero-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/destinations">Destinations</Link>
          <span>/</span>
          <span>{destination.name}</span>
        </div>
        
        <h1 className="hero-title">{destination.name}</h1>
        
        <div className="hero-location">
          <FiMapPin />
          <span>{destination.address}</span>
        </div>

        {/* Rating & Category */}
        <div className="hero-meta">
          <div className="rating-display">
            {[...Array(5)].map((_, i) => (
              i < Math.floor(destination.rating || 0) ? 
                <AiFillStar key={i} className="star filled" /> : 
                <AiOutlineStar key={i} className="star" />
            ))}
            <span className="rating-text">{destination.rating ? destination.rating.toFixed(1) : 'N/A'}</span>
            <span className="review-count">({destination.reviews?.length || 0} reviews)</span>
          </div>
          
          {destination.category && destination.category.length > 0 && (
            <div className="category-tags">
              {destination.category.map((cat, index) => (
                <span key={index} className="category-tag">{cat}</span>
              ))}
            </div>
          )}
        </div>
        
        <div className="hero-actions">
          <button 
            onClick={handleSave} 
            className={`action-btn ${isSaved ? 'saved' : ''}`}
          >
            {isSaved ? <FiHeart className="filled" /> : <FiBookmark />}
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
          
          <button onClick={handleShare} className="action-btn">
            <FiShare2 />
            <span>Share</span>
          </button>
        </div>
        
        <div className="scroll-indicator">
          <span>Scroll to explore</span>
          <FiChevronDown />
        </div>
      </div>
    </section>
  );
};

// ====================================
// ENHANCED QUICK INFO WITH ALL DATA
// ====================================
const QuickInfoSection = ({ destination }) => {
  const quickStats = [
    { 
      icon: <FiCalendar />, 
      label: 'Best Time', 
      value: destination.bestTimeToVisit?.season || destination.seasonality?.peakSeason?.months?.slice(0, 2).join(', ') || 'All Year' 
    },
    { 
      icon: <FiUsers />, 
      label: 'Popularity', 
      value: destination.stats?.popularityScore ? `${destination.stats.popularityScore}/10` : 'High' 
    },
    { 
      icon: <BiRupee />, 
      label: 'Entry Fee', 
      value: destination.pricing?.entryFee || 'Free Entry' 
    },
    { 
      icon: <FiClock />, 
      label: 'Duration', 
      value: destination.stats?.averageStayDuration || '2-4 hours' 
    },
    {
      icon: <FiSun />,
      label: 'Climate',
      value: destination.weather?.climate || 'Pleasant'
    },
    {
      icon: <MdAccessible />,
      label: 'Accessibility',
      value: destination.accessibility?.wheelchairAccessible ? 'Accessible' : 'Limited'
    }
  ];

  return (
    <section className="quick-info-section">
      <div className="container">
        <div className="quick-info-grid">
          {quickStats.map((stat, index) => (
            <div 
              key={index} 
              className="info-card"
              data-aos="fade-up"
              data-aos-delay={index * 50}
            >
              <div className="info-icon">{stat.icon}</div>
              <div className="info-content">
                <span className="info-label">{stat.label}</span>
                <span className="info-value">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ====================================
// ABOUTSECTION WITH FULL DETAILS
// ====================================
const AboutSection = ({ destination }) => {
  return (
    <section className="about-section">
      <div className="container">
        <div className="section-header" data-aos="fade-up">
          <h2 className="section-title">
            About <span className="title-accent">{destination.name}</span>
          </h2>
          <p className="section-subtitle">Discover the essence of this magnificent place</p>
        </div>

        <div className="about-content">
          <div className="about-main" data-aos="fade-right">
            <div className="about-text">
              <h3>Overview</h3>
              <p>{destination.description}</p>
            </div>
          </div>

          <div className="about-grid">
            {destination.history && (
              <div className="about-card" data-aos="fade-up">
                <div className="about-icon">📜</div>
                <h3>History & Heritage</h3>
                <p>{destination.history}</p>
              </div>
            )}

            {destination.significance && (
              <div className="about-card" data-aos="fade-up" data-aos-delay="100">
                <div className="about-icon">⭐</div>
                <h3>Significance</h3>
                <p>{destination.significance}</p>
              </div>
            )}

            {destination.category && destination.category.length > 0 && (
              <div className="about-card" data-aos="fade-up" data-aos-delay="200">
                <div className="about-icon">🏷️</div>
                <h3>Categories</h3>
                <div className="category-list">
                  {destination.category.map((cat, index) => (
                    <span key={index} className="category-badge">{cat}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {destination.images && destination.images.length > 1 && (
            <div className="destination-gallery" data-aos="fade-up">
              <h3>Photo Gallery</h3>
              <div className="gallery-grid">
                {destination.images.slice(1, 7).map((image, index) => (
                  <div key={index} className="gallery-item">
                    <img src={image} alt={`${destination.name} ${index + 1}`} />
                    <div className="gallery-overlay">
                      <BsCamera />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// ====================================
// NEW: RATINGS & REVIEWS SECTION
// ====================================
const RatingsReviewsSection = ({ destination }) => {
  if (!destination.reviews || destination.reviews.length === 0) return null;

  const avgRating = destination.rating || 0;
  
  return (
    <section className="ratings-reviews-section">
      <div className="container">
        <div className="section-header" data-aos="fade-up">
          <h2 className="section-title">
            <span className="title-accent">Ratings</span> & Reviews
          </h2>
          <p className="section-subtitle">What travelers are saying</p>
        </div>

        <div className="ratings-overview" data-aos="fade-up">
          <div className="rating-summary">
            <div className="rating-score">{avgRating.toFixed(1)}</div>
            <div className="rating-stars">
              {[...Array(5)].map((_, i) => (
                i < Math.floor(avgRating) ? 
                  <AiFillStar key={i} className="star filled" /> : 
                  <AiOutlineStar key={i} className="star" />
              ))}
            </div>
            <p className="rating-count">Based on {destination.reviews.length} reviews</p>
          </div>

          <div className="reviews-list">
            {destination.reviews.slice(0, 3).map((review, index) => (
              <div key={index} className="review-card" data-aos="fade-left" data-aos-delay={index * 100}>
                <div className="review-header">
                  <div className="reviewer-info">
                    <div className="reviewer-avatar">
                      {review.userId?.name?.[0] || 'U'}
                    </div>
                    <div>
                      <h4>{review.userId?.name || 'Anonymous'}</h4>
                      <span className="review-date">
                        {review.visitDate ? new Date(review.visitDate).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>
                  <div className="review-rating">
                    {[...Array(5)].map((_, i) => (
                      i < review.rating ? 
                        <AiFillStar key={i} className="star small filled" /> : 
                        <AiOutlineStar key={i} className="star small" />
                    ))}
                  </div>
                </div>
                <p className="review-comment">{review.comment}</p>
                <div className="review-actions">
                  <button className="review-action">
                    <FiThumbsUp /> Helpful ({review.helpful || 0})
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Continue in next part... (This file is getting large)
// I'll create the remaining sections in the actual file replacement

