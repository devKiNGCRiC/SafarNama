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
export const getTrending = () => http.get(`${BASE}/trending`).then(body);
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
