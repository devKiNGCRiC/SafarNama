import express from "express";
import {createBooking, getAllBooking, getBooking} from "./../Controllers/bookingController.js"
// import { verifyUser } from "../utils/verifyToken";
import { verifyToken } from '../Middleware/authMiddleware.js';

const router=express.Router();

router.post("/", verifyToken,createBooking );
router.get("/:id", verifyToken,getBooking);
router.get("/", verifyToken,getAllBooking );

export default router;