// ThankYou.js
import React from 'react';
import { Link } from 'react-router-dom'; // Use Link for navigation in React
import './ThankYou.css';

const ThankYou = () => {
  return (
    <section className="thank-you-section">
      <div className="container">
        <div className="row">
          <div className="col-lg-12 pt-5 text-center">
            <div className="thank__you">
              <span><i className="fas fa-check-circle"></i></span>
              <h1 className="mb-3 fw-semibold">Thank You!</h1>
              <h3 className="mb-4">Your tour is booked.</h3>
              <button className="btn btn-primary">
                <Link to="/">Back to Home</Link>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThankYou;
