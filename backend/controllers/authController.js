const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const signup = asyncHandler(async (req, res) => {
    logger.info('User signup attempt');
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.debug('Signup validation errors:', errors.array());
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { username, email, password, bio, skills } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            const field = existingUser.email === email ? 'email' : 'username';
            logger.warn(`Signup failed - ${field} already exists: ${existingUser[field]}`);
            
            return res.status(400).json({
                success: false,
                message: `User with this ${field} already exists`,
                field: field
            });
        }

        // Create new user
        const userData = {
            username: username.trim(),
            email: email.toLowerCase().trim(),
            passwordHash: password, // Will be hashed in pre-save middleware
            bio: bio ? bio.trim() : '',
            skills: skills ? skills.map(skill => skill.trim()).filter(Boolean) : []
        };

        const user = new User(userData);
        await user.save();

        logger.info(`New user created: ${user.username} (${user.email})`);

        // Generate token
        const token = generateToken(user._id);

        // Return user data (excluding password)
        const userResponse = user.toJSON();
        delete userResponse.passwordHash;

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: userResponse,
                token: token
            }
        });

    } catch (error) {
        logger.error('Signup error:', error);
        throw error;
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
    logger.info('User login attempt');
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.debug('Login validation errors:', errors.array());
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { identifier, password } = req.body; // identifier can be username or email

    try {
        // Find user by username or email
        const user = await User.findByUsernameOrEmail(identifier.trim());

        if (!user) {
            logger.warn(`Login failed - user not found: ${identifier}`);
            
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            logger.warn(`Login failed - inactive user: ${user.username}`);
            
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            logger.warn(`Login failed - invalid password for user: ${user.username}`);
            
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        logger.info(`User logged in successfully: ${user.username}`);

        // Generate token
        const token = generateToken(user._id);

        // Return user data (excluding password)
        const userResponse = user.toJSON();
        delete userResponse.passwordHash;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userResponse,
                token: token
            }
        });

    } catch (error) {
        logger.error('Login error:', error);
        throw error;
    }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    logger.debug(`Getting profile for user: ${req.user.username}`);

    try {
        // User is already attached to request by auth middleware
        const user = req.user.toJSON();
        delete user.passwordHash;

        res.json({
            success: true,
            message: 'Profile retrieved successfully',
            data: {
                user: user
            }
        });

    } catch (error) {
        logger.error('Get profile error:', error);
        throw error;
    }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
    logger.info(`Profile update attempt for user: ${req.user.username}`);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.debug('Profile update validation errors:', errors.array());
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { bio, skills, username } = req.body;
    const userId = req.user._id;

    try {
        // Check if username is being changed and if it's available
        if (username && username !== req.user.username) {
            const existingUser = await User.findOne({ 
                username: username.trim(),
                _id: { $ne: userId }
            });

            if (existingUser) {
                logger.warn(`Profile update failed - username already exists: ${username}`);
                
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists',
                    field: 'username'
                });
            }
        }

        // Prepare update data
        const updateData = {};
        if (bio !== undefined) updateData.bio = bio.trim();
        if (skills !== undefined) {
            updateData.skills = skills.map(skill => skill.trim()).filter(Boolean);
        }
        if (username !== undefined) updateData.username = username.trim();

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { 
                new: true, 
                runValidators: true 
            }
        ).select('-passwordHash');

        if (!updatedUser) {
            throw new AppError('User not found', 404);
        }

        logger.info(`Profile updated successfully for user: ${updatedUser.username}`);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: updatedUser
            }
        });

    } catch (error) {
        logger.error('Profile update error:', error);
        throw error;
    }
});

// @desc    Change user password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
    logger.info(`Password change attempt for user: ${req.user.username}`);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.debug('Password change validation errors:', errors.array());
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    try {
        // Get user with password
        const user = await User.findById(userId);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);

        if (!isCurrentPasswordValid) {
            logger.warn(`Password change failed - invalid current password for user: ${user.username}`);
            
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.passwordHash = newPassword; // Will be hashed in pre-save middleware
        await user.save();

        logger.info(`Password changed successfully for user: ${user.username}`);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        logger.error('Password change error:', error);
        throw error;
    }
});

// @desc    Deactivate user account
// @route   DELETE /api/auth/account
// @access  Private
const deactivateAccount = asyncHandler(async (req, res) => {
    logger.info(`Account deactivation attempt for user: ${req.user.username}`);

    const userId = req.user._id;

    try {
        // Update user status
        const user = await User.findByIdAndUpdate(
            userId,
            { isActive: false },
            { new: true }
        ).select('-passwordHash');

        if (!user) {
            throw new AppError('User not found', 404);
        }

        logger.info(`Account deactivated for user: ${user.username}`);

        res.json({
            success: true,
            message: 'Account deactivated successfully'
        });

    } catch (error) {
        logger.error('Account deactivation error:', error);
        throw error;
    }
});

// @desc    Get user public profile
// @route   GET /api/auth/user/:userId
// @access  Public
const getUserProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    logger.debug(`Getting public profile for user ID: ${userId}`);

    try {
        const user = await User.findById(userId)
            .select('-passwordHash -email')
            .populate('sessions', 'rating review completedAt');

        if (!user || !user.isActive) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User profile retrieved successfully',
            data: {
                user: user
            }
        });

    } catch (error) {
        logger.error('Get user profile error:', error);
        throw error;
    }
});

module.exports = {
    signup,
    login,
    getMe,
    updateProfile,
    changePassword,
    deactivateAccount,
    getUserProfile
};