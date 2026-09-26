export const CATEGORY_LABELS = {
  GENERAL: "General",
  TRIP_HELP: "Trip help",
  TRAVEL_TIPS: "Travel tips",
  ECO_PRACTICES: "Eco practices",
  LOCAL_KNOWLEDGE: "Local knowledge",
  MEETUPS: "Meetups",
};

export const CATEGORY_HINTS = {
  GENERAL: "Anything about travel and the community",
  TRIP_HELP: "Ask for help planning a trip",
  TRAVEL_TIPS: "Share what worked for you",
  ECO_PRACTICES: "Travelling lightly and responsibly",
  LOCAL_KNOWLEDGE: "Insider advice about a place",
  MEETUPS: "Find travel buddies and events",
};

export const categoryLabel = (category) => CATEGORY_LABELS[category] || "General";

export function replyCountText(count) {
  const n = Number(count) || 0;
  if (n === 0) return "No replies yet";
  return n === 1 ? "1 reply" : `${n} replies`;
}

// Small badges shown on a thread, most important first.
export function threadBadges(thread) {
  const badges = [];
  if (thread?.isPinned) badges.push({ id: "pinned", label: "Pinned" });
  if (thread?.hasAcceptedAnswer) badges.push({ id: "answered", label: "Answered" });
  if (thread?.isLocked) badges.push({ id: "locked", label: "Locked" });
  return badges;
}

export const tagsToInput = (tags) => (Array.isArray(tags) ? tags.join(", ") : "");

// What is wrong with a thread form (null when it can be sent). The server checks again.
export function threadFormError({ title, content }) {
  const t = (title || "").trim();
  const c = (content || "").trim();
  if (t.length < 5) return "The title needs at least 5 characters";
  if (t.length > 140) return "The title can be at most 140 characters";
  if (c.length < 10) return "Please write at least 10 characters";
  if (c.length > 5000) return "The post can be at most 5000 characters";
  return null;
}

// Paragraphs are shown as plain text (blank line = new paragraph); never as HTML.
export function splitParagraphs(content) {
  if (typeof content !== "string") return [];
  return content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

// Put the accepted answer first among the replies already loaded, keep the rest in order.
export function withAcceptedFirst(replies) {
  const accepted = replies.filter((r) => r.isAccepted);
  return [...accepted, ...replies.filter((r) => !r.isAccepted)];
}
