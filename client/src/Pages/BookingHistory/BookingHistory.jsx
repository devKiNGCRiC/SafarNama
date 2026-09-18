import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, Users, CreditCard } from 'lucide-react';
import './BookingHistory.css';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';
import { API_URL } from '../../config/api';

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/v1/booking`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/api/v1/booking/${bookingId}`,
        { status: 'CANCELLED' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      fetchBookings(); // Refresh the list
    } catch (error) {
      alert('Failed to cancel booking');
    }
  };

  if (loading) {
    return <div className="loading">Loading bookings...</div>;
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="booking-history-container">
        <h1>My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="no-bookings">
            <h3>No bookings found</h3>
            <p>Start exploring tours and plan your next adventure!</p>
            <button onClick={() => navigate('/tours')} className="explore-btn">
              Explore Tours
            </button>
          </div>
        ) : (
          <div className="bookings-grid">
            {bookings.map(booking => (
              <div key={booking._id} className="booking-card">
                <div className="booking-details">
                  <h3>{booking.tourName}</h3>
                  <div className="booking-info">
                    <span>
                      <Calendar size={16} />
                      {new Date(booking.bookAt).toLocaleDateString()}
                    </span>
                    <span>
                      <Users size={16} />
                      {booking.guestSize} guests
                    </span>
                    <span>
                      <CreditCard size={16} />
                      ₹{booking.totalAmount}
                    </span>
                  </div>
                  <div className="status-badge">
                    Status: {booking.status}
                  </div>
                  {booking.status === 'CONFIRMED' && (
                    <button 
                      onClick={() => handleCancelBooking(booking._id)}
                      className="cancel-btn"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default BookingHistory;