const express = require('express');
const { body, param, query } = require('express-validator');
const {
    createBooking,
    getBookings,
    getBooking,
    updateBookingStatus,
    cancelBooking,
    getBookingStats
} = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Validation rules
const bookingValidation = [
    body('slotId')
        .isMongoId()
        .withMessage('Invalid slot ID'),
    
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes cannot exceed 500 characters')
];

const bookingStatusValidation = [
    body('status')
        .isIn(['confirmed', 'completed', 'cancelled'])
        .withMessage('Invalid booking status'),
    
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Reason cannot exceed 200 characters')
];

const cancelBookingValidation = [
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Cancellation reason cannot exceed 200 characters')
];

const bookingIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid booking ID')
];

const bookingsQueryValidation = [
    query('role')
        .optional()
        .isIn(['student', 'mentor'])
        .withMessage('Role must be either student or mentor'),
    
    query('status')
        .optional()
        .isIn(['pending', 'confirmed', 'completed', 'cancelled', 'no-show'])
        .withMessage('Invalid status filter'),
    
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
    logger.info(`Bookings route accessed: ${routeName}`, {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.originalUrl,
        user: req.user ? req.user.username : 'Anonymous'
    });
    next();
};

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Private
router.post('/', 
    logRoute('createBooking'),
    authenticateToken,
    bookingValidation,
    createBooking
);

// @route   GET /api/bookings
// @desc    Get user bookings
// @access  Private
router.get('/', 
    logRoute('getBookings'),
    authenticateToken,
    bookingsQueryValidation,
    getBookings
);

// @route   GET /api/bookings/stats
// @desc    Get booking statistics
// @access  Private
router.get('/stats', 
    logRoute('getBookingStats'),
    authenticateToken,
    getBookingStats
);

// @route   GET /api/bookings/:id
// @desc    Get single booking
// @access  Private
router.get('/:id', 
    logRoute('getBooking'),
    authenticateToken,
    bookingIdValidation,
    getBooking
);

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.put('/:id/status', 
    logRoute('updateBookingStatus'),
    authenticateToken,
    bookingIdValidation,
    bookingStatusValidation,
    updateBookingStatus
);

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private
router.put('/:id/cancel', 
    logRoute('cancelBooking'),
    authenticateToken,
    bookingIdValidation,
    cancelBookingValidation,
    cancelBooking
);

// Error handling for booking routes
router.use((error, req, res, next) => {
    logger.error('Bookings route error:', {
        error: error.message,
        stack: error.stack,
        route: req.originalUrl,
        method: req.method,
        user: req.user ? req.user.username : 'Anonymous'
    });
    next(error);
});

module.exports = router;