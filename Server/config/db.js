import mongoose from "mongoose";
import "colors";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_DB , {
      serverSelectionTimeoutMS: 5000, // Reduce timeout to 5 seconds
      socketTimeoutMS: 45000, // Socket timeout
      family: 4 // Use IPv4, skip trying IPv6
  });
    console.log(`MongoDB connected: ${conn.connection.host}`.bgMagenta.white);
  } catch (error) {
    console.log(`MongoDB Connect Error: ${error.message}`.bgRed.white);
    process.exit(1);
  }
};

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.once('open', () => {
  console.log('MongoDB connected successfully');
});

export default connectDB;