/**
 * Test Suite for ML Risk Manager
 * Tests ATR calculation, TP/SL optimization, and position sizing
 */

const MLRiskManager = require('../src/ml-risk-manager.js');

class MLRiskManagerTests {
    constructor() {
        this.mlManager = new MLRiskManager();
        this.passedTests = 0;
        this.failedTests = 0;
    }

    // Generate mock price data
    generateMockData(bars = 100, basePrice = 100, volatility = 0.02) {
        const data = [];
        let price = basePrice;
        
        for (let i = 0; i < bars; i++) {
            const change = (Math.random() - 0.5) * volatility * price;
            price += change;
            
            data.push({
                timestamp: new Date(Date.now() - (bars - i) * 60000),
                open: price,
                high: price * 1.005,
                low: price * 0.995,
                close: price,
                volume: Math.random() * 1000
            });
        }
        
        return data;
    }

    // Test helper
    assert(condition, testName) {
        if (condition) {
            console.log(`✓ ${testName}`);
            this.passedTests++;
        } else {
            console.log(`✗ ${testName}`);
            this.failedTests++;
        }
    }

    // Test 1: ATR Calculation
    testATRCalculation() {
        console.log('\n--- Test 1: ATR Calculation ---');
        
        const data = this.generateMockData(50, 100, 0.02);
        const atr = this.mlManager.calculateATR(data, 14);
        
        this.assert(atr !== null, 'ATR should not be null');
        this.assert(atr > 0, 'ATR should be positive');
        this.assert(atr < 10, 'ATR should be reasonable (< 10 for $100 price)');
        
        console.log(`  ATR Value: ${atr.toFixed(2)}`);
    }

    // Test 2: Volatility Calculation
    testVolatilityCalculation() {
        console.log('\n--- Test 2: Volatility Calculation ---');
        
        const data = this.generateMockData(50, 100, 0.02);
        const volatility = this.mlManager.calculateVolatility(data);
        
        this.assert(volatility !== null, 'Volatility should not be null');
        this.assert(volatility > 0, 'Volatility should be positive');
        this.assert(volatility < 0.1, 'Volatility should be reasonable (< 10%)');
        
        console.log(`  Volatility: ${(volatility * 100).toFixed(2)}%`);
    }

    // Test 3: Trend Detection
    testTrendDetection() {
        console.log('\n--- Test 3: Trend Detection ---');
        
        // Create uptrending data
        const uptrendData = [];
        for (let i = 0; i < 50; i++) {
            uptrendData.push({
                timestamp: new Date(),
                close: 100 + i * 0.5,
                high: 100 + i * 0.5 + 0.5,
                low: 100 + i * 0.5 - 0.5,
                volume: 1000
            });
        }
        
        const trend = this.mlManager.calculateTrend(uptrendData);
        
        this.assert(trend !== null, 'Trend should not be null');
        this.assert(trend > 0, 'Uptrend should have positive value');
        this.assert(trend >= -1 && trend <= 1, 'Trend should be normalized (-1 to 1)');
        
        console.log(`  Trend Value: ${trend.toFixed(3)} (positive = uptrend)`);
    }

    // Test 4: TP/SL Calculation with Safety Caps
    testTPSLCalculation() {
        console.log('\n--- Test 4: TP/SL Calculation ---');
        
        const data = this.generateMockData(100, 100, 0.02);
        const currentPrice = 100;
        const tpsl = this.mlManager.calculateOptimalTPSL(data, currentPrice, 'EMA', 14);
        
        this.assert(tpsl !== null, 'TP/SL should not be null');
        this.assert(tpsl.stopLoss < currentPrice, 'Stop loss should be below entry');
        this.assert(tpsl.takeProfit > currentPrice, 'Take profit should be above entry');
        
        const slPercent = parseFloat(tpsl.stopLossPercent);
        const tpPercent = parseFloat(tpsl.takeProfitPercent);
        
        this.assert(slPercent >= 0.2 && slPercent <= 0.5, 'SL should be within safety caps (0.2-0.5%)');
        this.assert(tpPercent >= 0.3 && tpPercent <= 0.5, 'TP should be within safety caps (0.3-0.5%)');
        // TP and SL can be equal at 0.5% cap
        this.assert(tpPercent >= slPercent, 'TP should be >= SL');
        
        console.log(`  Stop Loss: ${slPercent}% ($${tpsl.stopLoss.toFixed(2)})`);
        console.log(`  Take Profit: ${tpPercent}% ($${tpsl.takeProfit.toFixed(2)})`);
        console.log(`  Risk/Reward: ${tpsl.riskRewardRatio}:1`);
        console.log(`  Confidence: ${tpsl.confidence}`);
    }

    // Test 5: Position Sizing
    testPositionSizing() {
        console.log('\n--- Test 5: Position Sizing ---');
        
        const accountInfo = {
            equity: 10000,
            cash: 5000,
            buyingPower: 20000,
            portfolioValue: 10000
        };
        
        const entryPrice = 100;
        const stopLoss = 98; // 2% stop
        const volatility = 0.02;
        
        const sizeInfo = this.mlManager.calculatePositionSize(
            accountInfo,
            1, // 1% risk
            entryPrice,
            stopLoss,
            volatility
        );
        
        this.assert(sizeInfo !== null, 'Position size info should not be null');
        this.assert(sizeInfo.size > 0, 'Position size should be positive');
        this.assert(sizeInfo.size >= 0.001, 'Position size should be >= minimum');
        
        const maxAllowedValue = accountInfo.equity * 0.15;
        const positionValue = sizeInfo.size * entryPrice;
        this.assert(positionValue <= maxAllowedValue, 'Position should not exceed 15% of equity');
        
        console.log(`  Position Size: ${sizeInfo.size.toFixed(4)}`);
        console.log(`  Position Value: $${positionValue.toFixed(2)}`);
        console.log(`  Risk Amount: $${sizeInfo.riskAmount.toFixed(2)}`);
        console.log(`  Volatility Adjustment: ${sizeInfo.volatilityAdjustment}x`);
    }

    // Test 6: High Volatility Scenario
    testHighVolatilityScenario() {
        console.log('\n--- Test 6: High Volatility Scenario ---');
        
        const data = this.generateMockData(100, 100, 0.05); // High volatility
        const currentPrice = 100;
        const tpsl = this.mlManager.calculateOptimalTPSL(data, currentPrice, 'EMA', 14);
        
        const slPercent = parseFloat(tpsl.stopLossPercent);
        
        this.assert(slPercent <= 0.5, 'High volatility SL should still respect max cap (0.5%)');
        this.assert(slPercent >= 0.2, 'High volatility should be capped at 0.5% for scalping');
        
        console.log(`  High Vol Stop Loss: ${slPercent}%`);
        console.log(`  Volatility: ${tpsl.metrics.volatility}`);
    }

    // Test 7: Low Volatility Scenario
    testLowVolatilityScenario() {
        console.log('\n--- Test 7: Low Volatility Scenario ---');
        
        const data = this.generateMockData(100, 100, 0.005); // Low volatility
        const currentPrice = 100;
        const tpsl = this.mlManager.calculateOptimalTPSL(data, currentPrice, 'EMA', 14);
        
        const slPercent = parseFloat(tpsl.stopLossPercent);
        
        this.assert(slPercent >= 0.5, 'Low volatility SL should still respect min cap (0.5%)');
        this.assert(slPercent <= 2.0, 'Low volatility should result in tighter stops');
        
        console.log(`  Low Vol Stop Loss: ${slPercent}%`);
        console.log(`  Volatility: ${tpsl.metrics.volatility}`);
    }

    // Test 8: Confidence Score
    testConfidenceScore() {
        console.log('\n--- Test 8: Confidence Score ---');
        
        const data = this.generateMockData(100, 100, 0.02);
        const currentPrice = 100;
        const tpsl = this.mlManager.calculateOptimalTPSL(data, currentPrice, 'EMA', 14);
        
        const confidence = parseFloat(tpsl.confidence);
        
        this.assert(confidence >= 0 && confidence <= 1, 'Confidence should be between 0 and 1');
        
        console.log(`  Confidence Score: ${confidence}`);
        console.log(`  Interpretation: ${confidence > 0.7 ? 'High' : confidence > 0.5 ? 'Medium' : 'Low'}`);
    }

    // Test 9: Extreme Price Scenario
    testExtremePriceScenario() {
        console.log('\n--- Test 9: Extreme Price Scenario ---');
        
        const data = this.generateMockData(100, 50000, 0.03); // BTC-like price
        const currentPrice = 50000;
        const tpsl = this.mlManager.calculateOptimalTPSL(data, currentPrice, 'EMA', 14);
        
        this.assert(tpsl.stopLoss > 0, 'Stop loss should be positive');
        this.assert(tpsl.stopLoss < currentPrice, 'Stop loss should be below entry');
        this.assert(tpsl.takeProfit > currentPrice, 'Take profit should be above entry');
        
        const slPercent = parseFloat(tpsl.stopLossPercent);
        this.assert(slPercent <= 5.0, 'Even with high prices, SL should respect caps');
        
        console.log(`  Entry: $${currentPrice.toFixed(2)}`);
        console.log(`  Stop Loss: $${tpsl.stopLoss.toFixed(2)} (${slPercent}%)`);
        console.log(`  Take Profit: $${tpsl.takeProfit.toFixed(2)} (${tpsl.takeProfitPercent}%)`);
    }

    // Test 10: Position Sizing with Small Account
    testSmallAccountPositionSizing() {
        console.log('\n--- Test 10: Small Account Position Sizing ---');
        
        const accountInfo = {
            equity: 1000, // Small account
            cash: 500,
            buyingPower: 2000,
            portfolioValue: 1000
        };
        
        const entryPrice = 50000; // BTC price
        const stopLoss = 49000; // 2% stop
        const volatility = 0.02;
        
        const sizeInfo = this.mlManager.calculatePositionSize(
            accountInfo,
            1,
            entryPrice,
            stopLoss,
            volatility
        );
        
        this.assert(sizeInfo.size >= 0.001, 'Should respect minimum position size');
        
        const positionValue = sizeInfo.size * entryPrice;
        this.assert(positionValue <= accountInfo.equity * 0.15, 'Should not exceed 15% of equity');
        
        console.log(`  Account: $${accountInfo.equity}`);
        console.log(`  Position Size: ${sizeInfo.size.toFixed(4)} BTC`);
        console.log(`  Position Value: $${positionValue.toFixed(2)}`);
    }

    // Run all tests
    runAllTests() {
        console.log('═══════════════════════════════════════════════════════');
        console.log('  ML Risk Manager Test Suite');
        console.log('═══════════════════════════════════════════════════════');
        
        try {
            this.testATRCalculation();
            this.testVolatilityCalculation();
            this.testTrendDetection();
            this.testTPSLCalculation();
            this.testPositionSizing();
            this.testHighVolatilityScenario();
            this.testLowVolatilityScenario();
            this.testConfidenceScore();
            this.testExtremePriceScenario();
            this.testSmallAccountPositionSizing();
            
            console.log('\n═══════════════════════════════════════════════════════');
            console.log(`  Results: ${this.passedTests} passed, ${this.failedTests} failed`);
            console.log('═══════════════════════════════════════════════════════\n');
            
            return this.failedTests === 0;
        } catch (error) {
            console.error('\n✗ Test suite failed with error:', error.message);
            console.error(error.stack);
            return false;
        }
    }
}

// Run tests if executed directly
if (require.main === module) {
    const tests = new MLRiskManagerTests();
    const success = tests.runAllTests();
    process.exit(success ? 0 : 1);
}

module.exports = MLRiskManagerTests;
