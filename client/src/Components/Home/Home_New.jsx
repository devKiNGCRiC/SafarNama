import React, { useState, useEffect } from "react";
import "./Home.scss";
import { Link } from "react-router-dom";

// Imported Assets
// Videos now hosted on Cloudinary (too large for GitHub)
const heroVideo =
  "https://res.cloudinary.com/dxyclus0f/video/upload/v1761919410/safarnama/videos/safarnama/videos/bg2-video.mp4";
import heroImage from "../../Assets/chandratal-lake.jpg"; // Fallback image

// Imported Icons
import { FiSearch, FiMapPin, FiCalendar, FiTrendingUp } from "react-icons/fi";
import { AiOutlineSwapRight } from "react-icons/ai";

// Imported images for featured destinations
import img1 from "../../Assets/chandratal-lake.jpg";
import img2 from "../../Assets/intro1.jpg";
import img3 from "../../Assets/nav.jpg";

// Importing Aos
import Aos from "aos";
import "aos/dist/aos.css";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [useVideo, setUseVideo] = useState(true);
  const [connectionSpeed, setConnectionSpeed] = useState("4g");

  // Check network speed and device capability
  useEffect(() => {
    Aos.init({ duration: 2000 });

    // Check connection type
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      setConnectionSpeed(effectiveType);

      // Use video only for fast connections (4g or better)
      if (
        effectiveType === "slow-2g" ||
        effectiveType === "2g" ||
        effectiveType === "3g"
      ) {
        setUseVideo(false);
      }
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      setUseVideo(false);
    }

    // Check device memory (if available)
    if (navigator.deviceMemory && navigator.deviceMemory < 4) {
      setUseVideo(false);
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/destinations?search=${encodeURIComponent(
        searchQuery
      )}`;
    }
  };

  return (
    <div className="Home">
      {/* Video/Image Background */}
      <div className="videoBg">
        {useVideo ? (
          <video
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={heroImage}
          />
        ) : (
          <img
            src={heroImage}
            alt="Safarnama Hero"
            className="hero-fallback-image"
          />
        )}
        <div className="video-overlay"></div>
      </div>

      <div className="sectionText">
        {/* Hero Content */}
        <div className="hero-content">
          {/* Welcome Badge */}
          <div className="welcome-badge" data-aos="fade-down">
            <span className="badge-icon">🇮🇳</span>
            <span>Welcome to India's Eco-Tourism Hub</span>
          </div>

          {/* Main Title with 3D effect */}
          <h1 data-aos="fade-up" className="hero-main-title">
            <span className="safar">Safar</span>
            <span className="nama">Nama</span>
          </h1>

          {/* Subtitle */}
          <h2 data-aos="fade-up" className="hero-subtitle">
            Your Gateway to{" "}
            <span className="highlight">Sustainable Adventures</span>
          </h2>

          {/* Hindi Tagline */}
          <p data-aos="fade-up" className="hindi-tagline">
            "यात्रा का आनंद लें - Every Journey Tells a Story"
          </p>

          {/* Search Bar with 3D effect */}
          <form
            className="hero-search-bar"
            onSubmit={handleSearch}
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <div className="search-container">
              <div className="search-input-wrapper">
                <FiMapPin className="search-icon location-icon" />
                <input
                  type="text"
                  placeholder='Where do you want to explore? (Try "Himalayas", "Kerala"...)'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <button type="submit" className="search-button">
                <FiSearch className="icon" />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* CTA Buttons with 3D effects */}
          <div className="hero-buttons" data-aos="fade-up" data-aos-delay="400">
            <Link to="/destinations">
              <button className="btn primary-hero-btn">
                <FiMapPin className="btn-icon" />
                Explore Destinations
                <AiOutlineSwapRight className="arrow-icon" />
              </button>
            </Link>
            <Link to="/tours">
              <button className="btn secondary-hero-btn">
                <FiCalendar className="btn-icon" />
                Plan Your Yatra
              </button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="hero-stats" data-aos="fade-up" data-aos-delay="600">
            <div className="stat-item">
              <FiMapPin className="stat-icon" />
              <div className="stat-content">
                <h3>500+</h3>
                <p>Destinations</p>
              </div>
            </div>
            <div className="stat-item">
              <FiTrendingUp className="stat-icon" />
              <div className="stat-content">
                <h3>10K+</h3>
                <p>Happy Travelers</p>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🌿</span>
              <div className="stat-content">
                <h3>100%</h3>
                <p>Eco-Friendly</p>
              </div>
            </div>
          </div>

          {/* Connection Info Badge (development only) */}
          {process.env.NODE_ENV === "development" && (
            <div className="dev-badge">
              {useVideo ? "🎥 Video Mode" : "🖼️ Image Mode"} | Speed:{" "}
              {connectionSpeed?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Featured Destinations */}
        <div className="popularPlaces" data-aos="fade-up">
          <div className="content">
            <h2>🌿 Featured Destinations</h2>
            <div className="images flex">
              <img src={img1} alt="Chandratal Lake" />
              <img src={img2} alt="Mountain Adventure" />
              <img src={img3} alt="Scenic Beauty" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
