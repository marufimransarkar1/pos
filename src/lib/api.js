import axios from 'axios';

// Detect if the app is running on Vercel or locally
const isProduction = import.meta.env.PROD;

const api = axios.create({
  // Use absolute URL for Vercel, relative path for local Vite proxy
  baseURL: isProduction 
    ? 'https://posbackend-ten.vercel.app/api' 
    : '/api',
  withCredentials: true
});

// Request Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Check for 401 Unauthorized
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      
      // STOP THE LOOP: Only redirect if the user isn't already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;