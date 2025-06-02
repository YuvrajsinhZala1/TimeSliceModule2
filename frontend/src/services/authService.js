import apiMethods from './api';
import { logInfo, logError, logDebug } from '../utils/logger';

class AuthService {
  constructor() {
    this.tokenKey = process.env.REACT_APP_TOKEN_STORAGE_KEY || 'token';
    this.isAuthenticated = false;
    this.currentUser = null;
    
    // Initialize auth state from storage
    this.initializeAuth();
  }

  initializeAuth() {
    const token = this.getToken();
    if (token) {
      this.isAuthenticated = true;
      logDebug('Auth initialized with existing token');
    }
  }

  // Sign up new user
  async signup(userData) {
    try {
      logInfo('Attempting user signup', { username: userData.username, email: userData.email });
      
      const response = await apiMethods.post('/auth/signup', userData);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Store token and user data
        this.setToken(token);
        this.currentUser = user;
        this.isAuthenticated = true;
        
        logInfo('Signup successful', { username: user.username, userId: user._id });
        
        return {
          success: true,
          user,
          token,
          message: response.message || 'Account created successfully!'
        };
      } else {
        throw new Error(response.message || 'Signup failed');
      }
    } catch (error) {
      logError('Signup failed:', error);
      
      // Handle validation errors
      if (error.validationErrors) {
        return {
          success: false,
          message: 'Please check your input',
          errors: error.validationErrors
        };
      }
      
      return {
        success: false,
        message: error.message || 'Failed to create account. Please try again.'
      };
    }
  }

  // Login user
  async login(credentials) {
    try {
      logInfo('Attempting user login', { identifier: credentials.identifier });
      
      const response = await apiMethods.post('/auth/login', credentials);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Store token and user data
        this.setToken(token);
        this.currentUser = user;
        this.isAuthenticated = true;
        
        logInfo('Login successful', { username: user.username, userId: user._id });
        
        return {
          success: true,
          user,
          token,
          message: response.message || 'Login successful!'
        };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      logError('Login failed:', error);
      
      return {
        success: false,
        message: error.message || 'Invalid credentials. Please try again.'
      };
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated');
      }
      
      const response = await apiMethods.get('/auth/me');
      
      if (response.success && response.data) {
        this.currentUser = response.data.user;
        logDebug('Current user fetched', { userId: this.currentUser._id });
        return this.currentUser;
      } else {
        throw new Error(response.message || 'Failed to fetch user profile');
      }
    } catch (error) {
      logError('Failed to fetch current user:', error);
      
      // If token is invalid, logout
      if (error.status === 401) {
        this.logout();
      }
      
      throw error;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      logInfo('Updating user profile');
      
      const response = await apiMethods.put('/auth/profile', profileData);
      
      if (response.success && response.data) {
        this.currentUser = response.data.user;
        logInfo('Profile updated successfully');
        
        return {
          success: true,
          user: this.currentUser,
          message: response.message || 'Profile updated successfully!'
        };
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      logError('Profile update failed:', error);
      
      return {
        success: false,
        message: error.message || 'Failed to update profile. Please try again.',
        errors: error.validationErrors
      };
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      logInfo('Attempting password change');
      
      const response = await apiMethods.put('/auth/password', passwordData);
      
      if (response.success) {
        logInfo('Password changed successfully');
        
        return {
          success: true,
          message: response.message || 'Password changed successfully!'
        };
      } else {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error) {
      logError('Password change failed:', error);
      
      return {
        success: false,
        message: error.message || 'Failed to change password. Please try again.'
      };
    }
  }

  // Logout user
  logout() {
    logInfo('User logging out');
    
    this.removeToken();
    this.currentUser = null;
    this.isAuthenticated = false;
    
    // Redirect to login page
    window.location.href = '/login';
  }

  // Token management
  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
    logDebug('Token stored in localStorage');
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  removeToken() {
    localStorage.removeItem(this.tokenKey);
    logDebug('Token removed from localStorage');
  }

  // Check if user is authenticated
  isUserAuthenticated() {
    return this.isAuthenticated && !!this.getToken();
  }

  // Get current user without API call
  getCachedUser() {
    return this.currentUser;
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;