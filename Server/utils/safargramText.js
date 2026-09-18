// Letters/digits/underscore, 1-50 long. The lookahead rejects over-long tags
// instead of silently truncating them.
const TAG_RE = /#([\p{L}\p{M}\p{N}_]{1,50})(?![\p{L}\p{M}\p{N}_])/gu;
export const MAX_HASHTAGS = 30;

export function extractHashtags(caption) {
  const tags = new Set();
  for (const match of String(caption ?? "").matchAll(TAG_RE)) {
    tags.add(match[1].toLowerCase());
    if (tags.size >= MAX_HASHTAGS) break;
  }
  return [...tags];
}
