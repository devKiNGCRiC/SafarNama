// server/controllers/profileController.js
import UserModel from '../Models/userModel.js';
import ProfileModel from '../Models/profileModel.js';
import BlogModel from '../Models/blogModel.js';
import SafarPost from '../Models/safargramPostModel.js';
import GalleryPhoto from '../Models/galleryPhotoModel.js';
import cloudinary from '../utils/Cloudinary.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { parseProfileInput } from '../utils/profileInput.js';
import { removeTempFiles } from '../Middleware/safargramUpload.js';
import { assertObjectId } from '../utils/cursor.js';
import { shouldUseCloudinary } from '../config/env.js';
import { notify, unnotify } from '../services/notifier.js';

// Profiles are created lazily elsewhere in the app, so following must not depend on both
// people having opened their profile page first.
const ensureProfile = (userId) =>
    ProfileModel.findOneAndUpdate(
        { user: userId },
        { $setOnInsert: { user: userId } },
        { upsert: true, new: true }
    );

// Get profile
// What anyone may see about a person. Email and account details are for the owner only, and
// nothing security-related (tokens, login attempts, role, settings) is ever sent.
const PUBLIC_USER_FIELDS = 'username firstName lastName avatar createdAt';
const person = (u) => (u ? { _id: u._id, username: u.username, avatar: u.avatar || '', firstName: u.firstName, lastName: u.lastName } : null);

export function serializeUser(user, isOwner) {
    return {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar || '',
        createdAt: user.createdAt,
        ...(isOwner ? { email: user.email, isEmailVerified: Boolean(user.isEmailVerified) } : {})
    };
}

export function serializeProfile(profile) {
    const p = profile?.toObject ? profile.toObject() : profile || {};
    return {
        bio: p.bio || '',
        location: p.location || '',
        occupation: p.occupation || '',
        website: p.website || '',
        interests: p.interests || [],
        socialLinks: (p.socialLinks || []).map((l) => ({ platform: l.platform, url: l.url })),
        coverImage: p.coverImage || '',
        followers: (p.followers || []).map(person),
        following: (p.following || []).map(person)
    };
}

const serializeBlog = (b) => ({
    _id: b._id,
    title: b.title,
    excerpt: b.excerpt || '',
    image: b.image,
    category: b.category,
    createdAt: b.createdAt
});

async function buildProfileView(user, viewerId) {
    const isOwner = Boolean(viewerId) && String(viewerId) === String(user._id);
    const profile = await ProfileModel.findOneAndUpdate(
        { user: user._id },
        { $setOnInsert: { user: user._id } },
        { upsert: true, new: true }
    )
        .populate('followers', 'username avatar firstName lastName')
        .populate('following', 'username avatar firstName lastName');

    const [posts, blogCount, photos, blogs] = await Promise.all([
        SafarPost.countDocuments({ author: user._id }),
        BlogModel.countDocuments({ user: user._id }),
        GalleryPhoto.countDocuments({ owner: user._id }),
        BlogModel.find({ user: user._id }).sort({ _id: -1 }).limit(24).select('title excerpt image category createdAt').lean()
    ]);

    return {
        user: serializeUser(user, isOwner),
        profile: serializeProfile(profile),
        counts: {
            followers: profile.followers.length,
            following: profile.following.length,
            posts,
            blogs: blogCount,
            photos
        },
        blogs: blogs.map(serializeBlog),
        isOwnProfile: isOwner
    };
}

export const getProfile = catchAsync(async (req, res) => {
    // "/me" has no :username, so it means the logged-in person
    const username = req.params.username ?? req.user?.username;
    if (!username) throw new AppError('Username is required', 400);

    const user =
        req.params.username === undefined
            ? req.user
            : await UserModel.findOne({ username }).select(`${PUBLIC_USER_FIELDS} email isEmailVerified`);
    if (!user) throw new AppError('Profile not found', 404);

    res.status(200).json({ success: true, data: await buildProfileView(user, req.user?._id) });
});

// Update profile
export const updateProfile = catchAsync(async (req, res) => {
    const { user: userFields, profile: profileFields, errors } = parseProfileInput(req.body);
    if (errors.length) throw new AppError(errors[0], 400);

    const user = Object.keys(userFields).length
        ? await UserModel.findByIdAndUpdate(req.user._id, { $set: userFields }, { new: true })
        : await UserModel.findById(req.user._id);
    if (Object.keys(profileFields).length) {
        await ProfileModel.findOneAndUpdate(
            { user: req.user._id },
            { $set: profileFields },
            { upsert: true }
        );
    }

    res.status(200).json({ success: true, data: await buildProfileView(user, req.user._id) });
});

// Uploads a temp file to Cloudinary (or keeps it locally in development) and returns its address.
async function storeImage(file, options) {
    if (!shouldUseCloudinary()) return `${process.env.BASE_URL}/uploads/${file.filename}`;
    const result = await cloudinary.uploader.upload(file.path, options);
    return result.secure_url;
}

// Update profile picture
export const updateProfilePicture = catchAsync(async (req, res) => {
    if (!req.file) throw new AppError('Please choose a photo to upload', 400);
    try {
        const avatar = await storeImage(req.file, { folder: 'profile_pictures', width: 500, height: 500, crop: 'fill' });
        await UserModel.updateOne({ _id: req.user._id }, { $set: { avatar } });
        res.status(200).json({ success: true, data: { avatar } });
    } finally {
        if (shouldUseCloudinary()) await removeTempFiles([req.file]); // local files are the stored copy in development
    }
});

export const updateCoverPhoto = catchAsync(async (req, res) => {
    if (!req.file) throw new AppError('Please choose a photo to upload', 400);
    try {
        const coverImage = await storeImage(req.file, { folder: 'cover_photos', width: 1200, height: 400, crop: 'fill' });
        await ProfileModel.findOneAndUpdate({ user: req.user._id }, { $set: { coverImage } }, { upsert: true });
        res.status(200).json({ success: true, data: { coverImage } });
    } finally {
        if (shouldUseCloudinary()) await removeTempFiles([req.file]);
    }
});

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

        await notify({ recipient: userId, actor: req.user._id, type: 'follow' });

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

        await unnotify({ type: 'follow', recipient: userId, actor: req.user._id });

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

export default {
    getProfile,
    updateProfile,
    updateProfilePicture,
    updateCoverPhoto,
    followUser,
    unfollowUser,
    getSavedItems,
    toggleSaveItem,
    getStats,
};