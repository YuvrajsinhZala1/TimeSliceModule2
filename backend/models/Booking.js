const mongoose = require('mongoose');
const logger = require('../config/logger');

const bookingSchema = new mongoose.Schema({
    slotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Slot',
        required: [true, 'Slot ID is required']
    },
    bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Booked by user ID is required']
    },
    bookedFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Booked from user ID is required']
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
            message: 'Invalid booking status'
        },
        default: 'pending'
    },
    cost: {
        type: Number,
        required: [true, 'Booking cost is required'],
        min: [1, 'Cost must be at least 1 credit']
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters'],
        default: ''
    },
    bookingDate: {
        type: Date,
        default: Date.now
    },
    confirmedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },
    cancelledAt: {
        type: Date,
        default: null
    },
    cancellationReason: {
        type: String,
        trim: true,
        maxlength: [200, 'Cancellation reason cannot exceed 200 characters'],
        default: ''
    },
    review: {
        rating: {
            type: Number,
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5'],
            default: null
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [500, 'Review comment cannot exceed 500 characters'],
            default: ''
        },
        reviewedAt: {
            type: Date,
            default: null
        }
    },
    mentorReview: {
        rating: {
            type: Number,
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5'],
            default: null
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [500, 'Review comment cannot exceed 500 characters'],
            default: ''
        },
        reviewedAt: {
            type: Date,
            default: null
        }
    },
    meetingDetails: {
        actualStartTime: {
            type: Date,
            default: null
        },
        actualEndTime: {
            type: Date,
            default: null
        },
        attendanceStatus: {
            type: String,
            enum: ['both', 'mentor-only', 'student-only', 'neither'],
            default: null
        }
    },
    reminders: {
        sent24h: {
            type: Boolean,
            default: false
        },
        sent1h: {
            type: Boolean,
            default: false
        },
        sent10min: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for better performance
bookingSchema.index({ bookedBy: 1 });
bookingSchema.index({ bookedFrom: 1 });
bookingSchema.index({ slotId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: -1 });

// Compound indexes
bookingSchema.index({ bookedBy: 1, status: 1 });
bookingSchema.index({ bookedFrom: 1, status: 1 });
bookingSchema.index({ status: 1, bookingDate: -1 });

// Pre-save middleware for validation
bookingSchema.pre('save', async function(next) {
    try {
        // Prevent users from booking their own slots
        if (this.bookedBy.toString() === this.bookedFrom.toString()) {
            const error = new Error('Users cannot book their own slots');
            logger.error(`Booking validation error: ${error.message}`);
            return next(error);
        }

        // Update timestamp fields based on status changes
        if (this.isModified('status')) {
            const now = new Date();
            
            switch (this.status) {
                case 'confirmed':
                    if (!this.confirmedAt) {
                        this.confirmedAt = now;
                    }
                    break;
                case 'completed':
                    if (!this.completedAt) {
                        this.completedAt = now;
                    }
                    break;
                case 'cancelled':
                    if (!this.cancelledAt) {
                        this.cancelledAt = now;
                    }
                    break;
            }
        }

        // Set review timestamp when review is added
        if (this.isModified('review.rating') && this.review.rating && !this.review.reviewedAt) {
            this.review.reviewedAt = new Date();
        }

        if (this.isModified('mentorReview.rating') && this.mentorReview.rating && !this.mentorReview.reviewedAt) {
            this.mentorReview.reviewedAt = new Date();
        }

        logger.debug(`Booking validation passed for booking: ${this._id}`);
        next();
    } catch (error) {
        logger.error('Error in booking pre-save validation:', error);
        next(error);
    }
});

// Method to confirm booking
bookingSchema.methods.confirm = function() {
    try {
        if (this.status !== 'pending') {
            throw new Error('Only pending bookings can be confirmed');
        }

        this.status = 'confirmed';
        this.confirmedAt = new Date();
        
        logger.debug(`Booking confirmed: ${this._id}`);
        return this.save();
    } catch (error) {
        logger.error('Error confirming booking:', error);
        throw error;
    }
};

// Method to complete booking
bookingSchema.methods.complete = function() {
    try {
        if (this.status !== 'confirmed') {
            throw new Error('Only confirmed bookings can be completed');
        }

        this.status = 'completed';
        this.completedAt = new Date();
        
        logger.debug(`Booking completed: ${this._id}`);
        return this.save();
    } catch (error) {
        logger.error('Error completing booking:', error);
        throw error;
    }
};

// Method to cancel booking
bookingSchema.methods.cancel = function(reason = '') {
    try {
        if (['completed', 'cancelled'].includes(this.status)) {
            throw new Error('Cannot cancel completed or already cancelled bookings');
        }

        this.status = 'cancelled';
        this.cancelledAt = new Date();
        this.cancellationReason = reason;
        
        logger.debug(`Booking cancelled: ${this._id}, reason: ${reason}`);
        return this.save();
    } catch (error) {
        logger.error('Error cancelling booking:', error);
        throw error;
    }
};

// Method to add review
bookingSchema.methods.addReview = function(rating, comment, reviewerType = 'student') {
    try {
        if (this.status !== 'completed') {
            throw new Error('Can only review completed bookings');
        }

        const reviewData = {
            rating: rating,
            comment: comment || '',
            reviewedAt: new Date()
        };

        if (reviewerType === 'mentor') {
            this.mentorReview = reviewData;
        } else {
            this.review = reviewData;
        }
        
        logger.debug(`Review added to booking: ${this._id}, type: ${reviewerType}, rating: ${rating}`);
        return this.save();
    } catch (error) {
        logger.error('Error adding review:', error);
        throw error;
    }
};

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
    return !['completed', 'cancelled'].includes(this.status);
};

// Method to check if booking can be reviewed
bookingSchema.methods.canBeReviewed = function(userId, reviewerType = 'student') {
    if (this.status !== 'completed') return false;
    
    if (reviewerType === 'mentor') {
        return this.bookedFrom.toString() === userId.toString() && !this.mentorReview.rating;
    } else {
        return this.bookedBy.toString() === userId.toString() && !this.review.rating;
    }
};

// Method to get time until session
bookingSchema.methods.getTimeUntilSession = function() {
    // This method would need slot information
    // It's better to populate the slot and calculate from there
    return null; // Placeholder
};

// Static method to find user bookings
bookingSchema.statics.findUserBookings = function(userId, role = 'student') {
    const query = role === 'mentor' ? 
        { bookedFrom: userId } : 
        { bookedBy: userId };
    
    return this.find(query)
               .populate('slotId', 'title dateTime duration description category')
               .populate('bookedBy', 'username profileImage rating')
               .populate('bookedFrom', 'username profileImage rating')
               .sort({ bookingDate: -1 });
};

// Static method to find bookings by status
bookingSchema.statics.findByStatus = function(status) {
    return this.find({ status })
               .populate('slotId')
               .populate('bookedBy', 'username email')
               .populate('bookedFrom', 'username email');
};

// Static method to get bookings needing reminders
bookingSchema.statics.findNeedingReminders = function() {
    return this.find({
        status: 'confirmed'
    }).populate('slotId bookedBy bookedFrom');
};

// Static method to get booking statistics
bookingSchema.statics.getStats = async function(userId = null) {
    try {
        const matchStage = userId ? { 
            $or: [{ bookedBy: userId }, { bookedFrom: userId }] 
        } : {};

        const stats = await this.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const result = {
            total: 0,
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
            'no-show': 0
        };

        stats.forEach(stat => {
            result[stat._id] = stat.count;
            result.total += stat.count;
        });

        return result;
    } catch (error) {
        logger.error('Error getting booking stats:', error);
        throw error;
    }
};

// Virtual for booking duration (in minutes)
bookingSchema.virtual('duration').get(function() {
    if (this.meetingDetails.actualStartTime && this.meetingDetails.actualEndTime) {
        return Math.round((this.meetingDetails.actualEndTime - this.meetingDetails.actualStartTime) / (1000 * 60));
    }
    return null;
});

// Virtual to check if booking is reviewable
bookingSchema.virtual('isReviewable').get(function() {
    return this.status === 'completed';
});

// Ensure virtual fields are serialized
bookingSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.id;
        return ret;
    }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;