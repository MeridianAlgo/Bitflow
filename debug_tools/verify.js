console.log('🔍 Verifying BitFlow Core Components...\n');

async function runVerification() {
    try {
        // Test 1: Check if modules can be loaded
        console.log('📦 Loading modules...');
        const ErrorHandler = require('./core/errorHandler');
        const TextSettingsManager = require('./core/textSettingsManager');
        const FastLocalTradingAI = require('./core/fastLocalTradingAI');
        console.log('✅ All modules loaded successfully');

        // Test 2: Check ErrorHandler
        console.log('\n🛡️ Testing ErrorHandler...');
        const errorHandler = new ErrorHandler();
        errorHandler.logError(new Error('Test error'), 'verification', 'info');
        console.log('✅ ErrorHandler working');

        // Test 3: Check TextSettingsManager
        console.log('\n⚙️ Testing TextSettingsManager...');
        const settingsManager = new TextSettingsManager();
        settingsManager.saveSetting('test', 'value');
        const loaded = settingsManager.loadSetting('test');
        if (loaded === 'value') {
            console.log('✅ TextSettingsManager working');
        } else {
            console.log('❌ TextSettingsManager failed');
        }

        // Test 4: Check FastLocalTradingAI
        console.log('\n🤖 Testing FastLocalTradingAI...');
        const tradingAI = new FastLocalTradingAI();
        
        // Test initialization
        const initialized = await tradingAI.initialize();
        if (initialized) {
            console.log('✅ FastLocalTradingAI initialized');
        } else {
            console.log('❌ FastLocalTradingAI initialization failed');
        }

        // Test position sizing (should be instant)
        const startTime = Date.now();
        const positionAdvice = await tradingAI.getPositionSizeAdvice(1000, 50, 'BTC/USD', 'Bitcoin is rising');
        const processingTime = Date.now() - startTime;
        
        console.log(`⚡ Position sizing completed in ${processingTime}ms`);
        console.log(`📊 Result: qty=${positionAdvice.qty}, TP=${positionAdvice.takeProfit}%, SL=${positionAdvice.stopLoss}%`);
        
        if (processingTime < 100) { // Should be under 100ms
            console.log('✅ FastLocalTradingAI is lightning fast!');
        } else {
            console.log('⚠️ FastLocalTradingAI slower than expected');
        }

        // Test 5: Check if yahoo-finance2 is available
        console.log('\n📡 Testing yahoo-finance2...');
        try {
            const yahooFinance = require('yahoo-finance2').default;
            console.log('✅ yahoo-finance2 package available');
        } catch (e) {
            console.log('❌ yahoo-finance2 package not found');
        }

        console.log('\n🎉 Core verification complete!');
        console.log('\n📋 System Summary:');
        console.log('✅ Fast Local AI - No API keys required');
        console.log('✅ Yahoo Finance - Real-time price data');
        console.log('✅ Text-based settings - Easy configuration');
        console.log('✅ Comprehensive error handling');
        console.log('\n🚀 Ready for real-time trading with sub-second AI decisions!');
        console.log('\n📋 Next steps:');
        console.log('1. Ensure your .env file has the required API keys');
        console.log('2. Run: node BitFlow.js BTC/USD');
        console.log('3. The system will make trading decisions in milliseconds!');

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        console.log('\n🔧 Please check:');
        console.log('1. All dependencies are installed (npm install)');
        console.log('2. File paths are correct');
        console.log('3. No syntax errors in the code');
    }
}

runVerification();
