import mongoose from "mongoose";
import Tour from "./Models/tourModel.js";
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB

mongoose.connect(process.env.MONGO_DB)
  .then(() => app.listen(PORT , () => console.log(`Server Running on ${process.env.DEV_MODE} mode at ${PORT}`))
        ).catch((error) => console.log(error));
// Insert data
async function insertTours() {
  try {
    const tours = [
      
      {
        name: "Valley of Flowers Photography Tour",
        destination: "6755a384edba70268c480bb5", // Replace with a valid Destination ObjectId
        description: "Capture the Valley of Flowers like never before.",
        duration: { days: 6, nights: 5 },
        schedule: [
          { date: new Date("2025-08-01"), maxParticipants: 15 },
          { date: new Date("2025-09-10"), maxParticipants: 20 }
        ],
        pricing: { adult: 6000, child: 3500 , groupDiscount: { minPeople: 8, percentage: 8 }},
        includes: ["Professional Photographer", "Trekking Gear"],
        excludes: ["Snacks", "Travel Insurance"],
        highlights: ["Exclusive photography spots", "Guided nature walks"],
        images: ["photo1.jpg", "photo2.jpg"],
        itinerary: [
          { day: 1, title: "Meetup", description: "Meet your group.", activities: ["Orientation", "Dinner"] },
          { day: 3, title: "Valley Exploration", description: "Full day in the Valley.", activities: ["Photography", "Relaxing"] }
        ],
        startingLocation: "Dehradun",
        meetingPoint: { address: "Dehradun Train Station", coordinates: [78.0322, 30.3165], time: "9:00 AM" },
        prerequisites: ["Photography equipment", "Trekking shoes"],
        difficultyLevel: "EASY",
        ageRestrictions: { minimum: 12 },
        season: "AUTUMN",
        isActive: true
      }
    ];

    const result = await Tour.insertMany(tours);
    console.log("Data inserted:", result);
  } catch (error) {
    console.error("Error inserting data:", error);
  } finally {
    mongoose.connection.close();
  }
}

insertTours();
