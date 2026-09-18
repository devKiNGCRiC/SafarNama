import multer from "multer";
import os from "os";
import path from "path";
import crypto from "crypto";
import AppError from "../utils/AppError.js";
import { MEDIA_LIMITS, mediaKind } from "../utils/safargramMediaRules.js";

// One photo per message, kept in the OS temp folder until Cloudinary has it.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) =>
    cb(
      null,
      `chat-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${path
        .extname(file.originalname)
        .toLowerCase()}`,
    ),
});

export const uploadChatImage = multer({
  storage,
  limits: { fileSize: MEDIA_LIMITS.maxImageBytes, files: 1 },
  fileFilter: (req, file, cb) => {
    if (mediaKind(file.mimetype, file.originalname) === "image") return cb(null, true);
    cb(new AppError("Only JPG, PNG or WEBP photos can be sent", 400));
  },
}).single("media");
