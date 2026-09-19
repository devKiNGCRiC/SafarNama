// server/controllers/profileController.js
import UserModel from '../Models/userModel.js';
import ProfileModel from '../Models/profileModel.js';
import PostModel from '../Models/postModel.js';   // Add this import
import BlogModel from '../Models/blogModel.js';   // Add this if you have a Blog model
import Booking from '../Models/TourBookingModel.js';   // Add this if you have a Tour model
import AchievementModel from '../Models/achievementModel.js'; // 'Models' must match the folder name exactly (case matters on Linux)
import fs from 'fs';
import cloudinary from '../utils/Cloudinary.js';
import AppError from '../utils/AppError.js';
import { assertObjectId } from '../utils/cursor.js';

// Profiles are created lazily elsewhere in the app, so following must not depend on both
// people having opened their profile page first.
const ensureProfile = (userId) =>
    ProfileModel.findOneAndUpdate(
        { user: userId },
        { $setOnInsert: { user: userId } },
        { upsert: true, new: true }
    );

// Get profile
export const getProfile = async (req, res) => {
    try {
        let user;
        
        // If accessing /me endpoint or no username provided
        if (req.user) {
            user = req.user;
        } 
        // If accessing /:username endpoint
        else if (req.params.username) {
            user = await UserModel.findOne({ username: req.params.username }).select('-password');
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }

        let profile = await ProfileModel.findOne({ user: user._id })
            .populate('achievements')
            .populate('followers', 'username avatar firstName lastName')
            .populate('following', 'username avatar firstName lastName')
            .populate({
                path: 'savedPosts',
                populate: { path: 'user', select: 'username avatar' }
            })
            .populate({
                path: 'savedBlogs',
                populate: { path: 'author', select: 'username avatar' }
            })
            .populate({
                path: 'savedTours',
                populate: { path: 'organizer', select: 'username avatar' }
            });

        // If profile doesn't exist, create one
        if (!profile) {
            profile = await ProfileModel.create({
                user: user._id,
                bio: '',
                location: '',
                interests: [],
                socialLinks: []
            });
            await profile.populate('user', '-password');
        }

        // Only populate additional fields if the models exist
        try {
            if (profile.savedPosts?.length > 0) {
                await profile.populate({
                    path: 'savedPosts',
                    populate: { path: 'user', select: 'username avatar' }
                });
            }
            
            if (profile.savedBlogs?.length > 0) {
                await profile.populate({
                    path: 'savedBlogs',
                    populate: { path: 'author', select: 'username avatar' }
                });
            }
            
            if (profile.savedTours?.length > 0) {
                await profile.populate({
                    path: 'savedTours',
                    populate: { path: 'organizer', select: 'username avatar' }
                });
            }
        } catch (populateError) {
            console.error('Population error:', populateError);
            // Continue without populated fields
        }

        // Send response
        res.status(200).json({
            success: true,
            data: {
                user,
                profile
            }
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error fetching profile'
        });
    }
};

// Update profile
export const updateProfile = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            bio,
            location,
            occupation,
            website,
            interests,
            socialLinks
        } = req.body;

        // Find and update user basic info
        let updatedUser = await UserModel.findByIdAndUpdate(
            req.user._id,
            { firstName, lastName },
            { new: true }
        ).select('-password');

        // Find and update profile info
        let profile = await ProfileModel.findOneAndUpdate(
            { user: req.user._id },
            {
                bio,
                location,
                occupation,
                website,
                interests,
                socialLinks
            },
            { new: true, upsert: true }
        );

        // If profile doesn't exist, create it
        if (!profile) {
            profile = await ProfileModel.create({
                user: req.user._id,
                bio,
                location,
                occupation,
                website,
                interests,
                socialLinks
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: updatedUser,
                profile
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating profile'
        });
    }
};

// Update profile picture
export const updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        let imageUrl;

        // If using cloudinary
        if (process.env.USE_CLOUDINARY === 'true') {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'profile_pictures',
                width: 500,
                height: 500,
                crop: 'fill'
            });
            imageUrl = result.secure_url;
            
            // Delete local file after upload to cloudinary
            fs.unlinkSync(req.file.path);
        } else {
            // If using local storage
            imageUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            req.user._id,
            { avatar: imageUrl },
            { new: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            data: updatedUser
        });
    } catch (error) {
        // Delete uploaded file if there's an error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        console.error('Profile picture update error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile picture'
        });
    }
};

export const updateCoverPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        let imageUrl;

        if (process.env.USE_CLOUDINARY === 'true') {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'cover_photos',
                width: 1200,
                height: 400,
                crop: 'fill'
            });
            imageUrl = result.secure_url;
            fs.unlinkSync(req.file.path);
        } else {
            imageUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;
        }

        const updatedProfile = await ProfileModel.findOneAndUpdate(
            { user: req.user._id },
            { coverImage: imageUrl },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: updatedProfile
        });
    } catch (error) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        console.error('Cover photo update error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating cover photo'
        });
    }
};

// Add profile photo
export const addProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            throw new AppError('No file uploaded', 400);
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'profile_photos'
        });

        const newPhoto = {
            url: result.secure_url,
            caption: req.body.caption,
            location: req.body.location
        };

        const profile = await ProfileModel.findOneAndUpdate(
            { user: req.user._id },
            { $push: { photos: newPhoto } },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: profile.photos[profile.photos.length - 1]
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Follow user
export const followUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (userId === req.user._id.toString()) {
            throw new AppError('You cannot follow yourself', 400);
        }

        assertObjectId(userId, 'user id');
        if (!(await UserModel.exists({ _id: userId }))) {
            throw new AppError('User not found', 404);
        }

        const [userProfile] = await Promise.all([
            ensureProfile(req.user._id),
            ensureProfile(userId)
        ]);

        if (userProfile.following.some((id) => id.toString() === userId)) {
            throw new AppError('You are already following this user', 400);
        }

        await Promise.all([
            ProfileModel.findOneAndUpdate(
                { user: req.user._id },
                { $push: { following: userId } }
            ),
            ProfileModel.findOneAndUpdate(
                { user: userId },
                { $push: { followers: req.user._id } }
            )
        ]);

        res.status(200).json({
            success: true,
            message: 'Successfully followed user'
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Unfollow user
export const unfollowUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (userId === req.user._id.toString()) {
            throw new AppError('You cannot unfollow yourself', 400);
        }

        await Promise.all([
            ProfileModel.findOneAndUpdate(
                { user: req.user._id },
                { $pull: { following: userId } }
            ),
            ProfileModel.findOneAndUpdate(
                { user: userId },
                { $pull: { followers: req.user._id } }
            )
        ]);

        res.status(200).json({
            success: true,
            message: 'Successfully unfollowed user'
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Get saved items
export const getSavedItems = async (req, res) => {
    try {
        const profile = await ProfileModel.findOne({ user: req.user._id })
            .populate('savedPosts')
            .populate('savedBlogs')
            .populate('savedTours');

        res.status(200).json({
            success: true,
            data: {
                posts: profile.savedPosts,
                blogs: profile.savedBlogs,
                tours: profile.savedTours
            }
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Toggle save item
export const toggleSaveItem = async (req, res) => {
    try {
        const { type, itemId } = req.params;
        const validTypes = ['posts', 'blogs', 'tours'];

        if (!validTypes.includes(type)) {
            throw new AppError('Invalid item type', 400);
        }

        const profile = await ProfileModel.findOne({ user: req.user._id });
        const savedField = `saved${type.charAt(0).toUpperCase() + type.slice(1)}`;
        const isSaved = profile[savedField].includes(itemId);

        const update = isSaved
            ? { $pull: { [savedField]: itemId } }
            : { $push: { [savedField]: itemId } };

        await ProfileModel.findOneAndUpdate(
            { user: req.user._id },
            update
        );

        res.status(200).json({
            success: true,
            message: isSaved ? 'Item unsaved' : 'Item saved'
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Get profile stats
export const getStats = async (req, res) => {
    try {
        const profile = await ProfileModel.findOne({ user: req.user._id });
        
        res.status(200).json({
            success: true,
            data: profile.stats
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Get photos
export const getPhotos = async (req, res) => {
    try {
        const profile = await ProfileModel.findOne({ user: req.user._id })
            .select('photos');

        res.status(200).json({
            success: true,
            data: profile.photos
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Like photo
export const likePhoto = async (req, res) => {
    try {
        const { photoId } = req.params;
        const profile = await ProfileModel.findOne({ user: req.user._id });
        
        // Find the photo
        const photo = profile.photos.id(photoId);
        if (!photo) {
            throw new AppError('Photo not found', 404);
        }

        // Check if already liked
        if (photo.likes.includes(req.user._id)) {
            throw new AppError('Photo already liked', 400);
        }

        // Add like
        photo.likes.push(req.user._id);
        await profile.save();

        res.status(200).json({
            success: true,
            data: photo
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Unlike photo
export const unlikePhoto = async (req, res) => {
    try {
        const { photoId } = req.params;
        const profile = await ProfileModel.findOne({ user: req.user._id });
        
        // Find the photo
        const photo = profile.photos.id(photoId);
        if (!photo) {
            throw new AppError('Photo not found', 404);
        }

        // Remove like
        photo.likes = photo.likes.filter(id => id.toString() !== req.user._id.toString());
        await profile.save();

        res.status(200).json({
            success: true,
            data: photo
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Add comment to photo
export const commentOnPhoto = async (req, res) => {
    try {
        const { photoId } = req.params;
        const { text } = req.body;

        if (!text) {
            throw new AppError('Comment text is required', 400);
        }

        const profile = await ProfileModel.findOne({ user: req.user._id });
        const photo = profile.photos.id(photoId);

        if (!photo) {
            throw new AppError('Photo not found', 404);
        }

        const comment = {
            user: req.user._id,
            text,
            createdAt: new Date()
        };

        photo.comments.push(comment);
        await profile.save();

        // Populate user info for the new comment
        const populatedComment = await UserModel.populate(comment, {
            path: 'user',
            select: 'username avatar firstName lastName'
        });

        res.status(201).json({
            success: true,
            data: populatedComment
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete comment
export const deleteComment = async (req, res) => {
    try {
        const { photoId, commentId } = req.params;
        const profile = await ProfileModel.findOne({ user: req.user._id });
        
        const photo = profile.photos.id(photoId);
        if (!photo) {
            throw new AppError('Photo not found', 404);
        }

        // Find and verify comment ownership
        const comment = photo.comments.id(commentId);
        if (!comment) {
            throw new AppError('Comment not found', 404);
        }

        if (comment.user.toString() !== req.user._id.toString()) {
            throw new AppError('Not authorized to delete this comment', 403);
        }

        photo.comments.pull(commentId);
        await profile.save();

        res.status(200).json({
            success: true,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

export default {
    getProfile,
    updateProfile,
    updateProfilePicture,
    updateCoverPhoto,
    addProfilePhoto,
    followUser,
    unfollowUser,
    getSavedItems,
    toggleSaveItem,
    getStats,
    getPhotos,
    likePhoto,
    unlikePhoto,
    commentOnPhoto,
    deleteComment
};