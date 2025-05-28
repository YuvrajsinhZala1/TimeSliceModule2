const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = asyncHandler(async (req, res) => {
    logger.info(`Creating booking for user: ${req.user.username}`);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.debug('Booking creation validation errors:', errors.array());
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { slotId, notes } = req.body;
    const userId = req.user._id;

    try {
        // Find the slot
        const slot = await Slot.findById(slotId).populate('userId');

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Slot not found'
            });
        }

        // Check if slot is available
        if (!slot.isAvailable()) {
            return res.status(400).json({
                success: false,
                message: 'Slot is not available for booking'
            });
        }

        // Check if user is trying to book their own slot
        if (slot.userId._id.toString() === userId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot book your own slot'
            });
        }

        // Check if user has enough credits
        if (req.user.credits < slot.cost) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient credits',
                details: {
                    required: slot.cost,
                    available: req.user.credits,
                    needed: slot.cost - req.user.credits
                }
            });
        }

        // Check if user already has a booking for this slot
        const existingBooking = await Booking.findOne({
            slotId: slotId,
            bookedBy: userId,
            status: { $nin: ['cancelled'] }
        });

        if (existingBooking) {
            return res.status(400).json({
                success: false,
                message: 'You have already booked this slot'
            });
        }

        // Create booking
        const bookingData = {
            slotId: slotId,
            bookedBy: userId,
            bookedFrom: slot.userId._id,
            cost: slot.cost,
            notes: notes ? notes.trim() : '',
            status: 'pending'
        };

        const booking = new Booking(bookingData);
        await booking.save();

        // Update slot
        await slot.bookSlot();

        // Deduct credits from user
        await req.user.updateCredits(slot.cost, 'subtract');

        // Populate booking data
        await booking.populate([
            { path: 'slotId', select: 'title dateTime duration description category' },
            { path: 'bookedBy', select: 'username profileImage' },
            { path: 'bookedFrom', select: 'username profileImage' }
        ]);

        logger.info(`Booking created successfully: ${booking._id} for slot: ${slot.title}`);

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: { booking }
        });

    } catch (error) {
        logger.error('Booking creation error:', error);
        throw error;
    }
});

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
const getBookings = asyncHandler(async (req, res) => {
    logger.info(`Fetching bookings for user: ${req.user.username}`);

    const { role = 'student', status, page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    try {
        // Build filter query
        const filters = {};
        
        if (role === 'mentor') {
            filters.bookedFrom = userId;
        } else {
            filters.bookedBy = userId;
        }

        if (status) {
            filters.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [bookings, total] = await Promise.all([
            Booking.find(filters)
                .populate('slotId', 'title dateTime duration description category meetingLink meetingPlatform')
                .populate('bookedBy', 'username profileImage rating')
                .populate('bookedFrom', 'username profileImage rating')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Booking.countDocuments(filters)
        ]);

        const totalPages = Math.ceil(total / parseInt(limit));

        logger.debug(`Found ${bookings.length} bookings for user: ${req.user.username}`);

        res.json({
            success: true,
            message: 'Bookings retrieved successfully',
            data: {
                bookings,
                pagination: {
                    total,
                    totalPages,
                    currentPage: parseInt(page),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        logger.error('Get bookings error:', error);
        throw error;
    }
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    logger.debug(`Fetching booking: ${id} for user: ${req.user.username}`);

    try {
        const booking = await Booking.findById(id)
            .populate('slotId', 'title dateTime duration description category meetingLink meetingPlatform')
            .populate('bookedBy', 'username profileImage rating bio')
            .populate('bookedFrom', 'username profileImage rating bio');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user has access to this booking
        const hasAccess = booking.bookedBy._id.toString() === userId.toString() ||
                         booking.bookedFrom._id.toString() === userId.toString();

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            message: 'Booking retrieved successfully',
            data: { booking }
        });

    } catch (error) {
        logger.error('Get booking error:', error);
        throw error;
    }
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
const updateBookingStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    const userId = req.user._id;

    logger.info(`Updating booking status: ${id} to ${status} by user: ${req.user.username}`);

    try {
        const booking = await Booking.findById(id)
            .populate('slotId')
            .populate('bookedBy')
            .populate('bookedFrom');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check permissions
        const isMentor = booking.bookedFrom._id.toString() === userId.toString();
        const isStudent = booking.bookedBy._id.toString() === userId.toString();

        if (!isMentor && !isStudent) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Handle different status updates
        switch (status) {
            case 'confirmed':
                if (!isMentor) {
                    return res.status(403).json({
                        success: false,
                        message: 'Only mentors can confirm bookings'
                    });
                }
                await booking.confirm();
                break;

            case 'completed':
                if (!isMentor) {
                    return res.status(403).json({
                        success: false,
                        message: 'Only mentors can mark bookings as completed'
                    });
                }
                await booking.complete();
                
                // Add credits to mentor
                const mentor = await User.findById(booking.bookedFrom);
                await mentor.updateCredits(booking.cost, 'add');
                break;

            case 'cancelled':
                await booking.cancel(reason || '');
                
                // Refund credits to student
                const student = await User.findById(booking.bookedBy);
                await student.updateCredits(booking.cost, 'add');
                
                // Update slot availability
                await booking.slotId.cancelBooking();
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status'
                });
        }

        logger.info(`Booking status updated: ${booking._id} to ${status}`);

        res.json({
            success: true,
            message: `Booking ${status} successfully`,
            data: { booking }
        });

    } catch (error) {
        logger.error('Update booking status error:', error);
        throw error;
    }
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    logger.info(`Cancelling booking: ${id} by user: ${req.user.username}`);

    try {
        const booking = await Booking.findById(id)
            .populate('slotId')
            .populate('bookedBy')
            .populate('bookedFrom');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user has permission to cancel
        const canCancel = booking.bookedBy._id.toString() === userId.toString() ||
                         booking.bookedFrom._id.toString() === userId.toString();

        if (!canCancel) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if booking can be cancelled
        if (!booking.canBeCancelled()) {
            return res.status(400).json({
                success: false,
                message: 'Booking cannot be cancelled'
            });
        }

        // Cancel booking
        await booking.cancel(reason || '');

        // Refund credits to student
        const student = await User.findById(booking.bookedBy);
        await student.updateCredits(booking.cost, 'add');

        // Update slot availability
        await booking.slotId.cancelBooking();

        logger.info(`Booking cancelled successfully: ${booking._id}`);

        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: { booking }
        });

    } catch (error) {
        logger.error('Cancel booking error:', error);
        throw error;
    }
});

// @desc    Get booking statistics
// @route   GET /api/bookings/stats
// @access  Private
const getBookingStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    logger.debug(`Getting booking stats for user: ${req.user.username}`);

    try {
        const [studentStats, mentorStats] = await Promise.all([
            Booking.getStats(userId),
            Booking.aggregate([
                { $match: { bookedFrom: userId } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        const mentorStatsFormatted = {
            total: 0,
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
            'no-show': 0
        };

        mentorStats.forEach(stat => {
            mentorStatsFormatted[stat._id] = stat.count;
            mentorStatsFormatted.total += stat.count;
        });

        res.json({
            success: true,
            message: 'Booking statistics retrieved successfully',
            data: {
                asStudent: studentStats,
                asMentor: mentorStatsFormatted
            }
        });

    } catch (error) {
        logger.error('Get booking stats error:', error);
        throw error;
    }
});

module.exports = {
    createBooking,
    getBookings,
    getBooking,
    updateBookingStatus,
    cancelBooking,
    getBookingStats
};