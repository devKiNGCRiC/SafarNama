// itineraryModel.js
import mongoose from "mongoose";

const itinerarySchema = new mongoose.Schema({
    title: {
      type: String,
      required: true
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isTemplate: {
      type: Boolean,
      default: false
    },
    destinations: [{
      destination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Destination'
      },
      duration: String,
      notes: String,
      activities: [String]
    }],
    totalDuration: String,
    difficulty: {
      type: String,
      enum: ['EASY', 'MODERATE', 'CHALLENGING']
    },
    bestSeasons: [String],
    estimatedBudget: {
      amount: Number,
      currency: String
    },
    sustainabilityScore: {
      type: Number,
      min: 0,
      max: 5
    }
  }, { timestamps: true });
  
  const Itinerary = mongoose.model('Itinerary', itinerarySchema);
  export default Itinerary;