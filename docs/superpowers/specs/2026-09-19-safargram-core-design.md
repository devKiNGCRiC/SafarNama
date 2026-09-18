# SafarGram Core — Design Spec

Date: 2026-09-19
Status: Draft for review
Sub-project: 1 of 5 (Core → Chat → Explore → Notifications → Stories)

## 1. Goal

Give Safarnama an in-app, Instagram-style social feed for travellers — branded as
**SafarGram** and shaped around travel and eco-tourism — that can be deployed as a
first release. This spec covers the **Core** only: posts (photos or video), feed,
likes, comments, saves ("Bucket List"), follows (reused), profile grids, hashtag
and destination pages.

### Roadmap (each piece gets its own spec → plan → build → check)

| # | Sub-project | Notes |
|---|---|---|
| 1 | **Core** (this spec) | Posts, feed, likes, comments, bucket list, profile grid, hashtag + destination pages |
| 2 | Chat | One-to-one, real-time (socket.io), unread counts. Needs a long-running server host (not serverless) |
| 3 | Explore & search | People/post search, hashtag discovery, browse by destination/category |
| 4 | Notifications | Like / comment / follow / message |
| 5 | Stories | 24-hour photo stories |

### Out of scope for Core

Stories, notifications, direct messages, Explore/search page, reels, private accounts,
comment replies, editing a post after publishing, post reporting/moderation UI,
migrating the old `posts` collection.

## 2. Decisions already made

- New dedicated collections (approach A); the old posts API and the legacy
  `Components/Post*` client code are retired (the old `postModel.js` file stays because
  `profileController.js` still imports it).
- Follow graph is **reused** from the existing Profile module (`Profile.followers` /
  `Profile.following`, ObjectIds of users). No changes to it.
- Feed has two tabs: **Discover** (everyone's posts, newest first) and **Following**.
  If the user follows nobody, the page opens on Discover.
- Post features in v1: multiple photos (carousel), one video, destination tag,
  hashtags, travel category.
- All accounts are public. Every SafarGram endpoint requires a logged-in user.
- "Save" is branded **"Add to Bucket List"**.

## 3. Data model

All models are Mongoose, in `Server/Models/`.

### SafarPost (`safargramPostModel.js`)

| Field | Type | Rules |
|---|---|---|
| `author` | ObjectId → User | required, indexed |
| `media` | array of `{ type: 'image'\|'video', url, publicId, width, height, duration? }` | 1–5 images **or** exactly 1 video; never mixed. URLs/publicIds are set by the server only |
| `caption` | String | ≤ 2200 chars, plain text, may be empty |
| `hashtags` | [String] | extracted from caption, lowercase, unique, ≤ 30, each 1–50 chars of letters/digits/underscore |
| `category` | enum | `Trekking, Wildlife, Culture, Eco-stay, Beach, Food, Adventure, Other`; default `Other` |
| `destination` | ObjectId → Destination | optional; must exist when provided |
| `likesCount`, `commentsCount` | Number | denormalised counters, default 0, updated with `$inc` |
| `createdAt`, `updatedAt` | Date | `timestamps: true` |

Indexes: `{ _id: -1 }` (default), `{ author: 1, _id: -1 }`, `{ hashtags: 1, _id: -1 }`,
`{ destination: 1, _id: -1 }`.

### SafarComment (`safargramCommentModel.js`)

`post` (ObjectId, indexed), `author` (ObjectId → User), `text` (String, 1–500, plain text),
timestamps. Index `{ post: 1, _id: -1 }`. Flat — no replies.

### SafarLike and SafarSave (`safargramLikeModel.js`, `safargramSaveModel.js`)

`post`, `user`, timestamps. **Unique compound index `{ post: 1, user: 1 }`** on each, so a
user can never like or save the same post twice, even under concurrent requests.
`SafarSave` additionally indexes `{ user: 1, _id: -1 }` for the Bucket List.

### Counter integrity

A like/comment is written first, and the post counter is `$inc`-ed only when the
write actually created a record (a duplicate-key error means "already liked" and
does **not** increment). Deleting removes the record and `$inc`s by -1 only if a
record was deleted.

## 4. API

Base path `/api/v1/safargram`, mounted in `Server/index.js`. All routes use
`verifyToken`. Errors use `{ success: false, message }` with the right status
(400 invalid input/id and every media-limit or unsupported-file problem, 401 no/invalid
token, 403 not owner, 404 not found, 429 rate limit).

| Method & path | Purpose |
|---|---|
| `POST /posts` | Create post. `multipart/form-data`: `media` (files), `caption`, `category`, `destinationId` |
| `GET /feed?tab=discover\|following&cursor=&limit=` | Feed, 10 per page (max 20) |
| `GET /posts/:id` | One post |
| `DELETE /posts/:id` | Author or admin. Cascades (see §6) |
| `POST /posts/:id/like`, `DELETE /posts/:id/like` | Like / unlike (idempotent) |
| `POST /posts/:id/save`, `DELETE /posts/:id/save` | Add / remove from Bucket List (idempotent) |
| `GET /posts/:id/comments?cursor=` | Comments, newest first, 20 per page |
| `POST /posts/:id/comments` | Add comment `{ text }` |
| `DELETE /comments/:id` | Comment author, the post's author, or admin |
| `GET /users/:username/posts?cursor=` | Profile grid |
| `GET /saved?cursor=` | The caller's Bucket List (own only) |
| `GET /hashtags/:tag?cursor=` | Posts with a hashtag |
| `GET /destinations/:id/posts?cursor=` | Posts tagged with a destination |

### Post response shape

```
{ _id, author: { _id, username, firstName, lastName, avatar },
  media: [...], caption, hashtags, category,
  destination: { _id, name } | null,
  likesCount, commentsCount, likedByMe, savedByMe, createdAt }
```

`likedByMe` / `savedByMe` are computed per request with a single `$in` query over the
page's post ids (no per-post queries).

### Pagination

Cursor = the `_id` of the last item returned; the next page is `_id < cursor`.
Response: `{ success, data: [...], nextCursor: <id> | null }`. Stable while new posts
arrive (no duplicates/skips).

### Feed queries

- **Discover:** all posts, `_id` descending.
- **Following:** `author ∈ Profile(me).following`. If the caller has no Profile
  document, `following` is treated as empty (returns an empty list, not an error).

### Hashtag extraction

Regex `#[\p{L}\p{M}\p{N}_]{1,50}` (unicode), lowercased, de-duplicated, capped at 30.
Done server-side on create; the client's parsing is display-only.

## 5. Media pipeline

1. `multer` with disk storage in the OS temp folder (`os.tmpdir()`), so large videos are
   not held in memory. Per-file limits: image 8 MB, video 50 MB; max 5 files; allowed
   MIME types and extensions: JPG/PNG/WEBP, MP4/MOV/WEBM.
2. Validate the post shape (all images ≤ 5, or exactly one video; not mixed).
3. Upload each file to Cloudinary folder `safarnama/safargram`:
   - images: `resource_type: image`, `width: 1440, crop: limit`, `quality: auto`,
     `fetch_format: auto`
   - video: `resource_type: video`; after upload, if `duration > 60` s → delete the
     asset and reject with a 400 error "Video must be 60 seconds or shorter".
4. Always delete the temp files (success or failure).
5. Save the `SafarPost` with server-generated `media` entries. If the DB write fails,
   delete the uploaded Cloudinary assets before returning the error.

Credentials come only from `CLOUDINARY_*` environment variables (already required by the
project). Nothing is written to the server's disk permanently.

## 6. Deletion cascade

`DELETE /posts/:id` (author or admin): delete the post, its `SafarComment`,
`SafarLike` and `SafarSave` records, then best-effort delete the Cloudinary assets
(failures are logged, not fatal). `DELETE /comments/:id` deletes the comment and
`$inc`s `commentsCount` by -1.

## 7. Security and limits

- `verifyToken` on every route; ownership/admin checks on deletes.
- Text (caption, comments) is stored as plain text and rendered escaped by React.
  Global `express-mongo-sanitize` already strips `$`/`.` keys.
- Every `:id`/`cursor` is validated with `mongoose.isValidObjectId` → 400.
- Per-user rate limits (keyed by user id, not IP): create post 20/hour, comment
  30/10 min, like/save 200/10 min. Uses `express-rate-limit`.
- Destination, when supplied, must exist.
- The client never supplies media URLs; only uploaded files are accepted.

## 8. Front end

Feature folder `client/src/features/safargram/`:

```
api.js                       all calls via the shared `http` instance (config/api.js)
hooks/useCursorList.js       cursor pagination + "load more" state
pages/FeedPage.jsx           tabs, "Share your journey", list of PostCards
pages/PostPage.jsx           single post + comments
pages/TagPage.jsx            /safargram/tag/:tag
pages/DestinationPostsPage.jsx   /safargram/destination/:id
components/PostCard.jsx
components/MediaCarousel.jsx     photos (swipe) or one <video controls>
components/CreatePostModal.jsx   pick files, preview, caption, category, destination, progress
components/DestinationPicker.jsx search-as-you-type over /api/v1/destinations
components/CommentList.jsx
components/CaptionText.jsx       renders #hashtags as links, everything else as text
safargram.scss               uses tokens from styles/indian-theme.css
```

- **Routes:** `/safargram`, `/safargram/post/:id`, `/safargram/tag/:tag`,
  `/safargram/destination/:id` (all inside `ProtectedRoute`, with Navbar/Sidebar/Footer
  like other pages). `/homegram` redirects to `/safargram`.
- **Profile page:** add a "SafarGram" grid tab (any user) and a "Bucket List" tab
  (own profile only), fed by the endpoints above.
- **Destination page:** link to `/safargram/destination/:id` ("See traveller posts").
- **State:** local component state + the `useCursorList` hook. No new Redux slice; the
  current user comes from `state.auth.user`.
- **Optimistic UI:** like/save toggle instantly and roll back with an error toast on
  failure.
- **Mobile-first:** single centred column (max ~470 px on desktop).

### Branding

- Wordmark in the logo style: "Safar" red (`#ff0000`), "Gram" saffron gradient
  (`#ffd700 → #ff9933 → #ff6b35`), font Shrikhand — per `BRAND_GUIDELINES`.
- Tokens from `indian-theme.css`: `--cream-marble` cards, `--saffron-primary` active
  tab, `--red-sindoor` liked heart, `--forest-green` for Eco-stay and Wildlife badges.
- Save is labelled "Add to Bucket List" (bookmark icon).

### Code retired after verifying nothing else imports it

`Pages/SafarGram/HomeGram`, `Components/{Post,Posts,PostShare,PostSide,ProfileSide,
RightSide,ProfileLeft,ProfileCard,FollowersCard,InfoCard,User,TrendCard,LogoSearch,
ProfileModal}`, `actions/{postAction,uplaodAction,UserAction}.js`,
`store/reducers/postReducer.js`, `store/ReduxStore.js`,
`api/{PostRequest,UploadRequest,UserRequest}.js`. Server: `Routes/PostRoute.js`,
`Controllers/PostController.js`, and the `/posts` mount in `index.js`.
`Models/postModel.js` is **kept** because `profileController.js` still imports it. Each deletion is preceded by a grep for remaining imports; anything still
in use stays.

## 9. Testing

- **Back end (automated):** `node:test` + `supertest` against `mongodb-memory-server`
  (throw-away in-memory MongoDB; real database never touched). Cloudinary is replaced by a
  fake. Dev-only dependencies added: `mongodb-memory-server`, `supertest`. Covers:
  create (valid/invalid mixes, limits, rollback when DB fails), feed tabs and cursor
  paging (no duplicates/skips), like/save idempotency and counters under repeated
  and concurrent requests, hashtag extraction, ownership on delete, cascade delete,
  comment permissions, rate-limit response, invalid ids, unauthenticated access.
- **Front end:** `vite build` and `npm run lint` must pass with no new errors; a
  manual click-through checklist is delivered with the plan (register → post photos →
  post video → like → comment → bucket list → follow → hashtag → destination →
  delete).

## 10. Deployment notes

- Requires `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` on the
  server host. Cloudinary usage (storage/bandwidth, especially video) should be
  monitored on the free plan.
- The API is stateless and works on any Node host. (Chat, the next sub-project, will
  need a host that keeps a process running, e.g. Render or Railway.)
- Behind a proxy the server needs `trust proxy` (part of the separate
  deploy-readiness batch) so per-IP limits behave.

## 11. Assumptions / open items

- Old posts in the legacy `posts` collection are not migrated.
- No editing of a published post in v1 (delete and repost).
- A user without a Profile document is treated as following nobody.
- Video is capped at 60 s / 50 MB; adjust if the Cloudinary plan needs lower limits.
