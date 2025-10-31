import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AllDestination.css';
import Navbar from '../../Components/Navbar/Navbar';
import Footer from '../../Components/Footer/Footer';

const AllDestinations = () => {
  // Destinations state
  const [destinations, setDestinations] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Unique categories and activities
  const categories = ['All', 'Mountain', 'Nature', 'Park', 'Beach', 'Recommended'];
  const [availableActivities, setAvailableActivities] = useState([]);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/v1/destinations');
        setDestinations(res.data.data);
        
        // Extract unique activities
        const activities = [...new Set(
          res.data.data.flatMap(dest => 
            dest.activities.map(activity => activity.name)
          )
        )];
        setAvailableActivities(activities);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching destinations:', error);
        setLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  // Filtering and Sorting Logic
  useEffect(() => {
    let result = destinations;

    // Search Filter
    if (searchTerm) {
      result = result.filter(dest => 
        dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dest.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(dest => dest.category === selectedCategory);
    }

    // Activity Filter
    if (selectedActivity) {
      result = result.filter(dest => 
        dest.activities.some(activity => activity.name === selectedActivity)
      );
    }

    // Sorting
    result.sort((a, b) => {
      switch(sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredDestinations(result);
  }, [destinations, searchTerm, selectedCategory, selectedActivity, sortBy]);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <>
      <Navbar />
      <div className="all-destinations">
        <h1>Explore Destinations with Safarnama</h1>
        
        {/* Search and Filter Section */}
        <div className="destinations-filters">
          <input 
            type="text" 
            placeholder="Search destinations..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <select 
            value={selectedActivity} 
            onChange={(e) => setSelectedActivity(e.target.value)}
            className="activity-select"
          >
            <option value="">All Activities</option>
            {availableActivities.map(activity => (
              <option key={activity} value={activity}>{activity}</option>
            ))}
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="name">Sort by Name</option>
            <option value="rating">Sort by Rating</option>
          </select>
        </div>

        {/* Destinations Grid */}
        <div className="destinations-grid">
          {filteredDestinations.length === 0 ? (
            <div className="no-destinations">
              No destinations match your search criteria.
            </div>
          ) : (
            filteredDestinations.map((dest) => (
              <Link to={`/destinations/${dest._id}`} key={dest._id} className="destination-card">
                <div className="image-container">
                  <img src={dest.images[0]} alt={dest.name} />
                </div>
                <div className="card-content">
                  <h3>{dest.name}</h3>
                  <p>{dest.address}</p>
                  <div className="destination-meta">
                    <span className="category-tag">{dest.category} </span>
                    <span className="rating">★ {dest.rating.toFixed(1)}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AllDestinations;