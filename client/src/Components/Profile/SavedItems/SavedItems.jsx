// Profile -> Saved -> Destinations
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import './SavedItems.css';
import { getSavedDestinations, unsaveDestination } from '../../../api/profileRequest';

const SavedItems = () => {
  const [savedDestinations, setSavedDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    getSavedDestinations()
      .then((r) => alive && setSavedDestinations(r.data))
      .catch(() => alive && setError('Could not load your saved destinations'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const removeSavedDestination = async (destinationId) => {
    try {
      await unsaveDestination(destinationId);
      setSavedDestinations((prev) => prev.filter((d) => d._id !== destinationId));
    } catch (e) {
      toast.error(e?.message || 'Failed to remove destination');
    }
  };

  if (loading) return <div className="loading">Loading saved destinations...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="saved-items-container">
      <h2>Saved Destinations</h2>
      {savedDestinations.length === 0 ? (
        <p className="no-saved-items">
          No saved destinations yet. Open a destination and tap <strong>Save</strong>.
        </p>
      ) : (
        <div className="saved-destinations-grid">
          {savedDestinations.map((destination) => (
            <div key={destination._id} className="saved-destination-card">
              {destination.images?.[0] && (
                <img src={destination.images[0]} alt={destination.name} className="destination-image" />
              )}
              <div className="destination-info">
                <h3>{destination.name}</h3>
                <p>{destination.address}</p>
                <div className="card-actions">
                  <Link to={`/destinations/${destination._id}`} className="view-btn">
                    View Details
                  </Link>
                  <button onClick={() => removeSavedDestination(destination._id)} className="remove-btn">
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
