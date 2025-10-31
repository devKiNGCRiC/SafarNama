// seedDestinations.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Destination from './Models/destinationModel.js';
import { destinations } from './Data/destinationsData.js';

dotenv.config();

const seedDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_DB);
    console.log('Connected to MongoDB');

    // // Clear existing data
    // await Destination.deleteMany({});
    // console.log('Cleared existing destinations');

    // Insert new data
    const createdDestinations = await Destination.create(destinations);
    console.log(`Successfully seeded ${createdDestinations.length} destinations`);

    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

seedDB();