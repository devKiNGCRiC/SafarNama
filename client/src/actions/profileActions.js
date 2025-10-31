// client/src/actions/profileActions.js
import * as profileApi from '../api/profileRequest';
import axios from 'axios';

import {
    profileStart,
    profileSuccess,
    currentProfileSuccess,
    profileFailure,
    updateProfileSuccess,
    setSavedItems,
    setPhotos,
    setStats,
    addPhoto,
    toggleSaveItemSuccess,
    updateFollowStatus
} from '../store/reducers/profileSlice';

// Fetch API base URL from environment or use fallback
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getProfile = (username) => async (dispatch) => {
  dispatch(profileStart());
  try {
      console.log('Fetching profile for:', username);
      const response = await profileApi.getProfile(username);
      console.log('Profile API response:', response);

      if (response.success) {
          dispatch(profileSuccess(response.data));
          return { success: true, data: response.data };
      } else {
          dispatch(profileFailure(response.message));
          return { success: false, error: response.message };
      }
  } catch (error) {
      console.error('Profile fetch error:', error);
      const errorMessage = error.message || 'Failed to load profile';
      dispatch(profileFailure(errorMessage));
      return { success: false, error: errorMessage };
  }
};

export const updateProfile = (formData) => async (dispatch) => {
    try {
        const response = await axios.put(
            `${import.meta.env.VITE_API_URL}/api/v1/profile/update`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.success) {
            dispatch({
                type: 'UPDATE_PROFILE_SUCCESS',
                payload: response.data.data
            });
            return { success: true, data: response.data.data };
        }
    } catch (error) {
        console.error('Profile update error:', error);
        return { 
            success: false, 
            error: error.response?.data?.message || 'Failed to update profile' 
        };
    }
};

export const updateProfilePicture = (formData) => async (dispatch) => {
  dispatch({ type: 'UPDATE_PROFILE_START' });
  try {
      const config = {
          headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${localStorage.getItem('token')}`
          }
      };

      // Log the FormData for debugging
      for (let pair of formData.entries()) {
          console.log('FormData content:', pair[0], pair[1]);
      }

      const response = await axios.put(
          `${API_BASE_URL}/api/v1/profile/picture`,
          formData,
          config
      );

      if (response.data.success) {
          dispatch({
              type: 'UPDATE_PROFILE_SUCCESS',
              payload: response.data.data
          });
          return { success: true, data: response.data.data };
      }
  } catch (error) {
      console.error('Profile picture update error:', error);
      dispatch({
          type: 'UPDATE_PROFILE_FAILURE',
          payload: error.response?.data?.message || 'Update failed'
      });
      return { success: false, error: error.response?.data?.message || 'Update failed' };
  }
};

export const updateCoverPhoto = (formData) => async (dispatch) => {
    dispatch({ type: 'UPDATE_PROFILE_START' });
    try {
        const response = await axios.put(
            `${import.meta.env.VITE_API_URL}/api/v1/profile/cover`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        if (response?.data?.success) {
            dispatch({
                type: 'UPDATE_PROFILE_SUCCESS',
                payload: response.data.data
            });
            return { success: true, data: response.data.data };
        }
        return { success: false, error: 'Update failed' };
    } catch (error) {
        console.error('Cover photo update error:', error);
        dispatch({
            type: 'UPDATE_PROFILE_FAILURE',
            payload: error.response?.data?.message || 'Update failed'
        });
        return { success: false, error: error.response?.data?.message || 'Update failed' };
    }
};

export const addProfilePhoto = (formData) => async (dispatch) => {
    dispatch(profileStart());
    try {
        const { data } = await profileApi.addProfilePhoto(formData);
        dispatch(addPhoto(data));
        return { success: true, data };
    } catch (error) {
        dispatch(profileFailure(error.message));
        return { success: false, error: error.message };
    }
};

export const followUserAction = (userId) => async (dispatch) => {
    try {
        const { data } = await profileApi.followUser(userId);
        dispatch(updateFollowStatus({ userId, isFollowing: false }));
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const unfollowUserAction = (userId) => async (dispatch) => {
    try {
        const { data } = await profileApi.unfollowUser(userId);
        dispatch(updateFollowStatus({ userId, isFollowing: true }));
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const fetchSavedItems = () => async (dispatch) => {
    try {
        const { data } = await profileApi.getSavedItems();
        dispatch(setSavedItems(data));
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const toggleSaveItemAction = (type, itemId) => async (dispatch) => {
    try {
        const { data } = await profileApi.toggleSaveItem(type, itemId);
        dispatch(toggleSaveItemSuccess({ type, itemId, isSaved: data.isSaved }));
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const fetchProfileStats = () => async (dispatch) => {
    try {
        const { data } = await profileApi.getProfileStats();
        dispatch(setStats(data));
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const fetchPhotos = () => async (dispatch) => {
    try {
        const { data } = await profileApi.getPhotos();
        dispatch(setPhotos(data));
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};