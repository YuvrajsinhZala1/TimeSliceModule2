require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

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

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('📁 Created logs directory');
}

// Initialize Express app
const app = express();

// Get port from environment or default
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting TimeSlice Backend Server...');
console.log('📋 Environment Variables Check:');
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'Not Set'}`);
console.log(`   - PORT: ${PORT}`);
console.log(`   - MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'NOT SET'}`);
console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'NOT SET'}`);
console.log(`   - FRONTEND_URL: ${process.env.FRONTEND_URL || 'Not Set'}`);

// Check for required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(varName => {
        console.error(`   - ${varName}`);
    });
    console.error('Please check your .env file');
    process.exit(1);
}

// Trust proxy if behind reverse proxy (for rate limiting)
app.set('trust proxy', 1);

// Connect to database with enhanced error handling
connectDB().catch(error => {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
});

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

// Enhanced CORS configuration with debugging
const corsOptions = {
    origin: function (origin, callback) {
        console.log(`🌐 CORS Request from origin: ${origin || 'No Origin'}`);
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('✅ CORS: Allowing request with no origin');
            return callback(null, true);
        }
        
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:3001', // In case frontend runs on different port
        ];
        
        console.log('🔍 CORS: Checking against allowed origins:', allowedOrigins);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log('✅ CORS: Origin allowed');
            callback(null, true);
        } else {
            console.log('❌ CORS: Origin blocked');
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

// Rate limiting with debugging
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
    onLimitReached: (req, res, options) => {
        console.log(`🚫 Rate limit exceeded for IP: ${req.ip}`);
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    },
    skip: (req) => {
        // Skip rate limiting for health checks and development
        return req.url === '/health' || 
               req.url === '/api/health' ||
               process.env.NODE_ENV === 'development';
    }
});

app.use(limiter);

// Body parsing middleware with debugging
app.use(express.json({ 
    limit: '10mb',
    strict: true,
    verify: (req, res, buf) => {
        if (buf.length > 0) {
            console.log(`📦 Received JSON body: ${buf.length} bytes`);
        }
    }
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

// Enhanced health check endpoint
app.get('/health', (req, res) => {
    const healthCheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
    };
    
    console.log('💊 Health check requested:', healthCheck);
    res.status(200).json(healthCheck);
});

// API routes with debugging
const API_PREFIX = '/api';

// Debug middleware to log all API requests
app.use(API_PREFIX, (req, res, next) => {
    console.log(`🔗 API Request: ${req.method} ${req.originalUrl}`);
    console.log(`📧 Headers:`, {
        'content-type': req.get('Content-Type'),
        'authorization': req.get('Authorization') ? 'Bearer ***' : 'None',
        'user-agent': req.get('User-Agent')
    });
    if (req.body && Object.keys(req.body).length > 0) {
        const logBody = { ...req.body };
        if (logBody.password) logBody.password = '***';
        if (logBody.passwordHash) logBody.passwordHash = '***';
        console.log(`📦 Body:`, logBody);
    }
    next();
});

// Main API route
app.get(API_PREFIX, (req, res) => {
    const apiInfo = {
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
    };
    
    console.log('📋 API Info requested:', apiInfo);
    res.json(apiInfo);
});

// Route mounting with logging
console.log('🛣️  Mounting API routes...');
app.use(`${API_PREFIX}/auth`, authRoutes);
console.log('   ✅ Auth routes mounted');
app.use(`${API_PREFIX}/slots`, slotRoutes);
console.log('   ✅ Slots routes mounted');
app.use(`${API_PREFIX}/bookings`, bookingRoutes);
console.log('   ✅ Bookings routes mounted');
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
console.log('   ✅ Reviews routes mounted');
app.use(`${API_PREFIX}/wallet`, walletRoutes);
console.log('   ✅ Wallet routes mounted');

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
    const rootInfo = {
        message: 'TimeSlice API Server',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        documentation: '/api/docs'
    };
    
    console.log('🏠 Root route accessed:', rootInfo);
    res.json(rootInfo);
});

// Error logging middleware
app.use(errorRequestLogger);

// 404 handler (must be before error handler)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// Start server with enhanced logging
const server = app.listen(PORT, () => {
    console.log('\n🎉 ===================================');
    console.log('🚀 TimeSlice API Server started successfully!');
    console.log('🎉 ===================================');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
    console.log(`📝 Logs directory: ${logsDir}`);
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Development mode enabled`);
        console.log(`📊 Debug logging active`);
        console.log(`🔍 CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    }
    
    console.log('🎉 ===================================\n');
    
    logger.info(`🚀 TimeSlice API Server started successfully!`);
    logger.info(`📡 Server running on port ${PORT}`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Enhanced error handling
process.on('unhandledRejection', (err, promise) => {
    console.error('💥 Unhandled Promise Rejection:', err);
    logger.error('Unhandled Promise Rejection:', err);
    
    // Close server & exit process
    server.close(() => {
        console.log('🛑 Server closed due to unhandled promise rejection');
        logger.info('Server closed due to unhandled promise rejection');
        process.exit(1);
    });
});

process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    logger.error('Uncaught Exception:', err);
    
    // Close server & exit process
    server.close(() => {
        console.log('🛑 Server closed due to uncaught exception');
        logger.info('Server closed due to uncaught exception');
        process.exit(1);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received. Graceful shutdown...');
    logger.info('SIGTERM received. Graceful shutdown...');
    
    server.close(() => {
        console.log('🛑 Process terminated');
        logger.info('Process terminated');
        mongoose.connection.close(false, () => {
            console.log('🔌 MongoDB connection closed');
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('\n🔄 SIGINT received. Graceful shutdown...');
    logger.info('SIGINT received. Graceful shutdown...');
    
    server.close(() => {
        console.log('🛑 Process terminated');
        logger.info('Process terminated');
        mongoose.connection.close(false, () => {
            console.log('🔌 MongoDB connection closed');
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
});

// Export app for testing
module.exports = app;