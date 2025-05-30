const morgan = require('morgan');
const logger = require('../config/logger');

// Custom token for user information
morgan.token('user', (req) => {
    return req.user ? req.user.username : 'Anonymous';
});

// Custom token for user ID
morgan.token('userId', (req) => {
    return req.user ? req.user._id : 'N/A';
});

// Custom token for request body (sanitized)
morgan.token('body', (req) => {
    if (req.method === 'GET') return '';
    
    // Sanitize sensitive information
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.passwordHash) sanitizedBody.passwordHash = '[REDACTED]';
    if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
    
    return JSON.stringify(sanitizedBody);
});

// Development format with colors and detailed info
const developmentFormat = morgan((tokens, req, res) => {
    const status = tokens.status(req, res);
    const statusColor = 
        status >= 500 ? '\x1b[31m' : // Red for 5xx
        status >= 400 ? '\x1b[33m' : // Yellow for 4xx
        status >= 300 ? '\x1b[36m' : // Cyan for 3xx
        '\x1b[32m'; // Green for 2xx
    
    const method = tokens.method(req, res);
    const methodColor = 
        method === 'GET' ? '\x1b[32m' :    // Green
        method === 'POST' ? '\x1b[33m' :   // Yellow
        method === 'PUT' ? '\x1b[34m' :    // Blue
        method === 'DELETE' ? '\x1b[31m' : // Red
        '\x1b[35m'; // Magenta for others
    
    return [
        '\x1b[90m' + tokens.date(req, res, 'clf') + '\x1b[0m', // Gray timestamp
        methodColor + method + '\x1b[0m', // Colored method
        tokens.url(req, res),
        statusColor + status + '\x1b[0m', // Colored status
        tokens['response-time'](req, res) + 'ms',
        'User:', tokens.user(req, res),
        tokens.body(req, res) ? 'Body: ' + tokens.body(req, res) : ''
    ].filter(Boolean).join(' ');
});

// Production format (structured JSON logging)
const productionFormat = morgan((tokens, req, res) => {
    const logData = {
        timestamp: tokens.date(req, res, 'iso'),
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: parseInt(tokens.status(req, res)),
        responseTime: parseFloat(tokens['response-time'](req, res)),
        contentLength: tokens.res(req, res, 'content-length'),
        userAgent: tokens['user-agent'](req, res),
        ip: tokens['remote-addr'](req, res),
        user: tokens.user(req, res),
        userId: tokens.userId(req, res),
        referrer: tokens.referrer(req, res)
    };
    
    // Add request body for non-GET requests (sanitized)
    if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
        const sanitizedBody = { ...req.body };
        if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
        if (sanitizedBody.passwordHash) sanitizedBody.passwordHash = '[REDACTED]';
        logData.requestBody = sanitizedBody;
    }
    
    return JSON.stringify(logData);
});

// Skip logging for health check endpoints
const skipHealthCheck = (req, res) => {
    return req.url === '/health' || req.url === '/api/health';
};

// Skip logging for static assets in production
const skipStatic = (req, res) => {
    return req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/);
};

// Combined skip function
const shouldSkipLogging = (req, res) => {
    return skipHealthCheck(req, res) || 
           (process.env.NODE_ENV === 'production' && skipStatic(req, res));
};

// Create morgan middleware based on environment
const requestLogger = process.env.NODE_ENV === 'production' 
    ? morgan(productionFormat, { 
        stream: { write: (message) => logger.info(message.trim()) },
        skip: shouldSkipLogging
      })
    : morgan(developmentFormat, {
        skip: shouldSkipLogging
      });

// Custom request/response logging middleware
const customRequestLogger = (req, res, next) => {
    // Log request start
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    req.requestId = requestId;
    
    logger.info(`Request started: ${req.method} ${req.originalUrl}`, {
        requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        user: req.user ? req.user.username : 'Anonymous',
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length')
    });
    
    // Override res.json to log response
    const originalJson = res.json;
    res.json = function(data) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        logger.info(`Request completed: ${req.method} ${req.originalUrl}`, {
            requestId,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            user: req.user ? req.user.username : 'Anonymous',
            responseSize: JSON.stringify(data).length
        });
        
        return originalJson.call(this, data);
    };
    
    next();
};

// Error request logger
const errorRequestLogger = (err, req, res, next) => {
    logger.error(`Request error: ${req.method} ${req.originalUrl}`, {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        error: err.message,
        stack: err.stack,
        user: req.user ? req.user.username : 'Anonymous',
        body: req.method !== 'GET' ? req.body : undefined
    });
    
    next(err);
};

module.exports = {
    requestLogger,
    customRequestLogger,
    errorRequestLogger
};