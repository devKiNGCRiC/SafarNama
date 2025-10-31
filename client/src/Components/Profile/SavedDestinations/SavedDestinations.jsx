// src/Components/Profile/SavedDestinations/SavedDestinations.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './SavedDestinations.scss';

const SavedDestinations = ({ savedDestinations = [] }) => {
    if (!savedDestinations || savedDestinations.length === 0) {
        return (
            <div className="no-saved-items">
                <p>No saved destinations yet</p>
            </div>
        );
    }

    return (
        <div className="saved-destinations">
            <div className="destinations-grid">
                {savedDestinations.map((item) => (
                    <div key={item.destination._id} className="destination-card">
                        <div className="destination-image">
                            {item.destination.images?.[0] && (
                                <img
                                    src={item.destination.images[0]}
                                    alt={item.destination.name}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/path/to/fallback/image.jpg';
                                    }}
                                />
                            )}
                        </div>
                        <div className="destination-info">
                            <h3>{item.destination.name}</h3>
                            <p>{item.destination.address}</p>
                            <div className="destination-actions">
                                <Link 
                                    to={`/destinations/${item.destination._id}`}
                                    className="view-btn"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SavedDestinations;