import { http } from '../config/api';
export const uploadImage = (data) => http.post('/upload', data);

export const uploadPost = (data) => http.post('/posts', data);