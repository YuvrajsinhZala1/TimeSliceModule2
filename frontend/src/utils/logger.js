// Enhanced Logger utility for frontend debugging and monitoring
// Supports file logging for VS Code development

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logs = [];
    this.maxLogs = 1000; // Maximum number of logs to keep in memory
    this.debugMode = process.env.REACT_APP_DEBUG === 'true';
    this.logToFile = this.isDevelopment; // Enable file logging in development
    
    // Initialize log storage
    if (this.isDevelopment) {
      this.initializeLogStore();
      this.setupFileLogging();
    }
    
    // Performance monitoring
    this.performanceMarks = new Map();
    
    // Error tracking
    this.errorCount = 0;
    this.warningCount = 0;
  }

  // Initialize log storage
  initializeLogStore() {
    try {
      const existingLogs = localStorage.getItem('timeslice_logs');
      if (existingLogs) {
        this.logs = JSON.parse(existingLogs).slice(-this.maxLogs);
      }
    } catch (error) {
      console.warn('Failed to load existing logs:', error);
      this.logs = [];
    }
  }

  // Setup file logging for development
  setupFileLogging() {
    if (!this.isDevelopment) return;
    
    // Override console methods to capture all logs
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.log = (...args) => {
      originalConsoleLog.apply(console, args);
      this.saveToFile('info', args.join(' '));
    };
    
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      this.saveToFile('error', args.join(' '));
    };
    
    console.warn = (...args) => {
      originalConsoleWarn.apply(console, args);
      this.saveToFile('warn', args.join(' '));
    };
  }

  // Save logs to file (simulated with localStorage for browser environment)
  saveToFile(level, message) {
    if (!this.logToFile) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    try {
      // Simulate file logging by storing in different localStorage keys
      const fileKey = `timeslice_${level}_log`;
      const existingLog = localStorage.getItem(fileKey) || '';
      const newLog = existingLog + logEntry;
      
      // Keep only last 500 lines to prevent localStorage overflow
      const lines = newLog.split('\n');
      const trimmedLog = lines.slice(-500).join('\n');
      
      localStorage.setItem(fileKey, trimmedLog);
    } catch (error) {
      console.warn('Failed to save log to file:', error);
    }
  }

  // Create log entry
  createLogEntry(level, message, data = null, meta = {}) {
    const entry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      data,
      meta: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.getSessionId(),
        component: meta.component || null,
        action: meta.action || null,
        userId: meta.userId || null,
        ...meta
      },
      stack: level === 'error' ? new Error().stack : null
    };

    // Add to memory
    this.logs.push(entry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Save to localStorage in development
    if (this.isDevelopment) {
      try {
        localStorage.setItem('timeslice_logs', JSON.stringify(this.logs));
      } catch (error) {
        console.warn('Failed to save logs to localStorage:', error);
      }
    }

    // Save to file
    this.saveToFile(level, `${message} ${data ? JSON.stringify(data) : ''}`);

    return entry;
  }

  // Generate unique log ID
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  // Get or create session ID
  getSessionId() {
    let sessionId = sessionStorage.getItem('timeslice_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2);
      sessionStorage.setItem('timeslice_session_id', sessionId);
    }
    return sessionId;
  }

  // Info level logging
  info(message, data = null, meta = {}) {
    const entry = this.createLogEntry('info', message, data, meta);
    
    if (this.isDevelopment || this.debugMode) {
      console.log(`[INFO] ${entry.timestamp} - ${message}`, data || '');
    }
    
    return entry;
  }

  // Error level logging
  error(message, data = null, meta = {}) {
    this.errorCount++;
    const entry = this.createLogEntry('error', message, data, meta);
    
    console.error(`[ERROR] ${entry.timestamp} - ${message}`, data || '');
    
    // Send error logs to external service in production
    if (!this.isDevelopment) {
      this.sendToErrorService(entry);
    }
    
    return entry;
  }

  // Warning level logging
  warn(message, data = null, meta = {}) {
    this.warningCount++;
    const entry = this.createLogEntry('warn', message, data, meta);
    
    if (this.isDevelopment || this.debugMode) {
      console.warn(`[WARN] ${entry.timestamp} - ${message}`, data || '');
    }
    
    return entry;
  }

  // Debug level logging (only in development)
  debug(message, data = null, meta = {}) {
    if (!this.isDevelopment && !this.debugMode) return;
    
    const entry = this.createLogEntry('debug', message, data, meta);
    console.log(`[DEBUG] ${entry.timestamp} - ${message}`, data || '');
    
    return entry;
  }

  // Success level logging
  success(message, data = null, meta = {}) {
    const entry = this.createLogEntry('success', message, data, meta);
    
    if (this.isDevelopment || this.debugMode) {
      console.log(`[SUCCESS] ${entry.timestamp} - ${message}`, data || '');
    }
    
    return entry;
  }

  // Component-specific logging
  component(componentName, action, data = null) {
    return this.debug(`[${componentName}] ${action}`, data, { 
      component: componentName, 
      action 
    });
  }

  // API request logging
  api(method, url, status, duration = null, data = null) {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    const message = `API ${method.toUpperCase()} ${url} - ${status}`;
    
    return this[level](message, {
      method,
      url,
      status,
      duration: duration ? `${duration}ms` : null,
      requestData: data
    }, { action: 'api_request' });
  }

  // User interaction logging
  interaction(element, action, data = null) {
    return this.debug(`User Interaction: ${action}`, {
      element: element.tagName || element.constructor.name,
      action,
      data,
      timestamp: new Date().toISOString()
    }, { action: 'user_interaction' });
  }

  // Performance logging
  performance(action, startTime = null) {
    if (!startTime) {
      // Start timing
      const start = performance.now();
      this.performanceMarks.set(action, start);
      return start;
    }
    
    // End timing
    const endTime = performance.now();
    const storedStart = this.performanceMarks.get(action);
    const duration = endTime - (storedStart || startTime);
    
    this.performanceMarks.delete(action);
    
    this.info(`Performance: ${action}`, {
      duration: `${duration.toFixed(2)}ms`,
      startTime: storedStart || startTime,
      endTime
    }, { action: 'performance' });
    
    return duration;
  }

  // Route change logging
  route(from, to) {
    return this.info(`Route change: ${from} -> ${to}`, null, { 
      action: 'route_change',
      from,
      to 
    });
  }

  // State change logging
  state(component, action, oldState = null, newState = null) {
    return this.debug(`State change in ${component}: ${action}`, {
      oldState,
      newState,
      diff: this.getStateDiff(oldState, newState)
    }, { 
      component, 
      action: 'state_change' 
    });
  }

  // Get state differences
  getStateDiff(oldState, newState) {
    if (!oldState || !newState) return null;
    
    try {
      const diff = {};
      const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);
      
      allKeys.forEach(key => {
        if (oldState[key] !== newState[key]) {
          diff[key] = {
            old: oldState[key],
            new: newState[key]
          };
        }
      });
      
      return Object.keys(diff).length > 0 ? diff : null;
    } catch (error) {
      return null;
    }
  }

  // Get all logs
  getLogs(level = null, limit = 100) {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level.toUpperCase());
    }
    
    return filteredLogs.slice(-limit);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    if (this.isDevelopment) {
      localStorage.removeItem('timeslice_logs');
      localStorage.removeItem('timeslice_error_log');
      localStorage.removeItem('timeslice_warn_log');
      localStorage.removeItem('timeslice_info_log');
      localStorage.removeItem('timeslice_debug_log');
    }
  }

  // Export logs as JSON
  exportLogs() {
    const logsData = {
      exportedAt: new Date().toISOString(),
      totalLogs: this.logs.length,
      errorCount: this.errorCount,
      warningCount: this.warningCount,
      sessionId: this.getSessionId(),
      logs: this.logs
    };
    
    const blob = new Blob([JSON.stringify(logsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeslice_logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  // Download specific log file
  downloadLogFile(type = 'all') {
    const logKey = type === 'all' ? 'timeslice_logs' : `timeslice_${type}_log`;
    const logs = localStorage.getItem(logKey) || 'No logs found';
    
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_log_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  // Get performance metrics
  getPerformanceMetrics() {
    if (window.performance) {
      return {
        navigation: window.performance.getEntriesByType('navigation')[0],
        resources: window.performance.getEntriesByType('resource').slice(-10),
        memory: window.performance.memory ? {
          usedJSHeapSize: window.performance.memory.usedJSHeapSize,
          totalJSHeapSize: window.performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit
        } : null,
        marks: Array.from(this.performanceMarks.entries())
      };
    }
    return null;
  }

  // Send logs to external service (placeholder)
  async sendToErrorService(logEntry) {
    // Implement external error logging service here
    // Example: Sentry, LogRocket, etc.
    
    if (process.env.REACT_APP_ERROR_LOGGING_URL) {
      try {
        await fetch(process.env.REACT_APP_ERROR_LOGGING_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry)
        });
      } catch (error) {
        console.warn('Failed to send error log to external service:', error);
      }
    }
  }

  // Get system info for debugging
  getSystemInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      memory: window.performance?.memory,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null
    };
  }

  // Log system info
  logSystemInfo() {
    this.info('System Information', this.getSystemInfo(), { action: 'system_info' });
  }
}

// Create singleton instance
const logger = new Logger();

// Export convenience functions
export const logInfo = (message, data, meta) => logger.info(message, data, meta);
export const logError = (message, data, meta) => logger.error(message, data, meta);
export const logWarn = (message, data, meta) => logger.warn(message, data, meta);
export const logDebug = (message, data, meta) => logger.debug(message, data, meta);
export const logSuccess = (message, data, meta) => logger.success(message, data, meta);
export const logComponent = (component, action, data) => logger.component(component, action, data);
export const logApi = (method, url, status, duration, data) => logger.api(method, url, status, duration, data);
export const logInteraction = (element, action, data) => logger.interaction(element, action, data);
export const logPerformance = (action, startTime) => logger.performance(action, startTime);
export const logRoute = (from, to) => logger.route(from, to);
export const logState = (component, action, oldState, newState) => logger.state(component, action, oldState, newState);

// Export logger instance
export { logger };

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Log initial page load
  window.addEventListener('load', () => {
    logger.info('Page loaded', logger.getPerformanceMetrics(), { action: 'page_load' });
    logger.logSystemInfo();
  });

  // Log unhandled errors
  window.addEventListener('error', (event) => {
    logger.error('Unhandled JavaScript Error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    }, { action: 'unhandled_error' });
  });

  // Log unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', {
      reason: event.reason,
      promise: event.promise
    }, { action: 'unhandled_promise_rejection' });
  });

  // Log visibility changes
  document.addEventListener('visibilitychange', () => {
    logger.debug('Page visibility changed', {
      hidden: document.hidden,
      visibilityState: document.visibilityState
    }, { action: 'visibility_change' });
  });

  // Log network status changes
  window.addEventListener('online', () => {
    logger.info('Network status: Online', null, { action: 'network_online' });
  });
  
  window.addEventListener('offline', () => {
    logger.warn('Network status: Offline', null, { action: 'network_offline' });
  });
}

// Development helper
if (process.env.NODE_ENV === 'development') {
  window.timesliceLogger = logger;
  console.log('🔧 TimeSlice Logger available at window.timesliceLogger');
  console.log('📊 Use logger.exportLogs() to download logs');
  console.log('📄 Use logger.downloadLogFile("error") to download specific log type');
  console.log('🧹 Use logger.clearLogs() to clear logs');
  console.log('⚡ Use logger.getPerformanceMetrics() to see performance data');
  console.log('💻 Use logger.getSystemInfo() to see system information');
}

export default logger;