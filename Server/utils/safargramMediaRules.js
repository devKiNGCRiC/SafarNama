import path from "path";

export const MEDIA_LIMITS = Object.freeze({
  maxImages: 5,
  maxImageBytes: 8 * 1024 * 1024,
  maxVideoBytes: 50 * 1024 * 1024,
  maxVideoSeconds: 60,
});

const IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};
const VIDEO_TYPES = {
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
  "video/webm": [".webm"],
};

export function mediaKind(mimetype, originalname) {
  const ext = path.extname(originalname || "").toLowerCase();
  if (IMAGE_TYPES[mimetype]?.includes(ext)) return "image";
  if (VIDEO_TYPES[mimetype]?.includes(ext)) return "video";
  return null;
}

// Returns a human-readable problem, or null when the upload is acceptable.
export function validateMediaFiles(files) {
  if (!files || files.length === 0) return "Add at least one photo or a video";

  const kinds = files.map((f) => mediaKind(f.mimetype, f.originalname));
  if (kinds.includes(null)) {
    return "Only JPG, PNG, WEBP photos and MP4, MOV, WEBM videos are allowed";
  }

  const videos = kinds.filter((k) => k === "video").length;
  const images = kinds.length - videos;
  if (videos > 0 && images > 0) return "A post can have photos or one video, not both";
  if (videos > 1) return "A post can have only one video";
  if (images > MEDIA_LIMITS.maxImages) return "You can add up to 5 photos";

  for (const [i, file] of files.entries()) {
    if (kinds[i] === "image" && file.size > MEDIA_LIMITS.maxImageBytes) {
      return "Each photo must be 8 MB or smaller";
    }
    if (kinds[i] === "video" && file.size > MEDIA_LIMITS.maxVideoBytes) {
      return "Video must be 50 MB or smaller";
    }
  }
  return null;
}
