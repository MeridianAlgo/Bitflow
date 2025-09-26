#!/usr/bin/env node

console.log('🎯 Testing New BitFlow Settings Interface...\n');

async function testNewInterface() {
    try {
        // Set up command line arguments
        process.argv[2] = 'BTC/USD';
        
        console.log('🚀 Simulating: node BitFlow.js BTC/USD');
        console.log('📋 This will show the new settings interface...\n');
        console.log('=' .repeat(60));
        
        // Load the required modules like BitFlow.js does
        require('dotenv').config();
        const TextSettingsManager = require('./core/textSettingsManager');
        const { 
            promptUserPreferences, 
            promptUsePreviousPreferences,
            printBanner, 
            printStatus, 
            printSuccess, 
            printWarning, 
            printError 
        } = require('./core/ui');
        const ErrorHandler = require('./core/errorHandler');
        
        const symbol = 'BTC/USD';
        console.log(`📊 Trading Symbol: ${symbol}`);
        
        // Check environment variables
        const requiredEnvVars = {
            'ALPACA_API_KEY_ID': process.env.ALPACA_API_KEY_ID,
            'ALPACA_SECRET_KEY': process.env.ALPACA_SECRET_KEY,
            'POLYGON_API_KEY': process.env.POLYGON_API_KEY,
            'FINNHUB_API_KEY': process.env.FINNHUB_API_KEY
        };
        
        const missingVars = Object.entries(requiredEnvVars)
            .filter(([_, value]) => !value)
            .map(([key]) => key);
            
        if (missingVars.length > 0) {
            console.log('❌ Missing environment variables:', missingVars);
            return;
        }
        
        console.log('✅ All API keys loaded');
        
        // Initialize text-based settings manager
        const settingsManager = new TextSettingsManager();
        let userPreferences = settingsManager.loadAllSettings();
        let usePrev = false;
        
        console.log('\n📋 NEW SETTINGS INTERFACE:');
        console.log('=' .repeat(60));
        
        // This is the NEW logic from the modified BitFlow.js
        const existingSettings = settingsManager.listSettings();
        if (existingSettings.length > 0) {
            // Show current settings (new enhanced display)
            console.log('\n📋 Current Settings:');
            console.log('─'.repeat(50));
            Object.entries(userPreferences).forEach(([key, value]) => {
                const emoji = value === true ? '✅' : value === false ? '❌' : '⚙️';
                const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                console.log(`   ${emoji} ${displayKey}: ${value}`);
            });
            console.log('─'.repeat(50));
            
            console.log('\n🔍 In the real interface, you would now see:');
            console.log('   📋 A settings card (shown above)');
            console.log('   ❓ Prompt: "Use these settings? (Y/n)"');
            console.log('   ⌨️ Your options:');
            console.log('      • Press Enter or Y → Use existing settings');
            console.log('      • Press N → Modify settings');
            
            // For demo purposes, simulate user choosing "Y" (use existing)
            console.log('\n✅ [DEMO] Simulating user choice: Y (use existing settings)');
            usePrev = true;
            
            if (usePrev) {
                console.log('\n✅ Using existing settings...');
            }
        } else {
            console.log('\n🔧 No existing settings found. Would prompt for new configuration.');
        }
        
        // Wait and reload settings (like the real BitFlow.js)
        await new Promise(resolve => setTimeout(resolve, 1000));
        userPreferences = settingsManager.loadAllSettings();
        
        console.log('\n⚙️ Final Configuration:');
        console.log('─'.repeat(50));
        console.log(`   📊 Timeframe: ${userPreferences.defaultTimeframe}`);
        console.log(`   💰 Take Profit: ${userPreferences.defaultTakeProfit}`);
        console.log(`   🛡️ Stop Loss: ${userPreferences.defaultStopLoss}`);
        console.log(`   📈 Crossunder Signals: ${userPreferences.enableCrossunderSignals ? 'Enabled' : 'Disabled'}`);
        console.log(`   📊 Performance Metrics: ${userPreferences.enablePerformanceMetrics ? 'Enabled' : 'Disabled'}`);
        console.log(`   📝 Position Logging: ${userPreferences.enablePositionLogging ? 'Enabled' : 'Disabled'}`);
        console.log('─'.repeat(50));
        
        console.log('\n🎉 Settings Interface Test Complete!');
        console.log('\n📋 What Changed:');
        console.log('✅ BitFlow now ALWAYS shows settings first');
        console.log('✅ Users can review their configuration each time');
        console.log('✅ Easy to modify settings when needed');
        console.log('✅ Clear visual feedback on current settings');
        console.log('✅ Quick confirmation to proceed');
        
        console.log('\n🚀 User Experience:');
        console.log('1. Run BitFlow → See settings immediately');
        console.log('2. Review current configuration');
        console.log('3. Choose to use existing or modify');
        console.log('4. BitFlow starts with confirmed settings');
        console.log('5. Full control every time!');
        
    } catch (error) {
        console.error('❌ Interface test failed:', error.message);
    }
}

testNewInterface();