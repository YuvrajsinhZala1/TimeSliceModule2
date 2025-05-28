const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        logger.debug('Authenticating token...');
        
        // Get token from header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            logger.warn('No token provided in request');
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        logger.debug('Token found, verifying...');

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.debug(`Token verified for user ID: ${decoded.userId}`);

        // Get user from database
        const user = await User.findById(decoded.userId).select('-passwordHash');
        
        if (!user) {
            logger.warn(`User not found for ID: ${decoded.userId}`);
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.isActive) {
            logger.warn(`Inactive user attempted access: ${user.username}`);
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Attach user to request object
        req.user = user;
        req.userId = user._id;
        
        logger.debug(`User authenticated successfully: ${user.username}`);
        next();

    } catch (error) {
        logger.error('Token authentication error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Middleware to optionally authenticate token (for routes that can work with or without auth)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            logger.debug('No token provided, continuing without auth');
            return next();
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.userId).select('-passwordHash');
        
        if (user && user.isActive) {
            req.user = user;
            req.userId = user._id;
            logger.debug(`Optional auth successful for user: ${user.username}`);
        }

        next();
    } catch (error) {
        logger.debug('Optional auth failed, continuing without auth:', error.message);
        next(); // Continue even if optional auth fails
    }
};

// Middleware to check if user owns the resource
const checkOwnership = (resourceField = 'userId') => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params.id;
            const userId = req.userId;

            logger.debug(`Checking ownership for resource: ${resourceId}, user: ${userId}`);

            // The actual ownership check depends on the resource type
            // This is a generic version that can be customized
            if (req.body[resourceField] && req.body[resourceField].toString() !== userId.toString()) {
                logger.warn(`Ownership check failed for user: ${userId}, resource: ${resourceId}`);
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only modify your own resources'
                });
            }

            next();
        } catch (error) {
            logger.error('Ownership check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authorization error'
            });
        }
    };
};

// Middleware to check user role (if implementing roles in the future)
const checkRole = (roles = []) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // For now, all users have the same role
            // This can be expanded when implementing admin/moderator roles
            const userRole = req.user.role || 'user';
            
            if (!roles.includes(userRole)) {
                logger.warn(`Role check failed for user: ${req.user.username}, required: ${roles}, has: ${userRole}`);
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions'
                });
            }

            next();
        } catch (error) {
            logger.error('Role check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authorization error'
            });
        }
    };
};

// Middleware to validate user credits before booking
const validateCredits = (requiredCredits) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            const credits = requiredCredits || req.body.cost || 0;

            logger.debug(`Validating credits for user: ${user.username}, required: ${credits}, available: ${user.credits}`);

            if (user.credits < credits) {
                logger.warn(`Insufficient credits for user: ${user.username}, required: ${credits}, available: ${user.credits}`);
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient credits',
                    details: {
                        required: credits,
                        available: user.credits,
                        needed: credits - user.credits
                    }
                });
            }

            next();
        } catch (error) {
            logger.error('Credits validation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Credits validation error'
            });
        }
    };
};

// Middleware to rate limit sensitive operations
const rateLimitSensitive = () => {
    const attempts = new Map();
    const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    const MAX_ATTEMPTS = 5;

    return (req, res, next) => {
        const key = req.ip + ':' + (req.user ? req.user._id : 'anonymous');
        const now = Date.now();
        
        // Clean old entries
        const userAttempts = attempts.get(key) || [];
        const recentAttempts = userAttempts.filter(time => now - time < WINDOW_MS);
        
        if (recentAttempts.length >= MAX_ATTEMPTS) {
            logger.warn(`Rate limit exceeded for: ${key}`);
            return res.status(429).json({
                success: false,
                message: 'Too many attempts. Please try again later.',
                retryAfter: Math.ceil(WINDOW_MS / 1000)
            });
        }
        
        recentAttempts.push(now);
        attempts.set(key, recentAttempts);
        
        next();
    };
};

// Generate JWT token
const generateToken = (userId) => {
    try {
        const payload = {
            userId: userId,
            iat: Math.floor(Date.now() / 1000)
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '7d'
        });

        logger.debug(`Token generated for user ID: ${userId}`);
        return token;
    } catch (error) {
        logger.error('Token generation error:', error);
        throw error;
    }
};

// Verify token without middleware (for utility purposes)
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        logger.error('Token verification error:', error);
        throw error;
    }
};

module.exports = {
    authenticateToken,
    optionalAuth,
    checkOwnership,
    checkRole,
    validateCredits,
    rateLimitSensitive,
    generateToken,
    verifyToken
};