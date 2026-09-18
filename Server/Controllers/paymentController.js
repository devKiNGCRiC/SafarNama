import mongoose from 'mongoose';
import Payment from '../Models/PaymentModel.js';
import Booking from '../Models/TourBookingModel.js';

// NOTE: this records a simulated payment - no real gateway is called.
// Before going live, integrate Razorpay (already a dependency) and confirm the
// booking only after the gateway signature has been verified.
export const processPayment = async (req, res) => {
  try {
    const { bookingId, paymentMethod, name, cardNumber, expiryDate, upiId } = req.body;

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid booking id' });
    }
    if (!['card', 'upi'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    // Only the booking's owner can pay for it, and the amount is taken from the
    // booking itself rather than trusting a value sent by the browser.
    const booking = await Booking.findOne({
      _id: bookingId,
      userId: req.user._id.toString()
    });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Booking is cancelled' });
    }
    if (booking.paymentStatus === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Booking is already paid' });
    }

    const newPayment = new Payment({
      bookingId: booking._id,
      amount: booking.totalAmount,
      paymentMethod,
      name,
      cardNumber: cardNumber ? String(cardNumber).slice(-4) : null, // Store only last 4 digits
      // Expiry is not needed once the payment is recorded, so it is not stored
      upiId
    });

    await newPayment.save();

    booking.status = 'CONFIRMED';
    booking.paymentStatus = 'COMPLETED';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully!',
      paymentId: newPayment._id
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment'
    });
  }
};
