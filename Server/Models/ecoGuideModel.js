// ecoGuideModel.js
import mongoose from "mongoose";

const ecoGuideSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['SUSTAINABLE_TIPS', 'BEST_PRACTICES', 'LOCAL_GUIDE'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  images: [String],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

//export const EcoGuide = mongoose.model('EcoGuide', ecoGuideSchema);

const EcoGuide = mongoose.model('EcoGuide', ecoGuideSchema);
export default EcoGuide;