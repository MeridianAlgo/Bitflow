console.log('Testing BitFlow.js import structure...');

try {
    // Import all modules in the same order as BitFlow.js
    const ui = require('./core/ui');
    console.log('✅ UI imported');

    const TextSettingsManager = require('./core/textSettingsManager');
    console.log('✅ TextSettingsManager imported');

    const ErrorHandler = require('./core/errorHandler');
    console.log('✅ ErrorHandler imported');

    const BitFlow = require('./core/BitFlow');
    console.log('✅ BitFlow core imported');

    const { executeTrade } = require('./core/tradeUtils');
    console.log('✅ tradeUtils imported');

    // Try to destructure the UI functions
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
    console.log('✅ UI destructuring successful');

    // Try to instantiate TextSettingsManager
    const settingsManager = new TextSettingsManager();
    console.log('✅ TextSettingsManager instantiated');

    // Try to instantiate ErrorHandler
    const errorHandler = new ErrorHandler();
    console.log('✅ ErrorHandler instantiated');

    console.log('🎉 All imports and instantiations successful!');

} catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Stack:', error.stack);
}
