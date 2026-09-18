import request from "supertest";
import ChatConversation from "../../Models/chatConversationModel.js";
import { directKeyFor } from "../../services/chatRules.js";

export const CHAT_BASE = "/api/v1/chat";

export function chatApi(app) {
  return {
    get: (path, u) => request(app).get(CHAT_BASE + path).set(u?.auth || {}),
    post: (path, u, body) => request(app).post(CHAT_BASE + path).set(u?.auth || {}).send(body),
    patch: (path, u, body) => request(app).patch(CHAT_BASE + path).set(u?.auth || {}).send(body),
    del: (path, u, body) => request(app).delete(CHAT_BASE + path).set(u?.auth || {}).send(body),
    // multipart send: fields + optional files [{ buf, opts }]
    send(conversationId, u, fields = {}, files = []) {
      let req = request(app).post(`${CHAT_BASE}/conversations/${conversationId}/messages`).set(u?.auth || {});
      for (const [k, v] of Object.entries(fields)) req = req.field(k, v);
      for (const f of files) req = req.attach("media", f.buf, f.opts);
      return req;
    },
  };
}

export async function seedDirect(a, b, { bStatus = "active", updatedAt } = {}) {
  const conv = await ChatConversation.create({
    type: "direct",
    createdBy: a.user._id,
    directKey: directKeyFor(a.user._id, b.user._id),
    members: [{ user: a.user._id }, { user: b.user._id, status: bStatus }],
  });
  if (updatedAt) await ChatConversation.collection.updateOne({ _id: conv._id }, { $set: { updatedAt } });
  return conv;
}

export const png = (name = "a.png") => ({
  buf: Buffer.from("fake-image"),
  opts: { filename: name, contentType: "image/png" },
});
