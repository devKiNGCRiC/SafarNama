import profileApi from '../api/profileRequest';

class PhotoService {
    static async getPhotos(username) {
        try {
            const response = await profileApi.get(`/${username}/photos`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    static async uploadPhoto(formData) {
        try {
            const response = await profileApi.post('/photos', formData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    static async likePhoto(photoId) {
        try {
            const response = await profileApi.post(`/photos/${photoId}/like`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    static async unlikePhoto(photoId) {
        try {
            const response = await profileApi.delete(`/photos/${photoId}/like`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    static async addComment(photoId, text) {
        try {
            const response = await profileApi.post(`/photos/${photoId}/comments`, { text });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    static async deleteComment(photoId, commentId) {
        try {
            const response = await profileApi.delete(`/photos/${photoId}/comments/${commentId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export default PhotoService;