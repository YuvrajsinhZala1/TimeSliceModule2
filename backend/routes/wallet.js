const express = require('express');
const { query } = require('express-validator');
const {
    getWallet,
    getTransactions,
    getWalletStats,
    getPendingTransactions
} = require('../controllers/walletController');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Validation rules
const walletQueryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
];

const transactionsQueryValidation = [
    query('type')
        .optional()
        .isIn(['spent', 'earned'])
        .withMessage('Transaction type must be either spent or earned'),
    
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
];

const statsQueryValidation = [
    query('period')
        .optional()
        .isIn(['7d', '30d', '90d', '1y'])
        .withMessage('Period must be one of: 7d, 30d, 90d, 1y')
];

// Route logging middleware
const logRoute = (routeName) => (req, res, next) => {
    logger.info(`Wallet route accessed: ${routeName}`, {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.originalUrl,
        user: req.user ? req.user.username : 'Anonymous'
    });
    next();
};

// @route   GET /api/wallet
// @desc    Get user wallet balance and recent transactions
// @access  Private
router.get('/', 
    logRoute('getWallet'),
    authenticateToken,
    walletQueryValidation,
    getWallet
);

// @route   GET /api/wallet/transactions
// @desc    Get wallet transaction history
// @access  Private
router.get('/transactions', 
    logRoute('getTransactions'),
    authenticateToken,
    transactionsQueryValidation,
    getTransactions
);

// @route   GET /api/wallet/stats
// @desc    Get wallet statistics
// @access  Private
router.get('/stats', 
    logRoute('getWalletStats'),
    authenticateToken,
    statsQueryValidation,
    getWalletStats
);

// @route   GET /api/wallet/pending
// @desc    Get pending transactions
// @access  Private
router.get('/pending', 
    logRoute('getPendingTransactions'),
    authenticateToken,
    getPendingTransactions
);

// Error handling for wallet routes
router.use((error, req, res, next) => {
    logger.error('Wallet route error:', {
        error: error.message,
        stack: error.stack,
        route: req.originalUrl,
        method: req.method,
        user: req.user ? req.user.username : 'Anonymous'
    });
    next(error);
});

module.exports = router;