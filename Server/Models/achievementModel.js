import mongoose from 'mongoose';

const AchievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: String,
  criteria: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  category: {
    type: String,
    enum: ['travel', 'eco', 'social', 'photography', 'community']
  },
  points: {
    type: Number,
    default: 10
  }
});

export default mongoose.model('Achievement', AchievementSchema);