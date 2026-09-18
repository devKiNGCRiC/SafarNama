import express from "express";
import {
  createBooking,
  getAllBooking,
  getBooking,
  updateBookingStatus,
} from "./../Controllers/bookingController.js";
import { verifyToken } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.post("/", verifyToken, createBooking);
router.get("/:id", verifyToken, getBooking);
router.get("/", verifyToken, getAllBooking);
router.patch("/:id", verifyToken, updateBookingStatus);

export default router;
