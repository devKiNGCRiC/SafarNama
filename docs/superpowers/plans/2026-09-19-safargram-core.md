# SafarGram Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the SafarGram Core: photo/video posts, feed (Discover + Following), likes, comments, Bucket List (saves), profile grids, hashtag and destination pages.

**Architecture:** New Mongoose collections (`SafarPost`, `SafarComment`, `SafarLike`, `SafarSave`) behind a dedicated Express router mounted at `/api/v1/safargram`. Media goes browser → server (temp file) → Cloudinary; the server stores only Cloudinary links. The React client lives in one feature folder, `client/src/features/safargram/`, with local state and a cursor-pagination hook (no new Redux slice).

**Tech Stack:** Node 24 (ESM), Express 4, Mongoose 8, multer, Cloudinary, express-rate-limit 7; React 18 + react-router 6 + SCSS (Vite). Tests: `node:test` + `supertest` + `mongodb-memory-server`.

**Spec:** `docs/superpowers/specs/2026-09-19-safargram-core-design.md`

## Global Constraints

- **Git:** the project owner runs all git commands. **Never run `git add`, `git commit`, `git push` or `git rm`.** At the end of each task, print the suggested commands in the reply for the owner to run.
- Server is ESM (`"type": "module"`); use `import`/`export`, `.js` extensions in relative imports.
- Server code style: reuse `AppError` (`Server/utils/AppError.js`) and `catchAsync` (`Server/utils/catchAsync.js`); auth via `verifyToken` and `isAdmin` from `Server/Middleware/authMiddleware.js`; the acting user is always `req.user` (never a user id from the body).
- Error response shape: `{ success: false, message }`. Media-limit violations and bad input are **400**; invalid/absent token 401; not owner 403; missing resource 404; rate limit 429.
- Ids (`:id`, cursor, `destinationId`) must match `/^[a-f\d]{24}$/i`, otherwise 400.
- Limits (verbatim from spec): 1–5 images **or** exactly one video, never mixed; image ≤ 8 MB; video ≤ 50 MB and ≤ 60 s; caption ≤ 2200 chars; comment 1–500 chars; up to 30 hashtags of 1–50 chars; feed page 10 (max 20); comments page 20; rate limits per user id: create post 20/hour, comment 30/10 min, like/save 200/10 min.
- Categories (enum, default `Other`): `Trekking, Wildlife, Culture, Eco-stay, Beach, Food, Adventure, Other`.
- Allowed media: JPG/PNG/WEBP images; MP4/MOV/WEBM video. Cloudinary folder `safarnama/safargram`; images resized to width ≤ 1440 (`crop: limit`, `quality: auto`, `fetch_format: auto`).
- Cursor pagination: cursor = `_id` of the last returned item; next page is `_id < cursor`; response `{ success, data, nextCursor }` (`nextCursor` null on the last page).
- No new runtime dependencies. Dev-only additions: `mongodb-memory-server`, `supertest` (Server). No new client dependencies.
- Client: API base comes from `client/src/config/api.js` (`http`, `API_URL`); current user from `state.auth.user` (login user object has `id`, not `_id`, so compare with `user?.id || user?._id`).
- Branding: wordmark "Safar" red `#ff0000` + "Gram" saffron gradient `#ffd700 → #ff9933 → #ff6b35`, font Shrikhand (already loaded in `App.css`); tokens from `client/src/styles/indian-theme.css` (`--cream-marble`, `--saffron-primary`, `--red-sindoor`, `--forest-green`); "Save" is labelled "Add to Bucket List".
- Real MongoDB must never be touched by tests; tests use `mongodb-memory-server`.

---

## File Structure

**Server (create)**
- `Server/Models/safargramPostModel.js`, `safargramCommentModel.js`, `safargramLikeModel.js`, `safargramSaveModel.js`
- `Server/utils/safargramText.js` (hashtag extraction), `safargramMediaRules.js` (limits + file validation), `cursor.js` (id check + paging helpers)
- `Server/services/safargramMedia.js` (Cloudinary upload/remove), `safargramSerializer.js` (post → API shape), `safargramFeed.js` (list queries)
- `Server/Middleware/safargramUpload.js` (multer temp-file upload), `safargramLimits.js` (per-user rate limiters)
- `Server/Controllers/safargram/feedController.js`, `postController.js`, `reactionController.js`, `commentController.js`
- `Server/Routes/safargramRoutes.js` (`createSafargramRouter({ media, limits })`, default export = ready router)
- `Server/tests/**` (helpers + one test file per unit)

**Server (modify)**
- `Server/Middleware/errorHandler.js` (convert known errors before the dev/prod branch)
- `Server/index.js` (mount router; later remove `/posts`)
- `Server/package.json` (`test` script, dev deps)

**Client (create)** — all under `client/src/features/safargram/`
- `api.js`, `hooks/useCursorList.js`, `utils/captionParts.js` (+ `.test.js`), `utils/timeAgo.js` (+ `.test.js`), `utils/mediaRules.js`
- `components/Wordmark.jsx`, `MediaCarousel.jsx`, `CaptionText.jsx`, `PostCard.jsx`, `PostGrid.jsx`, `CreatePostModal.jsx`, `DestinationPicker.jsx`, `CommentList.jsx`, `ProfileSafarGrid.jsx`, `ProfileBucketList.jsx`
- `pages/FeedPage.jsx`, `PostPage.jsx`, `TagPage.jsx`, `DestinationPostsPage.jsx`
- `safargram.scss`

**Client (modify):** `App.jsx` (routes), `Components/Navbar/Navbar.jsx` (link), `Components/Profile/ProfileTabs/ProfileTabs.jsx` (grid + Bucket List, fix missing `Navigation` import), `Pages/Profile/Profile.jsx` (pass `username`), `Pages/Destination/DestinationDetail.jsx` (link), `client/package.json` (`test` script).

**Retired at the end (only after grep proves nothing else uses them):** legacy SafarGram client components/actions/reducers/api files and server `PostRoute.js` + `PostController.js`. (`Models/postModel.js` **stays**: `profileController.js` still imports it.)

All server commands below run from `Server/` in Git Bash. All client commands run from `client/`.

---

## Task 1: Test harness and error-handler hardening

**Why:** every later task is test-first. The error handler must also turn multer/cast/validation errors into 400s in development (today only the production branch does), otherwise tests and dev see 500s.

**Files:**
- Modify: `Server/package.json`, `Server/Middleware/errorHandler.js`
- Create: `Server/tests/helpers/db.js`, `Server/tests/helpers/app.js`, `Server/tests/helpers/users.js`, `Server/tests/errorHandler.test.js`

**Interfaces:**
- Produces: `connectTestDb()`, `clearTestDb()`, `disconnectTestDb()` (helpers/db.js); `buildApp(mountPath, router)` returns an Express app with JSON parsing, a 404 fallthrough and the real `errorHandler` (helpers/app.js); `createUser(overrides?)` → `{ user, token, auth: { Authorization } }` (helpers/users.js).

- [ ] **Step 1: Install dev dependencies and add the test script**

Run: `npm install -D mongodb-memory-server supertest --no-audit --no-fund`

Then edit `Server/package.json` so the `scripts` block contains this `test` entry (keep the other scripts):

```json
"test": "node --test --test-concurrency=1 \"tests/**/*.test.js\""
```

- [ ] **Step 2: Create the test helpers**

`Server/tests/helpers/db.js`:

```js
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod;

export async function connectTestDb() {
  process.env.JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "test-secret-key";
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

export async function clearTestDb() {
  for (const collection of Object.values(mongoose.connection.collections)) {
    await collection.deleteMany({});
  }
}

export async function disconnectTestDb() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}
```

`Server/tests/helpers/app.js`:

```js
import express from "express";
import errorHandler from "../../Middleware/errorHandler.js";
import AppError from "../../utils/AppError.js";

export function buildApp(mountPath, router) {
  const app = express();
  app.use(express.json());
  app.use(mountPath, router);
  app.all("*", (req, res, next) =>
    next(new AppError(`Can't find ${req.originalUrl}`, 404)),
  );
  app.use(errorHandler);
  return app;
}
```

`Server/tests/helpers/users.js`:

```js
import UserModel from "../../Models/userModel.js";
import { createSecureToken } from "../../utils/security.js";

export async function createUser(overrides = {}) {
  const n = Math.random().toString(36).slice(2, 8);
  const user = await UserModel.create({
    username: `user_${n}`,
    email: `${n}@example.com`,
    password: "Str0ng@Pass1",
    firstName: "Test",
    lastName: "User",
    ...overrides,
  });
  const token = createSecureToken(user._id, { userRole: user.role });
  return { user, token, auth: { Authorization: `Bearer ${token}` } };
}
```

- [ ] **Step 3: Write the failing error-handler test**

`Server/tests/errorHandler.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import multer from "multer";
import errorHandler from "../Middleware/errorHandler.js";

function appThrowing(makeError) {
  const app = express();
  app.get("/boom", (req, res, next) => next(makeError()));
  app.use(errorHandler);
  return app;
}

test("CastError becomes 400 (not 500) outside production", async () => {
  const app = appThrowing(
    () => new mongoose.Error.CastError("ObjectId", "abc", "_id"),
  );
  const res = await request(app).get("/boom");
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test("MulterError becomes 400 with a readable message", async () => {
  const app = appThrowing(() => new multer.MulterError("LIMIT_FILE_SIZE"));
  const res = await request(app).get("/boom");
  assert.equal(res.status, 400);
  assert.match(res.body.message, /too large/i);
});

test("unknown errors stay 500", async () => {
  const app = appThrowing(() => new Error("kaboom"));
  const res = await request(app).get("/boom");
  assert.equal(res.status, 500);
});
```

- [ ] **Step 4: Run it and confirm it fails**

Run: `npm test`
Expected: the first two tests FAIL (status 500 instead of 400). (The first run may also download a MongoDB binary; that is normal.)

- [ ] **Step 5: Rewrite the handler so conversions run before the environment branch**

Replace the body of `Server/Middleware/errorHandler.js` from `const handleMulterError` to the end with:

```js
const handleMulterError = (err) => {
  const message =
    err.code === 'LIMIT_FILE_SIZE' ? 'File is too large.' : err.message;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  }

  // Programming or other unknown error: don't leak error details
  console.error('ERROR 💥', err);
  return res.status(500).json({
    success: false,
    status: 'error',
    message: 'Something went wrong!',
  });
};

const globalErrorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  // Known library errors are converted in every environment so clients get a
  // 4xx with a useful message instead of a 500.
  let error = err;
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  else if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  else if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  else if (err.name === 'JsonWebTokenError') error = handleJWTError();
  else if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  else if (err.name === 'MulterError') error = handleMulterError(err);

  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  // Anything that is not explicitly "production" is treated as development.
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.DEV_MODE === 'production';

  return isProduction ? sendErrorProd(error, res) : sendErrorDev(error, res);
};

export default globalErrorHandler;
```

(Keep the existing `handleCastErrorDB`, `handleDuplicateFieldsDB`, `handleValidationErrorDB`, `handleJWTError`, `handleJWTExpiredError` definitions above it unchanged, and remove the old `handleMulterError`, `sendErrorDev`, `sendErrorProd`, `globalErrorHandler` that this replaces.)

- [ ] **Step 6: Run the tests**

Run: `npm test`
Expected: 3 tests PASS.

- [ ] **Step 7: Checkpoint (owner runs)**

```bash
git add Server/package.json Server/package-lock.json Server/Middleware/errorHandler.js Server/tests
git commit -m "Add server test harness and convert known errors in every environment"
```

---

## Task 2: Pure helpers (hashtags, media rules, paging)

**Files:**
- Create: `Server/utils/safargramText.js`, `Server/utils/safargramMediaRules.js`, `Server/utils/cursor.js`
- Test: `Server/tests/safargramText.test.js`, `Server/tests/safargramMediaRules.test.js`, `Server/tests/cursor.test.js`

**Interfaces:**
- Produces:
  - `extractHashtags(caption: string): string[]` (lowercase, unique, ≤ 30, tags of 1–50 letters/digits/underscore)
  - `MEDIA_LIMITS` `{ maxImages: 5, maxImageBytes: 8388608, maxVideoBytes: 52428800, maxVideoSeconds: 60 }`
  - `mediaKind(mimetype: string, originalname: string): 'image' | 'video' | null`
  - `validateMediaFiles(files: {mimetype, originalname, size}[]): string | null` (error message or null)
  - `assertObjectId(value: unknown, label?: string): string` (throws `AppError` 400)
  - `parsePaging(query, { defaultLimit = 10, max = 20 }?): { limit: number, cursor: string | null }`
  - `cursorFilter(cursor: string | null): {} | { _id: { $lt: string } }`
  - `toPage(rows: {_id}[], limit: number): { page: any[], nextCursor: string | null }`

- [ ] **Step 1: Write the failing tests**

`Server/tests/safargramText.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractHashtags } from "../utils/safargramText.js";

test("extracts lowercase unique hashtags in order", () => {
  assert.deepEqual(extractHashtags("Trek #Spiti and #spiti #Snow!"), ["spiti", "snow"]);
});

test("supports unicode tags and underscores", () => {
  assert.deepEqual(extractHashtags("#यात्रा #eco_stay"), ["यात्रा", "eco_stay"]);
});

test("ignores tags longer than 50 characters", () => {
  assert.deepEqual(extractHashtags(`#${"a".repeat(51)} #ok`), ["ok"]);
});

test("caps at 30 tags", () => {
  const caption = Array.from({ length: 40 }, (_, i) => `#t${i}`).join(" ");
  assert.equal(extractHashtags(caption).length, 30);
});

test("returns empty array for no tags or non-string input", () => {
  assert.deepEqual(extractHashtags("no tags here"), []);
  assert.deepEqual(extractHashtags(undefined), []);
});
```

`Server/tests/safargramMediaRules.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateMediaFiles, mediaKind, MEDIA_LIMITS } from "../utils/safargramMediaRules.js";

const img = (n = 1, extra = {}) =>
  Array.from({ length: n }, (_, i) => ({ mimetype: "image/png", originalname: `a${i}.png`, size: 1000, ...extra }));
const vid = (extra = {}) => ({ mimetype: "video/mp4", originalname: "v.mp4", size: 1000, ...extra });

test("mediaKind checks mimetype and extension together", () => {
  assert.equal(mediaKind("image/jpeg", "x.JPG"), "image");
  assert.equal(mediaKind("video/quicktime", "x.mov"), "video");
  assert.equal(mediaKind("image/png", "x.exe"), null);
  assert.equal(mediaKind("image/svg+xml", "x.svg"), null);
});

test("accepts 1-5 images or a single video", () => {
  assert.equal(validateMediaFiles(img(1)), null);
  assert.equal(validateMediaFiles(img(5)), null);
  assert.equal(validateMediaFiles([vid()]), null);
});

test("rejects empty, too many, mixed, multiple videos and unsupported files", () => {
  assert.match(validateMediaFiles([]), /at least one/i);
  assert.match(validateMediaFiles(img(6)), /up to 5/i);
  assert.match(validateMediaFiles([...img(1), vid()]), /not both/i);
  assert.match(validateMediaFiles([vid(), vid()]), /only one video/i);
  assert.match(validateMediaFiles([{ mimetype: "application/pdf", originalname: "a.pdf", size: 1 }]), /allowed/i);
});

test("enforces size limits", () => {
  assert.match(validateMediaFiles(img(1, { size: MEDIA_LIMITS.maxImageBytes + 1 })), /8 MB/);
  assert.match(validateMediaFiles([vid({ size: MEDIA_LIMITS.maxVideoBytes + 1 })]), /50 MB/);
});
```

`Server/tests/cursor.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { assertObjectId, parsePaging, cursorFilter, toPage } from "../utils/cursor.js";

const ID = "64b000000000000000000001";

test("assertObjectId accepts 24-hex ids and rejects everything else with 400", () => {
  assert.equal(assertObjectId(ID), ID);
  for (const bad of ["abc", "", undefined, 123, "zzzzzzzzzzzzzzzzzzzzzzzz"]) {
    assert.throws(() => assertObjectId(bad), (e) => e.statusCode === 400);
  }
});

test("parsePaging applies defaults, clamps and validates", () => {
  assert.deepEqual(parsePaging({}), { limit: 10, cursor: null });
  assert.equal(parsePaging({ limit: "500" }).limit, 20);
  assert.equal(parsePaging({ cursor: ID }).cursor, ID);
  assert.throws(() => parsePaging({ limit: "0" }), (e) => e.statusCode === 400);
  assert.throws(() => parsePaging({ limit: "abc" }), (e) => e.statusCode === 400);
  assert.throws(() => parsePaging({ cursor: "nope" }), (e) => e.statusCode === 400);
});

test("cursorFilter and toPage", () => {
  assert.deepEqual(cursorFilter(null), {});
  assert.deepEqual(cursorFilter(ID), { _id: { $lt: ID } });
  const rows = [{ _id: "3" }, { _id: "2" }, { _id: "1" }];
  assert.deepEqual(toPage(rows, 2), { page: rows.slice(0, 2), nextCursor: "2" });
  assert.deepEqual(toPage(rows, 3), { page: rows, nextCursor: null });
});
```

- [ ] **Step 2: Run and confirm they fail**

Run: `npm test`
Expected: FAIL — "Cannot find module" for the three new util files.

- [ ] **Step 3: Implement the helpers**

`Server/utils/safargramText.js`:

```js
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
```

`Server/utils/safargramMediaRules.js`:

```js
import path from "path";

export const MEDIA_LIMITS = Object.freeze({
  maxImages: 5,
  maxImageBytes: 8 * 1024 * 1024,
  maxVideoBytes: 50 * 1024 * 1024,
  maxVideoSeconds: 60,
});

const IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};
const VIDEO_TYPES = {
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
  "video/webm": [".webm"],
};

export function mediaKind(mimetype, originalname) {
  const ext = path.extname(originalname || "").toLowerCase();
  if (IMAGE_TYPES[mimetype]?.includes(ext)) return "image";
  if (VIDEO_TYPES[mimetype]?.includes(ext)) return "video";
  return null;
}

// Returns a human-readable problem, or null when the upload is acceptable.
export function validateMediaFiles(files) {
  if (!files || files.length === 0) return "Add at least one photo or a video";

  const kinds = files.map((f) => mediaKind(f.mimetype, f.originalname));
  if (kinds.includes(null)) {
    return "Only JPG, PNG, WEBP photos and MP4, MOV, WEBM videos are allowed";
  }

  const videos = kinds.filter((k) => k === "video").length;
  const images = kinds.length - videos;
  if (videos > 0 && images > 0) return "A post can have photos or one video, not both";
  if (videos > 1) return "A post can have only one video";
  if (images > MEDIA_LIMITS.maxImages) return "You can add up to 5 photos";

  for (const [i, file] of files.entries()) {
    if (kinds[i] === "image" && file.size > MEDIA_LIMITS.maxImageBytes) {
      return "Each photo must be 8 MB or smaller";
    }
    if (kinds[i] === "video" && file.size > MEDIA_LIMITS.maxVideoBytes) {
      return "Video must be 50 MB or smaller";
    }
  }
  return null;
}
```

`Server/utils/cursor.js`:

```js
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
```

- [ ] **Step 4: Run and confirm they pass**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 5: Checkpoint (owner runs)**

```bash
git add Server/utils Server/tests
git commit -m "Add SafarGram text, media-rule and paging helpers"
```

---

## Task 3: Models

**Files:**
- Create: `Server/Models/safargramPostModel.js`, `safargramCommentModel.js`, `safargramLikeModel.js`, `safargramSaveModel.js`
- Test: `Server/tests/safargramModels.test.js`

**Interfaces:**
- Produces: default exports `SafarPost`, `SafarComment`, `SafarLike`, `SafarSave` (Mongoose models); named export `CATEGORIES` from the post model.
  - `SafarPost` fields: `author`, `media[{type,url,publicId,width,height,duration}]`, `caption`, `hashtags`, `category`, `destination`, `likesCount`, `commentsCount`, timestamps.
  - `SafarComment`: `post`, `author`, `text`, timestamps. `SafarLike` / `SafarSave`: `post`, `user`, timestamps, unique `{post, user}`.

- [ ] **Step 1: Write the failing test**

`Server/tests/safargramModels.test.js`:

```js
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import SafarPost, { CATEGORIES } from "../Models/safargramPostModel.js";
import SafarComment from "../Models/safargramCommentModel.js";
import SafarLike from "../Models/safargramLikeModel.js";
import SafarSave from "../Models/safargramSaveModel.js";

before(async () => {
  await connectTestDb();
  await Promise.all([SafarPost, SafarComment, SafarLike, SafarSave].map((m) => m.init()));
});
after(disconnectTestDb);
beforeEach(clearTestDb);

const oid = () => new mongoose.Types.ObjectId();
const image = (n = 1) => ({ type: "image", url: `https://cdn.test/${n}.jpg`, publicId: `p${n}` });
const video = () => ({ type: "video", url: "https://cdn.test/v.mp4", publicId: "v1", duration: 12 });

test("a valid post gets sensible defaults", async () => {
  const post = await SafarPost.create({ author: oid(), media: [image()] });
  assert.equal(post.category, "Other");
  assert.equal(post.caption, "");
  assert.deepEqual(post.hashtags, []);
  assert.equal(post.likesCount, 0);
  assert.equal(post.commentsCount, 0);
  assert.equal(post.destination, null);
  assert.ok(CATEGORIES.includes("Eco-stay"));
});

test("media shape rules: 1-5 images or a single video, never mixed", async () => {
  const author = oid();
  await assert.rejects(SafarPost.create({ author, media: [] }), /1 to 5/);
  await assert.rejects(SafarPost.create({ author, media: [1, 2, 3, 4, 5, 6].map(image) }), /1 to 5/);
  await assert.rejects(SafarPost.create({ author, media: [image(1), video()] }), /not both/);
  await assert.rejects(SafarPost.create({ author, media: [video(), video()] }), /not both/);
  await SafarPost.create({ author, media: [video()] });
  await SafarPost.create({ author, media: [1, 2, 3, 4, 5].map(image) });
});

test("caption length and category are validated", async () => {
  const author = oid();
  await assert.rejects(SafarPost.create({ author, media: [image()], caption: "x".repeat(2201) }));
  await assert.rejects(SafarPost.create({ author, media: [image()], category: "Nope" }));
});

test("comment text is trimmed and limited to 1-500 chars", async () => {
  const base = { post: oid(), author: oid() };
  const c = await SafarComment.create({ ...base, text: "  nice  " });
  assert.equal(c.text, "nice");
  await assert.rejects(SafarComment.create({ ...base, text: "   " }));
  await assert.rejects(SafarComment.create({ ...base, text: "x".repeat(501) }));
});

test("a user can like or save a post only once (unique index)", async () => {
  const pair = { post: oid(), user: oid() };
  await SafarLike.create(pair);
  await assert.rejects(SafarLike.create(pair), (e) => e.code === 11000);
  await SafarSave.create(pair);
  await assert.rejects(SafarSave.create(pair), (e) => e.code === 11000);
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npm test`
Expected: FAIL — cannot find the model modules.

- [ ] **Step 3: Implement the models**

`Server/Models/safargramPostModel.js`:

```js
import mongoose from "mongoose";

export const CATEGORIES = [
  "Trekking", "Wildlife", "Culture", "Eco-stay", "Beach", "Food", "Adventure", "Other",
];

const mediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video"], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    width: Number,
    height: Number,
    duration: Number,
  },
  { _id: false },
);

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    media: {
      type: [mediaSchema],
      validate: [
        {
          validator: (items) => items.length >= 1 && items.length <= 5,
          message: "A post needs 1 to 5 media items",
        },
        {
          validator: (items) => {
            const videos = items.filter((m) => m.type === "video").length;
            return videos === 0 || (videos === 1 && items.length === 1);
          },
          message: "A post can have photos or one video, not both",
        },
      ],
    },
    caption: { type: String, default: "", trim: true, maxlength: 2200 },
    hashtags: { type: [String], default: [] },
    category: { type: String, enum: CATEGORIES, default: "Other" },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: "Destination", default: null },
    likesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

postSchema.index({ author: 1, _id: -1 });
postSchema.index({ hashtags: 1, _id: -1 });
postSchema.index({ destination: 1, _id: -1 });

export default mongoose.model("SafarPost", postSchema);
```

`Server/Models/safargramCommentModel.js`:

```js
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "SafarPost", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: 500 },
  },
  { timestamps: true },
);

commentSchema.index({ post: 1, _id: -1 });

export default mongoose.model("SafarComment", commentSchema);
```

`Server/Models/safargramLikeModel.js`:

```js
import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "SafarPost", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

likeSchema.index({ post: 1, user: 1 }, { unique: true });

export default mongoose.model("SafarLike", likeSchema);
```

`Server/Models/safargramSaveModel.js`:

```js
import mongoose from "mongoose";

const saveSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "SafarPost", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

saveSchema.index({ post: 1, user: 1 }, { unique: true });
saveSchema.index({ user: 1, _id: -1 });

export default mongoose.model("SafarSave", saveSchema);
```

- [ ] **Step 4: Run and confirm it passes**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 5: Checkpoint (owner runs)**

```bash
git add Server/Models Server/tests
git commit -m "Add SafarGram post, comment, like and save models"
```

---

## Task 4: Media service (Cloudinary) and test doubles

**Files:**
- Create: `Server/services/safargramMedia.js`, `Server/tests/helpers/fakeMedia.js`
- Test: `Server/tests/safargramMedia.test.js`

**Interfaces:**
- Consumes: `MEDIA_LIMITS`, `mediaKind` (Task 2); the existing default export of `Server/utils/Cloudinary.js` (a configured `cloudinary.v2`).
- Produces:
  - `createCloudinaryMediaService(client = cloudinary)` → `{ upload(file), remove(items) }`
    - `upload(file: { path, mimetype, originalname }): Promise<{ type, url, publicId, width, height, duration? }>`; a video longer than 60 s is deleted and rejected with `AppError(…, 400)`.
    - `remove(items: { type, publicId }[]): Promise<void>` — best effort, never throws.
  - `createFakeMedia({ failOnUpload?, failOnSecond? })` → same interface plus `uploaded[]` and `removed[]` arrays for assertions.

- [ ] **Step 1: Write the failing test**

`Server/tests/safargramMedia.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { createCloudinaryMediaService } from "../services/safargramMedia.js";

function fakeClient({ duration = 10 } = {}) {
  const calls = { upload: [], destroy: [] };
  return {
    calls,
    uploader: {
      async upload(path, options) {
        calls.upload.push({ path, options });
        return {
          secure_url: "https://res.test/x",
          public_id: "safarnama/safargram/x",
          width: 800,
          height: 600,
          duration,
        };
      },
      async destroy(publicId, options) {
        calls.destroy.push({ publicId, options });
        return { result: "ok" };
      },
    },
  };
}

test("images are uploaded resized to 1440px wide into the SafarGram folder", async () => {
  const client = fakeClient();
  const media = createCloudinaryMediaService(client);
  const item = await media.upload({ path: "/tmp/a.png", mimetype: "image/png", originalname: "a.png" });

  assert.deepEqual(item, {
    type: "image",
    url: "https://res.test/x",
    publicId: "safarnama/safargram/x",
    width: 800,
    height: 600,
  });
  const { options } = client.calls.upload[0];
  assert.equal(options.folder, "safarnama/safargram");
  assert.equal(options.resource_type, "image");
  assert.deepEqual(options.transformation[0], { width: 1440, crop: "limit" });
});

test("a video within 60s is accepted and keeps its duration", async () => {
  const media = createCloudinaryMediaService(fakeClient({ duration: 42 }));
  const item = await media.upload({ path: "/tmp/v.mp4", mimetype: "video/mp4", originalname: "v.mp4" });
  assert.equal(item.type, "video");
  assert.equal(item.duration, 42);
});

test("a video longer than 60s is deleted again and rejected", async () => {
  const client = fakeClient({ duration: 61 });
  const media = createCloudinaryMediaService(client);
  await assert.rejects(
    media.upload({ path: "/tmp/v.mp4", mimetype: "video/mp4", originalname: "v.mp4" }),
    (e) => e.statusCode === 400 && /60 seconds/.test(e.message),
  );
  assert.equal(client.calls.destroy.length, 1);
  assert.equal(client.calls.destroy[0].options.resource_type, "video");
});

test("remove() never throws, even when Cloudinary fails", async () => {
  const client = fakeClient();
  client.uploader.destroy = async () => {
    throw new Error("network down");
  };
  const media = createCloudinaryMediaService(client);
  await media.remove([{ type: "image", publicId: "a" }]); // must not throw
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npm test`
Expected: FAIL — cannot find `services/safargramMedia.js`.

- [ ] **Step 3: Implement the service and the fake**

`Server/services/safargramMedia.js`:

```js
import cloudinary from "../utils/Cloudinary.js";
import AppError from "../utils/AppError.js";
import { MEDIA_LIMITS, mediaKind } from "../utils/safargramMediaRules.js";

const FOLDER = "safarnama/safargram";

export function createCloudinaryMediaService(client = cloudinary) {
  async function upload(file) {
    if (mediaKind(file.mimetype, file.originalname) === "video") {
      const result = await client.uploader.upload(file.path, {
        folder: FOLDER,
        resource_type: "video",
      });
      if (result.duration > MEDIA_LIMITS.maxVideoSeconds) {
        await client.uploader
          .destroy(result.public_id, { resource_type: "video" })
          .catch(() => {});
        throw new AppError("Video must be 60 seconds or shorter", 400);
      }
      return {
        type: "video",
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        duration: result.duration,
      };
    }

    const result = await client.uploader.upload(file.path, {
      folder: FOLDER,
      resource_type: "image",
      transformation: [
        { width: 1440, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });
    return {
      type: "image",
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  }

  async function remove(items = []) {
    await Promise.all(
      items.map(async (item) => {
        try {
          await client.uploader.destroy(item.publicId, {
            resource_type: item.type === "video" ? "video" : "image",
          });
        } catch (error) {
          console.error("Cloudinary cleanup failed:", item.publicId, error.message);
        }
      }),
    );
  }

  return { upload, remove };
}

export default createCloudinaryMediaService;
```

`Server/tests/helpers/fakeMedia.js`:

```js
// Drop-in replacement for the Cloudinary media service in tests.
export function createFakeMedia({ failOnUpload = false, failOnSecond = false } = {}) {
  const uploaded = [];
  const removed = [];
  let counter = 0;

  return {
    uploaded,
    removed,
    async upload(file) {
      counter += 1;
      if (failOnUpload || (failOnSecond && counter === 2)) {
        throw new Error("upload failed");
      }
      const type = file.mimetype.startsWith("video/") ? "video" : "image";
      const item = {
        type,
        url: `https://cdn.test/${counter}`,
        publicId: `test/${counter}`,
        width: 100,
        height: 100,
        ...(type === "video" ? { duration: 20 } : {}),
      };
      uploaded.push(item);
      return item;
    },
    async remove(items = []) {
      removed.push(...items);
    },
  };
}
```

- [ ] **Step 4: Run and confirm it passes**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 5: Checkpoint (owner runs)**

```bash
git add Server/services/safargramMedia.js Server/tests
git commit -m "Add SafarGram Cloudinary media service with 60s video limit"
```

---

## Task 5: Serializer, feed queries and list endpoints

**Files:**
- Create: `Server/services/safargramSerializer.js`, `Server/services/safargramFeed.js`, `Server/Controllers/safargram/feedController.js`, `Server/Middleware/safargramLimits.js`, `Server/Routes/safargramRoutes.js`, `Server/tests/helpers/seed.js`, `Server/tests/helpers/limits.js`
- Test: `Server/tests/safargramFeed.test.js`

**Interfaces:**
- Consumes: models (Task 3), `parsePaging`, `cursorFilter`, `toPage`, `assertObjectId` (Task 2), `Profile` model (`Server/Models/profileModel.js`, field `following: ObjectId[]`), `UserModel`, `verifyToken`.
- Produces:
  - `populatePost(query)` — adds `author` (`username firstName lastName avatar`) and `destination` (`name`) populates.
  - `AUTHOR_FIELDS` string constant.
  - `serializePosts(posts, viewerId): Promise<PostJSON[]>` with `likedByMe` / `savedByMe`.
  - `listPosts({ filter, cursor, limit, viewerId }): Promise<{ data, nextCursor }>`; `listSaved({ userId, cursor, limit })`; `followingIds(userId): Promise<ObjectId[]>`.
  - `DEFAULT_LIMITS` and `createLimiters(limits)` → `{ createPost, comment, reaction }` Express middleware (keyed by `req.user._id`).
  - `createSafargramRouter({ media?, limits? })` and default export `createSafargramRouter()`; every route runs `verifyToken` first.
  - Test helpers: `seedPost(author, extra?)`, `testLimits` (very high limits).
  - Routes added here: `GET /feed`, `GET /users/:username/posts`, `GET /saved`, `GET /hashtags/:tag`, `GET /destinations/:id/posts`.

- [ ] **Step 1: Write helpers and the failing test**

`Server/tests/helpers/seed.js`:

```js
import SafarPost from "../../Models/safargramPostModel.js";

// `author` is either a createUser() result ({ user, ... }) or a plain user document.
export const seedPost = (author, extra = {}) =>
  SafarPost.create({
    author: author.user ? author.user._id : author._id,
    media: [{ type: "image", url: "https://cdn.test/x.jpg", publicId: "x" }],
    caption: "hello",
    ...extra,
  });
```

`Server/tests/helpers/limits.js`:

```js
const high = { windowMs: 60_000, max: 100_000 };
export const testLimits = { createPost: high, comment: high, reaction: high };
```

`Server/tests/safargramFeed.test.js`:

```js
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { testLimits } from "./helpers/limits.js";
import { seedPost } from "./helpers/seed.js";
import { createSafargramRouter } from "../Routes/safargramRoutes.js";
import Profile from "../Models/profileModel.js";
import SafarLike from "../Models/safargramLikeModel.js";
import SafarSave from "../Models/safargramSaveModel.js";

let app;
before(async () => {
  await connectTestDb();
  app = buildApp("/api/v1/safargram", createSafargramRouter({ media: createFakeMedia(), limits: testLimits }));
});
after(disconnectTestDb);
beforeEach(clearTestDb);

const get = (path, auth) => request(app).get(`/api/v1/safargram${path}`).set(auth || {});

test("every list endpoint requires a login", async () => {
  for (const path of ["/feed", "/saved", "/hashtags/x", "/users/a/posts"]) {
    assert.equal((await get(path)).status, 401, path);
  }
});

test("discover returns everyone's posts newest first with author and flags", async () => {
  const me = await createUser();
  const other = await createUser();
  const first = await seedPost(other, { caption: "first" });
  const second = await seedPost(me, { caption: "second" });
  await SafarLike.create({ post: first._id, user: me.user._id });
  await SafarSave.create({ post: first._id, user: me.user._id });

  const res = await get("/feed?tab=discover", me.auth);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.map((p) => p.caption), ["second", "first"]);
  assert.equal(res.body.data[1].author.username, other.user.username);
  assert.equal(res.body.data[1].likedByMe, true);
  assert.equal(res.body.data[1].savedByMe, true);
  assert.equal(res.body.data[0].likedByMe, false);
  assert.equal(res.body.nextCursor, null);
  assert.equal(String(res.body.data[0]._id), String(second._id));
});

test("cursor paging returns every post exactly once", async () => {
  const me = await createUser();
  for (let i = 0; i < 25; i++) await seedPost(me, { caption: `p${i}` });

  const seen = [];
  let cursor = null;
  let pages = 0;
  do {
    const res = await get(`/feed?limit=10${cursor ? `&cursor=${cursor}` : ""}`, me.auth);
    assert.equal(res.status, 200);
    seen.push(...res.body.data.map((p) => p._id));
    cursor = res.body.nextCursor;
    pages += 1;
  } while (cursor);

  assert.equal(pages, 3);
  assert.equal(seen.length, 25);
  assert.equal(new Set(seen).size, 25);
});

test("following tab shows only followed authors; no profile means empty", async () => {
  const me = await createUser();
  const friend = await createUser();
  const stranger = await createUser();
  await seedPost(friend, { caption: "friend" });
  await seedPost(stranger, { caption: "stranger" });

  const before = await get("/feed?tab=following", me.auth);
  assert.equal(before.status, 200);
  assert.deepEqual(before.body.data, []);

  await Profile.create({ user: me.user._id, following: [friend.user._id] });
  const after = await get("/feed?tab=following", me.auth);
  assert.deepEqual(after.body.data.map((p) => p.caption), ["friend"]);
});

test("bad tab, limit and cursor are rejected with 400", async () => {
  const me = await createUser();
  assert.equal((await get("/feed?tab=nope", me.auth)).status, 400);
  assert.equal((await get("/feed?limit=0", me.auth)).status, 400);
  assert.equal((await get("/feed?cursor=abc", me.auth)).status, 400);
});

test("profile grid by username; unknown user is 404", async () => {
  const me = await createUser();
  const other = await createUser();
  await seedPost(me, { caption: "mine" });
  await seedPost(other, { caption: "theirs" });

  const res = await get(`/users/${other.user.username}/posts`, me.auth);
  assert.deepEqual(res.body.data.map((p) => p.caption), ["theirs"]);
  assert.equal((await get("/users/nobody_here/posts", me.auth)).status, 404);
});

test("hashtag page is case-insensitive and validates the tag", async () => {
  const me = await createUser();
  await seedPost(me, { caption: "#Spiti", hashtags: ["spiti"] });
  await seedPost(me, { caption: "other", hashtags: ["goa"] });

  const res = await get("/hashtags/SPITI", me.auth);
  assert.deepEqual(res.body.data.map((p) => p.caption), ["#Spiti"]);
  assert.equal((await get("/hashtags/bad-tag!", me.auth)).status, 400);
});

test("destination page lists tagged posts and validates the id", async () => {
  const me = await createUser();
  const dest = new mongoose.Types.ObjectId();
  await seedPost(me, { caption: "at dest", destination: dest });
  await seedPost(me, { caption: "elsewhere" });

  const res = await get(`/destinations/${dest}/posts`, me.auth);
  assert.deepEqual(res.body.data.map((p) => p.caption), ["at dest"]);
  assert.equal((await get("/destinations/xyz/posts", me.auth)).status, 400);
});

test("bucket list returns only the caller's saves, newest save first", async () => {
  const me = await createUser();
  const other = await createUser();
  const a = await seedPost(other, { caption: "a" });
  const b = await seedPost(other, { caption: "b" });
  await SafarSave.create({ post: a._id, user: me.user._id });
  await SafarSave.create({ post: b._id, user: me.user._id });
  await SafarSave.create({ post: a._id, user: other.user._id });

  const res = await get("/saved", me.auth);
  assert.deepEqual(res.body.data.map((p) => p.caption), ["b", "a"]);
  assert.ok(res.body.data.every((p) => p.savedByMe));
  const otherRes = await get("/saved", other.auth);
  assert.deepEqual(otherRes.body.data.map((p) => p.caption), ["a"]);
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npm test`
Expected: FAIL — cannot find `Routes/safargramRoutes.js`.

- [ ] **Step 3: Implement serializer and feed service**

`Server/services/safargramSerializer.js`:

```js
// Imported for their side effect: populate() needs these models registered even
// when only the SafarGram routes are loaded (e.g. in tests).
import "../Models/userModel.js";
import "../Models/destinationModel.js";
import SafarLike from "../Models/safargramLikeModel.js";
import SafarSave from "../Models/safargramSaveModel.js";

export const AUTHOR_FIELDS = "username firstName lastName avatar";

export const populatePost = (query) =>
  query.populate("author", AUTHOR_FIELDS).populate("destination", "name");

// One `$in` query per flag for the whole page (no per-post queries).
export async function serializePosts(posts, viewerId) {
  if (posts.length === 0) return [];
  const ids = posts.map((p) => p._id);
  const [likes, saves] = await Promise.all([
    SafarLike.find({ user: viewerId, post: { $in: ids } }).select("post").lean(),
    SafarSave.find({ user: viewerId, post: { $in: ids } }).select("post").lean(),
  ]);
  const liked = new Set(likes.map((l) => String(l.post)));
  const saved = new Set(saves.map((s) => String(s.post)));

  return posts.map((post) => {
    const o = typeof post.toObject === "function" ? post.toObject() : post;
    return {
      _id: o._id,
      author: o.author,
      media: o.media,
      caption: o.caption,
      hashtags: o.hashtags,
      category: o.category,
      destination: o.destination || null,
      likesCount: o.likesCount,
      commentsCount: o.commentsCount,
      likedByMe: liked.has(String(o._id)),
      savedByMe: saved.has(String(o._id)),
      createdAt: o.createdAt,
    };
  });
}
```

`Server/services/safargramFeed.js`:

```js
import SafarPost from "../Models/safargramPostModel.js";
import SafarSave from "../Models/safargramSaveModel.js";
import Profile from "../Models/profileModel.js";
import { cursorFilter, toPage } from "../utils/cursor.js";
import { AUTHOR_FIELDS, populatePost, serializePosts } from "./safargramSerializer.js";

export async function listPosts({ filter = {}, cursor, limit, viewerId }) {
  const rows = await populatePost(
    SafarPost.find({ ...filter, ...cursorFilter(cursor) })
      .sort({ _id: -1 })
      .limit(limit + 1),
  );
  const { page, nextCursor } = toPage(rows, limit);
  return { data: await serializePosts(page, viewerId), nextCursor };
}

// The Bucket List pages over the *save* records (newest save first).
export async function listSaved({ userId, cursor, limit }) {
  const saves = await SafarSave.find({ user: userId, ...cursorFilter(cursor) })
    .sort({ _id: -1 })
    .limit(limit + 1)
    .populate({
      path: "post",
      populate: [
        { path: "author", select: AUTHOR_FIELDS },
        { path: "destination", select: "name" },
      ],
    });
  const { page, nextCursor } = toPage(saves, limit);
  const posts = page.map((s) => s.post).filter(Boolean);
  return { data: await serializePosts(posts, userId), nextCursor };
}

// Users without a Profile document simply follow nobody.
export async function followingIds(userId) {
  const profile = await Profile.findOne({ user: userId }).select("following").lean();
  return profile?.following || [];
}
```

- [ ] **Step 4: Implement limiters, controller and router**

`Server/Middleware/safargramLimits.js`:

```js
import rateLimit from "express-rate-limit";

export const DEFAULT_LIMITS = {
  createPost: { windowMs: 60 * 60 * 1000, max: 20 },
  comment: { windowMs: 10 * 60 * 1000, max: 30 },
  reaction: { windowMs: 10 * 60 * 1000, max: 200 },
};

const perUser = ({ windowMs, max }, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    // Must run after verifyToken so req.user exists.
    keyGenerator: (req) => String(req.user._id),
    message: { success: false, message },
  });

export function createLimiters(limits = DEFAULT_LIMITS) {
  return {
    createPost: perUser(limits.createPost, "You are posting too fast. Please try again later."),
    comment: perUser(limits.comment, "You are commenting too fast. Please slow down."),
    reaction: perUser(limits.reaction, "Too many actions. Please slow down."),
  };
}
```

`Server/Controllers/safargram/feedController.js`:

```js
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import UserModel from "../../Models/userModel.js";
import { assertObjectId, parsePaging } from "../../utils/cursor.js";
import { followingIds, listPosts, listSaved } from "../../services/safargramFeed.js";

const send = (res, { data, nextCursor }) =>
  res.status(200).json({ success: true, data, nextCursor });

export const getFeed = catchAsync(async (req, res) => {
  const tab = req.query.tab ?? "discover";
  if (tab !== "discover" && tab !== "following") {
    throw new AppError("tab must be 'discover' or 'following'", 400);
  }
  const { limit, cursor } = parsePaging(req.query);
  const filter = tab === "following" ? { author: { $in: await followingIds(req.user._id) } } : {};
  send(res, await listPosts({ filter, cursor, limit, viewerId: req.user._id }));
});

export const getUserPosts = catchAsync(async (req, res) => {
  const { limit, cursor } = parsePaging(req.query);
  const user = await UserModel.findOne({ username: String(req.params.username) }).select("_id");
  if (!user) throw new AppError("User not found", 404);
  send(res, await listPosts({ filter: { author: user._id }, cursor, limit, viewerId: req.user._id }));
});

export const getHashtagPosts = catchAsync(async (req, res) => {
  const tag = String(req.params.tag).replace(/^#/, "").toLowerCase();
  if (!/^[\p{L}\p{M}\p{N}_]{1,50}$/u.test(tag)) throw new AppError("Invalid hashtag", 400);
  const { limit, cursor } = parsePaging(req.query);
  send(res, await listPosts({ filter: { hashtags: tag }, cursor, limit, viewerId: req.user._id }));
});

export const getDestinationPosts = catchAsync(async (req, res) => {
  const destination = assertObjectId(req.params.id, "destination id");
  const { limit, cursor } = parsePaging(req.query);
  send(res, await listPosts({ filter: { destination }, cursor, limit, viewerId: req.user._id }));
});

export const getSaved = catchAsync(async (req, res) => {
  const { limit, cursor } = parsePaging(req.query);
  send(res, await listSaved({ userId: req.user._id, cursor, limit }));
});
```

`Server/Routes/safargramRoutes.js`:

```js
import express from "express";
import { verifyToken } from "../Middleware/authMiddleware.js";
import { DEFAULT_LIMITS, createLimiters } from "../Middleware/safargramLimits.js";
import { createCloudinaryMediaService } from "../services/safargramMedia.js";
import {
  getDestinationPosts,
  getFeed,
  getHashtagPosts,
  getSaved,
  getUserPosts,
} from "../Controllers/safargram/feedController.js";

// `media` and `limits` are injectable so tests can fake Cloudinary and rate limits.
export function createSafargramRouter({
  media = createCloudinaryMediaService(),
  limits = DEFAULT_LIMITS,
} = {}) {
  const router = express.Router();
  const limiters = createLimiters(limits);
  void media;
  void limiters;

  router.use(verifyToken);

  router.get("/feed", getFeed);
  router.get("/saved", getSaved);
  router.get("/users/:username/posts", getUserPosts);
  router.get("/hashtags/:tag", getHashtagPosts);
  router.get("/destinations/:id/posts", getDestinationPosts);

  return router;
}

export default createSafargramRouter();
```

(The two `void` lines keep the unused parameters lint-clean until Tasks 6–9 use them; each of those tasks removes them as it wires its routes.)

- [ ] **Step 5: Run and confirm it passes**

Run: `npm test`
Expected: all tests PASS. If the profile test fails on validation, read `Server/Models/profileModel.js` and supply the missing required fields in the test's `Profile.create` call.

- [ ] **Step 6: Checkpoint (owner runs)**

```bash
git add Server/services Server/Controllers/safargram Server/Middleware/safargramLimits.js Server/Routes/safargramRoutes.js Server/tests
git commit -m "Add SafarGram feed, profile grid, hashtag, destination and bucket-list endpoints"
```

---

## Task 6: Create post (upload, validation, cleanup, rate limit)

**Files:**
- Create: `Server/Middleware/safargramUpload.js`, `Server/Controllers/safargram/postController.js`
- Modify: `Server/Routes/safargramRoutes.js`
- Test: `Server/tests/safargramCreatePost.test.js`

**Interfaces:**
- Consumes: `validateMediaFiles`, `MEDIA_LIMITS`, `mediaKind` (Task 2); `extractHashtags`; `SafarPost`, `CATEGORIES`; `populatePost`, `serializePosts` (Task 5); `createLimiters` (Task 5); the media service interface (Task 4); `Destination` model (`Server/Models/destinationModel.js`).
- Produces: `uploadMedia` (multer middleware for field `media`, max 5 files), `removeTempFiles(files)`; `makePostController(media)` → `{ createPost }` (Task 7 adds `getPost`, `deletePost` to the same factory); route `POST /posts` → 201 `{ success, data: PostJSON }`.

- [ ] **Step 1: Write the failing test**

`Server/tests/safargramCreatePost.test.js`:

```js
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import request from "supertest";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { testLimits } from "./helpers/limits.js";
import { createSafargramRouter } from "../Routes/safargramRoutes.js";
import SafarPost from "../Models/safargramPostModel.js";
import Destination from "../Models/destinationModel.js";

before(connectTestDb);
after(disconnectTestDb);
beforeEach(clearTestDb);

const png = (name = "a.png") => ({ buf: Buffer.from("fake-image"), opts: { filename: name, contentType: "image/png" } });
const mp4 = () => ({ buf: Buffer.from("fake-video"), opts: { filename: "v.mp4", contentType: "video/mp4" } });

function makeApp(media = createFakeMedia(), limits = testLimits) {
  return { media, app: buildApp("/api/v1/safargram", createSafargramRouter({ media, limits })) };
}

function post(app, auth, files, fields = {}) {
  let req = request(app).post("/api/v1/safargram/posts").set(auth || {});
  for (const [k, v] of Object.entries(fields)) req = req.field(k, v);
  for (const f of files) req = req.attach("media", f.buf, f.opts);
  return req;
}

const leftoverTempFiles = () => fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith("safargram-"));

test("requires a login", async () => {
  const { app } = makeApp();
  assert.equal((await post(app, null, [png()])).status, 401);
});

test("creates a post with photos, extracts hashtags, tags a destination", async () => {
  const { app, media } = makeApp();
  const me = await createUser();
  const dest = await Destination.collection.insertOne({ name: "Spiti Valley" });

  const res = await post(app, me.auth, [png("1.png"), png("2.png")], {
    caption: "Cold desert #Spiti #trek",
    category: "Trekking",
    destinationId: String(dest.insertedId),
  });

  assert.equal(res.status, 201, JSON.stringify(res.body));
  const p = res.body.data;
  assert.equal(p.media.length, 2);
  assert.deepEqual(p.hashtags, ["spiti", "trek"]);
  assert.equal(p.category, "Trekking");
  assert.equal(p.author.username, me.user.username);
  assert.equal(p.destination.name, "Spiti Valley");
  assert.equal(p.likedByMe, false);
  assert.equal(media.uploaded.length, 2);
  assert.equal(await SafarPost.countDocuments(), 1);
});

test("creates a video post; rejects mixed media and too many photos", async () => {
  const { app } = makeApp();
  const me = await createUser();
  assert.equal((await post(app, me.auth, [mp4()])).status, 201);
  assert.equal((await post(app, me.auth, [png(), mp4()])).status, 400);
  const six = Array.from({ length: 6 }, (_, i) => png(`${i}.png`));
  assert.equal((await post(app, me.auth, six)).status, 400);
});

test("rejects missing media, unsupported types, bad category, long caption, unknown destination", async () => {
  const { app } = makeApp();
  const me = await createUser();
  assert.equal((await post(app, me.auth, [])).status, 400);
  const pdf = { buf: Buffer.from("x"), opts: { filename: "a.pdf", contentType: "application/pdf" } };
  assert.equal((await post(app, me.auth, [pdf])).status, 400);
  assert.equal((await post(app, me.auth, [png()], { category: "Nope" })).status, 400);
  assert.equal((await post(app, me.auth, [png()], { caption: "x".repeat(2201) })).status, 400);
  const missing = String(new mongoose.Types.ObjectId());
  assert.equal((await post(app, me.auth, [png()], { destinationId: missing })).status, 400);
  assert.equal((await post(app, me.auth, [png()], { destinationId: "bad" })).status, 400);
  assert.equal(await SafarPost.countDocuments(), 0);
});

test("if one upload fails, already-uploaded files are removed and nothing is saved", async () => {
  const media = createFakeMedia({ failOnSecond: true });
  const { app } = makeApp(media);
  const me = await createUser();
  const res = await post(app, me.auth, [png("1.png"), png("2.png")]);
  assert.ok(res.status >= 400);
  assert.equal(media.removed.length, 1);
  assert.equal(await SafarPost.countDocuments(), 0);
});

test("temporary upload files are always deleted", async () => {
  const { app } = makeApp();
  const me = await createUser();
  const before = leftoverTempFiles().length;
  await post(app, me.auth, [png()]);
  await post(app, me.auth, [png()], { category: "Nope" });
  assert.equal(leftoverTempFiles().length, before);
});

test("rate limit: the third post within the window gets 429", async () => {
  const limits = { ...testLimits, createPost: { windowMs: 60_000, max: 2 } };
  const { app } = makeApp(createFakeMedia(), limits);
  const me = await createUser();
  assert.equal((await post(app, me.auth, [png()])).status, 201);
  assert.equal((await post(app, me.auth, [png()])).status, 201);
  assert.equal((await post(app, me.auth, [png()])).status, 429);
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npm test`
Expected: FAIL — `POST /posts` returns 404 (route missing).

- [ ] **Step 3: Implement the upload middleware**

`Server/Middleware/safargramUpload.js`:

```js
import multer from "multer";
import os from "os";
import path from "path";
import crypto from "crypto";
import fs from "fs/promises";
import AppError from "../utils/AppError.js";
import { MEDIA_LIMITS, mediaKind } from "../utils/safargramMediaRules.js";

// Files land in the OS temp folder (not memory, so 50 MB videos are safe) and are
// removed by the controller after the Cloudinary upload.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) =>
    cb(
      null,
      `safargram-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${path
        .extname(file.originalname)
        .toLowerCase()}`,
    ),
});

export const uploadMedia = multer({
  storage,
  limits: { fileSize: MEDIA_LIMITS.maxVideoBytes, files: MEDIA_LIMITS.maxImages },
  fileFilter: (req, file, cb) => {
    if (mediaKind(file.mimetype, file.originalname)) return cb(null, true);
    cb(
      new AppError(
        "Only JPG, PNG, WEBP photos and MP4, MOV, WEBM videos are allowed",
        400,
      ),
    );
  },
}).array("media", MEDIA_LIMITS.maxImages);

export async function removeTempFiles(files = []) {
  await Promise.all(files.map((f) => fs.unlink(f.path).catch(() => {})));
}
```

- [ ] **Step 4: Implement the controller**

`Server/Controllers/safargram/postController.js`:

```js
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import SafarPost, { CATEGORIES } from "../../Models/safargramPostModel.js";
import Destination from "../../Models/destinationModel.js";
import { assertObjectId } from "../../utils/cursor.js";
import { extractHashtags } from "../../utils/safargramText.js";
import { validateMediaFiles } from "../../utils/safargramMediaRules.js";
import { removeTempFiles } from "../../Middleware/safargramUpload.js";
import { populatePost, serializePosts } from "../../services/safargramSerializer.js";

export function makePostController(media) {
  const createPost = catchAsync(async (req, res) => {
    const files = req.files || [];
    try {
      const problem = validateMediaFiles(files);
      if (problem) throw new AppError(problem, 400);

      const caption = typeof req.body.caption === "string" ? req.body.caption.trim() : "";
      if (caption.length > 2200) {
        throw new AppError("Caption can be at most 2200 characters", 400);
      }

      const category = req.body.category || "Other";
      if (!CATEGORIES.includes(category)) throw new AppError("Invalid category", 400);

      let destination = null;
      if (req.body.destinationId) {
        destination = assertObjectId(req.body.destinationId, "destination id");
        if (!(await Destination.exists({ _id: destination }))) {
          throw new AppError("Destination not found", 400);
        }
      }

      // Upload everything; on any failure remove what already went up.
      const settled = await Promise.allSettled(files.map((f) => media.upload(f)));
      const uploaded = settled.filter((s) => s.status === "fulfilled").map((s) => s.value);
      const failed = settled.find((s) => s.status === "rejected");
      if (failed) {
        await media.remove(uploaded);
        throw failed.reason instanceof AppError
          ? failed.reason
          : new AppError("Could not upload media. Please try again.", 502);
      }

      let post;
      try {
        post = await SafarPost.create({
          author: req.user._id,
          media: uploaded,
          caption,
          hashtags: extractHashtags(caption),
          category,
          destination,
        });
      } catch (error) {
        await media.remove(uploaded);
        throw error;
      }

      const populated = await populatePost(SafarPost.findById(post._id));
      const [data] = await serializePosts([populated], req.user._id);
      res.status(201).json({ success: true, data });
    } finally {
      await removeTempFiles(files);
    }
  });

  return { createPost };
}
```

- [ ] **Step 5: Wire the route**

In `Server/Routes/safargramRoutes.js` add the imports:

```js
import { uploadMedia } from "../Middleware/safargramUpload.js";
import { makePostController } from "../Controllers/safargram/postController.js";
```

Delete the line `void media;`, add `const posts = makePostController(media);` after `const limiters = …`, and add this route right after `router.use(verifyToken);`:

```js
  router.post("/posts", limiters.createPost, uploadMedia, posts.createPost);
```

(Keep `void limiters;` only if `limiters` is still otherwise unused — it is not after this step, so delete that line too.)

- [ ] **Step 6: Run and confirm it passes**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 7: Checkpoint (owner runs)**

```bash
git add Server/Middleware/safargramUpload.js Server/Controllers/safargram/postController.js Server/Routes/safargramRoutes.js Server/tests
git commit -m "Add SafarGram create-post endpoint with media upload, validation and cleanup"
```

---

## Task 7: Get one post and delete (with cascade)

**Files:**
- Modify: `Server/Controllers/safargram/postController.js`, `Server/Routes/safargramRoutes.js`
- Test: `Server/tests/safargramPostDelete.test.js`

**Interfaces:**
- Consumes: `makePostController(media)` (Task 6); models; `populatePost`, `serializePosts`; `assertObjectId`.
- Produces: `makePostController(media)` now returns `{ createPost, getPost, deletePost }`; routes `GET /posts/:id` → `{ success, data: PostJSON }`, `DELETE /posts/:id` → `{ success, message }` (author or admin; cascades comments, likes, saves, Cloudinary files).

- [ ] **Step 1: Write the failing test**

`Server/tests/safargramPostDelete.test.js`:

```js
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { testLimits } from "./helpers/limits.js";
import { seedPost } from "./helpers/seed.js";
import { createSafargramRouter } from "../Routes/safargramRoutes.js";
import SafarPost from "../Models/safargramPostModel.js";
import SafarComment from "../Models/safargramCommentModel.js";
import SafarLike from "../Models/safargramLikeModel.js";
import SafarSave from "../Models/safargramSaveModel.js";

let app, media;
before(async () => {
  await connectTestDb();
});
after(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  media = createFakeMedia();
  app = buildApp("/api/v1/safargram", createSafargramRouter({ media, limits: testLimits }));
});

const url = (id) => `/api/v1/safargram/posts/${id}`;

test("GET returns one post; bad id 400; missing 404; needs login", async () => {
  const me = await createUser();
  const p = await seedPost(me, { caption: "one" });
  const ok = await request(app).get(url(p._id)).set(me.auth);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.caption, "one");
  assert.equal(ok.body.data.author.username, me.user.username);
  assert.equal((await request(app).get(url("abc")).set(me.auth)).status, 400);
  assert.equal((await request(app).get(url(new mongoose.Types.ObjectId())).set(me.auth)).status, 404);
  assert.equal((await request(app).get(url(p._id))).status, 401);
});

test("only the author or an admin can delete; others get 403", async () => {
  const author = await createUser();
  const stranger = await createUser();
  const admin = await createUser({ role: "admin" });
  const p1 = await seedPost(author);
  const p2 = await seedPost(author);

  assert.equal((await request(app).delete(url(p1._id)).set(stranger.auth)).status, 403);
  assert.equal(await SafarPost.countDocuments(), 2);
  assert.equal((await request(app).delete(url(p1._id)).set(author.auth)).status, 200);
  assert.equal((await request(app).delete(url(p2._id)).set(admin.auth)).status, 200);
  assert.equal(await SafarPost.countDocuments(), 0);
  assert.equal((await request(app).delete(url(p1._id)).set(author.auth)).status, 404);
});

test("deleting a post removes its comments, likes, saves and Cloudinary files", async () => {
  const author = await createUser();
  const fan = await createUser();
  const p = await seedPost(author, {
    media: [
      { type: "image", url: "https://cdn.test/1", publicId: "test/1" },
      { type: "image", url: "https://cdn.test/2", publicId: "test/2" },
    ],
  });
  const other = await seedPost(author);
  await SafarComment.create({ post: p._id, author: fan.user._id, text: "hi" });
  await SafarLike.create({ post: p._id, user: fan.user._id });
  await SafarSave.create({ post: p._id, user: fan.user._id });
  await SafarLike.create({ post: other._id, user: fan.user._id });

  assert.equal((await request(app).delete(url(p._id)).set(author.auth)).status, 200);
  assert.equal(await SafarComment.countDocuments({ post: p._id }), 0);
  assert.equal(await SafarLike.countDocuments({ post: p._id }), 0);
  assert.equal(await SafarSave.countDocuments({ post: p._id }), 0);
  assert.equal(await SafarLike.countDocuments({ post: other._id }), 1);
  assert.deepEqual(media.removed.map((m) => m.publicId).sort(), ["test/1", "test/2"]);
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npm test`
Expected: FAIL — `GET/DELETE /posts/:id` return 404.

- [ ] **Step 3: Extend the controller**

In `Server/Controllers/safargram/postController.js` add these imports at the top:

```js
import SafarComment from "../../Models/safargramCommentModel.js";
import SafarLike from "../../Models/safargramLikeModel.js";
import SafarSave from "../../Models/safargramSaveModel.js";
```

Inside `makePostController`, before `return { createPost };`, add:

```js
  const getPost = catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "post id");
    const post = await populatePost(SafarPost.findById(id));
    if (!post) throw new AppError("Post not found", 404);
    const [data] = await serializePosts([post], req.user._id);
    res.status(200).json({ success: true, data });
  });

  const deletePost = catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "post id");
    const post = await SafarPost.findById(id);
    if (!post) throw new AppError("Post not found", 404);

    const isOwner = String(post.author) === String(req.user._id);
    if (!isOwner && req.user.role !== "admin") {
      throw new AppError("You can only delete your own posts", 403);
    }

    await Promise.all([
      SafarComment.deleteMany({ post: id }),
      SafarLike.deleteMany({ post: id }),
      SafarSave.deleteMany({ post: id }),
      post.deleteOne(),
    ]);
    await media.remove(post.media); // best effort, never throws
    res.status(200).json({ success: true, message: "Post deleted" });
  });
```

and change the final line to `return { createPost, getPost, deletePost };`.

- [ ] **Step 4: Add the routes**

In `Server/Routes/safargramRoutes.js`, after the `router.post("/posts", …)` line:

```js
  router.get("/posts/:id", posts.getPost);
  router.delete("/posts/:id", posts.deletePost);
```

- [ ] **Step 5: Run and confirm it passes**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 6: Checkpoint (owner runs)**

```bash
git add Server/Controllers/safargram/postController.js Server/Routes/safargramRoutes.js Server/tests
git commit -m "Add SafarGram get/delete post with cascade clean-up"
```

---

## Task 8: Likes and Bucket List (saves)

**Files:**
- Create: `Server/Controllers/safargram/reactionController.js`
- Modify: `Server/Routes/safargramRoutes.js`
- Test: `Server/tests/safargramReactions.test.js`

**Interfaces:**
- Consumes: `SafarLike`, `SafarSave`, `SafarPost`, `assertObjectId`, `AppError`, `catchAsync`, `limiters.reaction` (Task 5).
- Produces: `likePost`, `unlikePost`, `savePost`, `unsavePost` Express handlers. Routes `POST|DELETE /posts/:id/like` → `{ success, data: { likesCount, likedByMe } }`; `POST|DELETE /posts/:id/save` → `{ success, data: { savedByMe } }`. All idempotent; counters change only when a record was actually created/removed.

- [ ] **Step 1: Write the failing test**

`Server/tests/safargramReactions.test.js`:

```js
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { testLimits } from "./helpers/limits.js";
import { seedPost } from "./helpers/seed.js";
import { createSafargramRouter } from "../Routes/safargramRoutes.js";
import SafarPost from "../Models/safargramPostModel.js";
import SafarLike from "../Models/safargramLikeModel.js";
import SafarSave from "../Models/safargramSaveModel.js";

let app;
before(async () => {
  await connectTestDb();
  await Promise.all([SafarLike.init(), SafarSave.init()]);
  app = buildApp("/api/v1/safargram", createSafargramRouter({ media: createFakeMedia(), limits: testLimits }));
});
after(disconnectTestDb);
beforeEach(clearTestDb);

const like = (id, auth, method = "post") => request(app)[method](`/api/v1/safargram/posts/${id}/like`).set(auth || {});
const save = (id, auth, method = "post") => request(app)[method](`/api/v1/safargram/posts/${id}/save`).set(auth || {});
const likesCount = async (id) => (await SafarPost.findById(id)).likesCount;

test("like is idempotent: liking twice counts once", async () => {
  const me = await createUser();
  const p = await seedPost(me);
  const first = await like(p._id, me.auth);
  assert.equal(first.status, 200);
  assert.deepEqual(first.body.data, { likesCount: 1, likedByMe: true });
  const second = await like(p._id, me.auth);
  assert.deepEqual(second.body.data, { likesCount: 1, likedByMe: true });
  assert.equal(await SafarLike.countDocuments(), 1);
});

test("unlike is idempotent and never goes below zero", async () => {
  const me = await createUser();
  const p = await seedPost(me);
  await like(p._id, me.auth);
  const first = await like(p._id, me.auth, "delete");
  assert.deepEqual(first.body.data, { likesCount: 0, likedByMe: false });
  const second = await like(p._id, me.auth, "delete");
  assert.deepEqual(second.body.data, { likesCount: 0, likedByMe: false });
  assert.equal(await likesCount(p._id), 0);
});

test("different users add up", async () => {
  const a = await createUser();
  const b = await createUser();
  const p = await seedPost(a);
  await like(p._id, a.auth);
  await like(p._id, b.auth);
  assert.equal(await likesCount(p._id), 2);
});

test("ten simultaneous likes by one user still count once", async () => {
  const me = await createUser();
  const p = await seedPost(me);
  const results = await Promise.all(Array.from({ length: 10 }, () => like(p._id, me.auth)));
  assert.ok(results.every((r) => r.status === 200));
  assert.equal(await SafarLike.countDocuments({ post: p._id }), 1);
  assert.equal(await likesCount(p._id), 1);
});

test("save and unsave are idempotent", async () => {
  const me = await createUser();
  const p = await seedPost(me);
  assert.deepEqual((await save(p._id, me.auth)).body.data, { savedByMe: true });
  assert.deepEqual((await save(p._id, me.auth)).body.data, { savedByMe: true });
  assert.equal(await SafarSave.countDocuments(), 1);
  assert.deepEqual((await save(p._id, me.auth, "delete")).body.data, { savedByMe: false });
  assert.deepEqual((await save(p._id, me.auth, "delete")).body.data, { savedByMe: false });
  assert.equal(await SafarSave.countDocuments(), 0);
});

test("bad id 400, missing post 404, no login 401", async () => {
  const me = await createUser();
  assert.equal((await like("abc", me.auth)).status, 400);
  assert.equal((await like(new mongoose.Types.ObjectId(), me.auth)).status, 404);
  assert.equal((await save(new mongoose.Types.ObjectId(), me.auth)).status, 404);
  const p = await seedPost(me);
  assert.equal((await like(p._id)).status, 401);
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npm test`
Expected: FAIL — like/save routes return 404.

- [ ] **Step 3: Implement the handlers**

`Server/Controllers/safargram/reactionController.js`:

```js
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import SafarPost from "../../Models/safargramPostModel.js";
import SafarLike from "../../Models/safargramLikeModel.js";
import SafarSave from "../../Models/safargramSaveModel.js";
import { assertObjectId } from "../../utils/cursor.js";

async function requirePost(rawId) {
  const id = assertObjectId(rawId, "post id");
  if (!(await SafarPost.exists({ _id: id }))) {
    throw new AppError("Post not found", 404);
  }
  return id;
}

// The unique {post, user} index makes this safe under concurrent requests:
// only the request that really created the record returns true.
async function addRecord(Model, post, user) {
  try {
    await Model.create({ post, user });
    return true;
  } catch (error) {
    if (error.code === 11000) return false;
    throw error;
  }
}

export const likePost = catchAsync(async (req, res) => {
  const post = await requirePost(req.params.id);
  if (await addRecord(SafarLike, post, req.user._id)) {
    await SafarPost.updateOne({ _id: post }, { $inc: { likesCount: 1 } });
  }
  const { likesCount } = await SafarPost.findById(post).select("likesCount");
  res.status(200).json({ success: true, data: { likesCount, likedByMe: true } });
});

export const unlikePost = catchAsync(async (req, res) => {
  const post = await requirePost(req.params.id);
  const { deletedCount } = await SafarLike.deleteOne({ post, user: req.user._id });
  if (deletedCount) {
    await SafarPost.updateOne(
      { _id: post, likesCount: { $gt: 0 } },
      { $inc: { likesCount: -1 } },
    );
  }
  const { likesCount } = await SafarPost.findById(post).select("likesCount");
  res.status(200).json({ success: true, data: { likesCount, likedByMe: false } });
});

export const savePost = catchAsync(async (req, res) => {
  const post = await requirePost(req.params.id);
  await addRecord(SafarSave, post, req.user._id);
  res.status(200).json({ success: true, data: { savedByMe: true } });
});

export const unsavePost = catchAsync(async (req, res) => {
  const post = await requirePost(req.params.id);
  await SafarSave.deleteOne({ post, user: req.user._id });
  res.status(200).json({ success: true, data: { savedByMe: false } });
});
```

- [ ] **Step 4: Wire the routes**

In `Server/Routes/safargramRoutes.js` add the import:

```js
import {
  likePost,
  savePost,
  unlikePost,
  unsavePost,
} from "../Controllers/safargram/reactionController.js";
```

and after the `/posts/:id` routes:

```js
  router.post("/posts/:id/like", limiters.reaction, likePost);
  router.delete("/posts/:id/like", limiters.reaction, unlikePost);
  router.post("/posts/:id/save", limiters.reaction, savePost);
  router.delete("/posts/:id/save", limiters.reaction, unsavePost);
```

- [ ] **Step 5: Run and confirm it passes**

Run: `npm test`
Expected: all tests PASS (including the 10-concurrent-likes test).

- [ ] **Step 6: Checkpoint (owner runs)**

```bash
git add Server/Controllers/safargram/reactionController.js Server/Routes/safargramRoutes.js Server/tests
git commit -m "Add SafarGram like and Bucket List endpoints"
```

---

## Task 9: Comments

**Files:**
- Create: `Server/Controllers/safargram/commentController.js`
- Modify: `Server/Routes/safargramRoutes.js`
- Test: `Server/tests/safargramComments.test.js`

**Interfaces:**
- Consumes: `SafarComment`, `SafarPost`, `AUTHOR_FIELDS` (Task 5), `parsePaging`, `cursorFilter`, `toPage`, `assertObjectId`, `limiters.comment`.
- Produces: `listComments`, `addComment`, `deleteComment` handlers. Routes: `GET /posts/:id/comments?cursor=` → `{ success, data: CommentJSON[], nextCursor }` (newest first, 20 per page, max 50); `POST /posts/:id/comments` body `{ text }` → 201 `{ success, data: CommentJSON }`; `DELETE /comments/:id` (comment author, the post's author, or admin) → `{ success, message }`. `CommentJSON` = `{ _id, post, text, createdAt, author: { _id, username, firstName, lastName, avatar } }`. `commentsCount` on the post is kept in sync.

- [ ] **Step 1: Write the failing test**

`Server/tests/safargramComments.test.js`:

```js
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { connectTestDb, clearTestDb, disconnectTestDb } from "./helpers/db.js";
import { buildApp } from "./helpers/app.js";
import { createUser } from "./helpers/users.js";
import { createFakeMedia } from "./helpers/fakeMedia.js";
import { testLimits } from "./helpers/limits.js";
import { seedPost } from "./helpers/seed.js";
import { createSafargramRouter } from "../Routes/safargramRoutes.js";
import SafarPost from "../Models/safargramPostModel.js";
import SafarComment from "../Models/safargramCommentModel.js";

let app;
before(async () => {
  await connectTestDb();
  app = buildApp("/api/v1/safargram", createSafargramRouter({ media: createFakeMedia(), limits: testLimits }));
});
after(disconnectTestDb);
beforeEach(clearTestDb);

const base = "/api/v1/safargram";
const add = (id, auth, text) => request(app).post(`${base}/posts/${id}/comments`).set(auth || {}).send({ text });
const list = (id, auth, qs = "") => request(app).get(`${base}/posts/${id}/comments${qs}`).set(auth || {});
const remove = (id, auth) => request(app).delete(`${base}/comments/${id}`).set(auth || {});
const count = async (id) => (await SafarPost.findById(id)).commentsCount;

test("adding a comment returns it with its author and bumps the counter", async () => {
  const me = await createUser();
  const p = await seedPost(me);
  const res = await add(p._id, me.auth, "  Beautiful!  ");
  assert.equal(res.status, 201);
  assert.equal(res.body.data.text, "Beautiful!");
  assert.equal(res.body.data.author.username, me.user.username);
  assert.equal(await count(p._id), 1);
});

test("invalid text, bad id, missing post and no login are rejected", async () => {
  const me = await createUser();
  const p = await seedPost(me);
  assert.equal((await add(p._id, me.auth, "   ")).status, 400);
  assert.equal((await add(p._id, me.auth, "x".repeat(501))).status, 400);
  assert.equal((await add(p._id, me.auth, { $gt: "" })).status, 400);
  assert.equal((await add("abc", me.auth, "hi")).status, 400);
  assert.equal((await add(new mongoose.Types.ObjectId(), me.auth, "hi")).status, 404);
  assert.equal((await add(p._id, null, "hi")).status, 401);
  assert.equal(await count(p._id), 0);
});

test("comments list newest first with cursor paging", async () => {
  const me = await createUser();
  const p = await seedPost(me);
  for (let i = 0; i < 25; i++) await SafarComment.create({ post: p._id, author: me.user._id, text: `c${i}` });

  const first = await list(p._id, me.auth);
  assert.equal(first.body.data.length, 20);
  assert.equal(first.body.data[0].text, "c24");
  const second = await list(p._id, me.auth, `?cursor=${first.body.nextCursor}`);
  assert.equal(second.body.data.length, 5);
  assert.equal(second.body.nextCursor, null);
  assert.equal((await list(new mongoose.Types.ObjectId(), me.auth)).status, 404);
});

test("comment author, post author and admin may delete; others may not", async () => {
  const postAuthor = await createUser();
  const commenter = await createUser();
  const stranger = await createUser();
  const admin = await createUser({ role: "admin" });
  const p = await seedPost(postAuthor);

  const make = async () => (await add(p._id, commenter.auth, "hi")).body.data._id;

  let id = await make();
  assert.equal((await remove(id, stranger.auth)).status, 403);
  assert.equal((await remove(id, commenter.auth)).status, 200);

  id = await make();
  assert.equal((await remove(id, postAuthor.auth)).status, 200);

  id = await make();
  assert.equal((await remove(id, admin.auth)).status, 200);

  assert.equal(await count(p._id), 0);
  assert.equal((await remove(id, admin.auth)).status, 404);
  assert.equal((await remove("abc", admin.auth)).status, 400);
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npm test`
Expected: FAIL — comment routes return 404.

- [ ] **Step 3: Implement the handlers**

`Server/Controllers/safargram/commentController.js`:

```js
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import SafarPost from "../../Models/safargramPostModel.js";
import SafarComment from "../../Models/safargramCommentModel.js";
import { assertObjectId, cursorFilter, parsePaging, toPage } from "../../utils/cursor.js";
import { AUTHOR_FIELDS } from "../../services/safargramSerializer.js";

async function requirePost(rawId) {
  const id = assertObjectId(rawId, "post id");
  if (!(await SafarPost.exists({ _id: id }))) {
    throw new AppError("Post not found", 404);
  }
  return id;
}

export const listComments = catchAsync(async (req, res) => {
  const post = await requirePost(req.params.id);
  const { limit, cursor } = parsePaging(req.query, { defaultLimit: 20, max: 50 });
  const rows = await SafarComment.find({ post, ...cursorFilter(cursor) })
    .sort({ _id: -1 })
    .limit(limit + 1)
    .populate("author", AUTHOR_FIELDS);
  const { page, nextCursor } = toPage(rows, limit);
  res.status(200).json({ success: true, data: page, nextCursor });
});

export const addComment = catchAsync(async (req, res) => {
  const post = await requirePost(req.params.id);
  const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
  if (text.length < 1 || text.length > 500) {
    throw new AppError("Comment must be between 1 and 500 characters", 400);
  }

  const comment = await SafarComment.create({ post, author: req.user._id, text });
  await SafarPost.updateOne({ _id: post }, { $inc: { commentsCount: 1 } });
  await comment.populate("author", AUTHOR_FIELDS);
  res.status(201).json({ success: true, data: comment });
});

export const deleteComment = catchAsync(async (req, res) => {
  const id = assertObjectId(req.params.id, "comment id");
  const comment = await SafarComment.findById(id);
  if (!comment) throw new AppError("Comment not found", 404);

  const post = await SafarPost.findById(comment.post).select("author");
  const me = String(req.user._id);
  const allowed =
    String(comment.author) === me ||
    (post && String(post.author) === me) ||
    req.user.role === "admin";
  if (!allowed) throw new AppError("You cannot delete this comment", 403);

  await comment.deleteOne();
  if (post) {
    await SafarPost.updateOne(
      { _id: post._id, commentsCount: { $gt: 0 } },
      { $inc: { commentsCount: -1 } },
    );
  }
  res.status(200).json({ success: true, message: "Comment deleted" });
});
```

- [ ] **Step 4: Wire the routes**

In `Server/Routes/safargramRoutes.js` add:

```js
import {
  addComment,
  deleteComment,
  listComments,
} from "../Controllers/safargram/commentController.js";
```

and after the like/save routes:

```js
  router.get("/posts/:id/comments", listComments);
  router.post("/posts/:id/comments", limiters.comment, addComment);
  router.delete("/comments/:id", deleteComment);
```

- [ ] **Step 5: Run and confirm it passes**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 6: Checkpoint (owner runs)**

```bash
git add Server/Controllers/safargram/commentController.js Server/Routes/safargramRoutes.js Server/tests
git commit -m "Add SafarGram comments endpoints"
```

---

## Task 10: Mount the router and smoke-check

**Files:**
- Modify: `Server/index.js`, `Server/.env.example` (no change needed unless Cloudinary keys are missing there — they already exist)

**Interfaces:**
- Consumes: default export of `Server/Routes/safargramRoutes.js` (a router built with the real Cloudinary service and default limits).

- [ ] **Step 1: Mount it**

In `Server/index.js` add next to the other route imports:

```js
import safargramRoutes from "./Routes/safargramRoutes.js";
```

and next to the other `/api/v1` mounts:

```js
app.use("/api/v1/safargram", safargramRoutes);
```

- [ ] **Step 2: Syntax check and full test run**

Run: `node --check index.js && npm test`
Expected: no syntax errors; all tests PASS.

- [ ] **Step 3: Start a throw-away server on port 5055 and check it is protected (read-only)**

Run (Git Bash, from `Server/`):

```bash
(PORT=5055 node index.js > "$TEMP/srv5055.log" 2>&1 &); sleep 8
curl -s -o /dev/null -w "feed no token: %{http_code}\n" http://localhost:5055/api/v1/safargram/feed
curl -s -o /dev/null -w "create no token: %{http_code}\n" -X POST http://localhost:5055/api/v1/safargram/posts
```

Expected: both print `401`. Then stop **only** that process: in PowerShell run
`Get-NetTCPConnection -LocalPort 5055 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`.
(Do **not** kill the owner's dev server on port 5000, and do not create posts against the real database.)

- [ ] **Step 4: Checkpoint (owner runs)**

```bash
git add Server/index.js
git commit -m "Mount SafarGram API at /api/v1/safargram"
```

---

# Client

All client commands run from `client/`. The client has no test framework; pure helpers are tested with Node's built-in runner, everything else is verified with `npm run lint` (no new errors) and `npx vite build`.

## Task 11: Client foundation (API module, paging hook, pure helpers)

**Files:**
- Create: `client/src/features/safargram/api.js`, `hooks/useCursorList.js`, `utils/captionParts.js`, `utils/captionParts.test.js`, `utils/timeAgo.js`, `utils/timeAgo.test.js`, `utils/mediaRules.js`
- Modify: `client/package.json` (`test` script)

**Interfaces:**
- Produces:
  - `splitCaption(text): { type: 'text' | 'tag', value: string }[]` (tag `value` has no `#`)
  - `timeAgo(date, now = Date.now()): string` (`just now`, `5m`, `3h`, `2d`, `4w`, else a short date)
  - `MEDIA_RULES`, `validateSelection(files: File[]): string | null` (same limits as the server)
  - `useCursorList(fetchPage, deps): { items, setItems, loading, loadingMore, error, hasMore, loadMore, reload }` where `fetchPage(cursor|null)` resolves to `{ data, nextCursor }`
  - API functions (all return the response body): `getFeed(tab, cursor)`, `getPost(id)`, `createPost(formData, onProgress)`, `deletePost(id)`, `likePost(id)`, `unlikePost(id)`, `savePost(id)`, `unsavePost(id)`, `getComments(id, cursor)`, `addComment(id, text)`, `deleteComment(id)`, `getUserPosts(username, cursor)`, `getSaved(cursor)`, `getHashtagPosts(tag, cursor)`, `getDestinationPosts(id, cursor)`, `getDestinations()` (cached), `getDestination(id)`

- [ ] **Step 1: Write the failing tests**

`client/src/features/safargram/utils/captionParts.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { splitCaption } from "./captionParts.js";

test("splits text and hashtags in order", () => {
  assert.deepEqual(splitCaption("Trek to #Spiti today #snow"), [
    { type: "text", value: "Trek to " },
    { type: "tag", value: "Spiti" },
    { type: "text", value: " today " },
    { type: "tag", value: "snow" },
  ]);
});

test("plain text, empty and unicode tags", () => {
  assert.deepEqual(splitCaption("just words"), [{ type: "text", value: "just words" }]);
  assert.deepEqual(splitCaption(""), []);
  assert.deepEqual(splitCaption("#यात्रा"), [{ type: "tag", value: "यात्रा" }]);
});

test("never treats markup as anything but text", () => {
  const parts = splitCaption("<img src=x onerror=alert(1)> #ok");
  assert.equal(parts[0].type, "text");
  assert.equal(parts[0].value, "<img src=x onerror=alert(1)> ");
});
```

`client/src/features/safargram/utils/timeAgo.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { timeAgo } from "./timeAgo.js";

const now = new Date("2026-09-19T12:00:00Z").getTime();
const ago = (ms) => new Date(now - ms).toISOString();

test("relative times", () => {
  assert.equal(timeAgo(ago(10_000), now), "just now");
  assert.equal(timeAgo(ago(5 * 60_000), now), "5m");
  assert.equal(timeAgo(ago(3 * 3_600_000), now), "3h");
  assert.equal(timeAgo(ago(2 * 86_400_000), now), "2d");
  assert.equal(timeAgo(ago(15 * 86_400_000), now), "2w");
});

test("old or invalid dates fall back safely", () => {
  assert.match(timeAgo(ago(90 * 86_400_000), now), /\d{4}/);
  assert.equal(timeAgo("not a date", now), "");
});
```

- [ ] **Step 2: Add the test script and run — confirm failure**

In `client/package.json` add to `scripts`:

```json
"test": "node --test \"src/features/safargram/utils/*.test.js\""
```

Run: `npm test`
Expected: FAIL — cannot find `captionParts.js` / `timeAgo.js`.

- [ ] **Step 3: Implement the pure helpers**

`client/src/features/safargram/utils/captionParts.js`:

```js
// Same rule as the server (letters/digits/underscore, 1-50, not followed by more).
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
```

`client/src/features/safargram/utils/timeAgo.js`:

```js
export function timeAgo(date, now = Date.now()) {
  const time = new Date(date).getTime();
  if (Number.isNaN(time)) return "";
  const seconds = Math.max(0, Math.floor((now - time) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return new Date(time).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
```

`client/src/features/safargram/utils/mediaRules.js`:

```js
export const MEDIA_RULES = Object.freeze({
  maxImages: 5,
  maxImageBytes: 8 * 1024 * 1024,
  maxVideoBytes: 50 * 1024 * 1024,
  accept:
    "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm",
});

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export const isVideo = (file) => VIDEO_TYPES.includes(file.type);

// Mirrors the server rules so users get instant feedback (the server re-checks).
export function validateSelection(files) {
  if (files.length === 0) return null;
  for (const f of files) {
    if (!IMAGE_TYPES.includes(f.type) && !VIDEO_TYPES.includes(f.type)) {
      return "Only JPG, PNG, WEBP photos and MP4, MOV, WEBM videos are allowed";
    }
  }
  const videos = files.filter(isVideo);
  const images = files.length - videos.length;
  if (videos.length > 0 && images > 0) return "A post can have photos or one video, not both";
  if (videos.length > 1) return "A post can have only one video";
  if (images > MEDIA_RULES.maxImages) return "You can add up to 5 photos";
  if (files.some((f) => !isVideo(f) && f.size > MEDIA_RULES.maxImageBytes)) {
    return "Each photo must be 8 MB or smaller";
  }
  if (videos.some((f) => f.size > MEDIA_RULES.maxVideoBytes)) {
    return "Video must be 50 MB or smaller (and up to 60 seconds)";
  }
  return null;
}
```

- [ ] **Step 4: Run and confirm the tests pass**

Run: `npm test`
Expected: 5 tests PASS.

- [ ] **Step 5: Implement the API module and the paging hook**

`client/src/features/safargram/api.js`:

```js
import { http } from "../../config/api";

const BASE = "/api/v1/safargram";
const body = (response) => response.data;
const withCursor = (cursor) => ({ params: cursor ? { cursor } : {} });

export const getFeed = (tab, cursor) =>
  http.get(`${BASE}/feed`, { params: { tab, ...(cursor ? { cursor } : {}) } }).then(body);

export const getPost = (id) => http.get(`${BASE}/posts/${id}`).then(body);

// Do NOT set Content-Type: axios adds the multipart boundary for FormData.
export const createPost = (formData, onProgress) =>
  http
    .post(`${BASE}/posts`, formData, {
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    })
    .then(body);

export const deletePost = (id) => http.delete(`${BASE}/posts/${id}`).then(body);
export const likePost = (id) => http.post(`${BASE}/posts/${id}/like`).then(body);
export const unlikePost = (id) => http.delete(`${BASE}/posts/${id}/like`).then(body);
export const savePost = (id) => http.post(`${BASE}/posts/${id}/save`).then(body);
export const unsavePost = (id) => http.delete(`${BASE}/posts/${id}/save`).then(body);

export const getComments = (id, cursor) =>
  http.get(`${BASE}/posts/${id}/comments`, withCursor(cursor)).then(body);
export const addComment = (id, text) =>
  http.post(`${BASE}/posts/${id}/comments`, { text }).then(body);
export const deleteComment = (id) => http.delete(`${BASE}/comments/${id}`).then(body);

export const getUserPosts = (username, cursor) =>
  http.get(`${BASE}/users/${encodeURIComponent(username)}/posts`, withCursor(cursor)).then(body);
export const getSaved = (cursor) => http.get(`${BASE}/saved`, withCursor(cursor)).then(body);
export const getHashtagPosts = (tag, cursor) =>
  http.get(`${BASE}/hashtags/${encodeURIComponent(tag)}`, withCursor(cursor)).then(body);
export const getDestinationPosts = (id, cursor) =>
  http.get(`${BASE}/destinations/${id}/posts`, withCursor(cursor)).then(body);

let destinationsPromise = null;
export const getDestinations = () => {
  if (!destinationsPromise) {
    destinationsPromise = http
      .get("/api/v1/destinations")
      .then((r) => r.data.data || [])
      .catch((error) => {
        destinationsPromise = null; // allow a retry
        throw error;
      });
  }
  return destinationsPromise;
};
export const getDestination = (id) =>
  http.get(`/api/v1/destinations/${id}`).then((r) => r.data.data);
```

`client/src/features/safargram/hooks/useCursorList.js`:

```js
import { useCallback, useEffect, useRef, useState } from "react";

const messageOf = (error) =>
  error?.response?.data?.message || "Something went wrong. Please try again.";

// Loads the first page whenever `deps` change and appends further pages on demand.
export default function useCursorList(fetchPage, deps = []) {
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const page = await fetchRef.current(null);
      if (id !== requestId.current) return; // a newer request replaced this one
      setItems(page.data);
      setNextCursor(page.nextCursor);
    } catch (e) {
      if (id === requestId.current) setError(messageOf(e));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchRef.current(nextCursor);
      setItems((prev) => [
        ...prev,
        ...page.data.filter((n) => !prev.some((p) => p._id === n._id)),
      ]);
      setNextCursor(page.nextCursor);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  return { items, setItems, loading, loadingMore, error, hasMore: !!nextCursor, loadMore, reload };
}
```

- [ ] **Step 6: Lint the new folder**

Run: `npx eslint src/features/safargram`
Expected: no errors (warnings about hook deps are already suppressed inline).

- [ ] **Step 7: Checkpoint (owner runs)**

```bash
git add client/package.json client/src/features/safargram
git commit -m "Add SafarGram client API module, paging hook and helpers"
```

---

## Task 12: Styles and post display components

**Files:**
- Create: `client/src/features/safargram/safargram.scss`, `components/Wordmark.jsx`, `MediaCarousel.jsx`, `CaptionText.jsx`, `PostCard.jsx`, `PostGrid.jsx`

**Interfaces:**
- Consumes: `api.js` (`likePost`, `unlikePost`, `savePost`, `unsavePost`, `deletePost`), `splitCaption`, `timeAgo`, `state.auth.user` (`id`/`_id`, `role`).
- Produces:
  - `<Wordmark size? />`
  - `<MediaCarousel media={PostJSON['media']} />`
  - `<CaptionText text={string} />` (hashtags link to `/safargram/tag/<lowercase>`)
  - `<PostCard post onChange(updatedPost) onDeleted(id) detail? />`
  - `<PostGrid posts loading emptyText />` (thumbnail grid linking to `/safargram/post/:id`)
  - Global class prefix `sg-`; `safargram.scss` is imported once by `FeedPage` (Task 13) and by any page that uses these components.

- [ ] **Step 1: Create the stylesheet**

`client/src/features/safargram/safargram.scss`:

```scss
// SafarGram - uses the tokens from styles/indian-theme.css
.sg-page {
  min-height: 100vh;
  padding: 80px 12px 40px; // clears the fixed navbar
  background: var(--cream-marble, #fff8e7);
}
.sg-column {
  max-width: 470px;
  margin: 0 auto;
}
.sg-wide {
  max-width: 935px;
  margin: 0 auto;
}

.sg-wordmark {
  font-family: "Shrikhand", cursive;
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1;
  .safar {
    color: #ff0000;
    text-shadow: 0 0 14px rgba(255, 0, 0, 0.35);
  }
  .gram {
    background: linear-gradient(135deg, #ffd700 0%, #ff9933 60%, #ff6b35 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.sg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  .sg-wordmark {
    font-size: 2rem;
  }
}

.sg-btn {
  border: 0;
  border-radius: 999px;
  padding: 9px 18px;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, var(--saffron-primary, #ff9933), #ff6b35);
  color: #fff;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  &.ghost {
    background: transparent;
    color: var(--charcoal, #36454f);
    border: 1px solid rgba(0, 0, 0, 0.15);
  }
}

.sg-tabs {
  display: flex;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  button {
    flex: 1;
    padding: 10px;
    background: none;
    border: 0;
    border-bottom: 3px solid transparent;
    font-weight: 600;
    color: var(--stone-grey, #808080);
    cursor: pointer;
    &.active {
      color: var(--charcoal, #36454f);
      border-bottom-color: var(--saffron-primary, #ff9933);
    }
  }
}

.sg-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
  margin-bottom: 20px;
  overflow: hidden;
}
.sg-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  .sg-author {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    a {
      color: var(--deep-black, #1a1a1a);
      font-weight: 700;
      text-decoration: none;
    }
    .sg-place {
      font-size: 0.78rem;
      color: var(--forest-green, #138808);
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
  }
  .sg-delete {
    background: none;
    border: 0;
    color: var(--stone-grey, #808080);
    cursor: pointer;
  }
}
.sg-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  background: linear-gradient(135deg, #ffd700, #ff6b35);
  color: #fff;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.sg-media {
  position: relative;
  background: #000;
  .sg-track {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  .sg-slide {
    flex: 0 0 100%;
    scroll-snap-align: center;
    max-height: 580px;
    display: flex;
    align-items: center;
    justify-content: center;
    img,
    video {
      width: 100%;
      max-height: 580px;
      object-fit: contain;
    }
  }
  .sg-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.85);
    border: 0;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    cursor: pointer;
    &.prev {
      left: 8px;
    }
    &.next {
      right: 8px;
    }
  }
  .sg-dots {
    position: absolute;
    bottom: 8px;
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 5px;
    span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      &.on {
        background: var(--saffron-primary, #ff9933);
      }
    }
  }
}

.sg-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 14px 4px;
  button,
  a {
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
    color: var(--charcoal, #36454f);
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .sg-like.on svg {
    fill: var(--red-sindoor, #e63946);
    color: var(--red-sindoor, #e63946);
  }
  .sg-save {
    margin-left: auto;
    font-size: 0.8rem;
    &.on svg {
      fill: var(--saffron-primary, #ff9933);
      color: var(--saffron-primary, #ff9933);
    }
  }
}
.sg-body {
  padding: 2px 14px 14px;
  .sg-likes {
    font-weight: 700;
    margin-bottom: 4px;
  }
  .sg-caption {
    white-space: pre-wrap;
    word-break: break-word;
    a.sg-tag {
      color: #c1502e;
      text-decoration: none;
      font-weight: 600;
    }
  }
  .sg-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
    font-size: 0.78rem;
    color: var(--stone-grey, #808080);
  }
  .sg-badge {
    background: rgba(19, 136, 8, 0.1);
    color: var(--forest-green, #138808);
    border-radius: 999px;
    padding: 2px 9px;
    font-weight: 600;
  }
  .sg-viewall {
    display: block;
    margin-top: 6px;
    color: var(--stone-grey, #808080);
    text-decoration: none;
  }
}

.sg-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  .sg-thumb {
    position: relative;
    aspect-ratio: 1;
    background: #ddd;
    overflow: hidden;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .sg-thumb-icon {
      position: absolute;
      top: 6px;
      right: 6px;
      color: #fff;
      filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.6));
    }
    .sg-thumb-stats {
      position: absolute;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      gap: 14px;
      color: #fff;
      font-weight: 700;
      background: rgba(0, 0, 0, 0.4);
    }
    &:hover .sg-thumb-stats {
      display: flex;
    }
  }
}

.sg-state {
  text-align: center;
  color: var(--stone-grey, #808080);
  padding: 30px 10px;
  .sg-btn {
    margin-top: 10px;
  }
}

// Create-post modal
.sg-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}
.sg-modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 92vh;
  overflow-y: auto;
  padding: 18px;
  h3 {
    margin: 0 0 12px;
  }
  label {
    display: block;
    font-weight: 600;
    margin: 12px 0 4px;
  }
  textarea,
  select,
  input[type="text"] {
    width: 100%;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    padding: 9px 11px;
    font: inherit;
  }
  .sg-previews {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 8px;
    .sg-preview {
      position: relative;
      width: 84px;
      height: 84px;
      border-radius: 10px;
      overflow: hidden;
      background: #000;
      img,
      video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      button {
        position: absolute;
        top: 3px;
        right: 3px;
        border: 0;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        cursor: pointer;
      }
    }
  }
  .sg-error {
    color: var(--red-sindoor, #e63946);
    margin-top: 10px;
  }
  .sg-progress {
    height: 8px;
    border-radius: 6px;
    background: #eee;
    margin-top: 12px;
    overflow: hidden;
    div {
      height: 100%;
      background: linear-gradient(90deg, #ffd700, #ff6b35);
      transition: width 0.2s;
    }
  }
  .sg-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 16px;
  }
  .sg-options {
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 10px;
    margin-top: 4px;
    button {
      display: block;
      width: 100%;
      text-align: left;
      padding: 8px 11px;
      background: none;
      border: 0;
      cursor: pointer;
      &:hover {
        background: rgba(255, 153, 51, 0.12);
      }
    }
  }
  .sg-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(19, 136, 8, 0.1);
    color: var(--forest-green, #138808);
    button {
      background: none;
      border: 0;
      cursor: pointer;
    }
  }
}

// Comments
.sg-comments {
  .sg-comment {
    display: flex;
    gap: 10px;
    padding: 8px 0;
    .sg-comment-body {
      flex: 1;
      word-break: break-word;
      strong a {
        color: inherit;
        text-decoration: none;
      }
      small {
        display: block;
        color: var(--stone-grey, #808080);
      }
    }
    button {
      background: none;
      border: 0;
      cursor: pointer;
      color: var(--stone-grey, #808080);
    }
  }
  form {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
    input {
      flex: 1;
      border: 1px solid rgba(0, 0, 0, 0.2);
      border-radius: 999px;
      padding: 9px 14px;
    }
  }
}

.sg-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  h2 {
    margin: 0;
  }
}
```

- [ ] **Step 2: Create the small display components**

`client/src/features/safargram/components/Wordmark.jsx`:

```jsx
import React from "react";
import "../safargram.scss";

const Wordmark = ({ size }) => (
  <span className="sg-wordmark" style={size ? { fontSize: size } : undefined}>
    <span className="safar">Safar</span>
    <span className="gram">Gram</span>
  </span>
);

export default Wordmark;
```

`client/src/features/safargram/components/CaptionText.jsx`:

```jsx
import React from "react";
import { Link } from "react-router-dom";
import { splitCaption } from "../utils/captionParts";

// Renders plain text plus #hashtag links. Nothing is ever injected as HTML.
const CaptionText = ({ text }) => (
  <>
    {splitCaption(text).map((part, i) =>
      part.type === "tag" ? (
        <Link key={i} className="sg-tag" to={`/safargram/tag/${part.value.toLowerCase()}`}>
          #{part.value}
        </Link>
      ) : (
        <React.Fragment key={i}>{part.value}</React.Fragment>
      ),
    )}
  </>
);

export default CaptionText;
```

`client/src/features/safargram/components/MediaCarousel.jsx`:

```jsx
import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MediaCarousel = ({ media = [] }) => {
  const track = useRef(null);
  const [index, setIndex] = useState(0);

  const go = (delta) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: delta * el.clientWidth, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = track.current;
    if (el && el.clientWidth) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="sg-media">
      <div className="sg-track" ref={track} onScroll={onScroll}>
        {media.map((item) => (
          <div className="sg-slide" key={item.publicId}>
            {item.type === "video" ? (
              <video src={item.url} controls playsInline preload="metadata" />
            ) : (
              <img src={item.url} alt="" loading="lazy" />
            )}
          </div>
        ))}
      </div>
      {media.length > 1 && (
        <>
          {index > 0 && (
            <button type="button" className="sg-arrow prev" aria-label="Previous" onClick={() => go(-1)}>
              <ChevronLeft size={18} />
            </button>
          )}
          {index < media.length - 1 && (
            <button type="button" className="sg-arrow next" aria-label="Next" onClick={() => go(1)}>
              <ChevronRight size={18} />
            </button>
          )}
          <div className="sg-dots">
            {media.map((m, i) => (
              <span key={m.publicId} className={i === index ? "on" : ""} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MediaCarousel;
```

- [ ] **Step 3: Create PostCard**

`client/src/features/safargram/components/PostCard.jsx`:

```jsx
import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { Bookmark, Heart, MapPin, MessageCircle, Trash2 } from "lucide-react";
import { deletePost, likePost, savePost, unlikePost, unsavePost } from "../api";
import { timeAgo } from "../utils/timeAgo";
import CaptionText from "./CaptionText";
import MediaCarousel from "./MediaCarousel";
import "../safargram.scss";

const PostCard = ({ post, onChange, onDeleted, detail = false }) => {
  const me = useSelector((state) => state.auth.user);
  const myId = me?.id || me?._id;
  const busy = useRef(false); // ignore taps while a request is in flight

  const author = post.author;
  const authorName = author?.username || "deleted user";
  const canDelete = !!myId && (String(author?._id) === String(myId) || me?.role === "admin");

  const toggle = async (flag, countKey, on, off) => {
    if (busy.current) return;
    busy.current = true;
    const was = post[flag];
    const optimistic = { ...post, [flag]: !was };
    if (countKey) optimistic[countKey] = post[countKey] + (was ? -1 : 1);
    onChange(optimistic); // instant feedback
    try {
      await (was ? off(post._id) : on(post._id));
    } catch {
      onChange(post); // roll back
      toast.error("Could not update. Please try again.");
    } finally {
      busy.current = false;
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      await deletePost(post._id);
      toast.success("Post deleted");
      onDeleted(post._id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete the post");
    }
  };

  return (
    <article className="sg-card">
      <div className="sg-card-head">
        {author?.avatar ? (
          <img className="sg-avatar" src={author.avatar} alt="" />
        ) : (
          <span className="sg-avatar">{authorName[0]?.toUpperCase()}</span>
        )}
        <div className="sg-author">
          {author ? <Link to={`/profile/${author.username}`}>{author.username}</Link> : <strong>{authorName}</strong>}
          {post.destination && (
            <Link className="sg-place" to={`/safargram/destination/${post.destination._id}`}>
              <MapPin size={12} /> {post.destination.name}
            </Link>
          )}
        </div>
        {canDelete && (
          <button type="button" className="sg-delete" aria-label="Delete post" onClick={handleDelete}>
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <MediaCarousel media={post.media} />

      <div className="sg-actions">
        <button
          type="button"
          className={`sg-like ${post.likedByMe ? "on" : ""}`}
          aria-label={post.likedByMe ? "Unlike" : "Like"}
          onClick={() => toggle("likedByMe", "likesCount", likePost, unlikePost)}
        >
          <Heart size={24} />
        </button>
        <Link to={`/safargram/post/${post._id}`} aria-label="Comments">
          <MessageCircle size={24} />
        </Link>
        <button
          type="button"
          className={`sg-save ${post.savedByMe ? "on" : ""}`}
          onClick={() => toggle("savedByMe", null, savePost, unsavePost)}
        >
          <Bookmark size={22} /> {post.savedByMe ? "In Bucket List" : "Add to Bucket List"}
        </button>
      </div>

      <div className="sg-body">
        <div className="sg-likes">
          {post.likesCount} {post.likesCount === 1 ? "like" : "likes"}
        </div>
        {post.caption && (
          <div className="sg-caption">
            <strong>{authorName}</strong> <CaptionText text={post.caption} />
          </div>
        )}
        <div className="sg-meta">
          {post.category && post.category !== "Other" && <span className="sg-badge">{post.category}</span>}
          <span>{timeAgo(post.createdAt)}</span>
        </div>
        {!detail && post.commentsCount > 0 && (
          <Link className="sg-viewall" to={`/safargram/post/${post._id}`}>
            View all {post.commentsCount} comments
          </Link>
        )}
      </div>
    </article>
  );
};

export default PostCard;
```

- [ ] **Step 4: Create PostGrid**

`client/src/features/safargram/components/PostGrid.jsx`:

```jsx
import React from "react";
import { Link } from "react-router-dom";
import { Copy, Heart, MessageCircle, Play } from "lucide-react";
import "../safargram.scss";

const thumbOf = (post) => {
  const first = post.media?.[0];
  if (!first) return "";
  // Cloudinary can render a still frame of a video by swapping the extension.
  return first.type === "video" ? first.url.replace(/\.[a-z0-9]+$/i, ".jpg") : first.url;
};

const PostGrid = ({ posts, loading, emptyText = "No posts yet." }) => {
  if (loading) return <div className="sg-state">Loading…</div>;
  if (!posts.length) return <div className="sg-state">{emptyText}</div>;
  return (
    <div className="sg-grid">
      {posts.map((post) => (
        <Link key={post._id} className="sg-thumb" to={`/safargram/post/${post._id}`}>
          <img src={thumbOf(post)} alt="" loading="lazy" />
          {post.media?.[0]?.type === "video" && <Play className="sg-thumb-icon" size={18} />}
          {post.media?.length > 1 && <Copy className="sg-thumb-icon" size={18} />}
          <span className="sg-thumb-stats">
            <span><Heart size={16} /> {post.likesCount}</span>
            <span><MessageCircle size={16} /> {post.commentsCount}</span>
          </span>
        </Link>
      ))}
    </div>
  );
};

export default PostGrid;
```

- [ ] **Step 5: Lint and build**

Run: `npx eslint src/features/safargram && npx vite build 2>&1 | tail -3`
Expected: no lint errors; `✓ built`.

- [ ] **Step 6: Checkpoint (owner runs)**

```bash
git add client/src/features/safargram
git commit -m "Add SafarGram styles and post display components"
```

---

## Task 13: Feed page, create-post modal and destination picker

**Files:**
- Create: `client/src/features/safargram/components/DestinationPicker.jsx`, `CreatePostModal.jsx`, `pages/FeedPage.jsx`

**Interfaces:**
- Consumes: `getDestinations`, `createPost`, `getFeed`, `useCursorList`, `validateSelection`, `MEDIA_RULES`, `isVideo`, `PostCard`, `Wordmark`.
- Produces:
  - `<DestinationPicker value={{_id,name}|null} onChange />`
  - `<CreatePostModal onClose onCreated(post) />`
  - default export `FeedPage` (route `/safargram`, added in Task 15).
- Categories offered in the modal: `Trekking, Wildlife, Culture, Eco-stay, Beach, Food, Adventure, Other`.

- [ ] **Step 1: DestinationPicker**

`client/src/features/safargram/components/DestinationPicker.jsx`:

```jsx
import React, { useEffect, useState } from "react";
import { MapPin, X } from "lucide-react";
import { getDestinations } from "../api";

const DestinationPicker = ({ value, onChange }) => {
  const [all, setAll] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    getDestinations()
      .then((list) => alive && setAll(list))
      .catch(() => {}); // the picker is optional; posting still works without it
    return () => {
      alive = false;
    };
  }, []);

  if (value) {
    return (
      <span className="sg-chip">
        <MapPin size={14} /> {value.name}
        <button type="button" aria-label="Remove destination" onClick={() => onChange(null)}>
          <X size={14} />
        </button>
      </span>
    );
  }

  const q = query.trim().toLowerCase();
  const matches = q ? all.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 6) : [];

  return (
    <div>
      <input
        type="text"
        placeholder="Search a destination (optional)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {matches.length > 0 && (
        <div className="sg-options">
          {matches.map((d) => (
            <button
              type="button"
              key={d._id}
              onClick={() => {
                onChange({ _id: d._id, name: d.name });
                setQuery("");
              }}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DestinationPicker;
```

- [ ] **Step 2: CreatePostModal**

`client/src/features/safargram/components/CreatePostModal.jsx`:

```jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { X } from "lucide-react";
import { createPost } from "../api";
import { MEDIA_RULES, isVideo, validateSelection } from "../utils/mediaRules";
import DestinationPicker from "./DestinationPicker";
import "../safargram.scss";

const CATEGORIES = ["Trekking", "Wildlife", "Culture", "Eco-stay", "Beach", "Food", "Adventure", "Other"];

const CreatePostModal = ({ onClose, onCreated }) => {
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("Other");
  const [destination, setDestination] = useState(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const input = useRef(null);

  // Object URLs for previews; revoked when the selection changes or the modal closes.
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !submitting && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const addFiles = (list) => {
    const next = [...files, ...Array.from(list)];
    const problem = validateSelection(next);
    if (problem) {
      setError(problem);
    } else {
      setError("");
      setFiles(next);
    }
    if (input.current) input.current.value = "";
  };

  const removeFile = (index) => setFiles(files.filter((_, i) => i !== index));

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const problem = files.length === 0 ? "Add at least one photo or a video" : validateSelection(files);
    if (problem) return setError(problem);

    const form = new FormData();
    files.forEach((f) => form.append("media", f));
    form.append("caption", caption);
    form.append("category", category);
    if (destination) form.append("destinationId", destination._id);

    setSubmitting(true);
    setError("");
    setProgress(0);
    try {
      const { data } = await createPost(form, setProgress);
      toast.success("Posted to SafarGram!");
      onCreated(data);
    } catch (err) {
      // Keep the modal (and the user's work) open so they can retry.
      setError(err.response?.data?.message || "Upload failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="sg-overlay" onMouseDown={(e) => e.target === e.currentTarget && !submitting && onClose()}>
      <form className="sg-modal" onSubmit={submit}>
        <h3>Share your journey</h3>

        <button type="button" className="sg-btn ghost" onClick={() => input.current?.click()} disabled={submitting}>
          Add photos or a video
        </button>
        <input
          ref={input}
          type="file"
          hidden
          multiple
          accept={MEDIA_RULES.accept}
          onChange={(e) => addFiles(e.target.files)}
        />
        <div className="sg-previews">
          {files.map((f, i) => (
            <div className="sg-preview" key={`${f.name}-${i}`}>
              {isVideo(f) ? <video src={previews[i]} muted /> : <img src={previews[i]} alt="" />}
              {!submitting && (
                <button type="button" aria-label="Remove" onClick={() => removeFile(i)}>
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>

        <label htmlFor="sg-caption">Caption</label>
        <textarea
          id="sg-caption"
          rows={4}
          maxLength={2200}
          placeholder="Tell the story… use #hashtags"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={submitting}
        />

        <label htmlFor="sg-category">Category</label>
        <select id="sg-category" value={category} onChange={(e) => setCategory(e.target.value)} disabled={submitting}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <label>Destination</label>
        <DestinationPicker value={destination} onChange={setDestination} />

        {submitting && (
          <div className="sg-progress" role="progressbar" aria-valuenow={progress}>
            <div style={{ width: `${progress}%` }} />
          </div>
        )}
        {error && <div className="sg-error">{error}</div>}

        <div className="sg-modal-actions">
          <button type="button" className="sg-btn ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="sg-btn" disabled={submitting}>
            {submitting ? (progress < 100 ? `Uploading ${progress}%` : "Processing…") : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostModal;
```

- [ ] **Step 3: FeedPage**

`client/src/features/safargram/pages/FeedPage.jsx`:

```jsx
import React, { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { getFeed } from "../api";
import useCursorList from "../hooks/useCursorList";
import Wordmark from "../components/Wordmark";
import PostCard from "../components/PostCard";
import CreatePostModal from "../components/CreatePostModal";
import "../safargram.scss";

function FeedList({ tab }) {
  const { items, setItems, loading, loadingMore, error, hasMore, loadMore, reload } = useCursorList(
    (cursor) => getFeed(tab, cursor),
    [tab],
  );
  const replace = (post) => setItems((list) => list.map((p) => (p._id === post._id ? post : p)));
  const remove = (id) => setItems((list) => list.filter((p) => p._id !== id));

  if (loading) return <div className="sg-state">Loading…</div>;
  if (error && items.length === 0) {
    return (
      <div className="sg-state">
        {error}
        <div>
          <button className="sg-btn" onClick={reload}>Try again</button>
        </div>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="sg-state">
        {tab === "following"
          ? "Follow travellers to see their posts here. Try the Discover tab!"
          : "No posts yet. Be the first to share a journey!"}
      </div>
    );
  }
  return (
    <>
      {items.map((post) => (
        <PostCard key={post._id} post={post} onChange={replace} onDeleted={remove} />
      ))}
      {error && <div className="sg-state">{error}</div>}
      {hasMore && (
        <div className="sg-state">
          <button className="sg-btn ghost" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}

const FeedPage = () => {
  const [tab, setTab] = useState(null); // null until we know where to start
  const [showCreate, setShowCreate] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Open on "Following" only if it has something to show; otherwise on Discover.
  useEffect(() => {
    let alive = true;
    getFeed("following")
      .then((r) => alive && setTab(r.data.length ? "following" : "discover"))
      .catch(() => alive && setTab("discover"));
    return () => {
      alive = false;
    };
  }, []);

  const handleCreated = () => {
    setShowCreate(false);
    setTab("discover"); // your new post shows up in Discover
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="sg-page">
      <div className="sg-column">
        <div className="sg-header">
          <Wordmark />
          <button className="sg-btn" onClick={() => setShowCreate(true)}>
            <Camera size={16} style={{ verticalAlign: "-3px" }} /> Share your journey
          </button>
        </div>

        <div className="sg-tabs">
          <button className={tab === "discover" ? "active" : ""} onClick={() => setTab("discover")}>
            Discover
          </button>
          <button className={tab === "following" ? "active" : ""} onClick={() => setTab("following")}>
            Following
          </button>
        </div>

        {tab ? <FeedList key={`${tab}-${reloadKey}`} tab={tab} /> : <div className="sg-state">Loading…</div>}
      </div>

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
};

export default FeedPage;
```

- [ ] **Step 4: Lint and build**

Run: `npx eslint src/features/safargram && npx vite build 2>&1 | tail -3`
Expected: no lint errors; `✓ built`.

- [ ] **Step 5: Checkpoint (owner runs)**

```bash
git add client/src/features/safargram
git commit -m "Add SafarGram feed page and create-post modal"
```

---

## Task 14: Post page, comments, and paged grid pages (hashtag, destination)

**Files:**
- Create: `client/src/features/safargram/components/CommentList.jsx`, `PagedPostGrid.jsx`, `ProfileSafarGrid.jsx`, `ProfileBucketList.jsx`, `pages/PostPage.jsx`, `pages/TagPage.jsx`, `pages/DestinationPostsPage.jsx`

**Interfaces:**
- Consumes: `getComments`, `addComment`, `deleteComment`, `getPost`, `getHashtagPosts`, `getDestinationPosts`, `getDestination`, `getUserPosts`, `getSaved`, `useCursorList`, `PostCard`, `PostGrid`, `timeAgo`.
- Produces:
  - `<CommentList postId postAuthorId onCountChange(delta) />`
  - `<PagedPostGrid fetchPage(cursor) deps emptyText />`
  - `<ProfileSafarGrid username />` and `<ProfileBucketList />` (used by the Profile page in Task 15)
  - default exports `PostPage`, `TagPage`, `DestinationPostsPage`.

- [ ] **Step 1: CommentList**

`client/src/features/safargram/components/CommentList.jsx`:

```jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { addComment, deleteComment, getComments } from "../api";
import useCursorList from "../hooks/useCursorList";
import { timeAgo } from "../utils/timeAgo";
import "../safargram.scss";

const CommentList = ({ postId, postAuthorId, onCountChange }) => {
  const me = useSelector((state) => state.auth.user);
  const myId = String(me?.id || me?._id || "");
  const { items, setItems, loading, loadingMore, error, hasMore, loadMore } = useCursorList(
    (cursor) => getComments(postId, cursor),
    [postId],
  );
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      const { data } = await addComment(postId, value);
      setItems((list) => [data, ...list]);
      onCountChange?.(1);
      setText("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not post the comment");
    } finally {
      setSending(false);
    }
  };

  const remove = async (id) => {
    try {
      await deleteComment(id);
      setItems((list) => list.filter((c) => c._id !== id));
      onCountChange?.(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the comment");
    }
  };

  const canDelete = (c) =>
    !!myId &&
    (String(c.author?._id) === myId || String(postAuthorId) === myId || me?.role === "admin");

  return (
    <div className="sg-comments">
      <form onSubmit={submit}>
        <input
          type="text"
          placeholder="Add a comment…"
          maxLength={500}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="sg-btn" disabled={sending || !text.trim()}>Post</button>
      </form>

      {loading && <div className="sg-state">Loading comments…</div>}
      {error && <div className="sg-state">{error}</div>}
      {!loading && items.length === 0 && !error && <div className="sg-state">No comments yet.</div>}

      {items.map((c) => (
        <div className="sg-comment" key={c._id}>
          <div className="sg-comment-body">
            <strong>
              {c.author ? <Link to={`/profile/${c.author.username}`}>{c.author.username}</Link> : "deleted user"}
            </strong>{" "}
            {c.text}
            <small>{timeAgo(c.createdAt)}</small>
          </div>
          {canDelete(c) && (
            <button type="button" aria-label="Delete comment" onClick={() => remove(c._id)}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}

      {hasMore && (
        <div className="sg-state">
          <button className="sg-btn ghost" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more comments"}
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentList;
```

- [ ] **Step 2: PagedPostGrid and the two profile wrappers**

`client/src/features/safargram/components/PagedPostGrid.jsx`:

```jsx
import React from "react";
import useCursorList from "../hooks/useCursorList";
import PostGrid from "./PostGrid";
import "../safargram.scss";

const PagedPostGrid = ({ fetchPage, deps, emptyText }) => {
  const { items, loading, loadingMore, error, hasMore, loadMore, reload } = useCursorList(fetchPage, deps);

  if (error && items.length === 0) {
    return (
      <div className="sg-state">
        {error}
        <div>
          <button className="sg-btn" onClick={reload}>Try again</button>
        </div>
      </div>
    );
  }
  return (
    <>
      <PostGrid posts={items} loading={loading} emptyText={emptyText} />
      {hasMore && (
        <div className="sg-state">
          <button className="sg-btn ghost" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
};

export default PagedPostGrid;
```

`client/src/features/safargram/components/ProfileSafarGrid.jsx`:

```jsx
import React from "react";
import { getUserPosts } from "../api";
import PagedPostGrid from "./PagedPostGrid";

const ProfileSafarGrid = ({ username }) => (
  <PagedPostGrid
    fetchPage={(cursor) => getUserPosts(username, cursor)}
    deps={[username]}
    emptyText="No SafarGram posts yet."
  />
);

export default ProfileSafarGrid;
```

`client/src/features/safargram/components/ProfileBucketList.jsx`:

```jsx
import React from "react";
import { getSaved } from "../api";
import PagedPostGrid from "./PagedPostGrid";

const ProfileBucketList = () => (
  <PagedPostGrid
    fetchPage={(cursor) => getSaved(cursor)}
    deps={[]}
    emptyText="Your Bucket List is empty. Tap “Add to Bucket List” on any post."
  />
);

export default ProfileBucketList;
```

- [ ] **Step 3: The three pages**

`client/src/features/safargram/pages/PostPage.jsx`:

```jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPost } from "../api";
import PostCard from "../components/PostCard";
import CommentList from "../components/CommentList";
import "../safargram.scss";

const PostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setPost(null);
    setError("");
    getPost(id)
      .then((r) => alive && setPost(r.data))
      .catch((e) => alive && setError(e.response?.status === 404 ? "This post no longer exists." : "Could not load the post."));
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="sg-page">
      <div className="sg-column">
        <p><Link to="/safargram">← Back to SafarGram</Link></p>
        {error && <div className="sg-state">{error}</div>}
        {!post && !error && <div className="sg-state">Loading…</div>}
        {post && (
          <>
            <PostCard
              post={post}
              detail
              onChange={setPost}
              onDeleted={() => navigate("/safargram")}
            />
            <div className="sg-card" style={{ padding: 14 }}>
              <CommentList
                postId={post._id}
                postAuthorId={post.author?._id}
                onCountChange={(delta) => setPost((p) => ({ ...p, commentsCount: Math.max(0, p.commentsCount + delta) }))}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PostPage;
```

`client/src/features/safargram/pages/TagPage.jsx`:

```jsx
import React from "react";
import { Link, useParams } from "react-router-dom";
import { getHashtagPosts } from "../api";
import PagedPostGrid from "../components/PagedPostGrid";
import "../safargram.scss";

const TagPage = () => {
  const { tag } = useParams();
  return (
    <div className="sg-page">
      <div className="sg-wide">
        <div className="sg-title">
          <Link to="/safargram">←</Link>
          <h2>#{tag}</h2>
        </div>
        <PagedPostGrid
          fetchPage={(cursor) => getHashtagPosts(tag, cursor)}
          deps={[tag]}
          emptyText={`No posts with #${tag} yet.`}
        />
      </div>
    </div>
  );
};

export default TagPage;
```

`client/src/features/safargram/pages/DestinationPostsPage.jsx`:

```jsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin } from "lucide-react";
import { getDestination, getDestinationPosts } from "../api";
import PagedPostGrid from "../components/PagedPostGrid";
import "../safargram.scss";

const DestinationPostsPage = () => {
  const { id } = useParams();
  const [name, setName] = useState("");

  useEffect(() => {
    let alive = true;
    setName("");
    getDestination(id)
      .then((d) => alive && setName(d?.name || ""))
      .catch(() => {}); // the title is cosmetic; the grid still works
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="sg-page">
      <div className="sg-wide">
        <div className="sg-title">
          <Link to="/safargram">←</Link>
          <h2><MapPin size={20} /> {name || "Destination"}</h2>
          <Link to={`/destinations/${id}`}>View destination</Link>
        </div>
        <PagedPostGrid
          fetchPage={(cursor) => getDestinationPosts(id, cursor)}
          deps={[id]}
          emptyText="No traveller posts here yet. Be the first!"
        />
      </div>
    </div>
  );
};

export default DestinationPostsPage;
```

- [ ] **Step 4: Lint and build**

Run: `npx eslint src/features/safargram && npx vite build 2>&1 | tail -3`
Expected: no lint errors; `✓ built`.

- [ ] **Step 5: Checkpoint (owner runs)**

```bash
git add client/src/features/safargram
git commit -m "Add SafarGram post page, comments and hashtag/destination pages"
```

---

## Task 15: Routing, navbar, profile tabs and destination link

**Files:**
- Modify: `client/src/App.jsx`, `client/src/Components/Navbar/Navbar.jsx`, `client/src/Components/Profile/ProfileTabs/ProfileTabs.jsx`, `client/src/Pages/Profile/Profile.jsx`, `client/src/Pages/Destination/DestinationDetail.jsx`

**Interfaces:**
- Consumes: pages and components from Tasks 12–14.
- Produces: routes `/safargram`, `/safargram/post/:id`, `/safargram/tag/:tag`, `/safargram/destination/:id` (all inside `ProtectedRoute` with Navbar/Sidebar/Footer); `/homegram` redirects to `/safargram`.

> If the `Edit` tool reports "no match" on a file below, the file uses CRLF line endings: apply the same replacement with a short Python script (read with `encoding="utf-8"`, `str.replace`, write back), as done earlier in this project.

- [ ] **Step 1: App.jsx — imports and a shell wrapper**

Replace the line

```jsx
const HomeGram = lazy(() => import("./Pages/SafarGram/HomeGram/HomeGram"));
```

with

```jsx
const SafarFeed = lazy(() => import("./features/safargram/pages/FeedPage"));
const SafarPost = lazy(() => import("./features/safargram/pages/PostPage"));
const SafarTag = lazy(() => import("./features/safargram/pages/TagPage"));
const SafarDestination = lazy(
  () => import("./features/safargram/pages/DestinationPostsPage"),
);

// Logged-in page with the standard site chrome.
const Shell = ({ children }) => (
  <ProtectedRoute>
    <div>
      <Navbar />
      <Sidebar />
      {children}
      <Footer />
    </div>
  </ProtectedRoute>
);
```

- [ ] **Step 2: App.jsx — replace the `/homegram` route**

Replace the whole element that starts at `<Route path="/homegram"` (the `ProtectedRoute` block containing the two `blur` divs, `<Sidebar />` and `<HomeGram />`) with:

```jsx
            <Route path="/homegram" element={<Navigate to="/safargram" replace />} />
            <Route path="/safargram" element={<Shell><SafarFeed /></Shell>} />
            <Route path="/safargram/post/:id" element={<Shell><SafarPost /></Shell>} />
            <Route path="/safargram/tag/:tag" element={<Shell><SafarTag /></Shell>} />
            <Route
              path="/safargram/destination/:id"
              element={<Shell><SafarDestination /></Shell>}
            />
```

- [ ] **Step 3: Navbar link**

In `client/src/Components/Navbar/Navbar.jsx` change `to="/homegram"` to `to="/safargram"` (single occurrence, the `SafarGram` `ProtectedLink`).

- [ ] **Step 4: Profile tabs**

In `client/src/Components/Profile/ProfileTabs/ProfileTabs.jsx`:

1. Change the lucide import to include `Navigation` (it is used for the Saved → Destinations sub-tab but was never imported, so it resolved to the browser's `window.Navigation` and crashed the Saved tab):

```jsx
import { Grid, BookOpen, Map, Bookmark, Image, Award, Navigation } from 'lucide-react';
```

2. Remove the two lines `import PostsGrid from '../Posts/PostsGrid';` and `import SavedPosts from '../SavedPosts/SavedPosts';`, and add:

```jsx
import ProfileSafarGrid from '../../../features/safargram/components/ProfileSafarGrid';
import ProfileBucketList from '../../../features/safargram/components/ProfileBucketList';
```

3. Add `username` to the props: `const ProfileTabs = ({ activeTab, setActiveTab, profile, isOwnProfile, username }) => {`
4. In `tabs`, change `{ id: 'posts', label: 'Posts', icon: Grid }` to `{ id: 'posts', label: 'SafarGram', icon: Grid }`; in the Saved `subTabs`, change `{ id: 'posts', label: 'Posts', icon: Grid }` to `{ id: 'posts', label: 'Bucket List', icon: Bookmark }`.
5. In `renderSavedContent`, replace `return <SavedPosts saved={profile?.saved} />;` with `return <ProfileBucketList />;`.
6. In `renderTabContent`, replace `return <PostsGrid posts={profile?.posts || []} />;` with `return <ProfileSafarGrid username={username} />;`.
7. Hide the stale legacy count on the SafarGram tab: change `{profile?.[tab.id]?.length > 0 && (` to `{tab.id !== 'posts' && profile?.[tab.id]?.length > 0 && (`.

In `client/src/Pages/Profile/Profile.jsx`, add the prop to the `<ProfileTabs …>` element: `username={profile.user.username}`.

- [ ] **Step 5: Destination page link**

In `client/src/Pages/Destination/DestinationDetail.jsx`: add `FiCamera` to the `react-icons/fi` import (the line containing `FiBookmark`), then directly after the Share button inside `<div className="hero-actions" …>` add:

```jsx
          <Link to={`/safargram/destination/${destination._id}`} className="action-btn">
            <FiCamera />
            Traveller posts
          </Link>
```

- [ ] **Step 6: Lint and build**

Run: `npx eslint src 2>&1 | tail -3 && npx vite build 2>&1 | tail -3`
Expected: `✓ built`; lint error count no higher than before this task (the previous baseline was 7 errors, all in legacy files: `ProfileModal.jsx`, `CommunityForum.jsx`).

- [ ] **Step 7: Checkpoint (owner runs)**

```bash
git add client/src/App.jsx client/src/Components/Navbar/Navbar.jsx client/src/Components/Profile/ProfileTabs/ProfileTabs.jsx client/src/Pages/Profile/Profile.jsx client/src/Pages/Destination/DestinationDetail.jsx
git commit -m "Wire SafarGram routes, navbar link, profile tabs and destination link"
```

---

## Task 16: Retire the legacy SafarGram code and final verification

**Files:**
- Delete (client, after the build proves they are unused): `Pages/SafarGram/`, `Components/{Post,Posts,PostShare,PostSide,ProfileSide,RightSide,ProfileLeft,ProfileCard,FollowersCard,InfoCard,User,TrendCard,LogoSearch,ProfileModal}/`, `actions/{postAction,uplaodAction,UserAction}.js`, `store/reducers/postReducer.js`, `store/ReduxStore.js`, `api/{PostRequest,UploadRequest,UserRequest}.js` (all under `client/src/`)
- Delete (server): `Server/Routes/PostRoute.js`, `Server/Controllers/PostController.js`
- Modify: `Server/index.js` (remove the `PostRoute` import and the `/posts` mount)
- **Keep:** `Server/Models/postModel.js` (still imported by `profileController.js`).

- [ ] **Step 1: Move the client candidates out of `src` (do not delete yet)**

From the repo root (Git Bash):

```bash
mkdir -p _retired_safargram && cd client/src
for p in Pages/SafarGram Components/Post Components/Posts Components/PostShare Components/PostSide Components/ProfileSide Components/RightSide Components/ProfileLeft Components/ProfileCard Components/FollowersCard Components/InfoCard Components/User Components/TrendCard Components/LogoSearch Components/ProfileModal actions/postAction.js actions/uplaodAction.js actions/UserAction.js store/reducers/postReducer.js store/ReduxStore.js api/PostRequest.js api/UploadRequest.js api/UserRequest.js; do
  mkdir -p "../../_retired_safargram/$(dirname "$p")" && mv "$p" "../../_retired_safargram/$p"
done
```

- [ ] **Step 2: Build — the build is the proof that nothing still imports them**

Run (from `client/`): `npx vite build 2>&1 | tail -15`
Expected: `✓ built`. If it fails with "Could not resolve …", the message names the file that still needs one of the moved items: move that item back into place (`mv` it from `_retired_safargram` to its original path) and repeat.

- [ ] **Step 3: Delete the moved folder once the build passes**

```bash
rm -r ../_retired_safargram
```

(Run from `client/`, so the path is `../_retired_safargram`.)

- [ ] **Step 4: Retire the old server posts API**

In `Server/index.js` delete the line `import PostRoute from "./Routes/PostRoute.js";` and the line `app.use("/posts", PostRoute);`, then:

```bash
rm Routes/PostRoute.js Controllers/PostController.js
node --check index.js && npm test
```

Expected: no syntax error; all server tests PASS.

- [ ] **Step 5: Full client verification**

Run (from `client/`): `npm test && npx eslint src 2>&1 | tail -3 && npx vite build 2>&1 | tail -3`
Expected: helper tests PASS; lint error count lower than or equal to before (legacy `ProfileModal.jsx` is gone, so the baseline of 7 should now be 6 or fewer, none inside `features/safargram`); `✓ built`.

- [ ] **Step 6: Manual click-through (owner's dev servers on 5000 and 5173; use a test account)**

- [ ] Log in → navbar "SafarGram" opens `/safargram`; `/homegram` redirects to it.
- [ ] Empty state shows on a fresh database; the Discover tab is selected.
- [ ] "Share your journey": add 2 photos → previews appear → remove one → post with a caption containing `#Spiti #trek`, category Trekking, a destination → progress bar → the post appears at the top of Discover with a destination chip and clickable hashtags.
- [ ] Post a video (≤ 60 s, ≤ 50 MB); it plays inline. A 6th photo, a photo + video mix, a > 8 MB photo and a > 50 MB video each show an inline error and nothing uploads.
- [ ] Like / unlike: heart fills instantly and the count changes; refresh keeps the state.
- [ ] "Add to Bucket List" toggles; Profile → Saved → Bucket List shows it; SafarGram tab shows your posts as a grid; thumbnails open the post page.
- [ ] Comments: add, see count update on the card, delete your own; as the post's author delete someone else's.
- [ ] Click `#trek` → hashtag page lists the post; click the destination chip → destination page lists it; the destination detail page has "Traveller posts".
- [ ] Follow another test user (Profile page) → their posts appear on the Following tab; a user who follows nobody lands on Discover.
- [ ] Delete your own post: it disappears; the Cloudinary files are removed (check the Media Library folder `safarnama/safargram`).
- [ ] Phone width (browser dev tools, ~375 px): single column, no horizontal scroll, modal usable.

- [ ] **Step 7: Checkpoint (owner runs)**

```bash
git add -A client/src Server/index.js Server/Routes Server/Controllers
git commit -m "Retire legacy SafarGram code and posts API"
```

---

## Self-Review Notes (spec coverage)

- Data model (spec §3) → Task 3. Counter integrity → Tasks 8–9 (idempotent create/delete with `$inc` guarded by the unique-index result).
- API (§4) → Tasks 5–9 (`/feed`, `/posts`, `/posts/:id`, like, save, comments, `/comments/:id`, `/users/:username/posts`, `/saved`, `/hashtags/:tag`, `/destinations/:id/posts`); pagination and following filter → Tasks 2, 5; hashtag extraction → Task 2.
- Media pipeline (§5) → Tasks 2, 4, 6 (temp files, validation, Cloudinary, 60 s rule, rollback on failure, temp cleanup).
- Deletion cascade (§6) → Task 7. Security and rate limits (§7) → Tasks 5, 6, 8, 9 plus id validation in Task 2.
- Front end (§8) → Tasks 11–15; branding → Task 12 stylesheet + `Wordmark`; retired code → Task 16.
- Testing (§9) → server tests in Tasks 1–9; client helper tests in Task 11; lint/build gates in Tasks 11–16; manual checklist in Task 16.
- Deployment notes (§10): no code change (uses existing `CLOUDINARY_*`); mounting is Task 10.
- Deliberate deviations from the spec: media-limit and validation errors are all **400** (spec listed 413/415); `Server/Models/postModel.js` is **kept** because `profileController.js` imports it.
