import { create } from 'zustand';
import api from '../lib/api.js';

const useAuthStore = create((set) => ({
  user: null,
  // Initialize token from localStorage immediately
  token: localStorage.getItem('token') || null,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      // Destructure to separate token from user details
      const { token, user } = data.data; 

      localStorage.setItem('token', token);
      
      // Update state: user is the object, token is the string
      set({ 
        user: user, 
        token: token, 
        isLoading: false 
      });

      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { 
        success: false, 
        message: err.response?.data?.message || 'Login failed' 
      };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    // If no token exists, don't even bother calling the API
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const { data } = await api.get('/auth/me');
      // Set user profile data from the /me endpoint
      set({ user: data.data });
    } catch (err) {
      // If the token is expired or invalid, clear everything
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },
}));

export default useAuthStore;