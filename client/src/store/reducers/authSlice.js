import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token'),
    loading: false,
    error: null,
    isAuthenticated: !!localStorage.getItem('token'),
    //authType: null, // 'local' or 'social'
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        loginSuccess: (state, action) => {
            state.loading = false;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            //state.authType = action.payload.authType;
            state.error = null;
            localStorage.setItem('token', action.payload.token);
            localStorage.setItem('user', JSON.stringify(action.payload.user));
        },
        loginFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
            state.isAuthenticated = false;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            //state.authType = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
        registerStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        registerSuccess: (state, action) => {
            state.loading = false;
            state.error = null;
            state.user = action.payload.user; // Example payload if user details are returned
        },
        registerFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        updateUserProfile: (state, action) => {
            state.user = { ...state.user, ...action.payload };
        },
        clearError: (state) => {
            state.error = null;
        }
    }
});

export const { 
    loginStart, 
    loginSuccess, 
    loginFailure, 
    logout, 
    registerStart,
    registerSuccess,
    registerFailure,
    updateUserProfile,
    clearError 
} = authSlice.actions;

export default authSlice.reducer;