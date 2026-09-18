import * as authApi from '../api/authRequest';
import { 
    loginStart, 
    loginSuccess, 
    loginFailure, 
    logout,
    registerStart,
    registerSuccess,
    registerFailure,
    clearError
} from '../store/reducers/authSlice';

export const loginUser = (credentials) => async (dispatch) => {
    dispatch(loginStart());
    try {
        
        const data  = await authApi.login(credentials);
        console.log('Login response data:', data); // Debug log

        if (data && data.token) {
            dispatch(loginSuccess({
                user: data.user,
                token: data.token
            }));
            return { success: true, data };
        } else {
            dispatch(loginFailure(data.message || 'Login failed'));
            return { success: false, error: data.message };
        }
        // dispatch(loginSuccess({ ...data, authType: 'local' }));
        // return { success: true, data };
    } catch (error) {
        console.error('Login error:', error); // Debug log
        dispatch(loginFailure(error.message));
        return { success: false, error: error.message };
    }
};

export const registerUser = (userData) => async (dispatch) => {
    dispatch(registerStart());
    try {
        
        const data = await authApi.register(userData);
        console.log('Registration response data:', data);

        if (data && data.success) {
            dispatch(registerSuccess(data));
            localStorage.setItem('token', data.token);
            return { success: true, data };
        } else {
            dispatch(registerFailure(data.message || 'Registration failed'));
            return { success: false, error: data.message };
        }
    } catch (error) {
        const errorMessage = error.message || 'Registration failed';
        dispatch(registerFailure(errorMessage));
        return { success: false, error: errorMessage };
    }
};

export const logoutUser = () => async (dispatch) => {
    try {
        // Clear local storage first
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        

        dispatch(logout());

        return { success: true, message: "Logged out successfully" };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
};

export const sendPasswordResetEmail = (email) => async (dispatch) => {
    try {
        const data = await authApi.forgotPassword(email);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const resetUserPassword = (token, newPassword) => async (dispatch) => {
    try {
        const data = await authApi.resetPassword(token, newPassword);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const verifyUserEmail = (token) => async (dispatch) => {
    try {
        const data = await authApi.verifyEmail(token);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const clearAuthError = () => (dispatch) => {
    dispatch(clearError());
};

export const googleLogin = (token) => async (dispatch) => {
    dispatch(loginStart());
    try {
        const { data } = await authApi.post('/google', { token });
        dispatch(loginSuccess(data));
        return { success: true, data };
    } catch (error) {
        dispatch(loginFailure(error.message));
        return { success: false, error: error.message };
    }
};

export const facebookLogin = (token) => async (dispatch) => {
    dispatch(loginStart());
    try {
        const { data } = await authApi.post('/facebook', { token });
        dispatch(loginSuccess(data));
        return { success: true, data };
    } catch (error) {
        dispatch(loginFailure(error.message));
        return { success: false, error: error.message };
    }
};
