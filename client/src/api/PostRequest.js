import { http } from '../config/api';
export const getTimeLinePosts = (id) => http.get(`/posts/${id}/timeline`);
export const likePost = (id, userId) => http.put(`/posts/${id}/like`, { userId: userId });

// export const addComment = async (postId, commentData) => {
//     try {
//       const response = await http.post(`/posts/${postId}/comment`, commentData);
//       return response.data; // Return the comments data
//     } catch (error) {
//       console.error("Error in adding comment:", error);
//       throw error;
//     }
// };

export const addComment = (id, comment) => http.post(`/posts/${id}/comment`, {comment:comment});
export const getComments = (id) => http.get(`/posts/${id}/comments`);