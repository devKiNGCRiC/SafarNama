// Models/tourModel.js
import mongoose from "mongoose";

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tour name is required"],
    unique: true
  },
  title: {
    type: String,
    required: true,
    default: "Untitled Tour"  // Set default value to avoid null/empty title
  },
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    days: Number,
    nights: Number
  },
  schedule: [{
    date: Date,
    maxParticipants: Number,
    bookedParticipants: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'FULL', 'COMPLETED', 'CANCELLED'],
      default: 'AVAILABLE'
    }
  }],
  pricing: {
    adult: {
      type: Number,
      required: true
    },
    child: {
      type: Number,
      required: true
    },
    groupDiscount: {
      minPeople: Number,
      percentage: Number
    }
  },
  includes: [String],
  excludes: [String],
  highlights: [String],
  images: [String],
  itinerary: [{
    day: Number,
    title: String,
    description: String,
    activities: [String]
  }],
  startingLocation: {
    type: String,
    required: true
  },
  meetingPoint: {
    address: String,
    coordinates: {
      type: [Number],
      required: true
    },
    time: String
  },
  prerequisites: [String],
  difficultyLevel: {
    type: String,
    enum: ['EASY', 'MODERATE', 'CHALLENGING', 'DIFFICULT'],
    required: true
  },
  ageRestrictions: {
    minimum: Number,
    maximum: Number
  },
  season: {
    type: String,
    enum: ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER', 'ALL'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  pricing: {
    adult: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    child: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    groupDiscount: {
      minPeople: {
        type: Number,
        min: [2, 'Group minimum must be at least 2']
      },
      percentage: {
        type: Number,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%']
      }
    }
  },
  schedule: [{
    date: {
      type: Date,
      required: true,
      validate: {
        validator: function(date) {
          return date > new Date();
        },
        message: 'Tour date must be in the future'
      }
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: [1, 'Tour must allow at least 1 participant']
    },
    bookedParticipants: {
      type: Number,
      default: 0,
      validate: {
        validator: function(booked) {
          return booked <= this.maxParticipants;
        },
        message: 'Booked participants cannot exceed maximum capacity'
      }
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'FULL', 'COMPLETED', 'CANCELLED'],
      default: 'AVAILABLE'
    },
    waitlist: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      participants: Number,
      requestDate: Date
    }]
  }]
}, { timestamps: true });

// Index for efficient querying
tourSchema.index({ destination: 1, 'schedule.date': 1, isActive: 1 });
tourSchema.index({ season: 1, isActive: 1 });

// Pre-save middleware to update tour status
tourSchema.pre('save', function(next) {
  this.schedule.forEach(slot => {
    if (slot.bookedParticipants >= slot.maxParticipants) {
      slot.status = 'FULL';
    }
  });
  next();
});

const Tour = mongoose.models.Tour || mongoose.model('Tour', tourSchema);
export default Tour;