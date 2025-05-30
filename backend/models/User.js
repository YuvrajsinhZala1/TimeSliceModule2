const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            'Please provide a valid email address'
        ]
    },
    passwordHash: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
        default: ''
    },
    skills: [{
        type: String,
        trim: true,
        maxlength: [50, 'Skill name cannot exceed 50 characters']
    }],
    credits: {
        type: Number,
        default: 10, // Starting credits for new users
        min: [0, 'Credits cannot be negative']
    },
    rating: {
        average: {
            type: Number,
            default: 0,
            min: [0, 'Rating cannot be negative'],
            max: [5, 'Rating cannot exceed 5']
        },
        count: {
            type: Number,
            default: 0,
            min: [0, 'Rating count cannot be negative']
        }
    },
    sessions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    }],
    profileImage: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    versionKey: false
});

// Remove manual indexes (they're created automatically from unique: true)
// Only add compound indexes that aren't duplicated
userSchema.index({ skills: 1 });
userSchema.index({ 'rating.average': -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    try {
        // Only hash password if it's been modified
        if (!this.isModified('passwordHash')) {
            return next();
        }

        logger.debug(`Hashing password for user: ${this.username}`);
        
        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
        
        logger.debug(`Password hashed successfully for user: ${this.username}`);
        next();
    } catch (error) {
        logger.error('Error hashing password:', error);
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        logger.debug(`Comparing password for user: ${this.username}`);
        const isMatch = await bcrypt.compare(candidatePassword, this.passwordHash);
        logger.debug(`Password comparison result for user ${this.username}: ${isMatch}`);
        return isMatch;
    } catch (error) {
        logger.error('Error comparing password:', error);
        throw error;
    }
};

// Method to update rating
userSchema.methods.updateRating = function(newRating) {
    try {
        logger.debug(`Updating rating for user: ${this.username}, new rating: ${newRating}`);
        
        const currentTotal = this.rating.average * this.rating.count;
        this.rating.count += 1;
        this.rating.average = (currentTotal + newRating) / this.rating.count;
        
        // Round to 1 decimal place
        this.rating.average = Math.round(this.rating.average * 10) / 10;
        
        logger.debug(`Updated rating for user ${this.username}: ${this.rating.average} (${this.rating.count} reviews)`);
        return this.save();
    } catch (error) {
        logger.error('Error updating rating:', error);
        throw error;
    }
};

// Method to add/subtract credits
userSchema.methods.updateCredits = function(amount, operation = 'add') {
    try {
        logger.debug(`Updating credits for user: ${this.username}, amount: ${amount}, operation: ${operation}`);
        
        if (operation === 'add') {
            this.credits += amount;
        } else if (operation === 'subtract') {
            if (this.credits < amount) {
                throw new Error('Insufficient credits');
            }
            this.credits -= amount;
        }
        
        logger.debug(`Updated credits for user ${this.username}: ${this.credits}`);
        return this.save();
    } catch (error) {
        logger.error('Error updating credits:', error);
        throw error;
    }
};

// Method to check if user has enough credits
userSchema.methods.hasEnoughCredits = function(amount) {
    return this.credits >= amount;
};

// Method to get public profile (excluding sensitive information)
userSchema.methods.getPublicProfile = function() {
    const publicProfile = this.toObject();
    delete publicProfile.passwordHash;
    delete publicProfile.email;
    return publicProfile;
};

// Static method to find by username or email
userSchema.statics.findByUsernameOrEmail = function(identifier) {
    return this.findOne({
        $or: [
            { username: identifier },
            { email: identifier }
        ]
    });
};

// Virtual for full name display
userSchema.virtual('displayName').get(function() {
    return this.username;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.passwordHash;
        delete ret.id;
        return ret;
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;