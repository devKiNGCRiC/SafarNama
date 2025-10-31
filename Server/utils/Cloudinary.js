import { v2 as cloudinary } from 'cloudinary';
          
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || dxyclus0f, 
  api_key: process.env.CLOUDINARY_API_KEY || 673761562154615, 
  api_secret: process.env.CLOUDINARY_API_SECRET || p9_QhRtWEA7WoA34XamaBrYssQI 
});

export default cloudinary ;