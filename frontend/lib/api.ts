import axios from 'axios';

const browserHost =
  typeof window !== 'undefined' ? window.location.hostname : 'localhost';
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
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // In cookie mode, just handle routing
    }
    return Promise.reject(error);
  }
);
