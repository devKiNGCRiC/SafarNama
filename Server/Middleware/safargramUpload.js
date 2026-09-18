import multer from "multer";
import os from "os";
import path from "path";
import crypto from "crypto";
import fs from "fs/promises";
import AppError from "../utils/AppError.js";
import { MEDIA_LIMITS, mediaKind } from "../utils/safargramMediaRules.js";

// Files land in the OS temp folder (not memory, so 50 MB videos are safe) and are
// removed by the controller after the Cloudinary upload.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) =>
    cb(
      null,
      `safargram-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${path
        .extname(file.originalname)
        .toLowerCase()}`,
    ),
});

export const uploadMedia = multer({
  storage,
  limits: { fileSize: MEDIA_LIMITS.maxVideoBytes, files: MEDIA_LIMITS.maxImages },
  fileFilter: (req, file, cb) => {
    if (mediaKind(file.mimetype, file.originalname)) return cb(null, true);
    cb(
      new AppError(
        "Only JPG, PNG, WEBP photos and MP4, MOV, WEBM videos are allowed",
        400,
      ),
    );
  },
}).array("media", MEDIA_LIMITS.maxImages);

export async function removeTempFiles(files = []) {
  await Promise.all(files.map((f) => fs.unlink(f.path).catch(() => {})));
}
