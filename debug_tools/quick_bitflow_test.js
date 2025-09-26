#!/usr/bin/env node

console.log('🎯 Quick BitFlow Startup Test...\n');

async function quickTest() {
    try {
        // Set up the command line arguments like the real BitFlow.js
        process.argv[2] = 'BTC/USD';
        
        console.log('📋 Simulating: node BitFlow.js BTC/USD');
        console.log('⏱️ Testing startup sequence...\n');
        
        // Load required modules
        require('dotenv').config();
        const BitFlow = require('./core/BitFlow');
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
        
        console.log('✅ All modules loaded successfully');
        
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
            console.log('⚠️ Missing environment variables:', missingVars);
        } else {
            console.log('✅ All environment variables present');
        }
        
        // Initialize settings manager
        const settingsManager = new TextSettingsManager();
        let userPreferences = settingsManager.loadAllSettings();
        
        console.log('📋 Loaded user preferences:');
        Object.entries(userPreferences).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
        });
        
        // Check existing settings
        const existingSettings = settingsManager.listSettings();
        console.log(`\n📁 Found ${existingSettings.length} existing settings files`);
        
        if (existingSettings.length > 0) {
            console.log('📋 Using saved settings (no prompts)...');
        }
        
        // Create BitFlow instance
        console.log('\n🔧 Creating BitFlow instance...');
        const monitor = new BitFlow(
            'BTC/USD', 
            20, 
            20, 
            userPreferences.defaultTimeframe,
            undefined,
            undefined,
            userPreferences.defaultTakeProfit,
            userPreferences.defaultStopLoss,
            userPreferences
        );
        
        console.log('✅ BitFlow instance created');
        
        // Test market status
        console.log('\n🏪 Checking market status...');
        const marketStatus = await monitor.checkMarketStatus();
        console.log(`   Polygon: ${marketStatus.polygonStatus.message}`);
        console.log(`   Alpaca: ${marketStatus.alpacaStatus.message}`);
        console.log(`   Can Monitor: ${marketStatus.canMonitor ? '✅ Yes' : '❌ No'}`);
        
        if (!marketStatus.canMonitor) {
            console.log('⚠️ Cannot monitor - market closed or asset not tradable');
            return;
        }
        
        // Test data initialization
        console.log('\n📊 Initializing historical data...');
        const initSuccess = await monitor.initializeHistoricalData();
        
        if (!initSuccess) {
            console.log('❌ Data initialization failed');
            return;
        }
        
        console.log('✅ Data initialization successful');
        
        // Test initial analysis
        console.log('\n📈 Running initial market analysis...');
        await monitor.displayInitialAnalysis();
        
        // Test one update cycle
        console.log('\n🔄 Testing regular update cycle...');
        await monitor.displayRegularUpdate();
        
        console.log('\n🎉 BitFlow startup test completed successfully!');
        console.log('\n📋 Summary:');
        console.log('✅ Environment variables loaded');
        console.log('✅ Settings loaded automatically (no prompts)');
        console.log('✅ BitFlow instance created');
        console.log('✅ Market status checked');
        console.log('✅ Historical data initialized');
        console.log('✅ Initial analysis completed');
        console.log('✅ Regular update cycle working');
        
        console.log('\n🚀 BitFlow is ready for live monitoring!');
        console.log('   To run live: node BitFlow.js BTC/USD');
        
    } catch (error) {
        console.error('❌ BitFlow startup test failed:', error.message);
        console.log('\n🔧 Error stack:', error.stack);
    }
}

quickTest();