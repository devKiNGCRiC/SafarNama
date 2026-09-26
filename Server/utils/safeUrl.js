// Turns what a person typed ("example.com/trip", "https://x.org") into a safe web address, or
// returns null. Only http and https are ever allowed - never javascript:, data:, etc.
export function normalizeWebUrl(value, { maxLength = 200 } = {}) {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw || raw.length > maxLength) return null;

  // A "scheme:" that is not http(s) (javascript:, data:, ftp:, mailto: ...) is refused outright.
  // "example.com:8080" is a host with a port, not a scheme, so it is let through to be parsed.
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(raw);
  if (scheme && !/^https?$/i.test(scheme[1]) && !/^[a-z0-9.-]+:\d+/i.test(raw)) return null;

  let url;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(url.protocol)) return null;
  if (!url.hostname.includes(".") || url.username || url.password) return null;
  return url.href;
}
