import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './AllDestinations.css'; // Create and style this CSS file
import { API_URL } from '../../config/api';

function AllDestinations() {
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    async function fetchDestinations() {
      try {
        const res = await axios.get(`${API_URL}/api/v1/destinations`);
        setDestinations(res.data);
      } catch (error) {
        console.error('Error fetching destinations:', error);
      }
    }
    fetchDestinations();
  }, []);

  return (
    <div className="destinations-container">
      <h2>Our Destinations</h2>
      <div className="destinations-grid">
        {destinations.map((destination) => (
          <div key={destination._id} className="destination-card">
            <img src={destination.images[0]} alt={destination.name} />
            <h3>{destination.name}</h3>
            <p>{destination.address}</p>
            <Link to={`/destinations/${destination._id}`} className="view-details-btn">
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AllDestinations;
