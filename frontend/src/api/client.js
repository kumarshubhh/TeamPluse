import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Token store (in-memory only, as per email requirements)
let authToken = null;
let logoutCallback = null;

// Set token (called by AuthProvider)
export function setAuthToken(token) {
  authToken = token;
}

// Set logout callback (called by AuthProvider)
export function setLogoutCallback(callback) {
  logoutCallback = callback;
}

// Create axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://teampluse.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - auto-add Authorization header
apiClient.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout
      if (logoutCallback) {
        logoutCallback();
      }
      // Clear token
      authToken = null;
    }
    return Promise.reject(error);
  }
);

export default apiClient;
