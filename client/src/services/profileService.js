import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000' });

// Request interceptor to add token
API.interceptors.request.use((req) => {
  const profile = localStorage.getItem('profile');
  if (profile) {
    const token = JSON.parse(profile).token;
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const getProfile = async (username) => {
  try {
    const response = await API.get(`/api/profile/${username}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (formData) => {
  try {
    const response = await API.patch('/api/profile', formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateProfilePicture = async (file) => {
  try {
    const formData = new FormData();
    formData.append('profilePicture', file);
    const response = await API.patch('/api/profile/profile-picture', formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCoverPicture = async (file) => {
  try {
    const formData = new FormData();
    formData.append('coverPicture', file);
    const response = await API.patch('/api/profile/cover-picture', formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserStats = async (username) => {
  try {
    const response = await API.get(`/api/profile/${username}/stats`);
    return response.data;
  } catch (error) {
    throw error;
  }
};