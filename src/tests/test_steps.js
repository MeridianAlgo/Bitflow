console.log('Testing BitFlow.js step by step...');

try {
    console.log('Step 1: Loading dotenv...');
    require('dotenv').config();
    console.log('✅ dotenv loaded');

    console.log('Step 2: Loading UI...');
    const ui = require('./core/ui');
    console.log('✅ UI loaded');

    console.log('Step 3: Loading TextSettingsManager...');
    const TextSettingsManager = require('./core/textSettingsManager');
    console.log('✅ TextSettingsManager loaded');

    console.log('Step 4: Loading ErrorHandler...');
    const ErrorHandler = require('./core/errorHandler');
    console.log('✅ ErrorHandler loaded');

    console.log('Step 5: Loading BitFlow core...');
    const BitFlow = require('./core/BitFlow');
    console.log('✅ BitFlow core loaded');

    console.log('Step 6: Loading tradeUtils...');
    const { executeTrade } = require('./core/tradeUtils');
    console.log('✅ tradeUtils loaded');

    console.log('Step 7: Destructuring UI...');
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

    console.log('Step 8: Instantiating TextSettingsManager...');
    const settingsManager = new TextSettingsManager();
    console.log('✅ TextSettingsManager instantiated');

    console.log('Step 9: Instantiating ErrorHandler...');
    const errorHandler = new ErrorHandler();
    console.log('✅ ErrorHandler instantiated');

    console.log('🎉 All steps successful!');

} catch (error) {
    console.log('❌ Error at step:', error.message);
    console.log('Stack:', error.stack);
}
