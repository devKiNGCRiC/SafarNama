// src/Pages/Itinerary/ItineraryBuilder.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';
import Footer from '../../Components/Footer/Footer';
import './ItineraryBuilder.css';
import { API_URL } from '../../config/api';

const ItineraryBuilder = () => {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [itineraryName, setItineraryName] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getToken = () => {
    return localStorage.getItem('token'); // Make sure this matches your token storage key
  };


  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/v1/destinations`);
        console.log('Destinations response:', response.data); // Debug log
        if (response.data.success && response.data.data) {
          setDestinations(response.data.data);
        } else {
          throw new Error('Invalid data format received');
        }
      } catch (error) {
        console.error('Error fetching destinations:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, []);

  // Filter destinations based on search query
  const filteredDestinations = destinations.filter(dest => {
    const isNotSelected = !selectedDestinations.some(
      selected => selected.destination._id === dest._id
    );
    const matchesSearch = dest.name.toLowerCase().includes(searchQuery.toLowerCase());
    return isNotSelected && matchesSearch;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading destinations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }


  const addToItinerary = (destination) => {
    if (selectedDestinations.length >= 10) { // Optional: limit number of destinations
      alert('Maximum 10 destinations allowed per itinerary');
      return;
    }
    
    setSelectedDestinations([...selectedDestinations, {
      destination: destination,
      duration: '1 day',
      notes: '',
      activities: []
    }]);
  };

  const removeFromItinerary = (index) => {
    const newSelected = [...selectedDestinations];
    newSelected.splice(index, 1);
    setSelectedDestinations(newSelected);
  };

  const updateDestinationDetails = (index, field, value) => {
    const newSelected = [...selectedDestinations];
    newSelected[index][field] = value;
    setSelectedDestinations(newSelected);
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('index', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = e.dataTransfer.getData('index');
    const newSelected = [...selectedDestinations];
    const item = newSelected[dragIndex];
    newSelected.splice(dragIndex, 1);
    newSelected.splice(dropIndex, 0, item);
    setSelectedDestinations(newSelected);
  };

  const canSaveItinerary = () => {
    return selectedDestinations.length > 0;
  };

  const saveItinerary = async () => {
    try {
      const token = getToken();
      
      if (!token) {
        alert('Please login to save itineraries');
        // Optionally redirect to login page
        navigate('/auth');
        return;
      }

      if (!itineraryName.trim()) {
        alert('Please enter an itinerary name');
        return;
      }

      if (selectedDestinations.length === 0) {
        alert('Please select at least one destination');
        return;
      }

      const itineraryData = {
        title: itineraryName,
        totalDuration: duration,
        destinations: selectedDestinations.map(item => ({
          destination: item.destination._id,
          duration: item.duration,
          notes: item.notes,
          activities: item.activities || []
        }))
      };

      const response = await axios.post(
        `${API_URL}/api/v1/itineraries`,
        itineraryData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert('Itinerary saved successfully!');
        // Clear form or redirect
        setItineraryName('');
        setDuration('');
        setSelectedDestinations([]);
      }
    } catch (error) {
      console.error('Error saving itinerary:', error);
      if (error.response?.status === 401) {
        alert('Please login again to continue');
        // Handle token expiration - maybe redirect to login
        navigate('/auth');
      } else {
        alert(error.response?.data?.message || 'Failed to save itinerary');
      }
    }
  };

  // Add validation to duration changes
  const updateDuration = (index, newDuration) => {
    const newSelected = [...selectedDestinations];
    newSelected[index] = {
      ...newSelected[index],
      duration: newDuration
    };
    setSelectedDestinations(newSelected);
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="itinerary-builder-container">
        <div className="itinerary-header">
          <h1>Create Your Eco-Tourism Itinerary</h1>
          <p>Plan your sustainable journey through amazing destinations</p>
        </div>

        <div className="itinerary-content">
          <div className="destinations-panel">
            <h2>Available Destinations</h2>
            <input
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <div className="destinations-list">
              {filteredDestinations.length > 0 ? (
                filteredDestinations.map(destination => (
                  <div key={destination._id} className="destination-item">
                    {destination.images && destination.images[0] && (
                      <img 
                        src={destination.images[0]} 
                        alt={destination.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/path/to/fallback/image.jpg';
                        }}
                      />
                    )}
                    <div className="destination-info">
                      <h3>{destination.name}</h3>
                      <p>{destination.address}</p>
                    </div>
                    <button 
                      onClick={() => addToItinerary(destination)}
                      className="add-destination-btn"
                    >
                      Add
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-destinations">
                  {searchQuery 
                    ? "No destinations found matching your search"
                    : "No destinations available"}
                </div>
              )}
            </div>
          </div>

          <div className="itinerary-panel">
          <div className="itinerary-details">
            <div className="input-group">
              <label htmlFor="itineraryName" className="required-field">Itinerary Name</label>
              <input
                id="itineraryName"
                type="text"
                placeholder="Enter itinerary name"
                value={itineraryName}
                onChange={(e) => setItineraryName(e.target.value)}
                className="itinerary-name-input"
              />
            </div>

            <div className="input-group">
              <label htmlFor="duration">Total Duration</label>
              <input
                id="duration"
                type="text"
                placeholder="e.g., 5 days"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="duration-input"
              />
            </div>
          </div>

            <div className="selected-destinations">
              {selectedDestinations.map((item, index) => (
                <div
                  key={index}
                  className="selected-destination-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <img src={item.destination.images[0]} alt={item.destination.name} />
                  <div className="destination-details">
                    <h3>{item.destination.name}</h3>
                    <select
                      value={item.duration}
                      onChange={(e) => updateDuration(index, e.target.value)}
                      className="duration-select"
                    >
                      {['1 day', '2 days', '3 days', '4 days', '5 days'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>

                    <textarea
                      placeholder="Add notes..."
                      value={item.notes}
                      onChange={(e) => updateDestinationDetails(index, 'notes', e.target.value)}
                    />
                    <button onClick={() => removeFromItinerary(index)} className="remove-btn">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedDestinations.length > 0 ? (
            <button 
              onClick={saveItinerary} 
              className="save-itinerary-btn"
            >
              Save Itinerary
            </button>
          ) : (
            <p className="no-destinations-message">
              Please select at least one destination to create an itinerary
            </p>
          )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ItineraryBuilder;