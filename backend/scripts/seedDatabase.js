require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../config/logger');

const seedUsers = [
    {
        username: 'testuser1',
        email: 'test1@example.com',
        passwordHash: 'password123',
        bio: 'Test user for development',
        skills: ['JavaScript', 'React', 'Node.js'],
        credits: 50
    },
    {
        username: 'testuser2', 
        email: 'test2@example.com',
        passwordHash: 'password123',
        bio: 'Another test user for development',
        skills: ['Python', 'Django', 'PostgreSQL'],
        credits: 75
    }
];

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        // Clear existing users
        await User.deleteMany({});
        console.log('🗑️  Cleared existing users');
        
        // Create new users
        const createdUsers = await User.create(seedUsers);
        console.log(`✅ Created ${createdUsers.length} test users`);
        
        createdUsers.forEach(user => {
            console.log(`   - ${user.username} (${user.email})`);
        });
        
        console.log('🎉 Database seeding completed!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        logger.error('Database seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();