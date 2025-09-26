#!/usr/bin/env node

console.log('🚀 Running BitFlow Live Test...\n');

// Simulate running: node BitFlow.js BTC/USD
process.argv = ['node', 'BitFlow.js', 'BTC/USD'];

async function runBitFlowTest() {
    try {
        console.log('📋 Starting BitFlow with BTC/USD...');
        console.log('⏱️ Running for 30 seconds to test functionality...\n');
        
        // Load and run the main BitFlow application
        require('./BitFlow.js');
        
        // Let it run for 30 seconds then stop
        setTimeout(() => {
            console.log('\n⏹️ Stopping test after 30 seconds...');
            process.exit(0);
        }, 30000);
        
    } catch (error) {
        console.error('❌ BitFlow test failed:', error.message);
        console.log('\n🔧 Error details:', error.stack);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⏹️ BitFlow test stopped by user');
    process.exit(0);
});

runBitFlowTest();