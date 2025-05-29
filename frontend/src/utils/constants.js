// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    PROFILE: '/auth/me',
    UPDATE_PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/password',
    PUBLIC_PROFILE: '/auth/user'
  },
  SLOTS: {
    BASE: '/slots',
    MY_SLOTS: '/slots/my-slots'
  },
  BOOKINGS: {
    BASE: '/bookings',
    STATS: '/bookings/stats',
    STATUS: '/bookings/:id/status',
    CANCEL: '/bookings/:id/cancel'
  },
  REVIEWS: {
    BASE: '/reviews',
    GIVEN: '/reviews/given',
    USER: '/reviews/user',
    STATS: '/reviews/stats'
  },
  WALLET: {
    BASE: '/wallet',
    TRANSACTIONS: '/wallet/transactions',
    STATS: '/wallet/stats',
    PENDING: '/wallet/pending'
  }
};

// Slot Categories
export const SLOT_CATEGORIES = [
  'Programming',
  'Design',
  'Marketing',
  'Business',
  'Writing',
  'Consulting',
  'Teaching',
  'Mentoring',
  'Career Advice',
  'Code Review',
  'Other'
];

// Slot Durations
export const SLOT_DURATIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '60 minutes' }
];

// Meeting Platforms
export const MEETING_PLATFORMS = [
  'Zoom',
  'Google Meet',
  'Microsoft Teams',
  'Discord',
  'Other'
];

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show'
};

// Status Colors
export const STATUS_COLORS = {
  [BOOKING_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [BOOKING_STATUS.CONFIRMED]: 'bg-blue-100 text-blue-800',
  [BOOKING_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
  [BOOKING_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
  [BOOKING_STATUS.NO_SHOW]: 'bg-gray-100 text-gray-800'
};

// Credit Limits
export const CREDIT_LIMITS = {
  MIN_SLOT_COST: 1,
  MAX_SLOT_COST: 20,
  INITIAL_CREDITS: 10
};

// Validation Rules
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_]+$/
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    PATTERN: /^(?=.*[a-zA-Z])(?=.*\d)/
  },
  BIO: {
    MAX_LENGTH: 500
  },
  SLOT_TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 100
  },
  SLOT_DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 500
  },
  SKILLS: {
    MAX_COUNT: 10,
    MAX_LENGTH: 50
  },
  TAGS: {
    MAX_COUNT: 10,
    MAX_LENGTH: 30
  }
};

// Date/Time Constants
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy - h:mm a',
  ISO: 'yyyy-MM-dd',
  TIME: 'h:mm a'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  PREFERENCES: 'preferences'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Internal server error. Please try again later.',
  VALIDATION: 'Please check your input and try again.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful!',
  SIGNUP: 'Account created successfully!',
  LOGOUT: 'Logout successful!',
  PROFILE_UPDATE: 'Profile updated successfully!',
  PASSWORD_CHANGE: 'Password changed successfully!',
  SLOT_CREATED: 'Slot created successfully!',
  SLOT_UPDATED: 'Slot updated successfully!',
  SLOT_DELETED: 'Slot deleted successfully!',
  BOOKING_CREATED: 'Booking created successfully!',
  BOOKING_CANCELLED: 'Booking cancelled successfully!',
  REVIEW_SUBMITTED: 'Review submitted successfully!'
};

// Loading States
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50
};

// Theme Colors
export const THEME_COLORS = {
  PRIMARY: '#3B82F6',
  SECONDARY: '#64748B',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#06B6D4'
};