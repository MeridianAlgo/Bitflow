#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue('🚀 BitFlow Installation Script'));
console.log(chalk.blue('================================'));

// Check if Node.js is installed
console.log(chalk.yellow('🔍 Checking Node.js installation...'));
try {
    const nodeVersion = execSync('node --version').toString().trim();
    console.log(chalk.green(`✅ Node.js ${nodeVersion} detected`));
} catch (e) {
    console.error(chalk.red('❌ Node.js not found. Please install Node.js before continuing.'));
    process.exit(1);
}

// Check if npm is installed
console.log(chalk.yellow('🔍 Checking npm installation...'));
try {
    const npmVersion = execSync('npm --version').toString().trim();
    console.log(chalk.green(`✅ npm ${npmVersion} detected`));
} catch (e) {
    console.error(chalk.red('❌ npm not found. Please install npm before continuing.'));
    process.exit(1);
}

// Create logs directory if it doesn't exist
console.log(chalk.yellow('📁 Setting up directories...'));
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log(chalk.green('✅ Created logs directory'));
}

// Install dependencies
console.log(chalk.yellow('📦 Installing dependencies...'));
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log(chalk.green('✅ Dependencies installed'));
} catch (e) {
    console.error(chalk.red('❌ Failed to install dependencies'), e.message);
    process.exit(1);
}

// Prefetch models
console.log(chalk.yellow('🤖 Downloading and caching models...'));
try {
    execSync('node scripts/prefetch_models.js', { stdio: 'inherit' });
    console.log(chalk.green('✅ Models cached'));
} catch (e) {
    console.log(chalk.yellow('⚠️ Model prefetch failed, but continuing...'), e.message);
}

// Test if program runs
console.log(chalk.yellow('🧪 Testing program execution...'));
try {
    execSync('node -e "require(\'./BitFlow\'); console.log(\'BitFlow imports successfully\')"', { stdio: 'inherit' });
    console.log(chalk.green('✅ Program runs successfully'));
} catch (e) {
    console.error(chalk.yellow('⚠️ Program test failed, trying alternative path...'));
    try {
        execSync('node -e "require(\'./src/core/BitFlow\'); console.log(\'BitFlow imports successfully\')"', { stdio: 'inherit' });
        console.log(chalk.green('✅ Program runs successfully'));
    } catch (err) {
        console.error(chalk.red('❌ Program test failed'), err.message);
        console.log(chalk.yellow('You may need to set up your environment variables in a .env file'));
        process.exit(1);
    }
}

console.log(chalk.green('🎉 Installation complete! You can now run BitFlow.'));
