import express from 'express';
import { verifyToken, optionalAuth } from '../Middleware/authMiddleware.js';
import { upload } from '../Middleware/uploadMiddleware.js';
import {
    listSavedDestinations,
    saveDestination,
    unsaveDestination
} from '../Controllers/savedDestinationController.js';
import {
    getProfile,
    updateProfile,
    updateProfilePicture,
    updateCoverPhoto,
    //getAchievements,
    followUser,
    unfollowUser,
    getSavedItems,
    toggleSaveItem,
    getStats,
} from '../Controllers/profileController.js';

const router = express.Router();

// Profile routes
router.get('/me', verifyToken, getProfile);
router.put('/update', verifyToken, updateProfile);
router.put('/picture', verifyToken, upload.single('avatar'), updateProfilePicture);
router.put('/cover', verifyToken, upload.single('cover'), updateCoverPhoto);

// (Travel photos live in the Gallery: /api/v1/gallery)

// Achievement routes
//router.get('/achievements', verifyToken, getAchievements);

// Social routes
router.post('/follow/:userId', verifyToken, followUser);
router.delete('/follow/:userId', verifyToken, unfollowUser);

// Saved items routes
router.get('/saved', verifyToken, getSavedItems);
router.post('/saved/:type/:itemId', verifyToken, toggleSaveItem);

// Saved destinations (stored on the user; see savedDestinationController.js)
router.get('/saved-destinations', verifyToken, listSavedDestinations);
router.post('/saved-destinations/:id', verifyToken, saveDestination);
router.delete('/saved-destinations/:id', verifyToken, unsaveDestination);

// Stats routes
router.get('/stats', verifyToken, getStats);

// Parameterised routes go LAST. '/:username' matches any single path segment,
// so declared earlier it swallowed /saved and /stats.
router.get('/:username/followers', optionalAuth, getProfile);
router.get('/:username/following', optionalAuth, getProfile);
router.get('/:username', optionalAuth, getProfile);

export default router;