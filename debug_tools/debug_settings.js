#!/usr/bin/env node

console.log('🔍 Debugging Settings Loading...\n');

const TextSettingsManager = require('./core/textSettingsManager');

function debugSettings() {
    const settingsManager = new TextSettingsManager();
    
    console.log('📁 Available settings files:');
    const availableSettings = settingsManager.listSettings();
    availableSettings.forEach(setting => {
        console.log(`   ${setting}.txt`);
    });
    
    console.log('\n📖 Raw file contents:');
    availableSettings.forEach(key => {
        const rawValue = settingsManager.loadSetting(key, 'NOT_FOUND');
        console.log(`   ${key}: "${rawValue}" (type: ${typeof rawValue})`);
    });
    
    console.log('\n⚙️ loadAllSettings() result:');
    const allSettings = settingsManager.loadAllSettings();
    Object.entries(allSettings).forEach(([key, value]) => {
        console.log(`   ${key}: ${value} (type: ${typeof value})`);
    });
    
    console.log('\n🔧 Testing individual loads:');
    console.log(`   enablePerformanceMetrics: ${settingsManager.loadSetting('enablePerformanceMetrics', 'DEFAULT')}`);
    console.log(`   enablePositionLogging: ${settingsManager.loadSetting('enablePositionLogging', 'DEFAULT')}`);
    console.log(`   enableCrossunderSignals: ${settingsManager.loadSetting('enableCrossunderSignals', 'DEFAULT')}`);
    
    console.log('\n🎯 Expected vs Actual:');
    console.log('   Expected: enablePerformanceMetrics = false');
    console.log(`   Actual:   enablePerformanceMetrics = ${allSettings.enablePerformanceMetrics}`);
    console.log('   Expected: enablePositionLogging = false');
    console.log(`   Actual:   enablePositionLogging = ${allSettings.enablePositionLogging}`);
    console.log('   Expected: enableCrossunderSignals = false');
    console.log(`   Actual:   enableCrossunderSignals = ${allSettings.enableCrossunderSignals}`);
}

debugSettings();