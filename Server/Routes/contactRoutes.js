import express from 'express';
import { addContact } from '../Controllers/contactController.js';

const router = express.Router();

router.post('/contact', addContact);

export default router;
