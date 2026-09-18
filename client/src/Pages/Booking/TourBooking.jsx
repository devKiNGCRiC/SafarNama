import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Users, MapPin, AlertCircle, Clock, Shield } from 'lucide-react';
import './TourBooking.css';
import Navbar from '../../Components/Navbar/Navbar';
import Footer from '../../Components/Footer/Footer';
import Sidebar from '../../Components/Sidebar/Sidebar';
import { API_URL } from '../../config/api';

const TourBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tourData = location.state;

  const [bookingData, setBookingData] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialRequirements: '',
    //termsAccepted: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Debug log at component mount
    console.log('Initial tourData:', tourData);
    if (!tourData || !tourData.tourName) {
      console.error('Missing tour name in data:', tourData);
    }
  }, []);

  useEffect(() => {
    // Validate incoming data
    if (!tourData || !tourData.tourId) {
      console.error('Missing tour data');
      navigate('/tours');
      return;
    }

    console.log('Received tour data:', tourData);
  }, [tourData, navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth', { state: { from: location.pathname } });
      return;
    }

    if (!tourData) {
      navigate('/tours');
      return;
    }

    // Pre-fill email if available from user data
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.email) {
      setBookingData(prev => ({ ...prev, email: userData.email }));
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!bookingData.fullName.trim()) {
      newErrors.fullName = 'Name is required';
    }

    if (!bookingData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(bookingData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!bookingData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\d{10}$/.test(bookingData.phone)) {
      newErrors.phone = 'Enter valid 10-digit number';
    }

    if (!bookingData.termsAccepted) {
      newErrors.terms = 'Please accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (isSubmitting) {
      // Reset submit state after 10 seconds if stuck
      const timeout = setTimeout(() => {
        setIsSubmitting(false);
      }, 10000);
  
      return () => clearTimeout(timeout);
    }
  }, [isSubmitting]);

    // Before making the booking request

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!validateForm()) return;
    
      setIsSubmitting(true);
      try {
        const token = localStorage.getItem('token');
        
        // Create complete booking payload
        const bookingPayload = {
          tourId: tourData.tourId,
          tourName: tourData.tourName, // This should now be defined
          userEmail: bookingData.email,
          fullName: bookingData.fullName,
          phone: bookingData.phone,
          guestSize: tourData.participants,
          bookAt: tourData.selectedDate,
          totalAmount: tourData.totalPrice,
          specialRequirements: bookingData.specialRequirements || ''
        };
    
        console.log('Submitting booking payload:', bookingPayload);
    
        const response = await axios.post(
          `${API_URL}/api/v1/booking`, // Make sure this matches your backend route
          bookingPayload,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
    
        console.log('Booking response:', response.data);
    
        if (response.data.success) {
          // Navigate to payment with correct data
          navigate('/payment', {
            state: {
              bookingId: response.data.data._id,
              amount: tourData.totalPrice,
              tourName: tourData.tourName
            },
            replace: true // This ensures we can't go back to the booking page
          });
        }
      } catch (error) {
        console.error('Booking error details:', error.response?.data);
        setErrors({
          submit: error.response?.data?.message || 'Failed to create booking'
        });
      } finally {
        setIsSubmitting(false);
      }
    };

  // At the start of TourBooking component
useEffect(() => {
  console.log('Tour Data received:', tourData);
}, [tourData]);

// Before submission
console.log('Submitting booking:', {
  tourId: tourData.tourId,
  tourName: tourData.tourName,
  // ... other data
});

useEffect(() => {
  // Log the received data
  console.log('Received tour data:', tourData);
  
  // Log authentication status
  const token = localStorage.getItem('token');
}, [tourData]);

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="booking-container">
        <div className="booking-header">
          <h1>Complete Your Booking</h1>
          <p>You're just a few steps away from your adventure!</p>
        </div>

        <div className="booking-content">
          {/* Tour Summary Card */}
          <div className="tour-summary-card">
            {/* <img src={tourData?.image} alt={tourData?.tourName} className="tour-image" /> */}
            <div className="tour-info">
              <h2>{tourData?.tourName}</h2>
              <div className="tour-details">
                <div className="detail-item">
                  <Calendar size={18} />
                  <span>{new Date(tourData?.selectedDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <Users size={18} />
                  <span>{tourData?.participants} Participants</span>
                </div>
                <div className="detail-item">
                  <MapPin size={18} />
                  <span>{tourData?.destination}</span>
                </div>
                <div className="detail-item">
                  <Clock size={18} />
                  <span>Duration: {tourData?.duration} Days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="booking-form-wrapper">
            <form onSubmit={handleSubmit} className="booking-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={bookingData.fullName}
                    onChange={(e) => setBookingData(prev => ({ ...prev, fullName: e.target.value }))}
                    className={errors.fullName ? 'error' : ''}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={bookingData.email}
                    onChange={(e) => setBookingData(prev => ({ ...prev, email: e.target.value }))}
                    className={errors.email ? 'error' : ''}
                    placeholder="your@email.com"
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    value={bookingData.phone}
                    onChange={(e) => setBookingData(prev => ({ ...prev, phone: e.target.value }))}
                    className={errors.phone ? 'error' : ''}
                    placeholder="Your contact number"
                  />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>

                <div className="form-group">
                  <label>Special Requirements</label>
                  <textarea
                    value={bookingData.specialRequirements}
                    onChange={(e) => setBookingData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                    placeholder="Any dietary restrictions or special needs?"
                  />
                </div>
              </div>

              {/* Price Summary */}
              <div className="price-summary">
                <h3>Price Breakdown</h3>
                <div className="price-items">
                  <div className="price-item">
                    <span>Base Price ({tourData?.participants} participants)</span>
                    <span>₹{tourData?.totalPrice - (tourData?.totalPrice * 0.18)}</span>
                  </div>
                  <div className="price-item">
                    <span>Tax (18%)</span>
                    <span>₹{tourData?.totalPrice * 0.18}</span>
                  </div>
                  <div className="price-item total">
                    <span>Total Amount</span>
                    <span>₹{tourData?.totalPrice}</span>
                  </div>
                </div>
              </div>

              {/* Terms and Secure Payment */}
              <div className="booking-footer">
                <div className="terms-section">
                  <label className="terms-label">
                    <input
                      type="checkbox"
                      checked={bookingData.termsAccepted}
                      onChange={(e) => setBookingData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                    />
                    <span>I accept the terms and conditions</span>
                  </label>
                  {errors.terms && <span className="error-text">{errors.terms}</span>}
                </div>

                <div className="secure-payment-notice">
                  <Shield size={20} />
                  <span>Secure payment powered by SSL encryption</span>
                </div>

                {errors.submit && (
                  <div className="error-alert">
                    <AlertCircle size={20} />
                    <span>{errors.submit}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  className={`proceed-payment-btn ${isSubmitting ? 'submitting' : ''}`}
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      Processing...
                    </>
                  ) : (
                    'Proceed to Payment'
                  )}
                </button>
              </div>
            </form>
            <div className="tour-summary-card">
            {/* {tourData?.image ? (
              <img 
                src={tourData.image} 
                alt={tourData.tourName} 
                className="tour-image" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-image.jpg'; // Add a placeholder image
                }}
              />
            ) : (
              <div className="tour-image-placeholder">No image available</div>
            )} */}
            <div className="tour-info">
              <h2>{tourData?.tourName || 'Tour Name Not Available'}</h2>
                <div className="tour-details">
                  <div className="detail-item">
                    <Calendar size={18} />
                    <span>{new Date(tourData?.selectedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <Users size={18} />
                    <span>{tourData?.participants} Participants</span>
                  </div>
                  <div className="detail-item">
                    <MapPin size={18} />
                    <span>{tourData?.destination || 'Destination not specified'}</span>
                  </div>
                  {tourData?.duration && (
                    <div className="detail-item">
                      <Clock size={18} />
                      <span>Duration: {tourData.duration} Days</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <Footer /> */}
    </>
  );
};

export default TourBooking;