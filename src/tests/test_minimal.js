console.log('Testing minimal BitFlow.js...');

try {
    // Essential imports only
    require('dotenv').config();
    console.log('✅ dotenv loaded');

    const ui = require('./core/ui');
    console.log('✅ UI loaded');

    const TextSettingsManager = require('./core/textSettingsManager');
    console.log('✅ TextSettingsManager loaded');

    // Try the destructuring that's in BitFlow.js
    const {
        promptTimeframe,
        promptTakeProfit,
        promptStopLoss,
        promptUserPreferences,
        promptUsePreviousPreferences,
        promptCrossunderSignals,
        promptPerformanceMetrics,
        printBanner,
        printStatus,
        printSuccess,
        printWarning,
        printError,
        printSection
    } = ui;
    console.log('✅ UI destructured');

    // Try TextSettingsManager instantiation
    const settingsManager = new TextSettingsManager();
    console.log('✅ TextSettingsManager instantiated');

    console.log('🎉 Minimal test successful!');

} catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Stack:', error.stack);
}
