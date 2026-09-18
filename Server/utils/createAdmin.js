import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import UserModel from '../Models/userModel.js';
import { validatePasswordStrength } from './security.js';

dotenv.config();

// Usage (PowerShell):
//   $env:ADMIN_PASSWORD="<a strong password>"; npm run create-admin
// Optional: ADMIN_EMAIL, ADMIN_USERNAME
const createAdminUser = async () => {
    try {
        const password = process.env.ADMIN_PASSWORD;
        const check = password ? validatePasswordStrength(password) : null;
        if (!check || !check.isValid) {
            console.error(
                'Set a strong ADMIN_PASSWORD environment variable first ' +
                '(min 8 chars, upper + lower case, a number and one of @$!%*?&).'
            );
            process.exit(1);
        }

        await connectDB();

        // Check if admin already exists
        const adminExists = await UserModel.findOne({ role: 'admin' });

        if (adminExists) {
            console.log('Admin user already exists!');
            process.exit(0);
        }

        // Create admin user
        const adminUser = await UserModel.create({
            username: process.env.ADMIN_USERNAME || "admin",
            email: (process.env.ADMIN_EMAIL || "admin@safarnama.com").toLowerCase(),
            password,
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
