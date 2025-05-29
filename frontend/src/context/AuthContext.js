import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { authService } from '../services/authService';
import { logInfo, logError, logDebug } from '../utils/logger';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  SIGNUP_START: 'SIGNUP_START',
  SIGNUP_SUCCESS: 'SIGNUP_SUCCESS',
  SIGNUP_FAILURE: 'SIGNUP_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER'
};

// Reducer
function authReducer(state, action) {
  logDebug('Auth action dispatched:', { type: action.type, payload: action.payload });
  
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.SIGNUP_START:
      return {
        ...state,
        loading: true,
        error: null
      };
      
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.SIGNUP_SUCCESS:
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
      
    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.SIGNUP_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
      
    case AUTH_ACTIONS.LOGOUT:
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null
      };
      
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
      
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
      
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext();

// Provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      logInfo('Attempting login for user:', { identifier: credentials.identifier });
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const response = await authService.login(credentials);
      
      if (response.success) {
        logInfo('Login successful:', { username: response.data.user.username });
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: response.data
        });
        return { success: true };
      } else {
        logError('Login failed:', response.message);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: response.message
        });
        return { success: false, message: response.message };
      }
    } catch (error) {
      logError('Login error:', error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message || 'Login failed'
      });
      return { success: false, message: error.message || 'Login failed' };
    }
  }, []);

  // Signup function
  const signup = useCallback(async (userData) => {
    try {
      logInfo('Attempting signup for user:', { username: userData.username, email: userData.email });
      dispatch({ type: AUTH_ACTIONS.SIGNUP_START });
      
      const response = await authService.signup(userData);
      
      if (response.success) {
        logInfo('Signup successful:', { username: response.data.user.username });
        dispatch({
          type: AUTH_ACTIONS.SIGNUP_SUCCESS,
          payload: response.data
        });
        return { success: true };
      } else {
        logError('Signup failed:', response.message);
        dispatch({
          type: AUTH_ACTIONS.SIGNUP_FAILURE,
          payload: response.message
        });
        return { success: false, message: response.message };
      }
    } catch (error) {
      logError('Signup error:', error);
      dispatch({
        type: AUTH_ACTIONS.SIGNUP_FAILURE,
        payload: error.message || 'Signup failed'
      });
      return { success: false, message: error.message || 'Signup failed' };
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    logInfo('User logging out');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  }, []);

  // Check auth status
  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return;
    }

    try {
      logDebug('Checking auth status with token');
      const response = await authService.getProfile();
      
      if (response.success) {
        logInfo('Auth status check successful');
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: response.data.user, token }
        });
      } else {
        logError('Auth status check failed:', response.message);
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    } catch (error) {
      logError('Auth status check error:', error);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  // Update user profile
  const updateUser = useCallback((userData) => {
    logInfo('Updating user data:', userData);
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData
    });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    signup,
    logout,
    checkAuthStatus,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;