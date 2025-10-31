import axios from 'axios';

const API = axios.create({ baseURL: "http://localhost:5000" });

export const getTimeLinePosts = (id) => API.get(`/posts/${id}/timeline`);
export const likePost = (id, userId) => API.put(`/posts/${id}/like`, { userId: userId });

// export const addComment = async (postId, commentData) => {
//     try {
//       const response = await API.post(`/posts/${postId}/comment`, commentData);
//       return response.data; // Return the comments data
//     } catch (error) {
//       console.error("Error in adding comment:", error);
//       throw error;
//     }
// };

export const addComment = (id, comment) => API.post(`/posts/${id}/comment`, {comment:comment});
export const getComments = (id) => API.get(`/posts/${id}/comments`);