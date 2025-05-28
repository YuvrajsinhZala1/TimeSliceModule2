const express = require('express');
const { body, param, query } = require('express-validator');
const {
    createSlot,
    getSlots,
    getSlot,
    updateSlot,
    deleteSlot,
    getMySlots
} = require('../controllers/slotController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Validation rules
const slotValidation = [
    body('title')
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),
    
    body('description')
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Description must be between 10 and 500 characters'),
    
    body('dateTime')
        .isISO8601()
        .withMessage('Please provide a valid date and time')
        .custom((value) => {
            const slotDate = new Date(value);
            const now = new Date();
            const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
            
            if (slotDate <= oneHourFromNow) {
                throw new Error('Slot must be scheduled at least 1 hour in advance');
            }
            
            const sixMonthsFromNow = new Date();
            sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
            
            if (slotDate > sixMonthsFromNow) {
                throw new Error('Slot cannot be scheduled more than 6 months in advance');
            }
            
            return true;
        }),
    
    body('duration')
        .isIn([30, 60])
        .withMessage('Duration must be either 30 or 60 minutes'),
    
    body('category')
        .isIn([
            'Programming', 'Design', 'Marketing', 'Business', 
            'Writing', 'Consulting', 'Teaching', 'Mentoring',
            'Career Advice', 'Code Review', 'Other'
        ])
        .withMessage('Invalid category'),
    
    body('cost')
        .isInt({ min: 1, max: 20 })
        .withMessage('Cost must be between 1 and 20 credits'),
    
    body('skills')
        .optional()
        .isArray()
        .withMessage('Skills must be an array')
        .custom((skills) => {
            if (skills && skills.some(skill => typeof skill !== 'string' || skill.trim().length === 0)) {
                throw new Error('All skills must be non-empty strings');
            }
            if (skills && skills.length > 5) {
                throw new Error('Cannot have more than 5 skills per slot');
            }
            return true;
        }),
    
    body('meetingPlatform')
        .optional()
        .isIn(['Zoom', 'Google Meet', 'Microsoft Teams', 'Discord', 'Other'])
        .withMessage('Invalid meeting platform'),
    
    body('maxParticipants')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Max participants must be between 1 and 5'),
    
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array')
        .custom((tags) => {
            if (tags && tags.length > 10) {
                throw new Error('Cannot have more than 10 tags');
            }
            return true;
        })
];

const slotUpdateValidation = [
    ...slotValidation.map(validation => validation.optional()),
    body('dateTime')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date and time')
        .custom((value) => {
            if (value) {
                const slotDate = new Date(value);
                const now = new Date();
                const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
                
                if (slotDate <= oneHourFromNow) {
                    throw new Error('Slot must be scheduled at least 1 hour in advance');
                }
            }
            return true;
        })
];

const slotIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid slot ID')
];

const slotsQueryValidation = [
    query('category')
        .optional()
        .isIn([
            'Programming', 'Design', 'Marketing', 'Business', 
            'Writing', 'Consulting', 'Teaching', 'Mentoring',
            'Career Advice', 'Code Review', 'Other'
        ])
        .withMessage('Invalid category'),
    
    query('duration')
        .optional()
        .isIn(['30', '60'])
        .withMessage('Duration must be either 30 or 60'),
    
    query('minCost')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Minimum cost must be at least 1'),
    
    query('maxCost')
        .optional()
        .isInt({ max: 20 })
        .withMessage('Maximum cost cannot exceed 20'),
    
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),
    
    query('sortBy')
        .optional()
        .isIn(['dateTime', 'cost', 'createdAt', 'rating'])
        .withMessage('Invalid sort field'),
    
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc')
];

// Route logging middleware
const logRoute = (routeName) => (req, res, next) => {
    logger.info(`Slots route accessed: ${routeName}`, {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.originalUrl,
        user: req.user ? req.user.username : 'Anonymous'
    });
    next();
};

// @route   POST /api/slots
// @desc    Create new slot
// @access  Private
router.post('/', 
    logRoute('createSlot'),
    authenticateToken,
    slotValidation,
    createSlot
);

// @route   GET /api/slots
// @desc    Get all available slots with filtering
// @access  Public (with optional auth)
router.get('/', 
    logRoute('getSlots'),
    optionalAuth,
    slotsQueryValidation,
    getSlots
);

// @route   GET /api/slots/my-slots
// @desc    Get user's own slots
// @access  Private
router.get('/my-slots', 
    logRoute('getMySlots'),
    authenticateToken,
    getMySlots
);

// @route   GET /api/slots/:id
// @desc    Get single slot
// @access  Public
router.get('/:id', 
    logRoute('getSlot'),
    slotIdValidation,
    getSlot
);

// @route   PUT /api/slots/:id
// @desc    Update slot
// @access  Private
router.put('/:id', 
    logRoute('updateSlot'),
    authenticateToken,
    slotIdValidation,
    slotUpdateValidation,
    updateSlot
);

// @route   DELETE /api/slots/:id
// @desc    Delete slot
// @access  Private
router.delete('/:id', 
    logRoute('deleteSlot'),
    authenticateToken,
    slotIdValidation,
    deleteSlot
);

// Error handling for slot routes
router.use((error, req, res, next) => {
    logger.error('Slots route error:', {
        error: error.message,
        stack: error.stack,
        route: req.originalUrl,
        method: req.method,
        user: req.user ? req.user.username : 'Anonymous'
    });
    next(error);
});

module.exports = router;