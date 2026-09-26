import { http } from "../../config/api";

const BASE = "/api/v1/forum";
const body = (r) => r.data;

// filters: category ("ALL" or a category), tag, search, saved / mine (true), cursor
export const getThreads = ({ category, tag, search, saved, mine, cursor } = {}) =>
  http
    .get(`${BASE}/threads`, {
      params: {
        ...(category && category !== "ALL" ? { category } : {}),
        ...(tag ? { tag } : {}),
        ...(search ? { search } : {}),
        ...(saved ? { saved: 1 } : {}),
        ...(mine ? { mine: 1 } : {}),
        ...(cursor ? { cursor } : {}),
      },
    })
    .then(body);
export const getThread = (id) => http.get(`${BASE}/threads/${id}`).then(body);
export const createThread = (fields) => http.post(`${BASE}/threads`, fields).then(body);
export const updateThread = (id, fields) => http.patch(`${BASE}/threads/${id}`, fields).then(body);
export const deleteThread = (id) => http.delete(`${BASE}/threads/${id}`).then(body);

export const likeThread = (id) => http.post(`${BASE}/threads/${id}/like`).then(body);
export const unlikeThread = (id) => http.delete(`${BASE}/threads/${id}/like`).then(body);
export const saveThread = (id) => http.post(`${BASE}/threads/${id}/save`).then(body);
export const unsaveThread = (id) => http.delete(`${BASE}/threads/${id}/save`).then(body);

// admin moderation
export const setPinned = (id, on) => http[on ? "post" : "delete"](`${BASE}/threads/${id}/pin`).then(body);
export const setLocked = (id, on) => http[on ? "post" : "delete"](`${BASE}/threads/${id}/lock`).then(body);

export const getReplies = (id, cursor) =>
  http.get(`${BASE}/threads/${id}/replies`, { params: cursor ? { cursor } : {} }).then(body);
export const createReply = (id, content) => http.post(`${BASE}/threads/${id}/replies`, { content }).then(body);
export const updateReply = (replyId, content) => http.patch(`${BASE}/replies/${replyId}`, { content }).then(body);
export const deleteReply = (replyId) => http.delete(`${BASE}/replies/${replyId}`).then(body);
export const likeReply = (replyId) => http.post(`${BASE}/replies/${replyId}/like`).then(body);
export const unlikeReply = (replyId) => http.delete(`${BASE}/replies/${replyId}/like`).then(body);

export const acceptReply = (id, replyId) => http.post(`${BASE}/threads/${id}/accept/${replyId}`).then(body);
export const clearAccepted = (id) => http.delete(`${BASE}/threads/${id}/accept`).then(body);
