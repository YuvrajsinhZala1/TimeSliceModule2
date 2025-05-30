const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
    try {
        logger.info('Attempting to connect to MongoDB...');
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Removed deprecated options
            serverSelectionTimeoutMS: 10000, // 10 seconds timeout
            socketTimeoutMS: 45000, // 45 seconds timeout
            family: 4 // Use IPv4, skip trying IPv6
        });

        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        logger.info(`Database Name: ${conn.connection.name}`);
        
        // Database connection event listeners for debugging
        mongoose.connection.on('connected', () => {
            logger.info('Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            logger.error('Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('Mongoose disconnected from MongoDB');
        });

        // Handle process termination
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                logger.info('MongoDB connection closed through app termination');
                process.exit(0);
            } catch (error) {
                logger.error('Error closing MongoDB connection:', error);
                process.exit(1);
            }
        });

        return conn;
    } catch (error) {
        logger.error('Database connection error:', error);
        logger.error('Full error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;