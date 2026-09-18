import express from 'express';
import { verifyToken } from '../Middleware/authMiddleware.js';
import { upload } from '../Middleware/uploadMiddleware.js';
import {
    getProfile,
    updateProfile,
    updateProfilePicture,
    updateCoverPhoto,
    addProfilePhoto,
    //getAchievements,
    followUser,
    unfollowUser,
    getSavedItems,
    toggleSaveItem,
    getPhotos,
    getStats,
    likePhoto,
    unlikePhoto,
    commentOnPhoto,
    deleteComment
} from '../Controllers/profileController.js';

const router = express.Router();

// Profile routes
router.get('/me', verifyToken, getProfile);
router.put('/update', verifyToken, updateProfile);
router.put('/picture', verifyToken, upload.single('avatar'), updateProfilePicture);
router.put('/cover', verifyToken, upload.single('cover'), updateCoverPhoto);

// Photo routes
router.get('/photos', verifyToken, getPhotos);
router.post('/photos', verifyToken, upload.single('photo'), addProfilePhoto);
router.post('/photos/:photoId/like', verifyToken, likePhoto);
router.delete('/photos/:photoId/like', verifyToken, unlikePhoto);
router.post('/photos/:photoId/comments', verifyToken, commentOnPhoto);
router.delete('/photos/:photoId/comments/:commentId', verifyToken, deleteComment);

// Achievement routes
//router.get('/achievements', verifyToken, getAchievements);

// Social routes
router.post('/follow/:userId', verifyToken, followUser);
router.delete('/follow/:userId', verifyToken, unfollowUser);

// Saved items routes
router.get('/saved', verifyToken, getSavedItems);
router.post('/saved/:type/:itemId', verifyToken, toggleSaveItem);

// Stats routes
router.get('/stats', verifyToken, getStats);

// Parameterised routes go LAST. '/:username' matches any single path segment,
// so declared earlier it swallowed /photos, /saved and /stats.
router.get('/:username/followers', getProfile);
router.get('/:username/following', getProfile);
router.get('/:username', getProfile);

export default router;