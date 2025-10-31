// src/Components/SavedItems/SavedItems.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './SavedItems.css';

const SavedItems = () => {
  const [savedDestinations, setSavedDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSavedDestinations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          'http://localhost:5000/api/v1/users/saved-destinations',
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          setSavedDestinations(response.data.data);
        }
      } catch (error) {
        setError('Failed to fetch saved destinations');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedDestinations();
  }, []);

  const removeSavedDestination = async (destinationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/v1/users/saved-destinations/${destinationId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSavedDestinations(prev => 
        prev.filter(item => item.destination._id !== destinationId)
      );
    } catch (error) {
      alert('Failed to remove destination');
    }
  };

  if (loading) return <div className="loading">Loading saved destinations...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="saved-items-container">
      <h2>Saved Destinations</h2>
      {savedDestinations.length === 0 ? (
        <p className="no-saved-items">No saved destinations yet</p>
      ) : (
        <div className="saved-destinations-grid">
          {savedDestinations.map((item) => (
            <div key={item.destination._id} className="saved-destination-card">
              <img 
                src={item.destination.images[0]} 
                alt={item.destination.name} 
                className="destination-image"
              />
              <div className="destination-info">
                <h3>{item.destination.name}</h3>
                <p>{item.destination.address}</p>
                <div className="card-actions">
                  <Link 
                    to={`/destinations/${item.destination._id}`}
                    className="view-btn"
                  >
                    View Details
                  </Link>
                  <button 
                    onClick={() => removeSavedDestination(item.destination._id)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedItems;