require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import configurations and middleware
const connectDB = require('./config/database');
const logger = require('./config/logger');
const { requestLogger, customRequestLogger, errorRequestLogger } = require('./middleware/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const slotRoutes = require('./routes/slots');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');
const walletRoutes = require('./routes/wallet');

// Initialize Express app
const app = express();

// Get port from environment or default
const PORT = process.env.PORT || 5000;

// Trust proxy if behind reverse proxy (for rate limiting)
app.set('trust proxy', 1);

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks and development
        return req.url === '/health' || 
               req.url === '/api/health' ||
               process.env.NODE_ENV === 'development';
    }
});

app.use(limiter);

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ 
    limit: '10mb',
    strict: true
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// Request logging middleware
if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger);
    app.use(customRequestLogger);
}

// Health check endpoint
app.get('/health', (req, res) => {
    const healthCheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
    };
    
    res.status(200).json(healthCheck);
});

// API routes
const API_PREFIX = '/api';

// Main API route (THIS WAS MISSING)
app.get(API_PREFIX, (req, res) => {
    res.json({
        success: true,
        message: 'TimeSlice API is running!',
        version: '1.0.0',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        documentation: '/api/docs',
        endpoints: {
            auth: '/api/auth',
            slots: '/api/slots', 
            bookings: '/api/bookings',
            reviews: '/api/reviews',
            wallet: '/api/wallet'
        }
    });
});

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/slots`, slotRoutes);
app.use(`${API_PREFIX}/bookings`, bookingRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/wallet`, walletRoutes);

// API documentation route
app.get(`${API_PREFIX}/docs`, (req, res) => {
    res.json({
        message: 'TimeSlice API Documentation',
        version: '1.0.0',
        endpoints: {
            auth: {
                'POST /api/auth/signup': 'Register new user',
                'POST /api/auth/login': 'Login user',
                'GET /api/auth/me': 'Get current user profile',
                'PUT /api/auth/profile': 'Update user profile',
                'PUT /api/auth/password': 'Change password',
                'DELETE /api/auth/account': 'Deactivate account',
                'GET /api/auth/user/:userId': 'Get user public profile'
            },
            slots: {
                'POST /api/slots': 'Create new slot',
                'GET /api/slots': 'Get available slots',
                'GET /api/slots/my-slots': 'Get user\'s own slots',
                'GET /api/slots/:id': 'Get single slot',
                'PUT /api/slots/:id': 'Update slot',
                'DELETE /api/slots/:id': 'Delete slot'
            },
            bookings: {
                'POST /api/bookings': 'Create new booking',
                'GET /api/bookings': 'Get user bookings',
                'GET /api/bookings/stats': 'Get booking statistics',
                'GET /api/bookings/:id': 'Get single booking',
                'PUT /api/bookings/:id/status': 'Update booking status',
                'PUT /api/bookings/:id/cancel': 'Cancel booking'
            },
            reviews: {
                'POST /api/reviews': 'Submit review',
                'GET /api/reviews/given': 'Get reviews given by user',
                'GET /api/reviews/user/:userId': 'Get reviews for user',
                'GET /api/reviews/stats/:userId': 'Get review statistics',
                'PUT /api/reviews/:bookingId': 'Update review'
            },
            wallet: {
                'GET /api/wallet': 'Get wallet info',
                'GET /api/wallet/transactions': 'Get transaction history',
                'GET /api/wallet/stats': 'Get wallet statistics',
                'GET /api/wallet/pending': 'Get pending transactions'
            }
        }
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'TimeSlice API Server',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        documentation: '/api/docs'
    });
});

// Error logging middleware
app.use(errorRequestLogger);

// 404 handler (must be before error handler)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
    logger.info(`🚀 TimeSlice API Server started successfully!`);
    logger.info(`📡 Server running on port ${PORT}`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 API Base URL: http://localhost:${PORT}/api`);
    logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
    logger.info(`❤️  Health Check: http://localhost:${PORT}/health`);
    
    if (process.env.NODE_ENV === 'development') {
        logger.info(`🔧 Development mode enabled`);
        logger.info(`📝 Logs are saved to: ./logs/`);
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Promise Rejection:', err);
    
    // Close server & exit process
    server.close(() => {
        logger.info('Server closed due to unhandled promise rejection');
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    
    // Close server & exit process
    server.close(() => {
        logger.info('Server closed due to uncaught exception');
        process.exit(1);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Graceful shutdown...');
    
    server.close(() => {
        logger.info('Process terminated');
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received. Graceful shutdown...');
    
    server.close(() => {
        logger.info('Process terminated');
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
});

// Export app for testing
module.exports = app;