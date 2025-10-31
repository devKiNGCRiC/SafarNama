import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000' ;

const authApi = axios.create({
    baseURL: `${API_URL}api/v1/auth/`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
authApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
authApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle token refresh here if needed
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Implement token refresh logic
                const newToken = await refreshToken();
                localStorage.setItem('token', newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return authApi(originalRequest);
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export const login = async (credentials) => {
    try {
        console.log('Making login request to:', `${API_URL}/auth/login`);
        const response = await authApi.post('/login', credentials);
        console.log('Full API Response:', response); // Debug log
        return response.data;
    } catch (error) {
        console.error('Login API Error:', error.response?.data || error);
        throw error.response?.data || { 
            success: false,
            message: 'Login failed' 
        };
    }
};

export const register = async (userData) => {
    try {
        console.log('Making registration request with:', userData);
        const response = await authApi.post('/register', userData);
        console.log('Registration response:', response.data);
        if (response.data) {
            return response.data;  // Return just the data part
        }
        throw new Error('No data received from server');
    } catch (error) {
        if (error.response) {
            // Server responded with error
            throw error.response.data;
        }
        throw error.response?.data || {
            success: false,
            message: 'Registration failed'
        };
    }
};

export const logoutApi = async () => {
    try {
        await authApi.post('/logout');
        localStorage.removeItem('token');
    } catch (error) {
        console.error('Logout error:', error);
    }
};

export const verifyEmail = async (token) => {
    try {
        const response = await authApi.post(`/verify-email/${token}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Email verification failed' };
    }
};

export const forgotPassword = async (email) => {
    try {
        const response = await authApi.post('/forgot-password', { email });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Password reset request failed' };
    }
};

export const resetPassword = async (token, newPassword) => {
    try {
        const response = await authApi.post(`/reset-password/${token}`, { password: newPassword });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Password reset failed' };
    }
};

export default authApi;