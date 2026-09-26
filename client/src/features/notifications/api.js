import { http } from "../../config/api";

const BASE = "/api/v1/notifications";
const body = (r) => r.data;

export const getNotifications = (cursor, limit) =>
  http.get(BASE, { params: { ...(cursor ? { cursor } : {}), ...(limit ? { limit } : {}) } }).then(body);
export const getNotificationCount = () => http.get(`${BASE}/unread-count`).then(body);
export const markNotificationRead = (id) => http.post(`${BASE}/${id}/read`).then(body);
export const markAllNotificationsRead = () => http.post(`${BASE}/read-all`).then(body);
