import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Calendar, Users } from 'lucide-react';
import './TourDetail.css';
import Navbar from '../../../Components/Navbar/Navbar';
import Footer from '../../../Components/Footer/Footer';
import {AlertCircle} from 'lucide-react';
import Sidebar from '../../../Components/Sidebar/Sidebar';
import { API_URL } from '../../../config/api';
const TourDetail = () => {
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [participants, setParticipants] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTourDetails();
  }, [id]);

  useEffect(() => {
    if (tour) {
      calculatePrice();
    }
  }, [participants, tour]);

  const fetchTourDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/tours/${id}`);
      if (response.data.success) {
        setTour(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tour:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    if (!tour) return;
  
    let price = tour.pricing.adult * participants;
    
    // Apply group discount if applicable
    if (tour.pricing.groupDiscount && participants >= tour.pricing.groupDiscount.minPeople) {
      const discount = price * (tour.pricing.groupDiscount.percentage / 100);
      price -= discount;
    }
  
    setTotalPrice(price);
  };

  const handleBookNow = () => {
    if (!selectedDate) {
      alert('Please select a tour date');
      return;
    }
  
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to book a tour');
      navigate('/auth', { state: { from: `/tours/${id}` } });
      return;
    }
  
    // Create complete booking data
    const bookingData = {
      tourId: id,
      tourName: tour.name, // Ensure tour name is passed
      selectedDate,
      participants,
      totalPrice,
      image: tour.images[0],
      destination: tour.destination.name,
      duration: tour.duration.days,
      pricing: tour.pricing,
      userEmail: localStorage.getItem('userEmail'),
      userId: localStorage.getItem('userId')
    };
  
    console.log('Passing booking data:', bookingData);
  
    navigate('/booking', {
      state: bookingData
    });
  };

  if (loading) return <div className="loading">Loading tour details...</div>;
  if (!tour) return <div className="not-found">Tour not found</div>;

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="tour-detail-container">
        {/* Hero Section */}
        <div className="tour-hero">
          <img src={tour.images[0]} alt={tour.name} className="tour-image"/>
          <div className="hero-content">
            <h1>{tour.name}</h1>
            <p className="destination-name">
              <MapPin size={16} />
              {tour.destination.name}
            </p>
          </div>
        </div>

        <div className="tour-content">
          {/* Tour Information */}
          <div className="tour-info">
            <div className="description-section">
              <h2>About This Tour</h2>
              <p>{tour.description}</p>
            </div>

            <div className="details-section">
              <h2>Tour Details</h2>
              <div className="details-grid">
                <div className="detail-item">
                  <Calendar size={20} />
                  <p>Duration: {tour.duration.days} Days</p>
                </div>
                <div className="detail-item">
                  <Users size={20} />
                  <p>Group Size: Up to {tour.schedule[0]?.maxParticipants} people</p>
                </div>
              </div>
            </div>

            {tour.itinerary && (
              <div className="itinerary-section">
                <h2>Itinerary</h2>
                {tour.itinerary.map((day, index) => (
                  <div key={index} className="itinerary-day">
                    <h3>Day {day.day}</h3>
                    <p>{day.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booking Section */}
          <div className="booking-section">
            <div className="booking-card">
              <h2>Book This Tour</h2>
              <div className="price-info">
                <span className="price">₹{tour.pricing.adult}</span>
                <span>per person</span>
              </div>

              <div className="booking-form">
                <div className="form-group">
                  <label>Select Date</label>
                  <select 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)}
                  >
                    <option value="">Choose a date</option>
                    {tour.schedule
                      .filter(s => new Date(s.date) > new Date())
                      .map((schedule, index) => (
                        <option key={index} value={schedule.date}>
                          {new Date(schedule.date).toLocaleDateString()}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Number of Participants</label>
                  <div className="participants-input">
                    <button onClick={() => setParticipants(p => Math.max(1, p - 1))}>-</button>
                    <span>{participants}</span>
                    <button onClick={() => setParticipants(p => p + 1)}>+</button>
                  </div>
                </div>

                {tour.pricing.groupDiscount && (
                    <div className="group-discount-info">
                      <AlertCircle size={16} />
                      <p>
                        Group discount of {tour.pricing.groupDiscount.percentage}% available for groups of {tour.pricing.groupDiscount.minPeople}+ people
                      </p>
                    </div>
                  )}

                  <div className="price-breakdown">
                    <div className="price-row">
                      <span>Base Price ({participants} × ₹{tour.pricing.adult})</span>
                      <span>₹{tour.pricing.adult * participants}</span>
                    </div>
                    
                    {tour.pricing.groupDiscount && 
                    participants >= tour.pricing.groupDiscount.minPeople && (
                      <div className="price-row discount">
                        <span>Group Discount ({tour.pricing.groupDiscount.percentage}%)</span>
                        <span>-₹{(tour.pricing.adult * participants * tour.pricing.groupDiscount.percentage / 100).toFixed(2)}</span>
                      </div>
                    )}

                    <div className="price-row total">
                      <span>Total Price</span>
                      <span>₹{totalPrice}</span>
                    </div>
                  </div>

                <button 
                  className="book-button"
                  onClick={handleBookNow}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TourDetail;