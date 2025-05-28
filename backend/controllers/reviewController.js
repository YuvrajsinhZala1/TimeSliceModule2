const Booking = require('../models/Booking');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

// @desc    Submit review for a booking
// @route   POST /api/reviews
// @access  Private
const submitReview = asyncHandler(async (req, res) => {
    logger.info(`Submitting review by user: ${req.user.username}`);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.debug('Review submission validation errors:', errors.array());
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { bookingId, rating, comment, reviewerType = 'student' } = req.body;
    const userId = req.user._id;

    try {
        // Find the booking
        const booking = await Booking.findById(bookingId)
            .populate('bookedBy', 'username')
            .populate('bookedFrom', 'username');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if booking is completed
        if (booking.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Can only review completed bookings'
            });
        }

        // Check if user can review this booking
        if (!booking.canBeReviewed(userId, reviewerType)) {
            return res.status(403).json({
                success: false,
                message: 'You cannot review this booking or have already reviewed it'
            });
        }

        // Add review to booking
        await booking.addReview(rating, comment, reviewerType);

        // Update user rating
        let reviewedUser;
        if (reviewerType === 'mentor') {
            // Mentor reviewing student
            reviewedUser = await User.findById(booking.bookedBy._id);
        } else {
            // Student reviewing mentor
            reviewedUser = await User.findById(booking.bookedFrom._id);
        }

        if (reviewedUser) {
            await reviewedUser.updateRating(rating);
            logger.info(`Updated rating for user: ${reviewedUser.username} to ${reviewedUser.rating.average}`);
        }

        logger.info(`Review submitted for booking: ${bookingId} by ${reviewerType}: ${req.user.username}`);

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: { 
                booking: booking,
                reviewedUser: reviewedUser ? {
                    username: reviewedUser.username,
                    newRating: reviewedUser.rating
                } : null
            }
        });

    } catch (error) {
        logger.error('Submit review error:', error);
        throw error;
    }
});

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getUserReviews = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role = 'mentor', page = 1, limit = 10 } = req.query;

    logger.debug(`Getting reviews for user: ${userId} as ${role}`);

    try {
        // Check if user exists
        const user = await User.findById(userId).select('username rating profileImage');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Build query based on role
        const query = role === 'mentor' 
            ? { bookedFrom: userId, 'review.rating': { $exists: true } }
            : { bookedBy: userId, 'mentorReview.rating': { $exists: true } };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [bookings, total] = await Promise.all([
            Booking.find(query)
                .populate('bookedBy', 'username profileImage')
                .populate('bookedFrom', 'username profileImage')
                .populate('slotId', 'title category')
                .sort({ 'review.reviewedAt': -1, 'mentorReview.reviewedAt': -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Booking.countDocuments(query)
        ]);

        // Format reviews
        const reviews = bookings.map(booking => {
            const reviewData = role === 'mentor' ? booking.review : booking.mentorReview;
            const reviewer = role === 'mentor' ? booking.bookedBy : booking.bookedFrom;
            
            return {
                _id: booking._id,
                rating: reviewData.rating,
                comment: reviewData.comment,
                reviewedAt: reviewData.reviewedAt,
                reviewer: {
                    _id: reviewer._id,
                    username: reviewer.username,
                    profileImage: reviewer.profileImage
                },
                slot: {
                    title: booking.slotId.title,
                    category: booking.slotId.category
                }
            };
        });

        const totalPages = Math.ceil(total / parseInt(limit));

        res.json({
            success: true,
            message: 'Reviews retrieved successfully',
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    profileImage: user.profileImage,
                    rating: user.rating
                },
                reviews,
                pagination: {
                    total,
                    totalPages,
                    currentPage: parseInt(page),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        logger.error('Get user reviews error:', error);
        throw error;
    }
});

// @desc    Get reviews given by a user
// @route   GET /api/reviews/given
// @access  Private
const getGivenReviews = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    logger.debug(`Getting reviews given by user: ${req.user.username}`);

    try {
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get bookings where user has given reviews (as both student and mentor)
        const [studentReviews, mentorReviews] = await Promise.all([
            // Reviews given as student
            Booking.find({
                bookedBy: userId,
                'review.rating': { $exists: true }
            })
            .populate('bookedFrom', 'username profileImage')
            .populate('slotId', 'title category')
            .sort({ 'review.reviewedAt': -1 })
            .skip(skip)
            .limit(parseInt(limit)),
            
            // Reviews given as mentor
            Booking.find({
                bookedFrom: userId,
                'mentorReview.rating': { $exists: true }
            })
            .populate('bookedBy', 'username profileImage')
            .populate('slotId', 'title category')
            .sort({ 'mentorReview.reviewedAt': -1 })
            .skip(skip)
            .limit(parseInt(limit))
        ]);

        // Format and combine reviews
        const formattedStudentReviews = studentReviews.map(booking => ({
            _id: booking._id,
            type: 'given_as_student',
            rating: booking.review.rating,
            comment: booking.review.comment,
            reviewedAt: booking.review.reviewedAt,
            reviewedUser: {
                _id: booking.bookedFrom._id,
                username: booking.bookedFrom.username,
                profileImage: booking.bookedFrom.profileImage
            },
            slot: {
                title: booking.slotId.title,
                category: booking.slotId.category
            }
        }));

        const formattedMentorReviews = mentorReviews.map(booking => ({
            _id: booking._id,
            type: 'given_as_mentor',
            rating: booking.mentorReview.rating,
            comment: booking.mentorReview.comment,
            reviewedAt: booking.mentorReview.reviewedAt,
            reviewedUser: {
                _id: booking.bookedBy._id,
                username: booking.bookedBy.username,
                profileImage: booking.bookedBy.profileImage
            },
            slot: {
                title: booking.slotId.title,
                category: booking.slotId.category
            }
        }));

        // Combine and sort by date
        const allReviews = [...formattedStudentReviews, ...formattedMentorReviews]
            .sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt))
            .slice(0, parseInt(limit));

        const total = studentReviews.length + mentorReviews.length;
        const totalPages = Math.ceil(total / parseInt(limit));

        res.json({
            success: true,
            message: 'Given reviews retrieved successfully',
            data: {
                reviews: allReviews,
                pagination: {
                    total,
                    totalPages,
                    currentPage: parseInt(page),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        logger.error('Get given reviews error:', error);
        throw error;
    }
});

// @desc    Get reviews statistics
// @route   GET /api/reviews/stats/:userId
// @access  Public
const getReviewStats = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    logger.debug(`Getting review stats for user: ${userId}`);

    try {
        // Check if user exists
        const user = await User.findById(userId).select('username rating');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const [mentorStats, studentStats] = await Promise.all([
            // Stats as mentor (receiving reviews from students)
            Booking.aggregate([
                { 
                    $match: { 
                        bookedFrom: user._id,
                        'review.rating': { $exists: true }
                    }
                },
                {
                    $group: {
                        _id: '$review.rating',
                        count: { $sum: 1 }
                    }
                }
            ]),
            
            // Stats as student (receiving reviews from mentors)
            Booking.aggregate([
                { 
                    $match: { 
                        bookedBy: user._id,
                        'mentorReview.rating': { $exists: true }
                    }
                },
                {
                    $group: {
                        _id: '$mentorReview.rating',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        // Format rating distribution
        const formatRatingDistribution = (stats) => {
            const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            let total = 0;
            
            stats.forEach(stat => {
                distribution[stat._id] = stat.count;
                total += stat.count;
            });
            
            return { distribution, total };
        };

        const mentorRatingStats = formatRatingDistribution(mentorStats);
        const studentRatingStats = formatRatingDistribution(studentStats);

        res.json({
            success: true,
            message: 'Review statistics retrieved successfully',
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    overallRating: user.rating
                },
                asMentor: {
                    totalReviews: mentorRatingStats.total,
                    ratingDistribution: mentorRatingStats.distribution
                },
                asStudent: {
                    totalReviews: studentRatingStats.total,
                    ratingDistribution: studentRatingStats.distribution
                }
            }
        });

    } catch (error) {
        logger.error('Get review stats error:', error);
        throw error;
    }
});

// @desc    Update a review
// @route   PUT /api/reviews/:bookingId
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { rating, comment, reviewerType = 'student' } = req.body;
    const userId = req.user._id;

    logger.info(`Updating review for booking: ${bookingId} by user: ${req.user.username}`);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    try {
        const booking = await Booking.findById(bookingId)
            .populate('bookedBy')
            .populate('bookedFrom');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check permissions
        const canUpdate = (reviewerType === 'student' && booking.bookedBy._id.toString() === userId.toString()) ||
                         (reviewerType === 'mentor' && booking.bookedFrom._id.toString() === userId.toString());

        if (!canUpdate) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own reviews'
            });
        }

        // Check if review exists
        const existingReview = reviewerType === 'student' ? booking.review : booking.mentorReview;
        if (!existingReview.rating) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Update review
        const reviewData = {
            rating: rating,
            comment: comment || '',
            reviewedAt: new Date()
        };

        if (reviewerType === 'mentor') {
            booking.mentorReview = reviewData;
        } else {
            booking.review = reviewData;
        }

        await booking.save();

        // Update user rating if rating changed
        if (existingReview.rating !== rating) {
            const reviewedUser = reviewerType === 'student' 
                ? await User.findById(booking.bookedFrom._id)
                : await User.findById(booking.bookedBy._id);

            if (reviewedUser) {
                // Recalculate rating (this is a simplified approach)
                // In a production app, you might want to recalculate from all reviews
                const oldTotal = reviewedUser.rating.average * reviewedUser.rating.count;
                const newTotal = oldTotal - existingReview.rating + rating;
                reviewedUser.rating.average = newTotal / reviewedUser.rating.count;
                reviewedUser.rating.average = Math.round(reviewedUser.rating.average * 10) / 10;
                
                await reviewedUser.save();
            }
        }

        logger.info(`Review updated for booking: ${bookingId}`);

        res.json({
            success: true,
            message: 'Review updated successfully',
            data: { booking }
        });

    } catch (error) {
        logger.error('Update review error:', error);
        throw error;
    }
});

module.exports = {
    submitReview,
    getUserReviews,
    getGivenReviews,
    getReviewStats,
    updateReview
};