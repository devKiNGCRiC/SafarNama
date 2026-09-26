// Validates and whitelists eco-guide fields from a request body (JSON or multipart).
// Only these fields can ever be set by a client - never author, likes or comments.
import { GUIDE_CATEGORIES } from "../Models/ecoGuideModel.js";

export const MAX_TAGS = 8;
export const MAX_COMMENTS = 200;

const text = (value) => (typeof value === "string" ? value.trim() : undefined);

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

export const readMinutes = (content = "") => Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));

// `existing` switches to "update" mode: only supplied fields are checked.
export function parseGuideInput(body = {}, existing = null) {
  const errors = [];
  const data = {};
  const creating = existing === null;
  const has = (key) => body[key] !== undefined;

  if (creating || has("title")) {
    const title = text(body.title);
    if (!title || title.length < 3 || title.length > 120) errors.push("Title must be 3 to 120 characters");
    else data.title = title;
  }

  if (creating || has("category")) {
    if (!GUIDE_CATEGORIES.includes(body.category)) errors.push("Unknown guide category");
    else data.category = body.category;
  }

  if (creating || has("content")) {
    const content = text(body.content);
    if (!content || content.length < 50 || content.length > 20000) {
      errors.push("Content must be 50 to 20000 characters");
    } else data.content = content;
  }

  if (has("summary")) {
    const summary = text(body.summary) ?? "";
    if (summary.length > 200) errors.push("Summary can be at most 200 characters");
    else data.summary = summary;
  }

  if (has("tags")) {
    const tags = parseTags(body.tags);
    if (tags.length > MAX_TAGS || tags.some((t) => t.length > 30)) {
      errors.push(`Use at most ${MAX_TAGS} tags of up to 30 characters each`);
    } else data.tags = tags;
  }

  return { data, errors };
}
