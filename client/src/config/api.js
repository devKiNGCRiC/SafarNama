import axios from "axios";

// Single source of truth for the backend address. Set VITE_API_URL in
// client/.env for other environments (staging, production).
export const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const attachToken = (config) => {
  try {
    const token = localStorage.getItem("token");
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // localStorage can be unavailable (private mode) - send the request as is
  }
  return config;
};

// Shared axios instance for the API modules in src/api/*
export const http = axios.create({ baseURL: API_URL });
http.interceptors.request.use(attachToken);

// The default axios instance is used directly by many pages/components.
// Send the JWT with every request that targets our own backend (and only ours,
// so the token is never leaked to third-party hosts such as weather APIs).
axios.interceptors.request.use((config) => {
  const url = `${config.baseURL || ""}${config.url || ""}`;
  return url.startsWith(API_URL) ? attachToken(config) : config;
});
