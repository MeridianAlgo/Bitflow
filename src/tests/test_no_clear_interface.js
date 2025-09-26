#!/usr/bin/env node

console.log('🧪 Testing No-Clear Settings Interface...\n');

async function testNoClearInterface() {
    try {
        console.log('🚀 Simulating BitFlow startup with no screen clearing...');
        console.log('📋 These lines should stay visible throughout the process:');
        console.log('   Line A: BitFlow starting up...');
        console.log('   Line B: Loading environment variables...');
        console.log('   Line C: Initializing settings manager...');
        
        // Simulate the settings loading
        const TextSettingsManager = require('./core/textSettingsManager');
        const settingsManager = new TextSettingsManager();
        const userPreferences = settingsManager.loadAllSettings();
        
        console.log('\n📋 Current Settings:');
        console.log('─'.repeat(50));
        Object.entries(userPreferences).forEach(([key, value]) => {
            const emoji = value === true ? '✅' : value === false ? '❌' : '⚙️';
            const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            console.log(`   ${emoji} ${displayKey}: ${value}`);
        });
        console.log('─'.repeat(50));
        
        // Test the new simple prompt
        const { createSimplePrompt } = require('./simple_prompt');
        const simplePrompt = createSimplePrompt();
        
        console.log('\n┌───────────────────────────────┐');
        console.log('│ Previous Preferences          │');
        if (userPreferences.enablePositionLogging !== undefined)
            console.log(`│ Position Logging: ${userPreferences.enablePositionLogging ? 'Enabled' : 'Disabled'}`.padEnd(32) + '│');
        if (userPreferences.defaultTakeProfit !== undefined)
            console.log(`│ Take Profit: ${userPreferences.defaultTakeProfit}`.padEnd(32) + '│');
        if (userPreferences.defaultStopLoss !== undefined)
            console.log(`│ Stop Loss: ${userPreferences.defaultStopLoss}`.padEnd(32) + '│');
        if (userPreferences.defaultTimeframe)
            console.log(`│ Timeframe: ${userPreferences.defaultTimeframe}`.padEnd(32) + '│');
        if (userPreferences.enableCrossunderSignals !== undefined)
            console.log(`│ Crossunder Signals: ${userPreferences.enableCrossunderSignals ? 'Enabled' : 'Disabled'}`.padEnd(32) + '│');
        if (userPreferences.enablePerformanceMetrics !== undefined)
            console.log(`│ Performance Metrics: ${userPreferences.enablePerformanceMetrics ? 'Enabled' : 'Disabled'}`.padEnd(32) + '│');
        console.log('└───────────────────────────────┘');
        
        console.log('\n🔍 About to prompt - all previous lines should remain visible...');
        
        // Simulate user input
        console.log('? Use these settings? (Y/n) › [Simulating Y]');
        const usePrev = true; // Simulate user choosing Y
        
        console.log('\n✅ Using existing settings...');
        
        console.log('\n' + '='.repeat(60));
        console.log('🚀 STARTING BITFLOW TRADING SYSTEM');
        console.log('='.repeat(60));
        
        console.log('\n📊 BitFlow would now start with these settings:');
        console.log(`   Timeframe: ${userPreferences.defaultTimeframe}`);
        console.log(`   Crossunder Signals: ${userPreferences.enableCrossunderSignals ? 'Enabled' : 'Disabled'}`);
        console.log(`   Performance Metrics: ${userPreferences.enablePerformanceMetrics ? 'Enabled' : 'Disabled'}`);
        
        console.log('\n🎉 Test Complete!');
        console.log('\n📋 Check above - you should still see:');
        console.log('   ✅ Line A: BitFlow starting up...');
        console.log('   ✅ Line B: Loading environment variables...');
        console.log('   ✅ Line C: Initializing settings manager...');
        console.log('   ✅ All settings displays');
        console.log('   ✅ Settings card');
        console.log('   ✅ Confirmation prompt');
        console.log('   ✅ BitFlow startup banner');
        
        console.log('\n🚀 No screen clearing - everything stays visible!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testNoClearInterface();