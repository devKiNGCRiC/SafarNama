import express from 'express';
import { 
  getForumPosts, 
  getForumPostById, 
  createForumPost, 
  updateForumPost, 
  deleteForumPost, 
  toggleLike, 
  toggleBookmark, 
  addForumComment 
} from '../Controllers/ForumPostController.js';
import { verifyToken } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getForumPosts);
router.get('/:id', getForumPostById);

// Protected routes
router.post('/', verifyToken, createForumPost);
router.patch('/:id', verifyToken, updateForumPost);
router.delete('/:id', verifyToken, deleteForumPost);
router.post('/:id/like', verifyToken, toggleLike);
router.post('/:id/bookmark', verifyToken, toggleBookmark);
router.post('/:id/comments', verifyToken, addForumComment);

export default router;