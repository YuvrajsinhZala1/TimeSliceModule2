const Slot = require('../models/Slot');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

// @desc    Create new slot
// @route   POST /api/slots
// @access  Private
const createSlot = asyncHandler(async (req, res) => {
    logger.info(`Creating new slot for user: ${req.user.username}`);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.debug('Slot creation validation errors:', errors.array());
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const {
        title,
        description,
        dateTime,
        duration,
        skills,
        category,
        cost,
        meetingLink,
        meetingPlatform,
        maxParticipants,
        tags,
        prerequisites,
        outcomes
    } = req.body;

    try {
        const slotData = {
            userId: req.user._id,
            title: title.trim(),
            description: description.trim(),
            dateTime: new Date(dateTime),
            duration,
            skills: skills ? skills.map(skill => skill.trim()).filter(Boolean) : [],
            category,
            cost,
            meetingLink: meetingLink ? meetingLink.trim() : '',
            meetingPlatform: meetingPlatform || 'Google Meet',
            maxParticipants: maxParticipants || 1,
            tags: tags ? tags.map(tag => tag.trim()).filter(Boolean) : [],
            prerequisites: prerequisites ? prerequisites.trim() : '',
            outcomes: outcomes ? outcomes.trim() : ''
        };

        const slot = new Slot(slotData);
        await slot.save();

        // Populate user info
        await slot.populate('userId', 'username rating profileImage');

        logger.info(`Slot created successfully: ${slot.title} by ${req.user.username}`);

        res.status(201).json({
            success: true,
            message: 'Slot created successfully',
            data: { slot }
        });

    } catch (error) {
        logger.error('Slot creation error:', error);
        throw error;
    }
});

// @desc    Get all available slots
// @route   GET /api/slots
// @access  Public
const getSlots = asyncHandler(async (req, res) => {
    logger.info('Fetching available slots');

    const {
        category,
        skills,
        dateFrom,
        dateTo,
        minCost,
        maxCost,
        duration,
        page = 1,
        limit = 10,
        sortBy = 'dateTime',
        sortOrder = 'asc'
    } = req.query;

    try {
        // Build filter query
        const filters = {
            isActive: true,
            isBooked: false,
            dateTime: { $gt: new Date() }
        };

        if (category) filters.category = category;
        if (skills) filters.skills = { $in: skills.split(',') };
        if (dateFrom || dateTo) {
            filters.dateTime = {
                ...filters.dateTime,
                ...(dateFrom && { $gte: new Date(dateFrom) }),
                ...(dateTo && { $lte: new Date(dateTo) })
            };
        }
        if (minCost || maxCost) {
            filters.cost = {
                ...(minCost && { $gte: parseInt(minCost) }),
                ...(maxCost && { $lte: parseInt(maxCost) })
            };
        }
        if (duration) filters.duration = parseInt(duration);

        // Exclude slots created by the current user if authenticated
        if (req.user) {
            filters.userId = { $ne: req.user._id };
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query
        const [slots, total] = await Promise.all([
            Slot.find(filters)
                .populate('userId', 'username rating profileImage')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Slot.countDocuments(filters)
        ]);

        const totalPages = Math.ceil(total / parseInt(limit));

        logger.debug(`Found ${slots.length} slots out of ${total} total`);

        res.json({
            success: true,
            message: 'Slots retrieved successfully',
            data: {
                slots,
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
        logger.error('Get slots error:', error);
        throw error;
    }
});

// @desc    Get single slot
// @route   GET /api/slots/:id
// @access  Public
const getSlot = asyncHandler(async (req, res) => {
    const { id } = req.params;
    logger.debug(`Fetching slot: ${id}`);

    try {
        const slot = await Slot.findById(id)
            .populate('userId', 'username rating profileImage bio skills');

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Slot not found'
            });
        }

        if (!slot.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Slot is no longer available'
            });
        }

        res.json({
            success: true,
            message: 'Slot retrieved successfully',
            data: { slot }
        });

    } catch (error) {
        logger.error('Get slot error:', error);
        throw error;
    }
});

// @desc    Update slot
// @route   PUT /api/slots/:id
// @access  Private
const updateSlot = asyncHandler(async (req, res) => {
    const { id } = req.params;
    logger.info(`Updating slot: ${id} by user: ${req.user.username}`);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    try {
        const slot = await Slot.findById(id);

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Slot not found'
            });
        }

        // Check ownership
        if (slot.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this slot'
            });
        }

        // Check if slot is already booked
        if (slot.isBooked) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update booked slots'
            });
        }

        // Prepare update data
        const updateData = { ...req.body };
        if (updateData.skills) {
            updateData.skills = updateData.skills.map(skill => skill.trim()).filter(Boolean);
        }
        if (updateData.tags) {
            updateData.tags = updateData.tags.map(tag => tag.trim()).filter(Boolean);
        }

        const updatedSlot = await Slot.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('userId', 'username rating profileImage');

        logger.info(`Slot updated successfully: ${updatedSlot.title}`);

        res.json({
            success: true,
            message: 'Slot updated successfully',
            data: { slot: updatedSlot }
        });

    } catch (error) {
        logger.error('Update slot error:', error);
        throw error;
    }
});

// @desc    Delete slot
// @route   DELETE /api/slots/:id
// @access  Private
const deleteSlot = asyncHandler(async (req, res) => {
    const { id } = req.params;
    logger.info(`Deleting slot: ${id} by user: ${req.user.username}`);

    try {
        const slot = await Slot.findById(id);

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Slot not found'
            });
        }

        // Check ownership
        if (slot.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this slot'
            });
        }

        // Check if slot is booked
        if (slot.isBooked) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete booked slots'
            });
        }

        await Slot.findByIdAndDelete(id);

        logger.info(`Slot deleted successfully: ${slot.title}`);

        res.json({
            success: true,
            message: 'Slot deleted successfully'
        });

    } catch (error) {
        logger.error('Delete slot error:', error);
        throw error;
    }
});

// @desc    Get user's own slots
// @route   GET /api/slots/my-slots
// @access  Private
const getMySlots = asyncHandler(async (req, res) => {
    logger.info(`Fetching slots for user: ${req.user.username}`);

    const { status, page = 1, limit = 10 } = req.query;

    try {
        const filters = { userId: req.user._id };
        
        if (status === 'active') filters.isActive = true;
        if (status === 'inactive') filters.isActive = false;
        if (status === 'booked') filters.isBooked = true;
        if (status === 'available') {
            filters.isBooked = false;
            filters.isActive = true;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [slots, total] = await Promise.all([
            Slot.find(filters)
                .sort({ dateTime: 1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Slot.countDocuments(filters)
        ]);

        const totalPages = Math.ceil(total / parseInt(limit));

        res.json({
            success: true,
            message: 'Your slots retrieved successfully',
            data: {
                slots,
                pagination: {
                    total,
                    totalPages,
                    currentPage: parseInt(page),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        logger.error('Get my slots error:', error);
        throw error;
    }
});

module.exports = {
    createSlot,
    getSlots,
    getSlot,
    updateSlot,
    deleteSlot,
    getMySlots
};