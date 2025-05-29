import api from './api';
import { logInfo, logError } from '../utils/logger';

export const authService = {
  // Login user
  login: async (credentials) => {
    try {
      logInfo('AuthService: Attempting login');
      const response = await api.post('/auth/login', credentials);
      logInfo('AuthService: Login successful');
      return response;
    } catch (error) {
      logError('AuthService: Login failed', error.message);
      throw error;
    }
  },

  // Register user
  signup: async (userData) => {
    try {
      logInfo('AuthService: Attempting signup');
      const response = await api.post('/auth/signup', userData);
      logInfo('AuthService: Signup successful');
      return response;
    } catch (error) {
      logError('AuthService: Signup failed', error.message);
      throw error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      logInfo('AuthService: Fetching user profile');
      const response = await api.get('/auth/me');
      return response;
    } catch (error) {
      logError('AuthService: Get profile failed', error.message);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      logInfo('AuthService: Updating user profile');
      const response = await api.put('/auth/profile', profileData);
      logInfo('AuthService: Profile update successful');
      return response;
    } catch (error) {
      logError('AuthService: Profile update failed', error.message);
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      logInfo('AuthService: Changing password');
      const response = await api.put('/auth/password', passwordData);
      logInfo('AuthService: Password change successful');
      return response;
    } catch (error) {
      logError('AuthService: Password change failed', error.message);
      throw error;
    }
  },

  // Get public user profile
  getUserProfile: async (userId) => {
    try {
      logInfo('AuthService: Fetching public user profile', { userId });
      const response = await api.get(`/auth/user/${userId}`);
      return response;
    } catch (error) {
      logError('AuthService: Get public profile failed', error.message);
      throw error;
    }
  }
};