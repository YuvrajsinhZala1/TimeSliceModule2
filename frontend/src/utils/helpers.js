import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { DATE_FORMATS } from './constants';
import { logError, logDebug } from './logger';

// Date formatting helpers
export const formatDate = (date, formatStr = DATE_FORMATS.DISPLAY) => {
  try {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      logError('Invalid date provided to formatDate:', date);
      return 'Invalid Date';
    }
    
    return format(dateObj, formatStr);
  } catch (error) {
    logError('Error formatting date:', error);
    return 'Invalid Date';
  }
};

// Relative time formatting
export const formatRelativeTime = (date) => {
  try {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      logError('Invalid date provided to formatRelativeTime:', date);
      return 'Invalid Date';
    }
    
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    logError('Error formatting relative time:', error);
    return 'Invalid Date';
  }
};

// Check if date is in the past
export const isPastDate = (date) => {
  try {
    if (!date) return false;
    
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) && dateObj < new Date();
  } catch (error) {
    logError('Error checking past date:', error);
    return false;
  }
};

// Credit formatting
export const formatCredits = (credits) => {
  if (typeof credits !== 'number') return '0';
  return credits.toLocaleString();
};

// Name formatting
export const formatName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text || typeof text !== 'string') return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
};

// Generate initials from name
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'U';
  
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

// Format rating
export const formatRating = (rating) => {
  if (!rating || typeof rating !== 'number') return '0.0';
  return rating.toFixed(1);
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePasswordStrength = (password) => {
  const result = {
    isValid: false,
    score: 0,
    feedback: []
  };
  
  if (!password) {
    result.feedback.push('Password is required');
    return result;
  }
  
  if (password.length < 6) {
    result.feedback.push('Password must be at least 6 characters long');
  } else {
    result.score += 1;
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    result.feedback.push('Password must contain at least one letter');
  } else {
    result.score += 1;
  }
  
  if (!/\d/.test(password)) {
    result.feedback.push('Password must contain at least one number');
  } else {
    result.score += 1;
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.feedback.push('Consider adding special characters for stronger security');
  } else {
    result.score += 1;
  }
  
  result.isValid = result.score >= 2 && password.length >= 6;
  
  return result;
};

// Capitalize first letter
export const capitalize = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Format currency (for credits)
export const formatCurrency = (amount, currency = 'credits') => {
  if (typeof amount !== 'number') return `0 ${currency}`;
  return `${amount.toLocaleString()} ${currency}`;
};

// Deep clone object
export const deepClone = (obj) => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    logError('Error deep cloning object:', error);
    return {};
  }
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Array utility functions
export const removeDuplicates = (array, key = null) => {
  if (!Array.isArray(array)) return [];
  
  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const keyValue = item[key];
      if (seen.has(keyValue)) {
        return false;
      }
      seen.add(keyValue);
      return true;
    });
  }
  
  return [...new Set(array)];
};

// Sort array of objects
export const sortBy = (array, key, direction = 'asc') => {
  if (!Array.isArray(array)) return [];
  
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// Group array by key
export const groupBy = (array, key) => {
  if (!Array.isArray(array)) return {};
  
  return array.reduce((groups, item) => {
    const keyValue = item[key];
    if (!groups[keyValue]) {
      groups[keyValue] = [];
    }
    groups[keyValue].push(item);
    return groups;
  }, {});
};

// Local storage helpers with error handling
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      logError('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logError('Error writing to localStorage:', error);
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      logError('Error removing from localStorage:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      logError('Error clearing localStorage:', error);
      return false;
    }
  }
};

// URL parameter helpers
export const getUrlParams = () => {
  return new URLSearchParams(window.location.search);
};

export const setUrlParam = (key, value) => {
  const url = new URL(window.location);
  url.searchParams.set(key, value);
  window.history.pushState({}, '', url);
};

export const removeUrlParam = (key) => {
  const url = new URL(window.location);
  url.searchParams.delete(key);
  window.history.pushState({}, '', url);
};

// File size formatter
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Color utilities
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  } catch (error) {
    logError('Error copying to clipboard:', error);
    return false;
  }
};

// Device detection
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isTablet = () => {
  return /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
};

export const isDesktop = () => {
  return !isMobile() && !isTablet();
};

// Browser detection
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  
  if (userAgent.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
    browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Safari') > -1) {
    browserName = 'Safari';
    browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Edge') > -1) {
    browserName = 'Edge';
    browserVersion = userAgent.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
  }
  
  return { browserName, browserVersion };
};

logDebug('Helpers module loaded successfully');