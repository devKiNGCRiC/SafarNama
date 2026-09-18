# Chat Design Spec (SafarGram sub-project 2 of 5)

Date: 2026-09-19
Status: Approved in conversation; written for the record

## 1. Goal

In-app messaging for Safarnama users: one-to-one and group chats with photo messages,
real-time delivery, unread counts, typing and online indicators, message requests from
strangers, and blocking.

Build order inside this sub-project: **Phase A** one-to-one chat (with photos, unread,
typing, presence, requests, blocking) ships first; **Phase B** group chats follow. The
data model is group-ready from the start so Phase B adds endpoints and UI only.

### Out of scope

Message editing/deleting, reactions, voice/video calls, message search, push
notifications (Notifications is sub-project 4), end-to-end encryption, multiple server
instances (a Redis adapter would be needed), file types other than photos.

## 2. Decisions

- Real-time transport: **socket.io** attached to the existing Express HTTP server.
- **REST for everything that changes data** (send, read, accept, blocks, groups) so
  validation, rate limits and uploads are uniform; **socket.io only pushes** events and
  carries typing/presence. Clients never mutate data over the socket.
- Who can chat: anyone can message anyone. If the two users follow each other in
  either direction (Profile `following`), the chat goes straight to the recipient's
  inbox; otherwise it is a **request** (recipient's membership status `pending`) until
  accepted. A requester may send at most **3** messages while pending.
- Blocking stops direct messages both ways and stops adding each other to groups.
- Hosting: needs a long-running Node process (Render/Railway), not serverless.

## 3. Data model (Mongoose, `Server/Models/`)

### ChatConversation (`chatConversationModel.js`)

| Field | Type | Rules |
|---|---|---|
| `type` | `'direct' \| 'group'` | required |
| `name` | String | groups only, 1-50 chars |
| `avatar` | String | groups only, optional (unused in v1 UI) |
| `createdBy` | ObjectId → User | required |
| `directKey` | String | direct only: `"<smallerId>:<largerId>"`; **unique sparse index** so a pair has one chat |
| `members` | array of `{ user, role: 'admin'\|'member', status: 'active'\|'pending', lastReadAt: Date, joinedAt: Date }` | direct: 2 members; group: 3-50 |
| `lastMessage` | `{ text, kind, sender, at }` | denormalised for inbox order |
| `createdAt`, `updatedAt` | Date | `updatedAt` is bumped on every new message |

Indexes: `{ 'members.user': 1, updatedAt: -1 }`, unique sparse `{ directKey: 1 }`.

### ChatMessage (`chatMessageModel.js`)

`conversation` (ObjectId), `sender` (ObjectId → User, `null` for system messages),
`kind` (`'text' | 'image' | 'system'`), `text` (≤ 2000, trimmed; may be empty for an
image), `media` (`{ url, publicId, width, height }`, image only, server-set), timestamps.
Index `{ conversation: 1, _id: -1 }`.

### ChatBlock (`chatBlockModel.js`)

`blocker`, `blocked` (ObjectIds), unique `{ blocker, blocked }`.

## 4. REST API (`/api/v1/chat`, every route uses `verifyToken`)

Errors: `{ success: false, message }`; 400 bad input/id, 401, 403 (not a member / blocked
/ not admin / request limit), 404, 429.

| Method & path | Purpose |
|---|---|
| `GET /conversations?cursor=` | Inbox: my `active` conversations, newest activity first (20/page) |
| `GET /conversations/requests` | Chats where my status is `pending` |
| `POST /conversations/direct` `{ userId }` | Get-or-create the direct chat; applies the follow/request rule. Blocked → 403 |
| `POST /conversations/group` `{ name, memberIds[] }` (Phase B) | Create a group (creator = admin, 2-49 other members) |
| `GET /conversations/:id` | One conversation (members only) |
| `PATCH /conversations/:id` `{ name }` (Phase B) | Rename a group (admin) |
| `POST /conversations/:id/members` `{ userIds[] }` (Phase B) | Add members (admin, max 50 total) |
| `DELETE /conversations/:id/members/:userId` (Phase B) | Remove a member (admin) or leave (`:userId` = me) |
| `GET /conversations/:id/messages?cursor=` | History, newest first, 30/page |
| `POST /conversations/:id/messages` | Send: `multipart/form-data` with `text` and/or one image `media`. 201 + `MessageJSON` |
| `POST /conversations/:id/read` | Set my `lastReadAt = now` |
| `POST /conversations/:id/accept` | Accept a request (my status → `active`) |
| `DELETE /conversations/:id/request` `{ block? }` | Decline: delete the chat (optionally block the sender) |
| `GET /unread-count` | `{ total }` unread messages across my active chats |
| `GET /users/search?q=` | Find people by username prefix (≤ 10, excludes me and people who blocked me) |
| `GET /presence?ids=a,b,c` | `{ online: [ids] }` (≤ 100 ids) |
| `GET /blocks`, `POST /blocks/:userId`, `DELETE /blocks/:userId` | List / block / unblock |

### JSON shapes

`MessageJSON`: `{ _id, conversation, sender: {_id,username,firstName,lastName,avatar}|null, kind, text, media, createdAt }`.

`ConversationJSON`: `{ _id, type, name, members: [{ user, role, status }], partner (direct only: the other user), lastMessage, unreadCount, isRequest, blockedByMe, blockedMe, updatedAt }`.

### Rules

- Only members can read/send. A `pending` recipient can read the request but cannot send
  until they call `accept` (declining deletes the chat).
- Requester limit: while the other member is `pending`, the requester may send at most 3
  messages → 4th is 403 "Wait for them to accept your request".
- Sending to a direct chat where either side has blocked the other → 403.
- `unreadCount` = messages in that conversation with `createdAt > my lastReadAt`,
  `sender != me`, `kind != 'system'`.
- Group rules (Phase B): creator admin; only admins add/remove/rename; anyone may leave;
  when the last admin leaves the earliest-joined remaining member becomes admin; when no
  members remain the chat and its media are deleted; system messages record adds/leaves/
  renames; you cannot add someone who blocked you or whom you blocked.
- Sending: text ≤ 2000, image types JPG/PNG/WEBP ≤ 8 MB, at most 1 image; at least text or
  image is required. Media goes to Cloudinary folder `safarnama/chat` (reusing the
  SafarGram media service), temp files always removed.
- Rate limits per user id: 60 messages / minute, 10 group creations / hour.

## 5. Real-time (`Server/services/chatSocket.js`)

- `attachChatSocket(httpServer, { origins })` creates the socket.io server with CORS for
  `CLIENT_URL` + localhost dev origins. Returns `{ io, emitToUsers(ids, event, payload),
  isOnline(id), onlineIds(ids) }`.
- **Auth:** the client connects with `auth: { token }`; the server verifies the JWT and that
  the user exists and is active (same rules as `verifyToken`); otherwise the connection is
  refused. On connect the socket joins room `user:<id>`.
- **Server → client events:** `message:new` `{ message, conversation }`,
  `conversation:updated` `{ conversation }`, `message:read` `{ conversationId, userId, at }`,
  `typing` `{ conversationId, userId, isTyping }`, `presence` `{ userId, online }`.
- **Client → server events (never mutate data):** `typing` `{ conversationId, isTyping }`
  (server checks membership, relays to the other active members), `presence:watch`
  `{ userIds[] }` (≤ 100; joins rooms `presence:<id>` and immediately answers with current
  status).
- Presence = number of open sockets per user, kept in memory; `presence` is emitted to room
  `presence:<id>` when a user's count goes 0→1 or 1→0.
- REST controllers get an injected `realtime` object (`{ emitToUsers, onlineIds }`) so tests
  can fake it; the real one comes from `attachChatSocket`.
- `Server/index.js` switches from `app.listen` to `http.createServer(app)` + socket
  attach + `server.listen`.

## 6. Security

Membership checked on every route and socket event; ids validated as 24-hex; text is plain
text rendered escaped; blocked/inactive users cannot connect or send; media only from
uploaded files (server-generated URLs); global CORS/sanitisation apply to REST; socket CORS
restricted to configured origins.

## 7. Front end (`client/src/features/chat/`)

- `socket.js` singleton (`socket.io-client`, token auth, auto-reconnect, disconnects on
  logout), `api.js`, `ChatProvider.jsx` (context: socket status, total unread, presence map,
  event subscriptions; mounted once inside `AppContent`).
- Pages: `ChatPage` at `/chat` and `/chat/:conversationId` (two panes on ≥ 1024 px, one pane
  at a time below), `/chat/with/:username` (opens/creates a direct chat).
- Components: `ConversationList` (tabs Chats | Requests), `ThreadView` (infinite scroll
  upward, day separators, image bubbles, typing line, read state), `Composer` (text +
  photo, disabled when blocked/pending-limit), `NewChatModal` (people search), `NewGroupModal`
  and `GroupInfoModal` (Phase B), `UnreadBadge` (navbar), `MessageButton` (Profile page).
- Branding matches SafarGram (saffron accents, cream background, `sg-`-style tokens under a
  `chat-` prefix).
- Navbar gets a "Chat" link with the unread badge; Profile page gets a "Message" button.

## 8. Testing

- Server (`node:test` + `supertest` + `mongodb-memory-server`): every REST rule above, with a
  fake `realtime`; plus a socket integration test using `socket.io-client` (dev dependency)
  against a real in-process server: refused without/with bad token, `message:new` delivered
  to the recipient only, typing relayed to others not sender, presence 0→1→0, membership
  check on `typing`.
- Client: helper tests where pure logic exists; `npm run lint` (no new errors) and
  `vite build` must pass; manual click-through checklist at the end of the plan.

## 9. Deployment notes

Requires a long-running host; `CLIENT_URL` must be set for socket CORS; a single instance
only (in-memory presence). Cloudinary env vars are reused.
