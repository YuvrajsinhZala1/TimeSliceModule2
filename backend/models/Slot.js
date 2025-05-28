const mongoose = require('mongoose');
const logger = require('../config/logger');

const slotSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    title: {
        type: String,
        required: [true, 'Slot title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Slot description is required'],
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    dateTime: {
        type: Date,
        required: [true, 'Date and time are required'],
        validate: {
            validator: function(value) {
                return value > new Date();
            },
            message: 'Slot date and time must be in the future'
        }
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        enum: {
            values: [30, 60],
            message: 'Duration must be either 30 or 60 minutes'
        }
    },
    skills: [{
        type: String,
        trim: true,
        maxlength: [50, 'Skill name cannot exceed 50 characters']
    }],
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: [
                'Programming', 'Design', 'Marketing', 'Business', 
                'Writing', 'Consulting', 'Teaching', 'Mentoring',
                'Career Advice', 'Code Review', 'Other'
            ],
            message: 'Invalid category'
        }
    },
    cost: {
        type: Number,
        required: [true, 'Cost is required'],
        min: [1, 'Cost must be at least 1 credit'],
        max: [20, 'Cost cannot exceed 20 credits']
    },
    isBooked: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    meetingLink: {
        type: String,
        trim: true,
        default: ''
    },
    meetingPlatform: {
        type: String,
        enum: ['Zoom', 'Google Meet', 'Microsoft Teams', 'Discord', 'Other'],
        default: 'Google Meet'
    },
    maxParticipants: {
        type: Number,
        default: 1,
        min: [1, 'Must allow at least 1 participant'],
        max: [5, 'Cannot exceed 5 participants']
    },
    currentParticipants: {
        type: Number,
        default: 0,
        min: [0, 'Current participants cannot be negative']
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [30, 'Tag cannot exceed 30 characters']
    }],
    prerequisites: {
        type: String,
        trim: true,
        maxlength: [300, 'Prerequisites cannot exceed 300 characters'],
        default: ''
    },
    outcomes: {
        type: String,
        trim: true,
        maxlength: [300, 'Outcomes cannot exceed 300 characters'],
        default: ''
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for better performance
slotSchema.index({ userId: 1 });
slotSchema.index({ dateTime: 1 });
slotSchema.index({ isBooked: 1 });
slotSchema.index({ isActive: 1 });
slotSchema.index({ category: 1 });
slotSchema.index({ skills: 1 });
slotSchema.index({ tags: 1 });

// Compound indexes
slotSchema.index({ isBooked: 1, isActive: 1, dateTime: 1 });
slotSchema.index({ category: 1, isBooked: 1, isActive: 1 });

// Pre-save middleware to validate slot timing
slotSchema.pre('save', function(next) {
    try {
        // Check if slot is in the future
        if (this.dateTime <= new Date()) {
            const error = new Error('Slot must be scheduled for a future date and time');
            logger.error(`Slot validation error: ${error.message}`);
            return next(error);
        }

        // Check if slot is not too far in the future (e.g., 6 months)
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        
        if (this.dateTime > sixMonthsFromNow) {
            const error = new Error('Slot cannot be scheduled more than 6 months in advance');
            logger.error(`Slot validation error: ${error.message}`);
            return next(error);
        }

        // Validate current participants doesn't exceed max
        if (this.currentParticipants > this.maxParticipants) {
            const error = new Error('Current participants cannot exceed maximum participants');
            logger.error(`Slot validation error: ${error.message}`);
            return next(error);
        }

        logger.debug(`Slot validation passed for slot: ${this.title}`);
        next();
    } catch (error) {
        logger.error('Error in slot pre-save validation:', error);
        next(error);
    }
});

// Method to check if slot is available for booking
slotSchema.methods.isAvailable = function() {
    return this.isActive && 
           !this.isBooked && 
           this.currentParticipants < this.maxParticipants &&
           this.dateTime > new Date();
};

// Method to book the slot
slotSchema.methods.bookSlot = function() {
    try {
        if (!this.isAvailable()) {
            throw new Error('Slot is not available for booking');
        }

        this.currentParticipants += 1;
        
        // If this is a single-participant slot, mark as booked
        if (this.maxParticipants === 1) {
            this.isBooked = true;
        }
        
        logger.debug(`Slot booked: ${this.title}, participants: ${this.currentParticipants}/${this.maxParticipants}`);
        return this.save();
    } catch (error) {
        logger.error('Error booking slot:', error);
        throw error;
    }
};

// Method to cancel booking
slotSchema.methods.cancelBooking = function() {
    try {
        if (this.currentParticipants > 0) {
            this.currentParticipants -= 1;
        }
        
        if (this.currentParticipants < this.maxParticipants) {
            this.isBooked = false;
        }
        
        logger.debug(`Slot booking cancelled: ${this.title}, participants: ${this.currentParticipants}/${this.maxParticipants}`);
        return this.save();
    } catch (error) {
        logger.error('Error cancelling slot booking:', error);
        throw error;
    }
};

// Method to check if slot is expired
slotSchema.methods.isExpired = function() {
    return this.dateTime < new Date();
};

// Static method to find available slots
slotSchema.statics.findAvailable = function(filters = {}) {
    const query = {
        isActive: true,
        isBooked: false,
        dateTime: { $gt: new Date() },
        ...filters
    };
    
    return this.find(query)
               .populate('userId', 'username rating profileImage')
               .sort({ dateTime: 1 });
};

// Static method to find slots by category
slotSchema.statics.findByCategory = function(category) {
    return this.findAvailable({ category });
};

// Static method to find slots by skills
slotSchema.statics.findBySkills = function(skills) {
    return this.findAvailable({ 
        skills: { $in: skills } 
    });
};

// Static method to clean up expired slots
slotSchema.statics.cleanupExpired = async function() {
    try {
        const result = await this.updateMany(
            { 
                dateTime: { $lt: new Date() },
                isActive: true 
            },
            { 
                isActive: false 
            }
        );
        
        logger.info(`Cleaned up ${result.modifiedCount} expired slots`);
        return result;
    } catch (error) {
        logger.error('Error cleaning up expired slots:', error);
        throw error;
    }
};

// Virtual for formatted date/time
slotSchema.virtual('formattedDateTime').get(function() {
    return this.dateTime.toLocaleString();
});

// Virtual for end time
slotSchema.virtual('endTime').get(function() {
    const endTime = new Date(this.dateTime);
    endTime.setMinutes(endTime.getMinutes() + this.duration);
    return endTime;
});

// Ensure virtual fields are serialized
slotSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.id;
        return ret;
    }
});

const Slot = mongoose.model('Slot', slotSchema);

module.exports = Slot;