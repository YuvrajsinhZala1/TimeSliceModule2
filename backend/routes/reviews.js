const express = require('express');
const { body, param, query } = require('express-validator');
const {
    submitReview,
    getUserReviews,
    getGivenReviews,
    getReviewStats,
    updateReview
} = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Validation rules
const reviewValidation = [
    body('bookingId')
        .isMongoId()
        .withMessage('Invalid booking ID'),
    
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Comment cannot exceed 500 characters'),
    
    body('reviewerType')
        .optional()
        .isIn(['student', 'mentor'])
        .withMessage('Reviewer type must be either student or mentor')
];

const updateReviewValidation = [
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Comment cannot exceed 500 characters'),
    
    body('reviewerType')
        .optional()
        .isIn(['student', 'mentor'])
        .withMessage('Reviewer type must be either student or mentor')
];

const userIdValidation = [
    param('userId')
        .isMongoId()
        .withMessage('Invalid user ID')
];

const bookingIdValidation = [
    param('bookingId')
        .isMongoId()
        .withMessage('Invalid booking ID')
];

const reviewsQueryValidation = [
    query('role')
        .optional()
        .isIn(['mentor', 'student'])
        .withMessage('Role must be either mentor or student'),
    
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
];

// Route logging middleware
const logRoute = (routeName) => (req, res, next) => {
    logger.info(`Reviews route accessed: ${routeName}`, {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.originalUrl,
        user: req.user ? req.user.username : 'Anonymous'
    });
    next();
};

// @route   POST /api/reviews
// @desc    Submit review for a booking
// @access  Private
router.post('/', 
    logRoute('submitReview'),
    authenticateToken,
    reviewValidation,
    submitReview
);

// @route   GET /api/reviews/given
// @desc    Get reviews given by current user
// @access  Private
router.get('/given', 
    logRoute('getGivenReviews'),
    authenticateToken,
    reviewsQueryValidation,
    getGivenReviews
);

// @route   GET /api/reviews/user/:userId
// @desc    Get reviews for a specific user
// @access  Public
router.get('/user/:userId', 
    logRoute('getUserReviews'),
    userIdValidation,
    reviewsQueryValidation,
    getUserReviews
);

// @route   GET /api/reviews/stats/:userId
// @desc    Get review statistics for a user
// @access  Public
router.get('/stats/:userId', 
    logRoute('getReviewStats'),
    userIdValidation,
    getReviewStats
);

// @route   PUT /api/reviews/:bookingId
// @desc    Update a review
// @access  Private
router.put('/:bookingId', 
    logRoute('updateReview'),
    authenticateToken,
    bookingIdValidation,
    updateReviewValidation,
    updateReview
);

// Error handling for review routes
router.use((error, req, res, next) => {
    logger.error('Reviews route error:', {
        error: error.message,
        stack: error.stack,
        route: req.originalUrl,
        method: req.method,
        user: req.user ? req.user.username : 'Anonymous'
    });
    next(error);
});

module.exports = router;