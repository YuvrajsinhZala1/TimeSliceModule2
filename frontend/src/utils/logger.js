// Logger utility for frontend debugging and monitoring
class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logs = [];
    this.maxLogs = 1000; // Maximum number of logs to keep in memory
    
    // Initialize log file if in development
    if (this.isDevelopment) {
      this.initializeLogStore();
    }
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

  // Create log entry
  createLogEntry(level, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId()
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

    return entry;
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
  info(message, data = null) {
    const entry = this.createLogEntry('info', message, data);
    
    if (this.isDevelopment) {
      console.log(`[INFO] ${entry.timestamp} - ${message}`, data || '');
    }
    
    return entry;
  }

  // Error level logging
  error(message, data = null) {
    const entry = this.createLogEntry('error', message, data);
    
    console.error(`[ERROR] ${entry.timestamp} - ${message}`, data || '');
    
    // You could send error logs to external service here
    // this.sendToErrorService(entry);
    
    return entry;
  }

  // Warning level logging
  warn(message, data = null) {
    const entry = this.createLogEntry('warn', message, data);
    
    if (this.isDevelopment) {
      console.warn(`[WARN] ${entry.timestamp} - ${message}`, data || '');
    }
    
    return entry;
  }

  // Debug level logging (only in development)
  debug(message, data = null) {
    if (!this.isDevelopment) return;
    
    const entry = this.createLogEntry('debug', message, data);
    console.log(`[DEBUG] ${entry.timestamp} - ${message}`, data || '');
    
    return entry;
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
    }
  }

  // Export logs as JSON
  exportLogs() {
    const logsData = {
      exportedAt: new Date().toISOString(),
      totalLogs: this.logs.length,
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
        } : null
      };
    }
    return null;
  }

  // Log performance metrics
  logPerformance(action, startTime = null) {
    if (!startTime) {
      startTime = performance.now();
      return startTime;
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.info(`Performance: ${action}`, {
      duration: `${duration.toFixed(2)}ms`,
      startTime,
      endTime
    });
    
    return duration;
  }

  // Log user interaction
  logInteraction(element, action, data = null) {
    this.debug(`User Interaction: ${action}`, {
      element: element.tagName || element.constructor.name,
      action,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Log network request
  logRequest(method, url, status, duration = null) {
    const level = status >= 400 ? 'error' : 'debug';
    this[level](`Network: ${method} ${url}`, {
      method,
      url,
      status,
      duration: duration ? `${duration}ms` : null
    });
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
}

// Create singleton instance
const logger = new Logger();

// Export convenience functions
export const logInfo = (message, data) => logger.info(message, data);
export const logError = (message, data) => logger.error(message, data);
export const logWarn = (message, data) => logger.warn(message, data);
export const logDebug = (message, data) => logger.debug(message, data);
export const logPerformance = (action, startTime) => logger.logPerformance(action, startTime);
export const logInteraction = (element, action, data) => logger.logInteraction(element, action, data);
export const logRequest = (method, url, status, duration) => logger.logRequest(method, url, status, duration);

// Export logger instance
export default logger;

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Log initial page load
  window.addEventListener('load', () => {
    logger.info('Page loaded', logger.getPerformanceMetrics());
  });

  // Log unhandled errors
  window.addEventListener('error', (event) => {
    logger.error('Unhandled JavaScript Error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });

  // Log unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', {
      reason: event.reason,
      promise: event.promise
    });
  });

  // Log visibility changes
  document.addEventListener('visibilitychange', () => {
    logger.debug('Page visibility changed', {
      hidden: document.hidden,
      visibilityState: document.visibilityState
    });
  });
}

// Development helper
if (process.env.NODE_ENV === 'development') {
  window.timesliceLogger = logger;
  console.log('🔧 TimeSlice Logger available at window.timesliceLogger');
  console.log('📊 Use logger.exportLogs() to download logs');
  console.log('🧹 Use logger.clearLogs() to clear logs');
}