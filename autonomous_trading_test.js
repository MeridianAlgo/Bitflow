/**
 * Autonomous Trading Decision Test
 *
 * This script demonstrates the AI making completely independent trading decisions
 * based on real-time market data, news, and technical indicators.
 *
 * Usage: node autonomous_trading_test.js
 */

const SmartModelManager = require('./core/smartModelManager');

async function testAutonomousTrading() {
    console.log('🤖 AUTONOMOUS TRADING DECISION TEST');
    console.log('═'.repeat(50));
    console.log('Testing AI models making independent trading decisions...');
    console.log('No hardcoded prompts - AI decides completely on its own!\n');

    const smartModelManager = new SmartModelManager();

    // Test scenarios with different market conditions
    const testScenarios = [
        {
            name: 'Bullish Market Rally',
            data: {
                price: 55000,
                rsi: 75, // Overbought
                ma_fast: 52000,
                ma_slow: 50000,
                volume: 2500000,
                volatility: 0.03,
                trend: 'bullish',
                symbol: 'BTC/USD',
                timeframe: '1Min',
                news: 'Bitcoin breaks $55,000 as institutional adoption accelerates. Major banks announce crypto custody services.'
            }
        },
        {
            name: 'Bearish Market Drop',
            data: {
                price: 45000,
                rsi: 25, // Oversold
                ma_fast: 48000,
                ma_slow: 49000,
                volume: 3000000,
                volatility: 0.08,
                trend: 'bearish',
                symbol: 'BTC/USD',
                timeframe: '1Min',
                news: 'Bitcoin crashes below $45,000 amid regulatory concerns. Government officials discuss crypto trading bans.'
            }
        },
        {
            name: 'Sideways Consolidation',
            data: {
                price: 50000,
                rsi: 55, // Neutral
                ma_fast: 49800,
                ma_slow: 50200,
                volume: 1200000,
                volatility: 0.015,
                trend: 'neutral',
                symbol: 'BTC/USD',
                timeframe: '1Min',
                news: 'Bitcoin trades sideways as market awaits Federal Reserve decision. Analysts expect range-bound trading to continue.'
            }
        },
        {
            name: 'High Volatility Event',
            data: {
                price: 50500,
                rsi: 60,
                ma_fast: 49500,
                ma_slow: 48500,
                volume: 5000000,
                volatility: 0.12, // Very high volatility
                trend: 'bullish',
                symbol: 'BTC/USD',
                timeframe: '1Min',
                news: 'BREAKING: Major cryptocurrency exchange hacked, $100M in Bitcoin stolen. Market reacts with extreme volatility.'
            }
        }
    ];

    const results = [];

    for (const scenario of testScenarios) {
        console.log(`\n📊 SCENARIO: ${scenario.name}`);
        console.log('─'.repeat(50));
        console.log(`💰 Price: $${scenario.data.price.toLocaleString()}`);
        console.log(`📈 RSI: ${scenario.data.rsi}`);
        console.log(`📊 Fast MA: $${scenario.data.ma_fast.toLocaleString()}`);
        console.log(`📊 Slow MA: $${scenario.data.ma_slow.toLocaleString()}`);
        console.log(`📊 Trend: ${scenario.data.trend}`);
        console.log(`⚡ Volatility: ${(scenario.data.volatility * 100).toFixed(1)}%`);
        console.log(`📰 News: ${scenario.data.news.substring(0, 100)}...`);

        const startTime = Date.now();
        const decision = await smartModelManager.makeAutonomousTradingDecision(scenario.data);
        const responseTime = Date.now() - startTime;

        console.log(`\n🤖 AI DECISION (${responseTime}ms):`);
        console.log(`   🏦 Action: ${decision.decision.action}`);
        console.log(`   📊 Confidence: ${(decision.decision.confidence * 100).toFixed(1)}%`);
        console.log(`   🎯 Risk Level: ${decision.decision.risk_level}`);
        console.log(`   💭 Reasoning: ${decision.decision.reasoning}`);

        results.push({
            scenario: scenario.name,
            decision: decision.decision,
            responseTime,
            model: decision.model
        });

        console.log('─'.repeat(50));
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log('\n🎯 AUTONOMOUS TRADING SUMMARY');
    console.log('═'.repeat(50));

    const totalTime = results.reduce((sum, r) => sum + r.responseTime, 0);
    const avgTime = totalTime / results.length;

    console.log(`⏱️ Average Response Time: ${Math.round(avgTime)}ms`);
    console.log(`🤖 Model Used: ${results[0].model}`);
    console.log(`📊 Total Scenarios Tested: ${results.length}`);

    console.log('\n📋 DECISION BREAKDOWN:');
    results.forEach((result, index) => {
        const emoji = result.decision.action === 'BUY' ? '🟢' : result.decision.action === 'SELL' ? '🔴' : '🟡';
        console.log(`${emoji} ${result.scenario}: ${result.decision.action} (${(result.decision.confidence * 100).toFixed(1)}% confidence)`);
    });

    console.log('\n✅ Autonomous trading test complete!');
    console.log('The AI is making completely independent decisions based on raw market data!');
    console.log('No hardcoded prompts or human guidance - pure AI analysis! 🚀');
}

// Run test if executed directly
if (require.main === module) {
    testAutonomousTrading().catch(console.error);
}

module.exports = { testAutonomousTrading };
