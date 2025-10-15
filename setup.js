#!/usr/bin/env node

/**
 * BitFlow Setup Script
 * Installs all required dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('BitFlow Trading Bot - Setup\n');
console.log('Installing dependencies...\n');

try {
    // Install npm packages
    console.log('Installing npm packages...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('\nChecking .env file...');
    
    // Check if .env exists
    if (!fs.existsSync('.env')) {
        console.log('.env file not found. Creating from template...');
        
        if (fs.existsSync('.env.template')) {
            fs.copyFileSync('.env.template', '.env');
            console.log('\n.env file created!');
            console.log('\nIMPORTANT: Edit .env file and add your Alpaca API credentials:');
            console.log('  ALPACA_API_KEY_ID=your_key_here');
            console.log('  ALPACA_SECRET_KEY=your_secret_here');
        } else {
            console.log('Warning: .env.template not found');
        }
    } else {
        console.log('.env file already exists');
    }
    
    // Create historical_data directory
    const dataDir = path.join(__dirname, 'historical_data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('\nCreated historical_data directory');
    }
    
    console.log('\nSetup complete!');
    console.log('\nNext steps:');
    console.log('1. Edit .env file with your Alpaca API credentials');
    console.log('2. Run: node BitFlow.js');
    console.log('\nHappy trading!');
    
} catch (error) {
    console.error('\nSetup failed:', error.message);
    console.error('\nTry running manually:');
    console.error('  npm install');
    process.exit(1);
}
