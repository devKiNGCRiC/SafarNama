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
//import authMiddleware from '../MiddleWare/authMiddleWare.js';

const router = express.Router();

// Public routes
router.get('/', getForumPosts);
router.get('/:id', getForumPostById);

// Protected routes
router.post('/',  createForumPost);
router.patch('/:id',  updateForumPost);
router.delete('/:id',  deleteForumPost);
router.post('/:id/like',  toggleLike);
router.post('/:id/bookmark',  toggleBookmark);
router.post('/:id/comments',  addForumComment);

export default router;