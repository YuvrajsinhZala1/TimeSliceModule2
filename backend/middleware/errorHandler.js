const logger = require('../config/logger');

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error details
    logger.error('Error caught by error handler:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        user: req.user ? req.user.username : 'Anonymous',
        body: req.method !== 'GET' ? req.body : undefined
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Invalid resource ID format';
        error = {
            message,
            statusCode: 400
        };
        logger.debug(`CastError handled: ${message}`);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
        error = {
            message,
            statusCode: 400,
            field: field
        };
        logger.debug(`Duplicate key error handled: ${message}`);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => ({
            field: val.path,
            message: val.message,
            value: val.value
        }));
        
        const message = 'Validation failed';
        error = {
            message,
            statusCode: 400,
            errors: errors
        };
        logger.debug(`Validation error handled: ${message}`, errors);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid authentication token';
        error = {
            message,
            statusCode: 401
        };
        logger.debug(`JWT error handled: ${message}`);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Authentication token has expired';
        error = {
            message,
            statusCode: 401
        };
        logger.debug(`Token expired error handled: ${message}`);
    }

    // MongoDB connection errors
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
        const message = 'Database connection error';
        error = {
            message,
            statusCode: 500
        };
        logger.error(`Database connection error handled: ${err.message}`);
    }

    // Rate limiting errors
    if (err.type === 'entity.too.large') {
        const message = 'Request payload too large';
        error = {
            message,
            statusCode: 413
        };
        logger.debug(`Payload too large error handled: ${message}`);
    }

    // Custom application errors
    if (err.isOperational) {
        error = {
            message: err.message,
            statusCode: err.statusCode || 500
        };
        logger.debug(`Operational error handled: ${err.message}`);
    }

    // Default error response
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    // Prepare error response
    const errorResponse = {
        success: false,
        message: message,
        ...(error.field && { field: error.field }),
        ...(error.errors && { errors: error.errors }),
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    };

    // Add stack trace in development mode
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
        errorResponse.details = {
            name: err.name,
            code: err.code,
            ...(err.keyValue && { keyValue: err.keyValue })
        };
    }

    // Send error response
    res.status(statusCode).json(errorResponse);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

// Not Found handler
const notFound = (req, res, next) => {
    const message = `Route ${req.method} ${req.originalUrl} not found`;
    logger.warn(message, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
};

// Validation error formatter
const formatValidationErrors = (errors) => {
    const formatted = {};
    
    errors.forEach(error => {
        if (!formatted[error.param]) {
            formatted[error.param] = [];
        }
        formatted[error.param].push(error.msg);
    });
    
    return formatted;
};

// Database error handler
const handleDatabaseError = (error) => {
    logger.error('Database operation failed:', {
        message: error.message,
        name: error.name,
        code: error.code
    });

    // Return a generic message to avoid exposing database details
    return new AppError('Database operation failed', 500);
};

// Unhandled promise rejection handler
process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Promise Rejection:', {
        message: err.message,
        stack: err.stack,
        promise: promise
    });
    
    // Close server & exit process
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', {
        message: err.message,
        stack: err.stack
    });
    
    // Close server & exit process
    process.exit(1);
});

module.exports = {
    errorHandler,
    asyncHandler,
    AppError,
    notFound,
    formatValidationErrors,
    handleDatabaseError
};