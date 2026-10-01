import React, { useEffect } from "react";
import "./Middle.scss";

import { ensureAos } from "../../config/aos";

const Middle = () => {
  useEffect(() => {
    ensureAos();
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
              <div className="promise-icon">🌿</div>
              <h3 className="promise-title">100% Eco-Conscious</h3>
            </div>
            <p className="promise-description">
              Discover destinations chosen for their natural and cultural value, with eco-guides
              and community tips to help you travel lightly and respectfully.
            </p>
            <div className="promise-badge">Eco-conscious travel</div>
          </div>

          <div className="promise-card" data-aos="fade-up" data-aos-delay="200">
            <div className="promise-header">
              <div className="promise-icon">🤝</div>
              <h3 className="promise-title">Authentic Experiences</h3>
            </div>
            <p className="promise-description">
              From hidden Himalayan trails to coastal villages, discover the real India through
              trip stories, photos and tips shared by fellow travellers on SafarGram.
            </p>
            <div className="promise-badge">Community-powered</div>
          </div>

          <div
            className="promise-card"
            data-aos="fade-left"
            data-aos-delay="300"
          >
            <div className="promise-header">
              <div className="promise-icon">🛡️</div>
              <h3 className="promise-title">Plan With Confidence</h3>
            </div>
            <p className="promise-description">
              Build a day-by-day itinerary from real destination details, with safety and permit
              information included where it's available.
            </p>
            <div className="promise-badge">Know before you go</div>
          </div>

          <div
            className="promise-card"
            data-aos="fade-right"
            data-aos-delay="400"
          >
            <div className="promise-header">
              <div className="promise-icon">🗺️</div>
              <h3 className="promise-title">Free to Explore</h3>
            </div>
            <p className="promise-description">
              Browse destinations, build itineraries and join the community at no cost. No hidden
              charges, no account required just to look around.
            </p>
            <div className="promise-badge">Always free to explore</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Middle;
