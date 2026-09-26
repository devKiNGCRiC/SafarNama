import { http } from "../../config/api";

const BASE = "/api/v1/eco-guides";
const body = (r) => r.data;

// category: SUSTAINABLE_TIPS | BEST_PRACTICES | LOCAL_GUIDE | "ALL"; cursor comes from the previous page
export const getGuides = ({ category, search, tag, cursor } = {}) =>
  http
    .get(BASE, {
      params: {
        ...(category && category !== "ALL" ? { category } : {}),
        ...(search ? { search } : {}),
        ...(tag ? { tag } : {}),
        ...(cursor ? { cursor } : {}),
      },
    })
    .then(body);
export const getGuide = (id) => http.get(`${BASE}/${id}`).then(body);

export const likeGuide = (id) => http.post(`${BASE}/${id}/like`).then(body);
export const unlikeGuide = (id) => http.delete(`${BASE}/${id}/like`).then(body);
export const addGuideComment = (id, content) => http.post(`${BASE}/${id}/comments`, { content }).then(body);
export const deleteGuideComment = (id, commentId) => http.delete(`${BASE}/${id}/comments/${commentId}`).then(body);

// admin (multipart so a cover photo can travel with the fields)
export const createGuide = (formData) => http.post(BASE, formData).then(body);
export const updateGuide = (id, formData) => http.put(`${BASE}/${id}`, formData).then(body);
export const deleteGuide = (id) => http.delete(`${BASE}/${id}`).then(body);
