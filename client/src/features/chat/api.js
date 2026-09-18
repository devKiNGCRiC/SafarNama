import { http } from "../../config/api";

const BASE = "/api/v1/chat";
const body = (response) => response.data;

// ---- conversations
export const getInbox = (cursor) =>
  http.get(`${BASE}/conversations`, { params: cursor ? { cursor } : {} }).then(body);
export const getRequests = () => http.get(`${BASE}/conversations/requests`).then(body);
export const startDirect = (userId) => http.post(`${BASE}/conversations/direct`, { userId }).then(body);
export const getConversation = (id) => http.get(`${BASE}/conversations/${id}`).then(body);
export const acceptRequest = (id) => http.post(`${BASE}/conversations/${id}/accept`).then(body);
export const declineRequest = (id, block = false) =>
  http.delete(`${BASE}/conversations/${id}/request`, { data: { block } }).then(body);

// ---- messages
export const getMessages = (id, cursor) =>
  http.get(`${BASE}/conversations/${id}/messages`, { params: cursor ? { cursor } : {} }).then(body);

// multipart so a photo can travel with the text (axios sets the boundary itself)
export const sendMessage = (id, { text, file }) => {
  const form = new FormData();
  if (text) form.append("text", text);
  if (file) form.append("media", file);
  return http.post(`${BASE}/conversations/${id}/messages`, form).then(body);
};
export const markRead = (id) => http.post(`${BASE}/conversations/${id}/read`).then(body);

// ---- misc
export const getUnreadCount = () => http.get(`${BASE}/unread-count`).then(body);
export const searchUsers = (q) => http.get(`${BASE}/users/search`, { params: { q } }).then(body);
export const getPresence = (ids) => http.get(`${BASE}/presence`, { params: { ids: ids.join(",") } }).then(body);

// ---- blocks
export const getBlocks = () => http.get(`${BASE}/blocks`).then(body);
export const blockUser = (userId) => http.post(`${BASE}/blocks/${userId}`).then(body);
export const unblockUser = (userId) => http.delete(`${BASE}/blocks/${userId}`).then(body);

// ---- groups (Phase B)
export const createGroup = (name, memberIds) =>
  http.post(`${BASE}/conversations/group`, { name, memberIds }).then(body);
export const renameGroup = (id, name) => http.patch(`${BASE}/conversations/${id}`, { name }).then(body);
export const addGroupMembers = (id, userIds) =>
  http.post(`${BASE}/conversations/${id}/members`, { userIds }).then(body);
export const removeGroupMember = (id, userId) =>
  http.delete(`${BASE}/conversations/${id}/members/${userId}`).then(body);
