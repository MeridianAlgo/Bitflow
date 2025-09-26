const HuggingFaceTradingLLM = require('../core/huggingfaceTradingLLM');

async function testFastModels() {
    console.log('🧪 Testing Fast HuggingFace Trading Models...\n');

    // Check if HuggingFace API key is available
    if (!process.env.HUGGINGFACE_API_KEY) {
        console.log('⚠️ HUGGINGFACE_API_KEY not found in environment variables');
        console.log('📝 Please add HUGGINGFACE_API_KEY=your_key_here to your .env file');
        console.log('🔗 Get your free API key from: https://huggingface.co/settings/tokens');
        return;
    }

    const tradingLLM = new HuggingFaceTradingLLM();

    try {
        // Test 1: Initialization
        console.log('📋 Testing model initialization...');
        const startInit = Date.now();
        const initialized = await tradingLLM.initialize();
        const initTime = Date.now() - startInit;
        
        if (initialized) {
            console.log(`✅ Models initialized successfully in ${initTime}ms`);
        } else {
            console.log('❌ Model initialization failed');
            return;
        }

        // Test 2: Position Sizing (Fast calculation)
        console.log('\n📋 Testing position sizing...');
        const startPos = Date.now();
        const positionAdvice = await tradingLLM.getPositionSizeAdvice(1000, 50, 'BTC/USD', 'Bitcoin price is rising due to positive news');
        const posTime = Date.now() - startPos;
        
        console.log(`⚡ Position sizing completed in ${posTime}ms`);
        console.log(`📊 Result: qty=${positionAdvice.qty}, TP=${positionAdvice.takeProfit}%, SL=${positionAdvice.stopLoss}%`);

        // Test 3: Trade Reasoning (Fast)
        console.log('\n📋 Testing trade reasoning...');
        const startReason = Date.now();
        const reasoning = await tradingLLM.getTradeReasoning('BUY', {
            rsi: 65,
            ma_fast: 51000,
            ma_slow: 50000,
            trend: 'up',
            volatility: 0.02
        });
        const reasonTime = Date.now() - startReason;
        
        console.log(`⚡ Trade reasoning completed in ${reasonTime}ms`);
        console.log(`💭 Reasoning: ${reasoning}`);

        // Test 4: Sentiment Analysis (Fast)
        console.log('\n📋 Testing sentiment analysis...');
        const startSent = Date.now();
        const sentiment = await tradingLLM.getMarketSentiment('Bitcoin adoption is increasing with major companies investing in cryptocurrency');
        const sentTime = Date.now() - startSent;
        
        console.log(`⚡ Sentiment analysis completed in ${sentTime}ms`);
        console.log(`😊 Sentiment: ${sentiment}`);

        // Test 5: Quick Trading Decision (All-in-one)
        console.log('\n📋 Testing quick trading decision...');
        const startQuick = Date.now();
        const decision = await tradingLLM.getQuickTradingDecision({
            signal: 'BUY',
            rsi: 45,
            ma_fast: 52000,
            ma_slow: 51000,
            trend: 'up',
            volatility: 0.015
        }, 'Positive market outlook for Bitcoin');
        const quickTime = Date.now() - startQuick;
        
        console.log(`⚡ Quick decision completed in ${quickTime}ms`);
        console.log(`🎯 Decision: ${JSON.stringify(decision, null, 2)}`);

        // Performance Summary
        console.log('\n📊 Performance Summary:');
        console.log(`- Initialization: ${initTime}ms`);
        console.log(`- Position Sizing: ${posTime}ms`);
        console.log(`- Trade Reasoning: ${reasonTime}ms`);
        console.log(`- Sentiment Analysis: ${sentTime}ms`);
        console.log(`- Quick Decision: ${quickTime}ms`);
        
        const totalTime = posTime + reasonTime + sentTime + quickTime;
        console.log(`- Total Processing: ${totalTime}ms`);
        
        if (totalTime < 10000) { // Less than 10 seconds
            console.log('\n🎉 All tests passed! Models are fast enough for real-time trading.');
        } else {
            console.log('\n⚠️ Models are working but may be slow for 1-minute timeframes.');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Check your internet connection');
        console.log('2. Verify your HuggingFace API key is valid');
        console.log('3. Ensure you have sufficient API quota');
    }
}

// Run the test
testFastModels().catch(console.error);
