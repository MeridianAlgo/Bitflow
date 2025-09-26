#!/usr/bin/env node

console.log('🧪 Testing Settings Flow...\n');

const TextSettingsManager = require('./core/textSettingsManager');

async function testSettingsFlow() {
    const settingsManager = new TextSettingsManager();
    
    console.log('1️⃣ Initial state - loadAllSettings():');
    let userPreferences = settingsManager.loadAllSettings();
    console.log(JSON.stringify(userPreferences, null, 2));
    
    console.log('\n2️⃣ Simulating your selections:');
    const yourSelections = {
        enablePositionLogging: false,        // You selected disabled
        defaultTakeProfit: 'auto',
        defaultStopLoss: 'auto', 
        defaultTimeframe: '1Min',            // You selected 1Min
        enableCrossunderSignals: false,      // You selected disabled
        enablePerformanceMetrics: false      // You selected disabled
    };
    
    console.log('Your selections:');
    console.log(JSON.stringify(yourSelections, null, 2));
    
    console.log('\n3️⃣ Saving your selections...');
    settingsManager.saveAllSettings(yourSelections);
    
    console.log('\n4️⃣ Reading back after save:');
    userPreferences = settingsManager.loadAllSettings();
    console.log(JSON.stringify(userPreferences, null, 2));
    
    console.log('\n5️⃣ Checking individual files:');
    console.log(`enablePositionLogging: ${settingsManager.loadSetting('enablePositionLogging')}`);
    console.log(`enablePerformanceMetrics: ${settingsManager.loadSetting('enablePerformanceMetrics')}`);
    console.log(`enableCrossunderSignals: ${settingsManager.loadSetting('enableCrossunderSignals')}`);
    console.log(`defaultTimeframe: ${settingsManager.loadSetting('defaultTimeframe')}`);
    
    console.log('\n✅ Settings should now match your selections!');
}

testSettingsFlow();