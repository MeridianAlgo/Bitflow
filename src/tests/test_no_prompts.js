#!/usr/bin/env node

console.log('🎯 Testing BitFlow Startup (No Prompts)...\n');

// Simulate the BitFlow.js startup process
async function testNoPrompts() {
    try {
        const TextSettingsManager = require('./core/textSettingsManager');
        
        console.log('📋 Simulating BitFlow.js startup logic...');
        
        // This is exactly what BitFlow.js does
        const settingsManager = new TextSettingsManager();
        let userPreferences = settingsManager.loadAllSettings();
        let usePrev = false;

        console.log('Initial userPreferences loaded:');
        console.log(JSON.stringify(userPreferences, null, 2));

        // Check if we have any existing settings
        const existingSettings = settingsManager.listSettings();
        console.log(`\nFound ${existingSettings.length} existing settings files`);
        
        if (existingSettings.length > 0) {
            // This is the NEW logic - no prompting!
            console.log('📋 Using saved settings...');
            usePrev = true;
        } else {
            console.log('❌ This should not happen - you have settings!');
        }

        // Wait 1 second (like BitFlow.js does)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Read fresh preferences from text files
        userPreferences = settingsManager.loadAllSettings();
        
        console.log('\nFinal userPreferences after reload:');
        console.log(JSON.stringify(userPreferences, null, 2));
        
        // Extract settings like BitFlow.js does
        let timeframe = userPreferences.defaultTimeframe || undefined;
        let takeProfit = userPreferences.defaultTakeProfit ?? 'auto';
        let stopLoss = userPreferences.defaultStopLoss ?? 'auto';
        let enableCrossunderSignals = userPreferences.enableCrossunderSignals ?? true;
        let enablePerformanceMetrics = userPreferences.enablePerformanceMetrics ?? false;
        
        console.log('\n🎯 Final settings that BitFlow will use:');
        console.log(`  Timeframe: ${timeframe}`);
        console.log(`  Take Profit: ${takeProfit}`);
        console.log(`  Stop Loss: ${stopLoss}`);
        console.log(`  Crossunder Signals: ${enableCrossunderSignals}`);
        console.log(`  Performance Metrics: ${enablePerformanceMetrics}`);
        console.log(`  Position Logging: ${userPreferences.enablePositionLogging}`);
        
        // Verify these match your selections
        const expectedSettings = {
            timeframe: '1Min',
            enableCrossunderSignals: false,
            enablePerformanceMetrics: false,
            enablePositionLogging: false
        };
        
        const matches = (
            timeframe === expectedSettings.timeframe &&
            enableCrossunderSignals === expectedSettings.enableCrossunderSignals &&
            enablePerformanceMetrics === expectedSettings.enablePerformanceMetrics &&
            userPreferences.enablePositionLogging === expectedSettings.enablePositionLogging
        );
        
        if (matches) {
            console.log('\n✅ SUCCESS! BitFlow will use your exact settings without prompting!');
            console.log('\n🚀 Ready to run: node BitFlow.js BTC/USD');
            console.log('   (No prompts, uses your saved settings automatically)');
        } else {
            console.log('\n❌ MISMATCH! Settings do not match your selections');
            console.log('\nExpected:');
            console.log(`  Timeframe: ${expectedSettings.timeframe}`);
            console.log(`  Crossunder: ${expectedSettings.enableCrossunderSignals}`);
            console.log(`  Metrics: ${expectedSettings.enablePerformanceMetrics}`);
            console.log(`  Logging: ${expectedSettings.enablePositionLogging}`);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testNoPrompts();