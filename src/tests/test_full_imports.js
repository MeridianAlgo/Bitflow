console.log('Testing BitFlow.js with more imports...');

try {
    // All imports from BitFlow.js
    require('dotenv').config();
    console.log('✅ dotenv loaded');

    const ui = require('./core/ui');
    console.log('✅ UI loaded');

    const TextSettingsManager = require('./core/textSettingsManager');
    console.log('✅ TextSettingsManager loaded');

    const ErrorHandler = require('./core/errorHandler');
    console.log('✅ ErrorHandler loaded');

    const BitFlow = require('./core/BitFlow');
    console.log('✅ BitFlow core loaded');

    const { executeTrade } = require('./core/tradeUtils');
    console.log('✅ tradeUtils loaded');

    // Destructuring
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

    // Instantiations
    const settingsManager = new TextSettingsManager();
    console.log('✅ TextSettingsManager instantiated');

    const errorHandler = new ErrorHandler();
    console.log('✅ ErrorHandler instantiated');

    console.log('🎉 Full test successful!');

} catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Stack:', error.stack);
}
