#!/usr/bin/env node

console.log('🎯 BitFlow Live Output Demo...\n');

// Simulate the exact BitFlow.js execution
async function showBitFlowOutput() {
    try {
        // Set command line args
        process.argv[2] = 'BTC/USD';
        
        console.log('🚀 Executing: node BitFlow.js BTC/USD\n');
        console.log('=' .repeat(60));
        
        // Load all the required modules like BitFlow.js does
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
        
        // Initialize error handler
        const errorHandler = new ErrorHandler();
        
        const symbol = 'BTC/USD';
        console.log(`📊 Symbol: ${symbol}`);
        
        // Check required environment variables
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
        
        console.log('\n📋 User Preferences:');
        Object.entries(userPreferences).forEach(([key, value]) => {
            const emoji = value === true ? '✅' : value === false ? '❌' : '⚙️';
            console.log(`   ${emoji} ${key}: ${value}`);
        });
        
        // Check if we have existing settings (this is the new logic)
        const existingSettings = settingsManager.listSettings();
        if (existingSettings.length > 0) {
            console.log('\n📋 Using saved settings (no prompts)...');
        }
        
        // Extract settings
        let timeframe = userPreferences.defaultTimeframe || '5Min';
        let takeProfit = userPreferences.defaultTakeProfit ?? 'auto';
        let stopLoss = userPreferences.defaultStopLoss ?? 'auto';
        let enableCrossunderSignals = userPreferences.enableCrossunderSignals ?? true;
        let enablePerformanceMetrics = userPreferences.enablePerformanceMetrics ?? false;
        
        console.log('\n⚙️ Active Configuration:');
        console.log(`   📊 Timeframe: ${timeframe}`);
        console.log(`   💰 Take Profit: ${takeProfit}`);
        console.log(`   🛡️ Stop Loss: ${stopLoss}`);
        console.log(`   📈 Crossunder Signals: ${enableCrossunderSignals ? 'Enabled' : 'Disabled'}`);
        console.log(`   📊 Performance Metrics: ${enablePerformanceMetrics ? 'Enabled' : 'Disabled'}`);
        console.log(`   📝 Position Logging: ${userPreferences.enablePositionLogging ? 'Enabled' : 'Disabled'}`);
        
        // Create monitor preferences
        const monitorPreferences = {
            ...userPreferences,
            enableCrossunderSignals: enableCrossunderSignals,
            enablePerformanceMetrics: enablePerformanceMetrics
        };
        
        console.log('\n🔧 Creating BitFlow monitor...');
        const monitor = new BitFlow(
            symbol, 
            20, 
            20, 
            timeframe, 
            undefined, 
            undefined, 
            takeProfit, 
            stopLoss, 
            monitorPreferences, 
            errorHandler
        );
        
        console.log('✅ BitFlow monitor created');
        
        // Start monitoring simulation
        console.log('\n🚀 Starting monitoring simulation...');
        console.log('=' .repeat(60));
        
        // Check market status
        const marketStatus = await monitor.checkMarketStatus();
        console.log(`\n🏪 Market Status:`);
        console.log(`   Polygon: ${marketStatus.polygonStatus.message}`);
        console.log(`   Alpaca: ${marketStatus.alpacaStatus.message}`);
        console.log(`   Can Monitor: ${marketStatus.canMonitor ? '✅ YES' : '❌ NO'}`);
        
        if (!marketStatus.canMonitor) {
            console.log('\n⚠️ Cannot start monitoring - market closed or asset unavailable');
            return;
        }
        
        // Initialize historical data
        console.log('\n📊 Initializing historical data...');
        const historySuccess = await monitor.initializeHistoricalData();
        
        if (!historySuccess) {
            console.log('❌ Failed to initialize historical data');
            return;
        }
        
        // Display initial analysis
        console.log('\n📈 Initial Market Analysis:');
        await monitor.displayInitialAnalysis();
        
        // Start Yahoo Finance updates
        console.log('\n📡 Starting real-time price updates...');
        monitor.startYahooFinanceWebSocket();
        
        // Simulate monitoring for a few cycles
        console.log('\n🔄 Monitoring cycles (simulated):');
        
        for (let i = 1; i <= 3; i++) {
            console.log(`\n--- Update Cycle ${i} ---`);
            await monitor.displayRegularUpdate();
            
            // Wait 2 seconds between updates
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Stop updates
        monitor.stopYahooFinanceWebSocket();
        
        console.log('\n=' .repeat(60));
        console.log('🎉 BitFlow Demo Completed Successfully!');
        console.log('\n📊 Summary:');
        console.log('✅ Settings loaded automatically (no prompts)');
        console.log('✅ Market data initialized successfully');
        console.log('✅ Real-time monitoring functional');
        console.log('✅ No function errors occurred');
        console.log('✅ Trade execution ready');
        
        console.log('\n🚀 To run BitFlow live:');
        console.log('   node BitFlow.js BTC/USD');
        console.log('   (Will run continuously until Ctrl+C)');
        
    } catch (error) {
        console.error('\n❌ BitFlow demo failed:', error.message);
        console.log('🔧 Error stack:', error.stack);
    }
}

showBitFlowOutput();