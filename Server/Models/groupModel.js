import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  category: {
    type: String,
    enum: ['eco-volunteers', 'adventure', 'photography', 'cultural', 'backpackers']
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  events: [{
    title: String,
    description: String,
    date: Date,
    location: String,
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }]
}, {
  timestamps: true
});

export default mongoose.model('Group', GroupSchema);