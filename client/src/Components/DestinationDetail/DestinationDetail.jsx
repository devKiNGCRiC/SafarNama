import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import './DestinationDetail.css'; // Create and style this CSS file

function DestinationDetail() {
  const { id } = useParams();
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    async function fetchDestination() {
      try {
        const res = await axios.get(`http://localhost:5000/api/destinations/${id}`);
        setDestination(res.data);
      } catch (error) {
        console.error('Error fetching destination:', error);
      }
    }
    fetchDestination();
  }, [id]);

  if (!destination) {
    return <div>Loading...</div>;
  }

  return (
    <div className="destination-detail-container">
      <h1>{destination.name}</h1>
      <p className="destination-address">{destination.address}</p>

      <div className="details-section">
        {/* Description */}
        <div className="detail-item">
          <div className="detail-text">
            <h2>Description</h2>
            <p>{destination.description}</p>
          </div>
          <div className="detail-image">
            <img src={destination.images[1]} alt={`${destination.name} Description`} />
          </div>
        </div>

        {/* History */}
        <div className="detail-item reverse">
          <div className="detail-image">
            <img src={destination.images[2]} alt={`${destination.name} History`} />
          </div>
          <div className="detail-text">
            <h2>History</h2>
            <p>{destination.history}</p>
          </div>
        </div>

        {/* Significance */}
        <div className="detail-item">
          <div className="detail-text">
            <h2>Significance</h2>
            <p>{destination.significance}</p>
          </div>
          <div className="detail-image">
            <img src={destination.images[3]} alt={`${destination.name} Significance`} />
          </div>
        </div>
      </div>

      <div className="booking-section">
        <p>Ready to explore this destination? Book your trip now!</p>
        <Link to="/booking" className="booking-btn">
          Book Now
        </Link>
      </div>
    </div>
  );
}

export default DestinationDetail;
