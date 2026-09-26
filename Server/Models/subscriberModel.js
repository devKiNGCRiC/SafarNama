import mongoose from "mongoose";

// Newsletter signups from the home page.
const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  },
  { timestamps: true },
);

export default mongoose.model("Subscriber", subscriberSchema);
