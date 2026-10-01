import multer from "multer";
import os from "os";
import path from "path";
import crypto from "crypto";
import AppError from "../utils/AppError.js";
import { MEDIA_LIMITS, mediaKind } from "../utils/safargramMediaRules.js";

// One photo or video (field "media"), kept in the OS temp folder until Cloudinary has it.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) =>
    cb(null, `story-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${path.extname(file.originalname).toLowerCase()}`),
});

export const uploadStoryMedia = multer({
  storage,
  limits: { fileSize: MEDIA_LIMITS.maxVideoBytes, files: 1 },
  fileFilter: (req, file, cb) => {
    if (mediaKind(file.mimetype, file.originalname)) return cb(null, true);
    cb(new AppError("Only JPG, PNG, WEBP photos and MP4, MOV, WEBM videos are allowed", 400));
  },
}).single("media");
