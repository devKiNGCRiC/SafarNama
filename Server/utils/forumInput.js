// Validates and whitelists forum thread fields. Only these can ever be set by a client -
// never author, likes, pinned, locked, replyCount or acceptedReply.
import { FORUM_CATEGORIES } from "../Models/forumThreadModel.js";
import { parseTags } from "./tags.js";

export const MAX_FORUM_TAGS = 5;

const text = (value) => (typeof value === "string" ? value.trim() : undefined);

// `existing` switches to "update" mode: only supplied fields are checked.
export function parseThreadInput(body = {}, existing = null) {
  const errors = [];
  const data = {};
  const creating = existing === null;
  const has = (key) => body[key] !== undefined;

  if (creating || has("title")) {
    const title = text(body.title);
    if (!title || title.length < 5 || title.length > 140) errors.push("Title must be 5 to 140 characters");
    else data.title = title;
  }

  if (creating || has("content")) {
    const content = text(body.content);
    if (!content || content.length < 10 || content.length > 5000) errors.push("Content must be 10 to 5000 characters");
    else data.content = content;
  }

  if (creating || has("category")) {
    const category = has("category") ? body.category : "GENERAL";
    if (!FORUM_CATEGORIES.includes(category)) errors.push("Unknown forum category");
    else data.category = category;
  }

  if (has("tags")) {
    const tags = parseTags(body.tags);
    if (tags.length > MAX_FORUM_TAGS || tags.some((t) => t.length > 30)) {
      errors.push(`Use at most ${MAX_FORUM_TAGS} tags of up to 30 characters each`);
    } else data.tags = tags;
  }

  return { data, errors };
}

// A reply is just text: 1 to 2000 characters.
export function parseReplyContent(value) {
  const content = text(value);
  if (!content || content.length > 2000) return { error: "A reply must be 1 to 2000 characters" };
  return { content };
}
