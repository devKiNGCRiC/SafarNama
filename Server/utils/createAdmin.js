import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import UserModel from '../Models/userModel.js';

dotenv.config();

const createAdminUser = async () => {
    try {
        await connectDB();

        // Check if admin already exists
        const adminExists = await UserModel.findOne({ role: 'admin' });

        if (adminExists) {
            console.log('Admin user already exists!');
            process.exit(0);
        }

        // Create admin user
        const adminUser = await UserModel.create({
            username: "admin",
            email: "admin@safarnama.com",
            password: "Admin@123",  // Change this to your secure password
            firstName: "Admin",
            lastName: "User",
            role: "admin",
            isEmailVerified: true,
            active: true
        });

        console.log('Admin user created successfully:', {
            username: adminUser.username,
            email: adminUser.email,
            role: adminUser.role
        });

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdminUser();