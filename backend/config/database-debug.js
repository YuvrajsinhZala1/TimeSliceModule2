const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
    try {
        console.log('🔌 Attempting to connect to MongoDB...');
        console.log(`📍 Connection string: ${process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@') || 'NOT PROVIDED'}`);
        
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000, // 10 seconds timeout
            socketTimeoutMS: 45000, // 45 seconds timeout
            family: 4, // Use IPv4, skip trying IPv6
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            heartbeatFrequencyMS: 2000, // Send a ping every 2 seconds
            retryWrites: true
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📦 Database Name: ${conn.connection.name}`);
        console.log(`🔗 Connection State: ${getConnectionState(conn.connection.readyState)}`);
        
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        logger.info(`Database Name: ${conn.connection.name}`);
        
        // Database connection event listeners for debugging
        mongoose.connection.on('connected', () => {
            console.log('🟢 Mongoose connected to MongoDB');
            logger.info('Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('🔴 Mongoose connection error:', err);
            logger.error('Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('🟡 Mongoose disconnected from MongoDB');
            logger.warn('Mongoose disconnected from MongoDB');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🟢 Mongoose reconnected to MongoDB');
            logger.info('Mongoose reconnected to MongoDB');
        });

        // Handle process termination
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('🔌 MongoDB connection closed through app termination');
                logger.info('MongoDB connection closed through app termination');
                process.exit(0);
            } catch (error) {
                console.error('❌ Error closing MongoDB connection:', error);
                logger.error('Error closing MongoDB connection:', error);
                process.exit(1);
            }
        });

        return conn;
    } catch (error) {
        console.error('❌ Database connection error:');
        console.error(`   Message: ${error.message}`);
        console.error(`   Name: ${error.name}`);
        
        if (error.name === 'MongoServerSelectionError') {
            console.error('💡 This usually means:');
            console.error('   1. MongoDB is not running');
            console.error('   2. Wrong connection string');
            console.error('   3. Network connectivity issues');
            console.error('   4. Authentication problems');
        }
        
        logger.error('Database connection error:', error);
        logger.error('Full error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // Don't exit immediately, let the calling code handle it
        throw error;
    }
};

function getConnectionState(state) {
    const states = {
        0: 'Disconnected',
        1: 'Connected', 
        2: 'Connecting',
        3: 'Disconnecting'
    };
    return states[state] || 'Unknown';
}

module.exports = connectDB;