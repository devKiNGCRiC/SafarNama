import React, { useEffect, useState } from "react";
import "./Subscribe.scss";
import { http } from "../../config/api";

import { ensureAos } from "../../config/aos";

//Import icons
import { MdEmail, MdNotifications } from "react-icons/md";
import { FaBell, FaCheckCircle } from "react-icons/fa";

const Subscribe = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ state: "idle", message: "" }); // idle | sending | done | error

  useEffect(() => {
    ensureAos();
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || status.state === "sending") return;

    setStatus({ state: "sending", message: "" });
    try {
      const res = await http.post("/api/v1/newsletter", { email: value });
      setStatus({ state: "done", message: res.data.message });
      setEmail("");
    } catch (error) {
      setStatus({
        state: "error",
        message: error.response?.data?.message || "Could not subscribe right now. Please try again.",
      });
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
                <button type="submit" className="subscribe-btn" disabled={status.state === "sending"}>
                  {status.state === "sending" ? "Subscribing…" : "Subscribe Now"}
                </button>
              </div>
              {status.message && (
                <p
                  className="privacy-text"
                  role="status"
                  style={{ color: status.state === "error" ? "#e63946" : "#138808", fontWeight: 600 }}
                >
                  {status.message}
                </p>
              )}
              <p className="privacy-text">
                🔒 We respect your privacy. Unsubscribe anytime.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;
