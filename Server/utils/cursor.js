import AppError from "./AppError.js";

const OBJECT_ID = /^[a-f\d]{24}$/i;

export function assertObjectId(value, label = "id") {
  if (typeof value !== "string" || !OBJECT_ID.test(value)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
  return value;
}

export function parsePaging(query, { defaultLimit = 10, max = 20 } = {}) {
  let limit =
    query.limit === undefined ? defaultLimit : Number.parseInt(query.limit, 10);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new AppError("Invalid limit", 400);
  }
  limit = Math.min(limit, max);
  const cursor = query.cursor ? assertObjectId(query.cursor, "cursor") : null;
  return { limit, cursor };
}

export const cursorFilter = (cursor) =>
  cursor ? { _id: { $lt: cursor } } : {};

// Callers fetch `limit + 1` rows; the extra row only signals "there is more".
export function toPage(rows, limit) {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? String(page[page.length - 1]._id) : null;
  return { page, nextCursor };
}
