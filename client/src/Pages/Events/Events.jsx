// src/Pages/Events/Events.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../Components/Navbar/Navbar';
import Footer from '../../Components/Footer/Footer';
import './Events.css';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/v1/events');
        if (response.data.success) {
          setEvents(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const categories = [
    { id: 'ALL', label: 'All Events' },
    { id: 'FESTIVAL', label: 'Festivals' },
    { id: 'ACTIVITY', label: 'Activities' },
    { id: 'WORKSHOP', label: 'Workshops' },
    { id: 'CLEANUP', label: 'Clean-up Drives' }
  ];

  const registerForEvent = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to register for events');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/v1/events/${eventId}/register`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (response.data.success) {
        alert('Successfully registered for the event!');
        // Refresh events list
        window.location.reload();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to register for event');
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const filteredEvents = events.filter(event => {
    const matchesCategory = activeCategory === 'ALL' || event.type === activeCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return <div className="loading">Loading events...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <>
      <Navbar />
      <div className="events-container">
        <div className="events-header">
          <h1>Eco-Tourism Events</h1>
          <p>Join us in making tourism sustainable and impactful</p>
        </div>

        <div className="events-filters">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="category-filters">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div className="events-grid">
          {filteredEvents.map(event => (
            <div key={event._id} className="event-card">
              {event.images?.[0] && (
                <div className="event-image">
                  <img 
                    src={event.images[0]} 
                    alt={event.title} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/path/to/fallback/image.jpg';
                    }}
                  />
                </div>
              )}
              <div className="event-content">
                <div className="event-type">{
                  categories.find(cat => cat.id === event.type)?.label || 'Event'
                }</div>
                <h2>{event.title}</h2>
                <p className="event-description">{event.description}</p>
                <div className="event-details">
                  <div className="event-date">
                    <strong>Start:</strong> {formatDate(event.startDate)}
                  </div>
                  <div className="event-date">
                    <strong>End:</strong> {formatDate(event.endDate)}
                  </div>
                  <div className="event-capacity">
                    <strong>Spots left:</strong> {
                      event.capacity - (event.registeredUsers?.length || 0)
                    }
                  </div>
                </div>
                {event.sustainabilityImpact && (
                  <div className="impact-section">
                    <h3>Environmental Impact</h3>
                    <p>{event.sustainabilityImpact.description}</p>
                  </div>
                )}
                <button 
                  onClick={() => registerForEvent(event._id)}
                  className="register-btn"
                  disabled={event.capacity <= (event.registeredUsers?.length || 0)}
                >
                  {event.capacity <= (event.registeredUsers?.length || 0)
                    ? 'Event Full'
                    : 'Register Now'
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Events;