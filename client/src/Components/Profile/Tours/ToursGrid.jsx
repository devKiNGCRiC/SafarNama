import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import './ToursGrid.scss';

const ToursGrid = ({ tours = [] }) => {
    return (
        <div className="tours-grid">
            {tours.length > 0 ? (
                <div className="grid-container">
                    {tours.map(tour => (
                        <div key={tour._id} className="tour-card">
                            <div className="tour-image">
                                <img src={tour.coverImage || '/api/placeholder/300/200'} alt={tour.title} />
                                <div className="tour-info">
                                    <h3>{tour.title}</h3>
                                    <p>{tour.description}</p>
                                    <div className="tour-meta">
                                        <span>{tour.duration} days</span>
                                        <span>• {tour.location}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <p>No tours yet</p>
                    <small>tours will appear here once they are shared.</small>
                </div>
            )}
        </div>
    );
};

export default ToursGrid;