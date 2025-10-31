import mongoose from 'mongoose';

const forumpostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['active', 'archived', 'reported'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
forumpostSchema.index({ title: 'text', content: 'text' });
forumpostSchema.index({ tags: 1 });
forumpostSchema.index({ createdAt: -1 });

// module.exports = mongoose.model('Post', forumpostSchema);

const ForumPostModel = mongoose.model("ForumPosts", forumpostSchema);
export default ForumPostModel;