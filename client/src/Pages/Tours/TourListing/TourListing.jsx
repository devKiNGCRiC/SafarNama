// src/Pages/Tours/TourListing.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TourListing.css';
import Navbar from '../../../Components/Navbar/Navbar';
import Sidebar from '../../../Components/Sidebar/Sidebar';
import Footer from '../../../Components/Footer/Footer';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';
import Loader from '../../../Components/Loader/Loader';
import { API_URL } from '../../../config/api';
const TourListing = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    month: '',
    season: '',
    minPrice: '',
    maxPrice: '',
    difficulty: ''
  });

  const location = useLocation();
  const navigate = useNavigate();
  const destinationId = new URLSearchParams(location.search).get('destination');

  useEffect(() => {
    fetchTours();
  }, [destinationId, filters]);

  const fetchTours = async () => {
    try {
      setLoading(true);

      // Build query string dynamically based on the filters
      const queryParams = new URLSearchParams();

      // const queryParams = new URLSearchParams({
      //   ...filters,
      //   destination: destinationId || ''
      // }).toString();

      if (filters.month) queryParams.append('month', filters.month);
      if (filters.season) queryParams.append('season', filters.season);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      if (filters.difficulty) queryParams.append('difficulty', filters.difficulty);
      if (destinationId) queryParams.append('destination', destinationId);

      // const response = await axios.get(`${API_URL}/api/v1/tours?${queryParams.toString()}`);
      const queryString = queryParams.toString();
        const url = queryString ? `${API_URL}/api/v1/tours?${queryString}` : `${API_URL}/api/v1/tours`;

        const response = await axios.get(url);

      if (response.data.success) {
        setTours(response.data.data);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch tours');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading tours... <Loader/> </div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="tour-listing-container">
        <div className="filter-section">
          <h2>Filter Tours</h2>
          
          <div className="filter-group">
            <label>Month</label>
            <select 
              value={filters.month}
              onChange={(e) => handleFilterChange('month', e.target.value)}
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Season</label>
            <select
              value={filters.season}
              onChange={(e) => handleFilterChange('season', e.target.value)}
            >
              <option value="">All Seasons</option>
              <option value="SPRING">Spring</option>
              <option value="SUMMER">Summer</option>
              <option value="AUTUMN">Autumn</option>
              <option value="WINTER">Winter</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Price Range</label>
            <div className="price-inputs">
              <input
                type="text"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
              <input
                type="text"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Difficulty</label>
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="EASY">Easy</option>
              <option value="MODERATE">Moderate</option>
              <option value="CHALLENGING">Challenging</option>
              <option value="DIFFICULT">Difficult</option>
            </select>
          </div>
        </div>

        <div className="tours-grid">
          {tours.length === 0 ? (
            <div className="no-tours">
              <h3>No tours available for the selected criteria</h3>
              <p>Try adjusting your filters or check back later for new tours.</p>
            </div>
          ) : (
            tours.map(tour => (
              <div key={tour._id} className="tour-card">
                <div className="tour-image">
                  <img src={tour.images[0]} alt={tour.name} />
                  <span className="tour-difficulty" data-difficulty={tour.difficultyLevel}>
                    {tour.difficultyLevel}
                  </span>
                </div>

                <div className="tour-content">
                  <h3>{tour.name}</h3>
                  <p className="tour-destination">
                    <MapPin size={16} />
                    {tour.destination?.name}
                  </p>
                  
                  <div className="tour-details">
                    <div className="detail-item">
                      <Clock size={16} />
                      <span>{tour.duration.days} Days</span>
                    </div>
                    <div className="detail-item">
                      <Users size={16} />
                      <span>Max {tour.schedule[0]?.maxParticipants} people</span>
                    </div>
                    <div className="detail-item">
                      <Calendar size={16} />
                      <span>{formatDate(tour.schedule[0]?.date)}</span>
                    </div>
                  </div>

                  <p className="tour-description">
                    {tour.description.substring(0, 150)}...
                  </p>

                  <div className="tour-footer">
                    <div className="tour-price">
                      <span className="price">₹{tour.pricing.adult}</span>
                      <span className="per-person">per person</span>
                    </div>
                    <button 
                      className="view-details-btn"
                      onClick={() => navigate(`/tours/${tour._id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TourListing;