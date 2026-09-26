import { http } from "../../config/api";

const BASE = "/api/v1/settings";
const body = (r) => r.data;

export const getSettings = () => http.get(BASE).then(body);
// notifications: any of { likes, comments, follows } as booleans
export const saveNotificationPrefs = (notifications) => http.put(`${BASE}/preferences`, { notifications }).then(body);
// both return a fresh { token } so this browser stays signed in while other sessions end
export const changePassword = (currentPassword, newPassword) =>
  http.put(`${BASE}/password`, { currentPassword, newPassword }).then(body);
export const signOutEverywhere = () => http.post(`${BASE}/sign-out-everywhere`).then(body);
export const deactivateAccount = (password) => http.post(`${BASE}/deactivate`, { password }).then(body);
