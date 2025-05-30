// create-log-setup.js - Run this to set up logging
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('✅ Created logs directory');
}

// Create log files
const logFiles = [
    'frontend.log',
    'backend.log',
    'debug.log',
    'error.log'
];

logFiles.forEach(file => {
    const filePath = path.join(logsDir, file);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, `# ${file} - Created on ${new Date().toISOString()}\n`);
        console.log(`✅ Created ${file}`);
    }
});

// Create .gitkeep for logs directory
const gitkeepPath = path.join(logsDir, '.gitkeep');
if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
    console.log('✅ Created .gitkeep for logs directory');
}

console.log('\n🎉 Log setup completed successfully!');
console.log('📁 Logs will be saved in: ' + logsDir);
console.log('\nLog files created:');
logFiles.forEach(file => {
    console.log(`  📄 ${file}`);
});

console.log('\n📋 Next steps:');
console.log('1. Run: npm run dev:debug (for frontend with logs)');
console.log('2. Run: npm run backend:debug (for backend with logs)');
console.log('3. Check logs in the ./logs/ directory');