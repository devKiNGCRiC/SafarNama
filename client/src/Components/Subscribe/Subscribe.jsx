import React, { useEffect, useState } from "react";
import "./Subscribe.scss";

//Importing Aos
import Aos from "aos";
import "aos/dist/aos.css";

//Import icons
import { MdEmail, MdNotifications } from "react-icons/md";
import { FaBell, FaCheckCircle } from "react-icons/fa";

const Subscribe = () => {
  const [email, setEmail] = useState("");

  useEffect(() => {
    Aos.init({ duration: 1200 });
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      // Add subscription logic here
      console.log("Subscribed:", email);
      setEmail("");
    }
  };

  return (
    <div className="subscribe section">
      <div className="subscribe-container" data-aos="fade-up">
        {/* Left Content */}
        <div className="subscribe-content">
          <div className="badge" data-aos="fade-right">
            <FaBell className="badge-icon" />
            <span>Stay Updated</span>
          </div>

          <h2
            className="subscribe-title"
            data-aos="fade-right"
            data-aos-delay="100"
          >
            Never Miss an <span className="highlight">Adventure</span>
          </h2>

          <p
            className="subscribe-desc"
            data-aos="fade-right"
            data-aos-delay="200"
          >
            Subscribe to our newsletter and get exclusive travel deals,
            destination guides, and adventure tips delivered straight to your
            inbox.
          </p>

          {/* Features List */}
          <ul
            className="features-list"
            data-aos="fade-right"
            data-aos-delay="300"
          >
            <li>
              <FaCheckCircle className="check-icon" />
              <span>Exclusive travel deals & discounts</span>
            </li>
            <li>
              <FaCheckCircle className="check-icon" />
              <span>Expert destination guides & tips</span>
            </li>
            <li>
              <FaCheckCircle className="check-icon" />
              <span>Early access to new tours</span>
            </li>
          </ul>
        </div>

        {/* Right Content - Newsletter Form */}
        <div className="subscribe-form-wrapper" data-aos="fade-left">
          <div className="form-card">
            <div className="form-header">
              <MdEmail className="email-icon" />
              <h3>Join Our Community</h3>
              <p>Get the best travel experiences</p>
            </div>

            <form onSubmit={handleSubscribe} className="newsletter-form">
              <div className="input-group">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="subscribe-btn">
                  Subscribe Now
                </button>
              </div>
              <p className="privacy-text">
                🔒 We respect your privacy. Unsubscribe anytime.
              </p>
            </form>

            {/* Stats */}
            <div className="stats-row">
              <div className="stat-item">
                <strong>10K+</strong>
                <span>Subscribers</span>
              </div>
              <div className="stat-item">
                <strong>500+</strong>
                <span>Destinations</span>
              </div>
              <div className="stat-item">
                <strong>4.9★</strong>
                <span>Rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;
