require('dotenv').config();

console.log('🔍 Environment Variables Check');
console.log('================================');

const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'PORT',
    'NODE_ENV',
    'FRONTEND_URL'
];

const optionalVars = [
    'JWT_EXPIRE',
    'LOG_LEVEL',
    'BCRYPT_ROUNDS'
];

let hasErrors = false;

console.log('\n📋 Required Environment Variables:');
requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        if (varName.includes('SECRET') || varName.includes('PASSWORD')) {
            console.log(`✅ ${varName}: ***hidden***`);
        } else if (varName === 'MONGODB_URI') {
            console.log(`✅ ${varName}: ${value.replace(/\/\/.*@/, '//***:***@')}`);
        } else {
            console.log(`✅ ${varName}: ${value}`);
        }
    } else {
        console.log(`❌ ${varName}: NOT SET`);
        hasErrors = true;
    }
});

console.log('\n📋 Optional Environment Variables:');
optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        console.log(`✅ ${varName}: ${value}`);
    } else {
        console.log(`⚠️  ${varName}: Using default`);
    }
});

if (hasErrors) {
    console.log('\n❌ Environment setup incomplete!');
    console.log('Please check your .env file and set the missing variables.');
    process.exit(1);
} else {
    console.log('\n✅ Environment setup complete!');
    process.exit(0);
}