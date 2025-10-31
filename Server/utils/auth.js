// Get auth token from localStorage
export const getToken = () => localStorage.getItem('token');

// Set auth token in localStorage
export const setToken = (token) => {
    if (token) {
        localStorage.setItem('token', token);
    }
};

// Remove auth token from localStorage
export const removeToken = () => {
    localStorage.removeItem('token');
};

// Check if user is authenticated
export const isAuthenticated = () => {
    const token = getToken();
    return !!token;
};

// Store user data
export const setUser = (user) => {
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
    }
};

// Get user data
export const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

// Clear all auth data
export const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

// Check if user is admin
export const isAdmin = () => {
    const user = getUser();
    return user?.role === 'admin';
};