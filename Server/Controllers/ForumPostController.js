import ForumPost from '../Models/ForumPostModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const createForumPost = catchAsync(async (req, res) => {
  try{
    const { title, content, tags , category } = req.body;

    // Validate input
    if (!title || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'Title and content are required'
      });
    }

    const forumPost = await ForumPost.create({
      title,
      content,
      tags,
      category,
      author: req.user._id,
    });

    await forumPost.populate('author', 'name avatar');
    res.status(201).json({
      status: 'success',
      data: forumPost,
    });
  }catch (error) {
    console.error('Post Creation Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export const getForumPosts = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = 'recent',
    tag,
    search,
  } = req.query;

  // Build query
  const query = { status: 'active' };

  if (tag) {
    query.tags = tag;
  }

  if (search) {
    query.$text = { $search: search };
  }

  // Build sort options
  let sortOption = {};
  if (sort === 'trending') {
    sortOption = { views: -1, likes: -1, createdAt: -1 };
  } else if (sort === 'recent') {
    sortOption = { createdAt: -1 };
  }

  const forumPosts = await ForumPost.find(query)
    .sort(sortOption)
    .populate('author', 'name avatar')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await ForumPost.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: forumPosts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
    },
  });
});

export const getForumPostById = catchAsync(async (req, res) => {
  const forumPost = await ForumPost.findById(req.params.id)
    .populate('author', 'name avatar')
    .populate('comments.user', 'name avatar');

  if (!forumPost) {
    throw new AppError('Post not found', 404);
  }

  // Increment views
  post.views += 1;
  await forumPost.save();

  res.status(200).json({
    status: 'success',
    data: forumPost,
  });
});

export const updateForumPost = catchAsync(async (req, res) => {
  const { title, content, tags } = req.body;

  const forumPost = await ForumPost.findById(req.params.id);

  if (!forumPost) {
    throw new AppError('Post not found', 404);
  }

  // Check if user is the author
  if (forumPost.author.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this post', 403);
  }

  forumPost.title = title;
  forumPost.content = content;
  forumPost.tags = tags;

  await forumPost.save();

  res.status(200).json({
    status: 'success',
    data: post,
  });
});

export const deleteForumPost = catchAsync(async (req, res) => {
  const forumPost = await ForumPost.findById(req.params.id);

  if (!forumPost) {
    throw new AppError('Post not found', 404);
  }

  // Check if user is the author
  if (forumPost.author.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to delete this post', 403);
  }

  await forumPost.remove();

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

export const toggleLike = catchAsync(async (req, res) => {
  const forumPost = await ForumPost.findById(req.params.id);

  if (!forumPost) {
    throw new AppError('Post not found', 404);
  }

  const likeIndex = forumPost.likes.indexOf(req.user._id);

  if (likeIndex === -1) {
    forumPost.likes.push(req.user._id);
  } else {
    forumPost.likes.splice(likeIndex, 1);
  }

  await forumPost.save();

  res.status(200).json({
    status: 'success',
    data: {
      likes: forumPost.likes.length,
      isLiked: likeIndex === -1,
    },
  });
});

export const addForumComment = catchAsync(async (req, res) => {
  const { text } = req.body;

  const forumPost = await ForumPost.findById(req.params.id);

  if (!forumPost) {
    throw new AppError('Post not found', 404);
  }

  forumPost.comments.push({
    user: req.user._id,
    text,
  });

  await forumPost.save();
  await forumPost.populate('comments.user', 'name avatar');

  res.status(201).json({
    status: 'success',
    data: forumPost.comments[forumPost.comments.length - 1],
  });
});

export const toggleBookmark = catchAsync(async (req, res) => {
  const forumPost = await ForumPost.findById(req.params.id);

  if (!forumPost) {
    throw new AppError('Post not found', 404);
  }

  const bookmarkIndex = forumPost.bookmarks.indexOf(req.user._id);

  if (bookmarkIndex === -1) {
    forumPost.bookmarks.push(req.user._id);
  } else {
    forumPost.bookmarks.splice(bookmarkIndex, 1);
  }

  await forumPost.save();

  res.status(200).json({
    status: 'success',
    data: {
      isBookmarked: bookmarkIndex === -1,
    },
  });
});