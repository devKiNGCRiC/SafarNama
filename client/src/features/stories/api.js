import { http } from "../../config/api";

const BASE = "/api/v1/stories";
const body = (r) => r.data;

export const getStoryFeed = () => http.get(`${BASE}/feed`).then(body);
export const getMyStories = () => http.get(`${BASE}/mine`).then(body);

// multipart: { file, caption }
export const createStory = ({ file, caption }, onProgress) => {
  const form = new FormData();
  form.append("media", file);
  if (caption) form.append("caption", caption);
  return http
    .post(BASE, form, { onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded * 100) / e.total)) })
    .then(body);
};

export const viewStory = (id) => http.post(`${BASE}/${id}/view`).then(body);
export const getStoryViewers = (id) => http.get(`${BASE}/${id}/viewers`).then(body);
export const deleteStory = (id) => http.delete(`${BASE}/${id}`).then(body);
