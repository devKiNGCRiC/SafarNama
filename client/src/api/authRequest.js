import axios from "axios";
import { API_URL } from '../config/api';


const authApi = axios.create({
  baseURL: `${API_URL}/api/v1/auth/`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor: the server has no refresh-token endpoint, so a 401 on a
// protected request simply means the session is gone - clear it.
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isCredentialCheck = /\/(login|register)$/.test(error.config?.url || '');
    if (status === 401 && !isCredentialCheck) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  },
);

export const login = async (credentials) => {
  try {
    const response = await authApi.post("/login", credentials);
    return response.data;
  } catch (error) {
    console.error("Login API Error:", error.response?.data || error);
    throw (
      error.response?.data || {
        success: false,
        message: "Login failed",
      }
    );
  }
};

export const register = async (userData) => {
  try {
    const response = await authApi.post("/register", userData);
    if (response.data) {
      return response.data; // Return just the data part
    }
    throw new Error("No data received from server");
  } catch (error) {
    if (error.response) {
      // Server responded with error
      throw error.response.data;
    }
    throw (
      error.response?.data || {
        success: false,
        message: "Registration failed",
      }
    );
  }
};

export const logoutApi = async () => {
  try {
    await authApi.post("/logout");
    localStorage.removeItem("token");
  } catch (error) {
    console.error("Logout error:", error);
  }
};

export const verifyEmail = async (token) => {
  try {
    const response = await authApi.get(`/verify-email/${token}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Email verification failed" };
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await authApi.post("/forgot-password", { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Password reset request failed" };
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await authApi.post(`/reset-password/${token}`, {
      password: newPassword,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Password reset failed" };
  }
};

export default authApi;
