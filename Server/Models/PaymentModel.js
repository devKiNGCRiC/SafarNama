import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi'],
    required: true
  },
  name: String,
  cardNumber: String, // Will store only last 4 digits
  expiryDate: String,
  upiId: String,
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  }
}, {
  timestamps: true
});

export default mongoose.model('Payment', paymentSchema);