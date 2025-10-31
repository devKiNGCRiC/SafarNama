// src/Components/Tours/SimilarTours.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Calendar, Clock } from 'lucide-react';
import './SimilarTours.css';

const SimilarTours = ({ currentTourId, destination, category }) => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilarTours = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/v1/tours/similar`, {
          params: {
            tourId: currentTourId,
            destination,
            category
          }
        });

        if (response.data.success) {
          setTours(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching similar tours:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarTours();
  }, [currentTourId, destination, category]);

  if (loading) return <div className="similar-tours-loading">Loading...</div>;
  if (tours.length === 0) return null;

  return (
    <div className="similar-tours">
      <h2>Similar Tours You Might Like</h2>
      <div className="similar-tours-grid">
        {tours.map(tour => (
          <Link to={`/tours/${tour._id}`} key={tour._id} className="similar-tour-card">
            <div className="tour-image">
              <img src={tour.images[0]} alt={tour.name} />
              <span className="tour-price">₹{tour.pricing.adult}</span>
            </div>
            <div className="tour-info">
              <h3>{tour.name}</h3>
              <div className="tour-details">
                <span><MapPin size={16} /> {tour.destination.name}</span>
                <span><Clock size={16} /> {tour.duration.days} days</span>
                <span><Calendar size={16} /> Next date: {new Date(tour.schedule[0]?.date).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SimilarTours;