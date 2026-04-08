import axios from 'axios';

const browserHost =
  typeof window !== 'undefined' ? window.location.hostname : 'localhost';

// Use same host as browser to avoid cookie domain issues during local dev
const API_URL = 
  process.env.NEXT_PUBLIC_API_URL || `http://${browserHost}:3001/api/v1`;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to catch 401s globally
api.interceptors.response.use(
  (response) => {
    // If backend returns data wrapped, extract it
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      console.warn('[API Interceptor] 401 Unauthorized detected. Redirecting to login.');
      // Avoid infinite redirects if already on login or error pages
      if (!window.location.pathname.includes('/login')) {
         window.location.href = '/login?expired=true';
         return new Promise(() => {}); // Prevent downstream catch blocks from triggering alerts
      }
    }
    return Promise.reject(error);
  }
);
