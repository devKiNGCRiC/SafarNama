import { http } from "../../config/api";

const BASE = "/api/v1/gallery";
const body = (r) => r.data;

// user: a username (one person's album); search: caption or place; cursor: from the previous page
export const getPhotos = ({ user, search, cursor } = {}) =>
  http
    .get(BASE, { params: { ...(user ? { user } : {}), ...(search ? { search } : {}), ...(cursor ? { cursor } : {}) } })
    .then(body);
export const getPhoto = (id) => http.get(`${BASE}/${id}`).then(body);

// multipart: { file, caption, location }
export const uploadPhoto = ({ file, caption, location }) => {
  const form = new FormData();
  if (caption) form.append("caption", caption);
  if (location) form.append("location", location);
  form.append("photo", file);
  return http.post(BASE, form).then(body);
};
export const updatePhoto = (id, { caption, location }) => http.put(`${BASE}/${id}`, { caption, location }).then(body);
export const deletePhoto = (id) => http.delete(`${BASE}/${id}`).then(body);

export const likePhoto = (id) => http.post(`${BASE}/${id}/like`).then(body);
export const unlikePhoto = (id) => http.delete(`${BASE}/${id}/like`).then(body);
export const addPhotoComment = (id, content) => http.post(`${BASE}/${id}/comments`, { content }).then(body);
export const deletePhotoComment = (id, commentId) => http.delete(`${BASE}/${id}/comments/${commentId}`).then(body);
