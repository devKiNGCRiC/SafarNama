import express from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { verifyToken } from "../Middleware/authMiddleware.js";
import AppError from "../utils/AppError.js";

const router = express.Router();

// Only real image types - the destination folder is served statically, so
// allowing e.g. .html would let anyone host a page on this origin.
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    // The client suggests a file name in `req.body.name`. Strip any directory
    // part and unsafe characters so it can never escape public/images.
    const suggested = path
      .basename(String(req.body?.name || ""))
      .replace(/[^\w.-]/g, "_");

    if (suggested && ALLOWED_EXTENSIONS.includes(path.extname(suggested).toLowerCase())) {
      return cb(null, suggested);
    }
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (
      ALLOWED_MIME_TYPES.includes(file.mimetype) &&
      ALLOWED_EXTENSIONS.includes(extension)
    ) {
      return cb(null, true);
    }
    cb(new AppError("Only JPG, PNG, WEBP and GIF images are allowed.", 400));
  },
});

router.post("/", verifyToken, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }
  return res.status(200).json("File uploaded successfully");
});

export default router;
