// eventModel.js
import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['FESTIVAL', 'ACTIVITY', 'WORKSHOP', 'CLEANUP', 'OTHER']
    },
    description: {
        type: String,
        required: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    venue: { type: String, trim: true, maxlength: 120 },
    capacity: Number,
    registeredUsers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      registrationDate: Date
    }],
    images: [String],
    imagePublicId: String, // Cloudinary id of the cover photo (so it can be replaced/deleted)
    sustainabilityImpact: {
      category: String,
      description: String,
      metrics: Map
    }
  }, { timestamps: true });

//   export const Event = mongoose.model('Event', eventSchema);
  const Event = mongoose.model("Event", eventSchema);
    export default Event;