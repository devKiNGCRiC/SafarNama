import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  userId: String,
  feedback: String,
  rating: Number
});

export default mongoose.model('Feedback', feedbackSchema);
