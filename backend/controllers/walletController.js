const User = require('../models/User');
const Booking = require('../models/Booking');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// @desc    Get user wallet balance and transaction history
// @route   GET /api/wallet
// @access  Private
const getWallet = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    logger.debug(`Getting wallet info for user: ${req.user.username}`);

    try {
        // Get current user with updated balance
        const user = await User.findById(userId).select('username credits rating');

        // Get transaction history from bookings
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [sentTransactions, receivedTransactions, totalSent, totalReceived] = await Promise.all([
            // Credits spent (as student)
            Booking.find({ 
                bookedBy: userId,
                status: { $in: ['pending', 'confirmed', 'completed', 'cancelled'] }
            })
            .populate('bookedFrom', 'username profileImage')
            .populate('slotId', 'title category dateTime')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),

            // Credits earned (as mentor)
            Booking.find({ 
                bookedFrom: userId,
                status: 'completed'
            })
            .populate('bookedBy', 'username profileImage')
            .populate('slotId', 'title category dateTime')
            .sort({ completedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),

            // Total credits spent
            Booking.aggregate([
                { 
                    $match: { 
                        bookedBy: userId,
                        status: { $in: ['pending', 'confirmed', 'completed'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$cost' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Total credits earned
            Booking.aggregate([
                { 
                    $match: { 
                        bookedFrom: userId,
                        status: 'completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$cost' },
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        // Format transactions
        const formattedSentTransactions = sentTransactions.map(booking => ({
            _id: booking._id,
            type: 'spent',
            amount: -booking.cost, // Negative for spent
            description: `Booked: ${booking.slotId.title}`,
            status: booking.status,
            date: booking.createdAt,
            relatedUser: {
                _id: booking.bookedFrom._id,
                username: booking.bookedFrom.username,
                profileImage: booking.bookedFrom.profileImage
            },
            slot: {
                title: booking.slotId.title,
                category: booking.slotId.category,
                dateTime: booking.slotId.dateTime
            }
        }));

        const formattedReceivedTransactions = receivedTransactions.map(booking => ({
            _id: booking._id,
            type: 'earned',
            amount: +booking.cost, // Positive for earned
            description: `Session completed: ${booking.slotId.title}`,
            status: booking.status,
            date: booking.completedAt,
            relatedUser: {
                _id: booking.bookedBy._id,
                username: booking.bookedBy.username,
                profileImage: booking.bookedBy.profileImage
            },
            slot: {
                title: booking.slotId.title,
                category: booking.slotId.category,
                dateTime: booking.slotId.dateTime
            }
        }));

        // Combine and sort transactions
        const allTransactions = [...formattedSentTransactions, ...formattedReceivedTransactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, parseInt(limit));

        // Calculate totals
        const totalSpent = totalSent.length > 0 ? totalSent[0].total : 0;
        const totalEarned = totalReceived.length > 0 ? totalReceived[0].total : 0;
        const sessionsSent = totalSent.length > 0 ? totalSent[0].count : 0;
        const sessionsReceived = totalReceived.length > 0 ? totalReceived[0].count : 0;

        res.json({
            success: true,
            message: 'Wallet information retrieved successfully',
            data: {
                balance: user.credits,
                user: {
                    _id: user._id,
                    username: user.username,
                    rating: user.rating
                },
                summary: {
                    totalSpent,
                    totalEarned,
                    sessionsAsStudent: sessionsSent,
                    sessionsAsMentor: sessionsReceived,
                    netBalance: totalEarned - totalSpent + 10 // Including initial credits
                },
                transactions: allTransactions,
                pagination: {
                    currentPage: parseInt(page),
                    limit: parseInt(limit),
                    total: sentTransactions.length + receivedTransactions.length
                }
            }
        });

    } catch (error) {
        logger.error('Get wallet error:', error);
        throw error;
    }
});

// @desc    Get wallet transaction history only
// @route   GET /api/wallet/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { type, page = 1, limit = 20 } = req.query;

    logger.debug(`Getting transaction history for user: ${req.user.username}, type: ${type || 'all'}`);

    try {
        const skip = (parseInt(page) - 1) * parseInt(limit);
        let transactions = [];

        if (type === 'spent' || !type) {
            // Get spending transactions
            const spentBookings = await Booking.find({ 
                bookedBy: userId,
                status: { $in: ['pending', 'confirmed', 'completed', 'cancelled'] }
            })
            .populate('bookedFrom', 'username profileImage')
            .populate('slotId', 'title category dateTime')
            .sort({ createdAt: -1 });

            const spentTransactions = spentBookings.map(booking => ({
                _id: booking._id,
                type: 'spent',
                amount: -booking.cost,
                description: `Booked: ${booking.slotId.title}`,
                status: booking.status,
                date: booking.createdAt,
                relatedUser: booking.bookedFrom,
                slot: booking.slotId,
                refunded: booking.status === 'cancelled'
            }));

            transactions = [...transactions, ...spentTransactions];
        }

        if (type === 'earned' || !type) {
            // Get earning transactions
            const earnedBookings = await Booking.find({ 
                bookedFrom: userId,
                status: 'completed'
            })
            .populate('bookedBy', 'username profileImage')
            .populate('slotId', 'title category dateTime')
            .sort({ completedAt: -1 });

            const earnedTransactions = earnedBookings.map(booking => ({
                _id: booking._id,
                type: 'earned',
                amount: +booking.cost,
                description: `Session completed: ${booking.slotId.title}`,
                status: booking.status,
                date: booking.completedAt,
                relatedUser: booking.bookedBy,
                slot: booking.slotId
            }));

            transactions = [...transactions, ...earnedTransactions];
        }

        // Sort by date and paginate
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        const total = transactions.length;
        const paginatedTransactions = transactions.slice(skip, skip + parseInt(limit));
        const totalPages = Math.ceil(total / parseInt(limit));

        res.json({
            success: true,
            message: 'Transaction history retrieved successfully',
            data: {
                transactions: paginatedTransactions,
                pagination: {
                    total,
                    totalPages,
                    currentPage: parseInt(page),
                    limit: parseInt(limit),
                    hasNext: parseInt(page) < totalPages,
                    hasPrev: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        logger.error('Get transactions error:', error);
        throw error;
    }
});

// @desc    Get wallet statistics
// @route   GET /api/wallet/stats
// @access  Private
const getWalletStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { period = '30d' } = req.query;

    logger.debug(`Getting wallet stats for user: ${req.user.username}, period: ${period}`);

    try {
        // Calculate date range
        const now = new Date();
        let startDate;

        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const [spentStats, earnedStats, categoryStats] = await Promise.all([
            // Credits spent in period
            Booking.aggregate([
                {
                    $match: {
                        bookedBy: userId,
                        createdAt: { $gte: startDate },
                        status: { $in: ['pending', 'confirmed', 'completed'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSpent: { $sum: '$cost' },
                        totalBookings: { $sum: 1 },
                        avgCost: { $avg: '$cost' }
                    }
                }
            ]),

            // Credits earned in period
            Booking.aggregate([
                {
                    $match: {
                        bookedFrom: userId,
                        completedAt: { $gte: startDate },
                        status: 'completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalEarned: { $sum: '$cost' },
                        totalSessions: { $sum: 1 },
                        avgEarning: { $avg: '$cost' }
                    }
                }
            ]),

            // Earnings by category
            Booking.aggregate([
                {
                    $match: {
                        bookedFrom: userId,
                        status: 'completed',
                        completedAt: { $gte: startDate }
                    }
                },
                {
                    $lookup: {
                        from: 'slots',
                        localField: 'slotId',
                        foreignField: '_id',
                        as: 'slot'
                    }
                },
                {
                    $unwind: '$slot'
                },
                {
                    $group: {
                        _id: '$slot.category',
                        totalEarned: { $sum: '$cost' },
                        sessionCount: { $sum: 1 }
                    }
                },
                {
                    $sort: { totalEarned: -1 }
                }
            ])
        ]);

        // Format results
        const spent = spentStats.length > 0 ? spentStats[0] : {
            totalSpent: 0,
            totalBookings: 0,
            avgCost: 0
        };

        const earned = earnedStats.length > 0 ? earnedStats[0] : {
            totalEarned: 0,
            totalSessions: 0,
            avgEarning: 0
        };

        res.json({
            success: true,
            message: 'Wallet statistics retrieved successfully',
            data: {
                period: period,
                summary: {
                    totalSpent: spent.totalSpent,
                    totalEarned: earned.totalEarned,
                    netChange: earned.totalEarned - spent.totalSpent,
                    bookingsCount: spent.totalBookings,
                    sessionsCount: earned.totalSessions,
                    averageSpend: Math.round(spent.avgCost * 100) / 100,
                    averageEarning: Math.round(earned.avgEarning * 100) / 100
                },
                categoryBreakdown: categoryStats.map(cat => ({
                    category: cat._id,
                    totalEarned: cat.totalEarned,
                    sessionCount: cat.sessionCount,
                    averagePerSession: Math.round((cat.totalEarned / cat.sessionCount) * 100) / 100
                }))
            }
        });

    } catch (error) {
        logger.error('Get wallet stats error:', error);
        throw error;
    }
});

// @desc    Get pending transactions (bookings that affect credits)
// @route   GET /api/wallet/pending
// @access  Private
const getPendingTransactions = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    logger.debug(`Getting pending transactions for user: ${req.user.username}`);

    try {
        const [pendingSpent, pendingEarnings] = await Promise.all([
            // Pending credits (spent but session not completed)
            Booking.find({
                bookedBy: userId,
                status: { $in: ['pending', 'confirmed'] }
            })
            .populate('bookedFrom', 'username profileImage')
            .populate('slotId', 'title category dateTime')
            .sort({ createdAt: -1 }),

            // Potential earnings (confirmed sessions as mentor)
            Booking.find({
                bookedFrom: userId,
                status: 'confirmed'
            })
            .populate('bookedBy', 'username profileImage')
            .populate('slotId', 'title category dateTime')
            .sort({ createdAt: -1 })
        ]);

        const formattedPendingSpent = pendingSpent.map(booking => ({
            _id: booking._id,
            type: 'pending_spent',
            amount: -booking.cost,
            description: `Pending: ${booking.slotId.title}`,
            status: booking.status,
            date: booking.slotId.dateTime,
            relatedUser: booking.bookedFrom,
            slot: booking.slotId
        }));

        const formattedPendingEarnings = pendingEarnings.map(booking => ({
            _id: booking._id,
            type: 'pending_earned',
            amount: +booking.cost,
            description: `Upcoming session: ${booking.slotId.title}`,
            status: booking.status,
            date: booking.slotId.dateTime,
            relatedUser: booking.bookedBy,
            slot: booking.slotId
        }));

        const totalPendingSpent = pendingSpent.reduce((sum, booking) => sum + booking.cost, 0);
        const totalPendingEarnings = pendingEarnings.reduce((sum, booking) => sum + booking.cost, 0);

        res.json({
            success: true,
            message: 'Pending transactions retrieved successfully',
            data: {
                summary: {
                    totalPendingSpent,
                    totalPendingEarnings,
                    netPending: totalPendingEarnings - totalPendingSpent
                },
                pendingTransactions: [
                    ...formattedPendingSpent,
                    ...formattedPendingEarnings
                ].sort((a, b) => new Date(a.date) - new Date(b.date))
            }
        });

    } catch (error) {
        logger.error('Get pending transactions error:', error);
        throw error;
    }
});

module.exports = {
    getWallet,
    getTransactions,
    getWalletStats,
    getPendingTransactions
};