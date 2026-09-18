import axios from 'axios';
import { API_URL } from '../config/api';


const profileApi = axios.create({
    baseURL: `${API_URL}/api/v1/profile`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
profileApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Profile API requests
export const getProfile = async (username) => {
    try {
        console.log('Making profile request for:', username);
        // If no username provided, use /me endpoint
        const endpoint = username ? `/${username}` : '/me';
        const response = await profileApi.get(endpoint);
        console.log('Profile API response:', response);

        if (response.data && response.data.success) {
            return {
                success: true,
                data: response.data.data
            };
        }
        
        throw new Error(response.data.message || 'Failed to fetch profile');
    } catch (error) {
        console.error('Profile request error:', error.response || error);
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to fetch profile'
        };
    }
};

export const updateProfile = async (profileData) => {
    try {
        const response = await profileApi.put('/update', profileData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const updateProfilePicture = async (formData) => {
    try {
        const response = await profileApi.put('/picture', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Profile picture upload error:', error.response || error);
        throw error.response?.data || error;
    }
};

export const updateCoverPhoto = async (formData) => {
    try {
        const response = await profileApi.put('/cover', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Cover photo upload error:', error.response || error);
        throw error.response?.data || error;
    }
};

export const addProfilePhoto = async (formData) => {
    try {
        const response = await profileApi.post('/photos', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const followUser = async (userId) => {
    try {
        const response = await profileApi.post(`/follow/${userId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const unfollowUser = async (userId) => {
    try {
        const response = await profileApi.delete(`/follow/${userId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getSavedItems = async () => {
    try {
        const response = await profileApi.get('/saved');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const toggleSaveItem = async (type, itemId) => {
    try {
        const response = await profileApi.post(`/saved/${type}/${itemId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getProfileStats = async () => {
    try {
        const response = await profileApi.get('/stats');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getPhotos = async () => {
    try {
        const response = await profileApi.get('/photos');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export default profileApi;