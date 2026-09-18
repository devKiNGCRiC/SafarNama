import mongoose from "mongoose";
import UserModel from "../Models/userModel.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// DANGEROUS: deletes EVERY user. Refuses to run unless explicitly confirmed:
//   node utils/clearUsers.js --yes-delete-all-users
const clearDatabase = async () => {
  if (!process.argv.includes("--yes-delete-all-users")) {
    console.error(
      "Refusing to run. Pass --yes-delete-all-users to delete all users.",
    );
    process.exit(1);
  }
  if (process.env.DEV_MODE === "production" || process.env.NODE_ENV === "production") {
    console.error("Refusing to delete users in production.");
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_DB);
    console.log("Connected to MongoDB");

    // Count existing users
    const userCount = await UserModel.countDocuments();
    console.log(`Found ${userCount} users in database`);

    if (userCount > 0) {
      // Clear all users
      const result = await UserModel.deleteMany({});
      console.log(`Deleted ${result.deletedCount} users from database`);
    } else {
      console.log("No users found in database");
    }

    // Close connection
    await mongoose.connection.close();
    console.log("Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error clearing database:", error);
    process.exit(1);
  }
};

clearDatabase();
