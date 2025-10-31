import mongoose from "mongoose";

const emergencyContactSchema = new mongoose.Schema({
    name: String,
    number: String,
    type: String
  });
  
  const educationalResourceSchema = new mongoose.Schema({
    title: String,
    type: String,
    description: String,
    link: String
  });
  
  const localBusinessSchema = new mongoose.Schema({
    name: String,
    type: String,
    description: String,
    sustainable: Boolean
  });
  

const destinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    history: {
      type: String,
      required: true,
    },
    significance: {
      type: String,
      required: true,
    },
    images: [{
      type: String,
      required: true,
    }],
    activities: [{
      name: String,
      description: String,
      duration: String,
      image: String
    }],
    cuisine: [{
      name: String,
      description: String,
      image: String
    }],
    featured: {
      type: Boolean,
      default: false,
    },
    // New fields
    category: [{
      type: String,
      enum: ['Mountain', 'Nature', 'Park', 'Beach', 'Recommended'],
      required: true
    }],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    location: {
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      },
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      }
    },
    healthSafety: {
      guidelines: [String],
      medicalFacilities: [{
        name: String,
        address: String,
        phone: String,
        distance: String
      }],
      emergencyContacts: [emergencyContactSchema]  // Using sub-schema
    },
    travelGear: [{
      category: String,
      items: [{
        name: String,
        importance: String,
        description: String
      }]
    }],

    educationalResources: [educationalResourceSchema],  // Using sub-schema

    bestTimeToVisit: {
      season: String,
      months: [String],
      description: String
    },
    seasonality: {
      peakSeason: {
        months: {
          type: [String],
          default: []
        },
        advantages: {
          type: [String],
          default: []
        },
        disadvantages: {
          type: [String],
          default: []
        },
        pricing: {
          type: String,
          default: "Not specified"
        }
      },
      offSeason: {
        months: {
          type: [String],
          default: []
        },
        advantages: {
          type: [String],
          default: []
        },
        disadvantages: {
          type: [String],
          default: []
        },
        pricing: {
          type: String,
          default: "Not specified"
        }
      }
    },
    accessibility: {
      wheelchairAccessible: {
        type: Boolean,
        default: false
      },
      publicTransport: {
        type: Boolean,
        default: false
      },
      parkingAvailable: {
        type: Boolean,
        default: false
      },
      accessibilityNotes: {
        type: String,
        default: ""
      }
    },
    sustainabilityInitiatives: [{
      name: String,
      description: String,
      impact: String,
      howToParticipate: String
    }],
    localCommunity: {
      traditions: [String],
      guidelines: [String],
      localBusinesses: [localBusinessSchema]  // Using sub-schema
    },
    weather: {
      climate: {
        type: String,
        default: "Not specified"
      },
      averageTemperature: {
        summer: {
          type: String,
          default: "Not specified"
        },
        winter: {
          type: String,
          default: "Not specified"
        },
        spring: {
          type: String,
          default: "Not specified"
        },
        fall: {
          type: String,
          default: "Not specified"
        }
      },
      rainfallPattern: {
        type: String,
        default: "Not specified"
      }
    },
    permits: [{
      name: String,
      required: Boolean,
      howToObtain: String,
      cost: String,
      validityPeriod: String
    }],
    reviews: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      visitDate: Date,
      helpful: Number,
      photos: [String],
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    stats: {
      averageStayDuration: {
        type: String,
        default: "Not specified"
      },
      peakHours: {
        type: [String],
        default: []
      },
      quietHours: {
        type: [String],
        default: []
      }
    },
    savedDestinations: [{
      destination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Destination'
      },
      savedAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    itineraries: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Itinerary'
    }]
  },
  { timestamps: true,
     // Add indexes for common queries
     indexes: [
      { category: 1 },
      { featured: 1 },
      { "reviews.rating": 1 },
      { createdAt: -1 }
    ]
   }
);

// Index for location-based queries
destinationSchema.index({ location: '2dsphere' });

export default mongoose.model("Destination", destinationSchema);