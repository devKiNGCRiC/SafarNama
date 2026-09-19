// Makes user text safe to embed in a RegExp (so "(" or ".*" search literally).
export const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
