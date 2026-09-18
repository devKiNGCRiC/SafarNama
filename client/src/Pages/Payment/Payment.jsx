import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, Smartphone, AlertCircle, Shield, ArrowLeft } from 'lucide-react';
import './payment.css';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';
import { API_URL } from '../../config/api';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const paymentData = location.state;

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Verify authentication and payment data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    if (!paymentData?.bookingId || !paymentData?.amount) {
      navigate('/tours');
      return;
    }

    console.log('Payment data received:', paymentData);
  }, []);

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    return parts.length ? parts.join(' ') : value;
  };

  // Format expiry date
  const formatExpiryDate = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const validateCard = () => {
    const errors = {};
    if (!cardData.number.replace(/\s/g, '').match(/^\d{16}$/)) {
      errors.number = 'Invalid card number';
    }
    if (!cardData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!cardData.expiry.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)) {
      errors.expiry = 'Invalid expiry date (MM/YY)';
    }
    if (!cardData.cvv.match(/^\d{3}$/)) {
      errors.cvv = 'Invalid CVV';
    }
    return errors;
  };

  const validateUPI = () => {
    const errors = {};
    if (!upiId.match(/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/)) {
      errors.upiId = 'Invalid UPI ID';
    }
    return errors;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    const errors = paymentMethod === 'card' ? validateCard() : validateUPI();
    if (Object.keys(errors).length > 0) {
      setError(errors);
      return;
    }
  
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // The server verifies the booking, takes the amount from it and marks the
      // booking CONFIRMED once the payment is recorded - the browser can no
      // longer confirm a booking on its own.
      const paymentResponse = await axios.post(
        `${API_URL}/api/v1/payment`,
        {
          bookingId: paymentData.bookingId,
          paymentMethod,
          name: paymentMethod === 'card' ? cardData.name : '',
          cardNumber: paymentMethod === 'card' ? cardData.number : '',
          expiryDate: paymentMethod === 'card' ? cardData.expiry : '',
          upiId: paymentMethod === 'upi' ? upiId : ''
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (paymentResponse.data.success) {
        navigate('/thank-you', {
          state: {
            bookingId: paymentData.bookingId,
            tourName: paymentData.tourName,
            amount: paymentData.amount
          }
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError({
        general: 'Payment failed. Please try again.'
      });
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="payment-container">
        <div className="payment-header">
          <button 
            onClick={() => navigate(-1)} 
            className="back-button"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1>Complete Your Payment</h1>
          <p>Secure payment for your booking of {paymentData?.tourName}</p>
        </div>

        <div className="payment-content">
          <div className="payment-methods">
            <div className="payment-method-selector">
              <button
                className={`method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard size={20} />
                Card Payment
              </button>
              <button
                className={`method-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('upi')}
              >
                <Smartphone size={20} />
                UPI Payment
              </button>
            </div>

            <form onSubmit={handlePayment} className="payment-form">
              {paymentMethod === 'card' ? (
                <>
                  <div className="form-group">
                    <label>Card Number</label>
                    <input
                      type="text"
                      value={cardData.number}
                      onChange={(e) => setCardData({ 
                        ...cardData, 
                        number: formatCardNumber(e.target.value)
                      })}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                    />
                    {error?.number && <span className="error">{error.number}</span>}
                  </div>

                  <div className="form-group">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      value={cardData.name}
                      onChange={(e) => setCardData({ 
                        ...cardData, 
                        name: e.target.value
                      })}
                      placeholder="John Doe"
                    />
                    {error?.name && <span className="error">{error.name}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry Date</label>
                      <input
                        type="text"
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ 
                          ...cardData, 
                          expiry: formatExpiryDate(e.target.value)
                        })}
                        placeholder="MM/YY"
                        maxLength="5"
                      />
                      {error?.expiry && <span className="error">{error.expiry}</span>}
                    </div>

                    <div className="form-group">
                      <label>CVV</label>
                      <input
                        type="password"
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ 
                          ...cardData, 
                          cvv: e.target.value.slice(0, 3)
                        })}
                        placeholder="123"
                        maxLength="3"
                      />
                      {error?.cvv && <span className="error">{error.cvv}</span>}
                    </div>
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label>UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                  />
                  {error?.upiId && <span className="error">{error.upiId}</span>}
                </div>
              )}

              {error?.general && (
                <div className="error-message">
                  <AlertCircle size={20} />
                  {error.general}
                </div>
              )}

              <button 
                type="submit" 
                className={`pay-now-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  `Pay ₹${paymentData?.amount || 0}`
                )}
              </button>
            </form>
          </div>

          <div className="payment-summary">
            <div className="summary-header">
              <h3>Payment Summary</h3>
            </div>
            <div className="summary-content">
              <div className="summary-row">
                <span>Tour Price</span>
                <span>₹{paymentData?.amount ? (paymentData.amount - (paymentData.amount * 0.18)).toFixed(2) : 0}</span>
              </div>
              <div className="summary-row">
                <span>Tax (18%)</span>
                <span>₹{paymentData?.amount ? (paymentData.amount * 0.18).toFixed(2) : 0}</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount</span>
                <span>₹{paymentData?.amount || 0}</span>
              </div>
            </div>
            <div className="security-note">
              <Shield size={20} />
              <p>Your payment is secured with industry-standard encryption</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Payment;