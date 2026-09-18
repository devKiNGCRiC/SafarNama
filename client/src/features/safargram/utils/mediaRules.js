export const MEDIA_RULES = Object.freeze({
  maxImages: 5,
  maxImageBytes: 8 * 1024 * 1024,
  maxVideoBytes: 50 * 1024 * 1024,
  accept:
    "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm",
});

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export const isVideo = (file) => VIDEO_TYPES.includes(file.type);

// Mirrors the server rules so users get instant feedback (the server re-checks).
export function validateSelection(files) {
  if (files.length === 0) return null;
  for (const f of files) {
    if (!IMAGE_TYPES.includes(f.type) && !VIDEO_TYPES.includes(f.type)) {
      return "Only JPG, PNG, WEBP photos and MP4, MOV, WEBM videos are allowed";
    }
  }
  const videos = files.filter(isVideo);
  const images = files.length - videos.length;
  if (videos.length > 0 && images > 0) return "A post can have photos or one video, not both";
  if (videos.length > 1) return "A post can have only one video";
  if (images > MEDIA_RULES.maxImages) return "You can add up to 5 photos";
  if (files.some((f) => !isVideo(f) && f.size > MEDIA_RULES.maxImageBytes)) {
    return "Each photo must be 8 MB or smaller";
  }
  if (videos.some((f) => f.size > MEDIA_RULES.maxVideoBytes)) {
    return "Video must be 50 MB or smaller (and up to 60 seconds)";
  }
  return null;
}
