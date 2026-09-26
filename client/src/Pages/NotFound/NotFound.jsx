import React from "react";
import { Link } from "react-router-dom";
import "./NotFound.css";

// Shown for any address that does not exist (and for profiles/posts that were not found).
const NotFound = () => (
  <div className="notfound">
    <div className="notfound-card">
      <span className="notfound-code">404</span>
      <h1>This trail leads nowhere</h1>
      <p>The page you are looking for does not exist or has moved.</p>
      <div className="notfound-actions">
        <Link to="/home" className="notfound-btn">Back to Home</Link>
        <Link to="/destinations" className="notfound-btn ghost">Explore destinations</Link>
        <Link to="/safargram" className="notfound-btn ghost">Open SafarGram</Link>
      </div>
    </div>
  </div>
);

export default NotFound;
