const express = require('express');
const { body } = require('express-validator');
const {
    signup,
    login,
    getMe,
    updateProfile,
    changePassword,
    deactivateAccount,
    getUserProfile
} = require('../controllers/authController');
const { authenticateToken, rateLimitSensitive } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Validation rules
const signupValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one letter and one number'),
    
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio cannot exceed 500 characters'),
    
    body('skills')
        .optional()
        .isArray()
        .withMessage('Skills must be an array')
        .custom((skills) => {
            if (skills && skills.length > 10) {
                throw new Error('Cannot have more than 10 skills');
            }
            return true;
        })
];

const loginValidation = [
    body('identifier')
        .trim()
        .notEmpty()
        .withMessage('Username or email is required'),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

const profileUpdateValidation = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio cannot exceed 500 characters'),
    
    body('skills')
        .optional()
        .isArray()
        .withMessage('Skills must be an array')
        .custom((skills) => {
            if (skills && skills.length > 10) {
                throw new Error('Cannot have more than 10 skills');
            }
            return true;
        })
];

const passwordChangeValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one letter and one number')
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error('New password must be different from current password');
            }
            return true;
        })
];

// Route logging middleware
const logRoute = (routeName) => (req, res, next) => {
    logger.info(`Auth route accessed: ${routeName}`, {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.originalUrl
    });
    next();
};

// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup', 
    logRoute('signup'),
    rateLimitSensitive(),
    signupValidation,
    signup
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', 
    logRoute('login'),
    rateLimitSensitive(),
    loginValidation,
    login
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', 
    logRoute('getMe'),
    authenticateToken,
    getMe
);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', 
    logRoute('updateProfile'),
    authenticateToken,
    profileUpdateValidation,
    updateProfile
);

// @route   PUT /api/auth/password
// @desc    Change user password
// @access  Private
router.put('/password', 
    logRoute('changePassword'),
    authenticateToken,
    rateLimitSensitive(),
    passwordChangeValidation,
    changePassword
);

// @route   DELETE /api/auth/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account', 
    logRoute('deactivateAccount'),
    authenticateToken,
    rateLimitSensitive(),
    deactivateAccount
);

// @route   GET /api/auth/user/:userId
// @desc    Get user public profile
// @access  Public
router.get('/user/:userId', 
    logRoute('getUserProfile'),
    getUserProfile
);

// Error handling for auth routes
router.use((error, req, res, next) => {
    logger.error('Auth route error:', {
        error: error.message,
        stack: error.stack,
        route: req.originalUrl,
        method: req.method,
        user: req.user ? req.user.username : 'Anonymous'
    });
    next(error);
});

module.exports = router;