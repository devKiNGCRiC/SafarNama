// server/models/profileModel.js
import mongoose from 'mongoose';

const ProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    bio: {
        type: String,
        trim: true,
        maxlength: 500
    },
    location: {
        type: String,
        trim: true
    },
    occupation: {
        type: String,
        trim: true
    },
    interests: [{
        type: String,
        trim: true
    }],
    website: {
        type: String,
        trim: true,
        match: [
            /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
            'Please provide a valid URL'
        ]
    },
    socialLinks: [{
        platform: {
            type: String,
            required: true,
            enum: ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube']
        },
        url: {
            type: String,
            required: true
        }
    }],
    photos: [{
        url: String,
        caption: String,
        location: String,
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        comments: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            text: String,
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    coverImage: {
        type: String,
        default: ''
    },
    achievements: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Achievement'
    }],
    stats: {
        totalLikes: {
            type: Number,
            default: 0
        },
        totalPhotos: {
            type: Number,
            default: 0
        },
        totalPosts: {
            type: Number,
            default: 0
        },
        totalBlogs: {
            type: Number,
            default: 0
        },
        totalTours: {
            type: Number,
            default: 0
        }
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    savedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    savedBlogs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog'
    }],
    savedTours: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    }]
}, {
    timestamps: true
});

// Middleware to update stats
ProfileSchema.pre('save', async function(next) {
    if (this.isModified('photos')) {
        this.stats.totalPhotos = this.photos.length;
    }
    next();
});

// Methods
ProfileSchema.methods.follow = async function(userId) {
    if (!this.following.includes(userId)) {
        this.following.push(userId);
        await this.save();
    }
};

ProfileSchema.methods.unfollow = async function(userId) {
    if (this.following.includes(userId)) {
        this.following = this.following.filter(id => id.toString() !== userId.toString());
        await this.save();
    }
};

const ProfileModel = mongoose.model('Profile', ProfileSchema);
export default ProfileModel;