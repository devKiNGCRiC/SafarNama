const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

// Divider label between days in a thread.
export function dayLabel(date, now = Date.now()) {
  const t = new Date(date);
  if (Number.isNaN(t.getTime())) return "";
  if (sameDay(t, now)) return "Today";
  if (sameDay(t, now - 86_400_000)) return "Yesterday";
  return t.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function displayName(user) {
  if (!user) return "Deleted user";
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return full || user.username || "Deleted user";
}

// The grey line under a conversation title in the inbox.
export function previewText(lastMessage, meId) {
  if (!lastMessage) return "No messages yet";
  if (lastMessage.kind === "system") return lastMessage.text;
  const body = lastMessage.kind === "image" ? `📷 ${lastMessage.text || "Photo"}` : lastMessage.text;
  return String(lastMessage.sender) === String(meId) ? `You: ${body}` : body;
}

// Consecutive messages from one person within 5 minutes share a bubble group.
export function isGrouped(prev, next) {
  if (!prev || !next) return false;
  const a = prev.sender?._id ?? prev.sender;
  const b = next.sender?._id ?? next.sender;
  if (!a || String(a) !== String(b)) return false;
  if (!sameDay(prev.createdAt, next.createdAt)) return false;
  return new Date(next.createdAt) - new Date(prev.createdAt) < 5 * 60_000;
}
