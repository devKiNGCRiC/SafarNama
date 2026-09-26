// client/src/actions/profileActions.js
import * as profileApi from '../api/profileRequest';

import {
    profileStart,
    profileSuccess,
    profileFailure,
    patchViewedUser,
    patchViewedProfile,
    setSavedItems,
    setStats,
    toggleSaveItemSuccess,
    updateFollowStatus
} from '../store/reducers/profileSlice';
import { updateUserProfile } from '../store/reducers/authSlice';

// Loads someone's profile (no username = my own). Resolves to { success, data | error, notFound }.
export const getProfile = (username) => async (dispatch) => {
    dispatch(profileStart());
    const response = await profileApi.getProfile(username);
    if (response.success) {
        dispatch(profileSuccess(response.data));
        return { success: true, data: response.data };
    }
    dispatch(profileFailure(response.message));
    return { success: false, error: response.message, notFound: response.status === 404 };
};

// Saves the edit form. The server checks every field and answers with the fresh profile.
export const updateProfile = (fields) => async (dispatch) => {
    try {
        const response = await profileApi.updateProfile(fields);
        dispatch(profileSuccess(response.data));
        // keep the name in the logged-in user (navbar, chat, ...) in step
        dispatch(updateUserProfile({ firstName: response.data.user.firstName, lastName: response.data.user.lastName }));
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.message || 'Failed to update profile' };
    }
};

export const updateProfilePicture = (formData) => async (dispatch) => {
    try {
        const response = await profileApi.updateProfilePicture(formData);
        dispatch(patchViewedUser({ avatar: response.data.avatar }));
        dispatch(updateUserProfile({ avatar: response.data.avatar })); // navbar avatar too
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.message || 'Could not update the profile picture' };
    }
};

export const updateCoverPhoto = (formData) => async (dispatch) => {
    try {
        const response = await profileApi.updateCoverPhoto(formData);
        dispatch(patchViewedProfile({ coverImage: response.data.coverImage }));
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.message || 'Could not update the cover photo' };
    }
};

const currentUserId = (getState) => {
    const me = getState().auth.user;
    return me?.id || me?._id;
};

export const followUserAction = (userId) => async (dispatch, getState) => {
    try {
        const data = await profileApi.followUser(userId);
        dispatch(updateFollowStatus({ myId: currentUserId(getState), followed: true }));
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const unfollowUserAction = (userId) => async (dispatch, getState) => {
    try {
        const data = await profileApi.unfollowUser(userId);
        dispatch(updateFollowStatus({ myId: currentUserId(getState), followed: false }));
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
