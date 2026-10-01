export const MAX_STORY_BYTES = 50 * 1024 * 1024; // matches the server's video limit
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

// Same rules as the server (which stays the judge); this just gives an instant answer.
// Returns a message, or null when the file can be uploaded.
export function storyFileProblem(file) {
  if (!file) return "Please choose a photo or video";
  if (![...IMAGE_TYPES, ...VIDEO_TYPES].includes(file.type)) return "Only JPG, PNG, WEBP photos and MP4, MOV, WEBM videos are allowed";
  if (file.size > MAX_STORY_BYTES) return "That file is larger than 50 MB";
  return null;
}

// How long each story holds the screen before auto-advancing (images: a fixed read time;
// videos: their own length, capped so a long clip cannot stall the viewer).
export function storyDurationMs(story) {
  if (story?.media?.type === "video" && story.media.duration) {
    return Math.min(60, Math.max(3, story.media.duration)) * 1000;
  }
  return 5000;
}

export function timeLeftLabel(expiresAt, now = Date.now()) {
  const ms = new Date(expiresAt).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return "Expired";
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours}h left`;
  const minutes = Math.max(1, Math.floor(ms / 60_000));
  return `${minutes}m left`;
}

// The group (and story index within it) that should open when a particular ring is tapped.
export function openAt(groups, authorId) {
  const groupIndex = groups.findIndex((g) => g.author._id === authorId);
  return groupIndex === -1 ? null : { groupIndex, storyIndex: 0 };
}

// Moves to the next story, crossing into the next person's ring when the current one ends.
// Returns null when there is nothing left to show (the viewer should close).
export function advance(groups, position, direction) {
  if (!groups.length || !position) return null;
  let { groupIndex, storyIndex } = position;
  storyIndex += direction;
  while (groupIndex >= 0 && groupIndex < groups.length) {
    const stories = groups[groupIndex].stories;
    if (storyIndex >= 0 && storyIndex < stories.length) return { groupIndex, storyIndex };
    groupIndex += direction;
    storyIndex = direction > 0 ? 0 : (groups[groupIndex]?.stories.length ?? 0) - 1;
  }
  return null;
}
