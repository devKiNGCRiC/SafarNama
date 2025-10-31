import express from 'express';
import { googleAuth, facebookAuth } from '../Controllers/socialAuthController.js';

const router = express.Router();

router.post('/google', googleAuth);
router.post('/facebook', facebookAuth);

export default router;