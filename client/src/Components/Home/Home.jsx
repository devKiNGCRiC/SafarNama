import React, { useState, useEffect, useMemo } from "react";
import "./Home.scss";
import { Link } from "react-router-dom";

// Imported Assets
// Videos now hosted on Cloudinary (too large for GitHub)
const heroVideo =
  "https://res.cloudinary.com/dxyclus0f/video/upload/q_auto:low,f_auto/v1761919410/safarnama/videos/safarnama/videos/bg2-video.mp4";
import heroImage from "../../Assets/chandratal-lake.jpg"; // Fallback image

// Imported Icons
import { FiSearch, FiMapPin, FiCalendar, FiTrendingUp } from "react-icons/fi";
import { AiOutlineSwapRight } from "react-icons/ai";

// Imported images for featured destinations
import img1 from "../../Assets/chandratal-lake.jpg";
import img2 from "../../Assets/intro1.jpg";
import img3 from "../../Assets/nav.jpg";

// Lazy load AOS only when needed
let Aos;
const loadAos = async () => {
  if (!Aos) {
    Aos = (await import("aos")).default;
    await import("aos/dist/aos.css");
  }
  return Aos;
};

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [useVideo, setUseVideo] = useState(false); // Start with image, load video after
  const [connectionSpeed, setConnectionSpeed] = useState("4g");
  const [aosLoaded, setAosLoaded] = useState(false);

  // Check network speed and device capability
  useEffect(() => {
    // Load AOS animations asynchronously
    loadAos().then((AosModule) => {
      AosModule.init({
        duration: 1000, // Reduced from 2000ms
        once: true, // Animate only once
        disable: "mobile", // Disable on mobile for better performance
      });
      setAosLoaded(true);
    });

    // Defer video loading
    const timer = setTimeout(() => {
      // Check connection type
      const connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;
      let shouldUseVideo = true;

      if (connection) {
        const effectiveType = connection.effectiveType;
        setConnectionSpeed(effectiveType);

        // Use video only for fast connections (4g or better)
        if (
          effectiveType === "slow-2g" ||
          effectiveType === "2g" ||
          effectiveType === "3g"
        ) {
          shouldUseVideo = false;
        }
      }

      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (prefersReducedMotion) {
        shouldUseVideo = false;
      }

      // Check device memory (if available)
      if (navigator.deviceMemory && navigator.deviceMemory < 4) {
        shouldUseVideo = false;
      }

      setUseVideo(shouldUseVideo);
    }, 500); // Delay video loading by 500ms

    return () => clearTimeout(timer);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to destinations with location parameter for filtering
      window.location.href = `/destinations?location=${encodeURIComponent(
        searchQuery,
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
            preload="none"
            loading="lazy"
            poster={heroImage}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <img
            src={heroImage}
            alt="Safarnama Hero"
            className="hero-fallback-image"
            loading="eager"
          />
        )}
        <div className="video-overlay"></div>
      </div>

      <div className="sectionText">
        {/* Hero Banner */}
        <div className="hero-banner" data-aos="zoom-in">
          <div className="hero-badge">🌿 Eco-Tourism Pioneer</div>

          {/* Brand Name Only */}
          <h1 className="hero-brand-name">
            <span className="safar">Safar</span>
            <span className="nama">Nama</span>
          </h1>

          <p className="hero-tagline">
            <span className="hindi">यात्रा का आनंद लें</span>
            <span className="separator">|</span>
            <span className="english">Journey with Purpose</span>
          </p>
        </div>

        {/* Search Experience */}
        <div
          className="search-experience"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <h2 className="search-heading">Where will your adventure begin?</h2>
          <form className="search-container" onSubmit={handleSearch}>
            <div className="search-bar">
              <FiMapPin className="search-icon" />
              <input
                type="text"
                placeholder='Try "Himalayan Monasteries" or "Kerala Backwaters"...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <FiSearch className="icon" />
                <span className="btn-text">Search</span>
              </button>
            </div>
          </form>

          {/* Popular Searches */}
          <div className="popular-tags">
            <button onClick={() => setSearchQuery("Himalayas")} className="tag">
              🏔️ Himalayas
            </button>
            <button onClick={() => setSearchQuery("Kerala")} className="tag">
              🌴 Kerala Backwaters
            </button>
            <button onClick={() => setSearchQuery("Rajasthan")} className="tag">
              🏰 Rajasthan Forts
            </button>
            <button onClick={() => setSearchQuery("Goa")} className="tag">
              🏖️ Goa Beaches
            </button>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="mission-box" data-aos="fade-up" data-aos-delay="200">
          <p className="mission-text">
            Experience the <strong>soul of Incredible India</strong> through
            sustainable travel. From the snow-capped Himalayas to the backwaters
            of Kerala, every journey tells a story.{" "}
            <span className="highlight">What's yours?</span>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="action-cards" data-aos="fade-up" data-aos-delay="300">
          <Link to="/destinations" className="action-card explore">
            <div className="card-icon">🗺️</div>
            <h3>Explore Destinations</h3>
            <p>500+ eco-friendly spots across India</p>
            <span className="card-arrow">→</span>
          </Link>
          <Link to="/tours" className="action-card plan">
            <div className="card-icon">📅</div>
            <h3>Plan Your Yatra</h3>
            <p>Customized sustainable travel packages</p>
            <span className="card-arrow">→</span>
          </Link>
          <Link to="/destinations" className="action-card discover">
            <div className="card-icon">✨</div>
            <h3>Hidden Gems</h3>
            <p>Off-beat places waiting to be explored</p>
            <span className="card-arrow">→</span>
          </Link>
        </div>

        {/* Impact Stats */}
        <div className="impact-stats" data-aos="fade-up" data-aos-delay="400">
          <div className="stat-card">
            <div className="stat-number">500+</div>
            <div className="stat-label">Destinations</div>
            <div className="stat-desc">Across 28 States</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Happy Travelers</div>
            <div className="stat-desc">Stories Shared</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">100%</div>
            <div className="stat-label">Eco-Friendly</div>
            <div className="stat-desc">Carbon Neutral</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">50+</div>
            <div className="stat-label">Local Guides</div>
            <div className="stat-desc">Community First</div>
          </div>
        </div>

        {/* Popular Activities */}
        <div
          className="activities-section"
          data-aos="fade-up"
          data-aos-delay="450"
        >
          <h2 className="section-heading">Adventure Awaits</h2>
          <div className="activities-grid">
            <Link
              to="/destinations?activity=Trekking"
              className="activity-card"
            >
              <div className="activity-icon">🥾</div>
              <h3>Trekking</h3>
              <p>50+ Trails</p>
            </Link>
            <Link
              to="/destinations?activity=River Rafting"
              className="activity-card"
            >
              <div className="activity-icon">🚣</div>
              <h3>River Rafting</h3>
              <p>15+ Rapids</p>
            </Link>
            <Link
              to="/destinations?activity=Wildlife Safari"
              className="activity-card"
            >
              <div className="activity-icon">🦁</div>
              <h3>Wildlife Safari</h3>
              <p>20+ Parks</p>
            </Link>
            <Link to="/destinations?activity=Camping" className="activity-card">
              <div className="activity-icon">🏕️</div>
              <h3>Camping</h3>
              <p>100+ Sites</p>
            </Link>
            <Link
              to="/destinations?activity=Paragliding"
              className="activity-card"
            >
              <div className="activity-icon">🪂</div>
              <h3>Paragliding</h3>
              <p>10+ Spots</p>
            </Link>
            <Link
              to="/destinations?activity=Scuba Diving"
              className="activity-card"
            >
              <div className="activity-icon">🤿</div>
              <h3>Scuba Diving</h3>
              <p>8+ Islands</p>
            </Link>
          </div>
        </div>

        {/* Featured Collection */}
        <div
          className="featured-collection"
          data-aos="fade-up"
          data-aos-delay="500"
        >
          <div className="collection-header">
            <h2 className="collection-title">Trending This Season</h2>
            <Link to="/destinations" className="view-all">
              View All →
            </Link>
          </div>
          <div className="destinations-grid">
            <Link
              to="/destinations?location=Himachal Pradesh"
              className="destination-card"
            >
              <div className="card-image">
                <img src={img1} alt="Chandratal Lake" />
                <div className="card-badge">🏔️ Mountains</div>
              </div>
              <div className="card-info">
                <h3>Chandratal Lake</h3>
                <p className="location">📍 Himachal Pradesh</p>
                <div className="card-meta">
                  <span className="difficulty">🥾 Moderate</span>
                  <span className="season">☀️ Summer</span>
                </div>
              </div>
            </Link>
            <Link
              to="/destinations?location=Uttarakhand"
              className="destination-card"
            >
              <div className="card-image">
                <img src={img2} alt="Mountain Adventure" />
                <div className="card-badge">⛰️ Trekking</div>
              </div>
              <div className="card-info">
                <h3>Valley of Flowers</h3>
                <p className="location">📍 Uttarakhand</p>
                <div className="card-meta">
                  <span className="difficulty">🥾 Easy</span>
                  <span className="season">🌸 Monsoon</span>
                </div>
              </div>
            </Link>
            <Link
              to="/destinations?location=Kashmir"
              className="destination-card"
            >
              <div className="card-image">
                <img src={img3} alt="Scenic Beauty" />
                <div className="card-badge">🌄 Scenic</div>
              </div>
              <div className="card-info">
                <h3>Kashmir Valley</h3>
                <p className="location">📍 Jammu & Kashmir</p>
                <div className="card-meta">
                  <span className="difficulty">🥾 Easy</span>
                  <span className="season">🍂 Autumn</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Dev Badge */}
      {process.env.NODE_ENV === "development" && (
        <div className="dev-badge">
          {useVideo ? "🎥" : "🖼️"} {connectionSpeed?.toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default Home;
