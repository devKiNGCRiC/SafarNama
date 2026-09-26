// Web addresses and names shown on a profile. Same rules as the server (utils/safeUrl.js): only
// http(s) links are ever turned into clickable links, so a bad value can never run a script.

export function safeHref(value) {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw || raw.length > 200) return null;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(raw);
  if (scheme && !/^https?$/i.test(scheme[1]) && !/^[a-z0-9.-]+:\d+/i.test(raw)) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (!url.hostname.includes(".") || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

// "https://www.example.com/x" -> "example.com" (or "" when the link is not usable)
export function hostnameOf(value) {
  const href = safeHref(value);
  return href ? new URL(href).hostname.replace(/^www\./, "") : "";
}

export const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "twitter", label: "X (Twitter)" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "youtube", label: "YouTube" },
];

export const platformLabel = (id) => SOCIAL_PLATFORMS.find((p) => p.id === id)?.label || id;

export function fullName(user) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
}

// Usernames are unique regardless of capitals, so /profile/Asha and /profile/asha are the same person.
export function sameUsername(a, b) {
  return typeof a === "string" && typeof b === "string" && a.toLowerCase() === b.toLowerCase();
}
