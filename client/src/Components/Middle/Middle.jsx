import React, { useEffect } from "react";
import "./Middle.scss";

//Importing Aos
import Aos from "aos";
import "aos/dist/aos.css";

const Middle = () => {
  useEffect(() => {
    Aos.init({ duration: 2000 });
  }, []);

  return (
    <div className="middle section">
      <div className="secContainer container">
        {/* Section Title */}
        <div className="section-header" data-aos="fade-down">
          <h2 className="section-title">
            <span className="title-accent">Why</span>{" "}
            <span className="safar">Safar</span>
            <span className="nama">Nama</span>?
          </h2>
          <p className="section-subtitle">
            Your trusted companion for authentic Indian travel experiences
          </p>
        </div>

        {/* Promise Cards Grid */}
        <div className="promise-grid">
          <div
            className="promise-card"
            data-aos="fade-right"
            data-aos-delay="100"
          >
            <div className="promise-header">
              <div className="promise-icon">�</div>
              <h3 className="promise-title">100% Eco-Conscious</h3>
            </div>
            <p className="promise-description">
              Every journey is carbon-neutral. We partner with local communities
              to ensure your travel leaves a positive impact on nature and
              culture.
            </p>
            <div className="promise-badge">Certified Green</div>
          </div>

          <div className="promise-card" data-aos="fade-up" data-aos-delay="200">
            <div className="promise-header">
              <div className="promise-icon">�️</div>
              <h3 className="promise-title">Authentic Experiences</h3>
            </div>
            <p className="promise-description">
              From hidden Himalayan trails to coastal villages, discover the
              real India through stories and experiences curated by local
              experts.
            </p>
            <div className="promise-badge">Local First</div>
          </div>

          <div
            className="promise-card"
            data-aos="fade-left"
            data-aos-delay="300"
          >
            <div className="promise-header">
              <div className="promise-icon">🛡️</div>
              <h3 className="promise-title">Safe & Secure</h3>
            </div>
            <p className="promise-description">
              Travel with confidence. 24/7 support, verified accommodations, and
              trained guides ensure your safety at every step of the journey.
            </p>
            <div className="promise-badge">Trusted by 10K+</div>
          </div>

          <div
            className="promise-card"
            data-aos="fade-right"
            data-aos-delay="400"
          >
            <div className="promise-header">
              <div className="promise-icon">💰</div>
              <h3 className="promise-title">Best Value Guarantee</h3>
            </div>
            <p className="promise-description">
              Transparent pricing with no hidden costs. Get premium experiences
              at fair prices that support local economies directly.
            </p>
            <div className="promise-badge">Price Match</div>
          </div>
        </div>

        {/* Trust Indicator */}
        <div className="trust-banner" data-aos="zoom-in" data-aos-delay="500">
          <div className="trust-content">
            <span className="trust-icon">🏆</span>
            <p className="trust-text">
              <strong>Award-Winning Service</strong> • Rated 4.9/5 by 5,000+
              travelers
            </p>
            <span className="trust-icon">🏆</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Middle;
