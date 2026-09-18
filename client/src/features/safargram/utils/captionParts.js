// Same rule as the server (letters/marks/digits/underscore, 1-50, not followed by more).
const TAG_RE = /#([\p{L}\p{M}\p{N}_]{1,50})(?![\p{L}\p{M}\p{N}_])/gu;

// Returns display segments. Text is never interpreted as HTML - React escapes it.
export function splitCaption(text = "") {
  const source = String(text);
  const parts = [];
  let last = 0;
  for (const match of source.matchAll(TAG_RE)) {
    if (match.index > last) {
      parts.push({ type: "text", value: source.slice(last, match.index) });
    }
    parts.push({ type: "tag", value: match[1] });
    last = match.index + match[0].length;
  }
  if (last < source.length) parts.push({ type: "text", value: source.slice(last) });
  return parts;
}
