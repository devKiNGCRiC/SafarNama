export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

// Same rules as the server (which stays the judge); this only gives an instant answer.
// Returns a message, or null when the file can be uploaded.
export function fileProblem(file) {
  if (!file) return "Please choose a photo";
  if (!TYPES.includes(file.type)) return "Only JPG, PNG or WEBP photos are allowed";
  if (file.size > MAX_PHOTO_BYTES) return "That photo is larger than 8 MB";
  return null;
}

// height / width for the grid tile, kept between tall and wide limits so no tile is extreme.
export function tileRatio(photo) {
  const ratio = photo?.width && photo?.height ? photo.height / photo.width : 1;
  return Math.min(1.6, Math.max(0.6, ratio));
}

export const photoAlt = (photo) =>
  [photo?.caption, photo?.location && `in ${photo.location}`].filter(Boolean).join(" ") || "Travel photo";

export function formatDay(value, timeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone }).format(date);
}

// Index of the neighbour photo (or null at the ends) for the viewer's arrows.
export function neighbour(items, id, step) {
  const index = items.findIndex((p) => p._id === id);
  if (index === -1) return null;
  const next = index + step;
  return next >= 0 && next < items.length ? items[next]._id : null;
}
