export const CATEGORY_LABELS = {
  SUSTAINABLE_TIPS: "Sustainable tips",
  BEST_PRACTICES: "Best practices",
  LOCAL_GUIDE: "Local guides",
};

export const CATEGORY_HINTS = {
  SUSTAINABLE_TIPS: "Tips for eco-friendly travel",
  BEST_PRACTICES: "Guidelines for responsible tourism",
  LOCAL_GUIDE: "Local insights and recommendations",
};

export const categoryLabel = (category) => CATEGORY_LABELS[category] || "Guide";

export const readTimeText = (minutes) => `${Math.max(1, Number(minutes) || 1)} min read`;

// Article text is shown as plain paragraphs (blank line = new paragraph); it is never treated as HTML.
export function splitParagraphs(content) {
  if (typeof content !== "string") return [];
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export const tagsToInput = (tags) => (Array.isArray(tags) ? tags.join(", ") : "");

export function formatDay(value, timeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone }).format(date);
}
