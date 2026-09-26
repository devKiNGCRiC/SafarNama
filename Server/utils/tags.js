// Shared by eco-guides and the forum.
// "Packing, Plastic-Free" (or an array) -> ["packing", "plastic-free"], without duplicates
export function parseTags(value) {
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const tags = [];
  for (const raw of list) {
    const tag = String(raw).trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");
    if (tag && !tags.includes(tag)) tags.push(tag);
  }
  return tags;
}
