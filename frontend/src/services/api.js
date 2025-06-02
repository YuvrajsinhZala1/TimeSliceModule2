import axios from 'axios';
import { logInfo, logError, logDebug, logWarn } from '../utils/logger';

// Environment validation
const validateEnvironment = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const debug = process.env.REACT_APP_DEBUG === 'true';
  
  if (debug) {
    console.log('🔧 Frontend API Configuration:');
    console.log(`   API URL: ${apiUrl}`);
    console.log(`   Debug Mode: ${debug}`);
    console.log(`   Environment: ${process.env.REACT_APP_ENVIRONMENT}`);
  }
  
  return { apiUrl, debug };
};

const { apiUrl, debug } = validateEnvironment();

// Create axios instance with enhanced configuration
const api = axios.create({
  baseURL: apiUrl || 'http://localhost:5000/api',
  timeout: 15000, // Increased timeout for better reliability
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Enable credentials for CORS
  withCredentials: false, // Set to true if you need cookies
});

// Network status tracking
let isOnline = navigator.onLine;
let retryCount = 0;
const MAX_RETRIES = 3;

// Monitor network status
window.addEventListener('online', () => {
  isOnline = true;
  logInfo('Network: Back online');
});

window.addEventListener('offline', () => {
  isOnline = false;
  logWarn('Network: Gone offline');
});

// Enhanced request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Add timestamp for request tracking
    config.metadata = { startTime: new Date() };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Enhanced logging
    if (debug) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      console.log('📦 Request Details:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        timeout: config.timeout,
        headers: { 
          ...config.headers, 
          Authorization: token ? 'Bearer [REDACTED]' : 'None' 
        },
        data: config.data ? (typeof config.data === 'string' ? config.data : JSON.stringify(config.data, null, 2)) : 'None'
      });
    }

    logDebug('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      headers: { ...config.headers, Authorization: token ? 'Bearer [REDACTED]' : undefined },
      data: config.data,
      timestamp: new Date().toISOString()
    });

    // Check network status
    if (!isOnline) {
      logWarn('Attempting request while offline');
    }

    return config;
  },
  (error) => {
    logError('API Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
api.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata.startTime;
    
    if (debug) {
      console.log(`✅ API Response: ${response.status} ${response.statusText} (${duration}ms)`);
      console.log('📥 Response Data:', response.data);
    }

    logDebug('API Response Success:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      duration: `${duration}ms`,
      data: response.data,
      timestamp: new Date().toISOString()
    });

    // Reset retry count on successful response
    retryCount = 0;

    return response;
  },
  (error) => {
    const duration = error.config?.metadata ? new Date() - error.config.metadata.startTime : 0;
    
    // Enhanced error logging
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      duration: duration ? `${duration}ms` : 'Unknown',
      data: error.response?.data,
      timestamp: new Date().toISOString(),
      networkStatus: isOnline ? 'Online' : 'Offline'
    };

    if (debug) {
      console.error(`❌ API Error: ${error.response?.status || 'Network'} - ${error.message}`);
      console.error('🔍 Error Details:', errorDetails);
    }

    logError('API Response Error:', errorDetails);

    // Handle specific error types
    if (error.code === 'ECONNABORTED') {
      logWarn('Request timeout - server may be slow or unavailable');
    } else if (error.code === 'ERR_NETWORK') {
      logWarn('Network error - check if backend server is running');
    } else if (!error.response) {
      logWarn('No response received - possible CORS or network issue');
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message?.toLowerCase();
      
      if (errorMessage?.includes('token') && (errorMessage?.includes('expired') || errorMessage?.includes('invalid'))) {
        logInfo('Authentication token invalid/expired, removing from storage');
        localStorage.removeItem('token');
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          logInfo('Redirecting to login page');
          window.location.href = '/login';
        }
      }
    }

    // Handle server errors with retry logic
    if (error.response?.status >= 500 && retryCount < MAX_RETRIES) {
      retryCount++;
      logWarn(`Server error, retrying... (${retryCount}/${MAX_RETRIES})`);
      
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(api.request(error.config));
        }, 1000 * retryCount); // Exponential backoff
      });
    }

    return Promise.reject(error);
  }
);

// Connection test utility
const testConnection = async () => {
  try {
    logInfo('Testing API connection...');
    const response = await api.get('/health', { timeout: 5000 });
    logInfo('✅ API connection successful', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    logError('❌ API connection failed:', error.message);
    return { 
      success: false, 
      error: error.message,
      details: {
        code: error.code,
        status: error.response?.status,
        baseURL: api.defaults.baseURL
      }
    };
  }
};

// Enhanced API methods with better error handling
const apiMethods = {
  // Test connection
  testConnection,

  // GET request
  get: async (url, params = {}, options = {}) => {
    try {
      logDebug(`GET request to: ${url}`, { params });
      const response = await api.get(url, { 
        params, 
        ...options 
      });
      return response.data;
    } catch (error) {
      const enhancedError = new Error(
        error.response?.data?.message || 
        error.message || 
        'An unexpected error occurred'
      );
      enhancedError.status = error.response?.status;
      enhancedError.originalError = error;
      throw enhancedError;
    }
  },

  // POST request
  post: async (url, data = {}, options = {}) => {
    try {
      logDebug(`POST request to: ${url}`, { data });
      const response = await api.post(url, data, options);
      return response.data;
    } catch (error) {
      const enhancedError = new Error(
        error.response?.data?.message || 
        error.message || 
        'An unexpected error occurred'
      );
      enhancedError.status = error.response?.status;
      enhancedError.originalError = error;
      enhancedError.validationErrors = error.response?.data?.errors;
      throw enhancedError;
    }
  },

  // PUT request
  put: async (url, data = {}, options = {}) => {
    try {
      logDebug(`PUT request to: ${url}`, { data });
      const response = await api.put(url, data, options);
      return response.data;
    } catch (error) {
      const enhancedError = new Error(
        error.response?.data?.message || 
        error.message || 
        'An unexpected error occurred'
      );
      enhancedError.status = error.response?.status;
      enhancedError.originalError = error;
      enhancedError.validationErrors = error.response?.data?.errors;
      throw enhancedError;
    }
  },

  // DELETE request
  delete: async (url, options = {}) => {
    try {
      logDebug(`DELETE request to: ${url}`);
      const response = await api.delete(url, options);
      return response.data;
    } catch (error) {
      const enhancedError = new Error(
        error.response?.data?.message || 
        error.message || 
        'An unexpected error occurred'
      );
      enhancedError.status = error.response?.status;
      enhancedError.originalError = error;
      throw enhancedError;
    }
  },

  // PATCH request (for partial updates)
  patch: async (url, data = {}, options = {}) => {
    try {
      logDebug(`PATCH request to: ${url}`, { data });
      const response = await api.patch(url, data, options);
      return response.data;
    } catch (error) {
      const enhancedError = new Error(
        error.response?.data?.message || 
        error.message || 
        'An unexpected error occurred'
      );
      enhancedError.status = error.response?.status;
      enhancedError.originalError = error;
      enhancedError.validationErrors = error.response?.data?.errors;
      throw enhancedError;
    }
  }
};

// Export axios instance and methods
export default apiMethods;
export { api, testConnection };

// Initialize connection test in development
if (debug && process.env.REACT_APP_ENVIRONMENT === 'development') {
  // Test connection on load (delayed to allow app to initialize)
  setTimeout(() => {
    testConnection().then(result => {
      if (!result.success) {
        console.warn('⚠️ Backend connection failed. Make sure your backend server is running on:', api.defaults.baseURL);
        console.warn('💡 Troubleshooting tips:');
        console.warn('   1. Check if backend server is running: npm run dev (in backend folder)');
        console.warn('   2. Verify REACT_APP_API_URL in .env file');
        console.warn('   3. Check for CORS issues in browser console');
        console.warn('   4. Ensure MongoDB is running and connected');
      }
    });
  }, 2000);
}