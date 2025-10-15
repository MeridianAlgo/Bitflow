/**
 * Test Suite for Scalping TP/SL (0.5% max)
 * Tests the ultra-tight TP/SL caps for scalping
 */

const MLRiskManager = require('../src/ml-risk-manager.js');

class ScalpingTPSLTests {
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

    // Test 1: Max TP Cap at 0.5%
    testMaxTPCap() {
        console.log('\n--- Test 1: Max TP Cap at 0.5% ---');
        
        const data = this.generateMockData(100, 100, 0.05); // High volatility
        const currentPrice = 100;
        const tpsl = this.mlManager.calculateOptimalTPSL(data, currentPrice, 'EMA', 14, 0.001, 0);
        
        const tpPercent = parseFloat(tpsl.takeProfitPercent);
        
        this.assert(tpPercent <= 0.5, 'TP should be capped at 0.5%');
        this.assert(tpPercent >= 0.3, 'TP should be at least 0.3%');
        
        console.log(`  TP: ${tpPercent}% (max 0.5%)`);
        console.log(`  TP Price: ${tpsl.takeProfit.toFixed(2)}`);
    }

    // Test 2: Max SL Cap at 0.5%
    testMaxSLCap() {
        console.log('\n--- Test 2: Max SL Cap at 0.5% ---');
        
        const data = this.generateMockData(100, 100, 0.05); // High volatility
        const currentPrice = 100;
        const tpsl = this.mlManager.calculateOptimalTPSL(data, currentPrice, 'EMA', 14, 0.001, 0);
        
        const slPercent = parseFloat(tpsl.stopLossPercent);
        
        this.assert(slPercent <= 0.5, 'SL should be capped at 0.5%');
        this.assert(slPercent >= 0.2, 'SL should be at least 0.2%');
        
        console.log(`  SL: ${slPercent}% (max 0.5%)`);
        console.log(`  SL Price: ${tpsl.stopLoss.toFixed(2)}`);
    }

    // Test 3: Scalping on BTC Price
    testScalpingBTCPrice() {
        console.log('\n--- Test 3: Scalping on BTC Price ---');
        
        const data = this.generateMockData(100, 100000, 0.02); // BTC-like price
        const currentPrice = 100000;
        const tpsl = this.mlManager.calculateOptimalTPSL(data, currentPrice, 'EMA', 14, 0.001, 0);
        
        const tpPercent = parseFloat(tpsl.takeProfitPercent);
        const slPercent = parseFloat(tpsl.stopLossPercent);
        
        // Calculate dollar amounts
        const tpDollar = currentPrice * (tpPercent / 100);
        const slDollar = currentPrice * (slPercent / 100);
        
        this.assert(tpPercent <= 0.5, 'TP should be capped at 0.5%');
        this.assert(slPercent <= 0.5, 'SL should be capped at 0.5%');
        this.assert(tpDollar <= 500, 'TP should be max $500 on $100k');
        this.assert(slDollar <= 500, 'SL should be max $500 on $100k');
        
        console.log(`  Entry: $${currentPrice.toFixed(2)}`);
        console.log(`  TP: ${tpPercent}% ($${tpDollar.toFixed(2)})`);
        console.log(`  SL: ${slPercent}% ($${slDollar.toFixed(2)})`);
    }

    // Test 4: Fee Impact on Scalping
    testFeeImpactOnScalping() {
        console.log('\n--- Test 4: Fee Impact on Scalping ---');
        
        const data = this.generateMockData(100, 100, 0.02);
        const currentPrice = 100;
        const positionSize = 0.01; // Larger position
        const tpsl = this.mlManager.calculateOptimalTPSL(data, currentPrice, 'EMA', 14, positionSize, 0);
        
        this.assert(tpsl.fees !== undefined, 'Should include fee calculations');
        this.assert(tpsl.fees.tpScenario !== undefined, 'Should have TP scenario fees');
        this.assert(tpsl.fees.slScenario !== undefined, 'Should have SL scenario fees');
        
        const tpFees = parseFloat(tpsl.fees.tpScenario.totalFees);
        const tpProfit = parseFloat(tpsl.fees.tpScenario.netProfit);
        
        this.assert(tpProfit > 0, 'Should still be profitable after fees');
        
        console.log(`  Position: ${positionSize} BTC`);
        console.log(`  TP Fees: $${tpFees.toFixed(4)}`);
        console.log(`  Net Profit: $${tpProfit.toFixed(4)}`);
    }

    // Test 5: Min TP/SL Floors
    testMinTPSLFloors() {
        console.log('\n--- Test 5: Min TP/SL Floors ---');
        
        const data = this.generateMockData(100, 100, 0.001); // Very low volatility
        const currentPrice = 100;
        const tpsl = this.mlManager.calculateOptimalTPSL(data, currentPrice, 'EMA', 14, 0.001, 0);
        
        const tpPercent = parseFloat(tpsl.takeProfitPercent);
        const slPercent = parseFloat(tpsl.stopLossPercent);
        
        this.assert(tpPercent >= 0.3, 'TP should have min floor of 0.3%');
        this.assert(slPercent >= 0.2, 'SL should have min floor of 0.2%');
        
        console.log(`  Low volatility scenario:`);
        console.log(`  TP: ${tpPercent}% (min 0.3%)`);
        console.log(`  SL: ${slPercent}% (min 0.2%)`);
    }

    // Test 6: Risk/Reward Ratio with Tight Caps
    testRiskRewardWithTightCaps() {
        console.log('\n--- Test 6: Risk/Reward with Tight Caps ---');
        
        const data = this.generateMockData(100, 100, 0.02);
        const currentPrice = 100;
        const tpsl = this.mlManager.calculateOptimalTPSL(data, currentPrice, 'EMA', 14, 0.001, 0);
        
        const rr = parseFloat(tpsl.riskRewardRatio);
        
        this.assert(rr > 0, 'Risk/reward should be positive');
        this.assert(rr <= 2.5, 'Risk/reward should be reasonable with tight caps');
        
        console.log(`  Risk/Reward: ${rr}:1`);
        console.log(`  TP: ${tpsl.takeProfitPercent}%`);
        console.log(`  SL: ${tpsl.stopLossPercent}%`);
    }

    // Test 7: Position Sizing with Scalping
    testPositionSizingWithScalping() {
        console.log('\n--- Test 7: Position Sizing with Scalping ---');
        
        const accountInfo = {
            equity: 10000,
            cash: 5000,
            buyingPower: 20000,
            portfolioValue: 10000
        };
        
        const entryPrice = 100;
        const stopLoss = 99.5; // 0.5% stop
        const volatility = 0.02;
        
        const sizeInfo = this.mlManager.calculatePositionSize(
            accountInfo,
            1, // 1% risk
            entryPrice,
            stopLoss,
            volatility,
            0
        );
        
        this.assert(sizeInfo.size > 0, 'Should calculate position size');
        this.assert(sizeInfo.fees !== undefined, 'Should include fee calculations');
        
        const actualRisk = parseFloat(sizeInfo.actualRiskPercent);
        this.assert(actualRisk <= 1.1, 'Actual risk should be close to 1%');
        
        console.log(`  Position Size: ${sizeInfo.size.toFixed(4)}`);
        console.log(`  Actual Risk: ${actualRisk}%`);
        console.log(`  Fees: $${sizeInfo.fees.totalFees}`);
    }

    // Test 8: Scalping Profitability
    testScalpingProfitability() {
        console.log('\n--- Test 8: Scalping Profitability ---');
        
        const data = this.generateMockData(100, 100, 0.02);
        const currentPrice = 100;
        const positionSize = 0.01;
        const tpsl = this.mlManager.calculateOptimalTPSL(data, currentPrice, 'EMA', 14, positionSize, 0);
        
        const netProfit = parseFloat(tpsl.fees.tpScenario.netProfit);
        const netLoss = parseFloat(tpsl.fees.slScenario.netLoss);
        
        this.assert(netProfit > 0, 'TP scenario should be profitable after fees');
        this.assert(netLoss > 0, 'SL scenario should have loss');
        this.assert(netProfit < netLoss * 2, 'Profit should be reasonable vs loss');
        
        console.log(`  Net Profit (TP): $${netProfit.toFixed(4)}`);
        console.log(`  Net Loss (SL): $${netLoss.toFixed(4)}`);
        console.log(`  Profit/Loss Ratio: ${(netProfit / netLoss).toFixed(2)}:1`);
    }

    // Run all tests
    runAllTests() {
        console.log('═══════════════════════════════════════════════════════');
        console.log('  Scalping TP/SL Test Suite (0.5% Max)');
        console.log('═══════════════════════════════════════════════════════');
        
        try {
            this.testMaxTPCap();
            this.testMaxSLCap();
            this.testScalpingBTCPrice();
            this.testFeeImpactOnScalping();
            this.testMinTPSLFloors();
            this.testRiskRewardWithTightCaps();
            this.testPositionSizingWithScalping();
            this.testScalpingProfitability();
            
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
    const tests = new ScalpingTPSLTests();
    const success = tests.runAllTests();
    process.exit(success ? 0 : 1);
}

module.exports = ScalpingTPSLTests;
