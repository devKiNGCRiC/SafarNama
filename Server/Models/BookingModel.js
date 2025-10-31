import Mongoose from "mongoose";

const bookingSchema = new Mongoose.Schema(
  {
    userId: {
      type:String
    },
    userEmail: {
      type: String,
      required: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide valid email']
    },
    tourName:{
        type:String,
        required:true
    },

    fullName: {
      type: String,
      required: true,
    },
    guestSize:{
        type:Number,
        required:true,
        min: [1, 'At least one guest is required']
    },
    phone:{
        type:String,
        required:true,
        match: [/^\d{10}$/, 'Please provide valid 10-digit phone number']
    },
    bookAt:{
        type:Date,
        required:true,
        validate: {
          validator: function(date) {
            return date >= new Date();
          },
          message: 'Booking date must be in the future'
        }
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING'
    },
    totalAmount: {
      type: Number,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      default: 'PENDING'
    },
    specialRequirements: String
  },
  { 
    timestamps: true , 
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
  }
);

// Add indexes for frequent queries
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ bookAt: 1 });

export default Mongoose.model("Booking", bookingSchema);
