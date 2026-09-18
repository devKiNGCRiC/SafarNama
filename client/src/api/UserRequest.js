import { http } from '../config/api';

export const getUser = (userId) => http.get(`/user/${userId}`);

export const updateUser = (id, formData) => http.put(`/user/${id}`, formData);

export const getAllUser = () => http.get("/user/all-users");

// Following now lives in /api/v1/profile/follow/:userId (see api/profileRequest.js).
// The old /user/:id/follow endpoints were removed from the server.
export const followUser = (id, data) => http.put(`/user/${id}/follow`, data);

export const unFollowUser = (id, data) => http.put(`/user/${id}/unfollow`, data);