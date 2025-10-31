import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    profile: null,
    currentUserProfile: null,
    loading: false,
    error: null,
    savedItems: {
        posts: [],
        blogs: [],
        tours: []
    },
    photos: [],
    stats: null
};

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        profileStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        profileSuccess: (state, action) => {
            state.loading = false;
            state.profile = action.payload;
            state.error = null;
        },
        currentProfileSuccess: (state, action) => {
            state.loading = false;
            state.currentUserProfile = action.payload;
            state.error = null;
        },
        profileFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        updateProfileSuccess: (state, action) => {
            state.loading = false;
            state.profile = { ...state.profile, ...action.payload };
            if (state.currentUserProfile) {
                state.currentUserProfile = { ...state.currentUserProfile, ...action.payload };
            }
            state.error = null;
        },
        updateProfileFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        setSavedItems: (state, action) => {
            state.savedItems = action.payload;
        },
        setPhotos: (state, action) => {
            state.photos = action.payload;
        },
        setStats: (state, action) => {
            state.stats = action.payload;
        },
        addPhoto: (state, action) => {
            state.photos.unshift(action.payload);
        },
        toggleSaveItemSuccess: (state, action) => {
            const { type, itemId, isSaved } = action.payload;
            if (isSaved) {
                state.savedItems[type] = state.savedItems[type].filter(id => id !== itemId);
            } else {
                state.savedItems[type].push(itemId);
            }
        },
        updateFollowStatus: (state, action) => {
            const { userId, isFollowing } = action.payload;
            if (state.profile) {
                if (isFollowing) {
                    state.profile.followers = state.profile.followers.filter(id => id !== userId);
                } else {
                    state.profile.followers.push(userId);
                }
            }
        },
        clearProfile: (state) => {
            state.profile = null;
            state.currentUserProfile = null;
            state.savedItems = { posts: [], blogs: [], tours: [] };
            state.photos = [];
            state.stats = null;
            state.loading = false;
            state.error = null;
        }
    }
});

export const {
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
    updateFollowStatus,
    clearProfile
} = profileSlice.actions;

export default profileSlice.reducer;