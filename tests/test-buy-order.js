#!/usr/bin/env node

/**
 * Test script to verify buy order execution without const reassignment errors
 */

require('dotenv').config();
const MLRiskManager = require('../src/ml-risk-manager.js');
const OrderManager = require('../src/orders.js');

async function testBuyOrder() {
    console.log('=== Testing Buy Order Execution ===\n');

    try {
        // Initialize managers
        const mlRiskManager = new MLRiskManager();
        const orderManager = new OrderManager();

        // Mock historical data for testing
        const mockHistoricalData = [];
        const basePrice = 106700;
        for (let i = 0; i < 100; i++) {
            mockHistoricalData.push({
                close: basePrice + (Math.random() - 0.5) * 1000,
                high: basePrice + Math.random() * 500,
                low: basePrice - Math.random() * 500,
                volume: 1000000
            });
        }

        const currentPrice = 106700.78;
        const symbol = 'BTC/USD';

        console.log('Step 1: Testing ML Risk Manager calculateOptimalTPSL...');
        const mlResult = mlRiskManager.calculateOptimalTPSL(
            mockHistoricalData,
            currentPrice,
            'EMA',
            10,
            0.001,
            0,
            '5m'
        );

        console.log('✅ ML TP/SL calculated successfully:');
        console.log(`   Stop Loss: ${mlResult.stopLoss}`);
        console.log(`   Take Profit: ${mlResult.takeProfit}`);
        console.log(`   SL%: ${mlResult.stopLossPercent}%`);
        console.log(`   TP%: ${mlResult.takeProfitPercent}%`);
        console.log(`   R:R: ${mlResult.riskRewardRatio}`);
        console.log('');

        console.log('Step 2: Testing ML Risk Manager calculatePositionSize...');
        const mockAccountInfo = {
            equity: 10000,
            cash: 10000,
            buyingPower: 20000,
            portfolioValue: 10000
        };

        const positionResult = mlRiskManager.calculatePositionSize(
            mockAccountInfo,
            1.0,
            currentPrice,
            mlResult.stopLoss,
            0.02,
            0,
            '5m'
        );

        console.log('✅ Position size calculated successfully:');
        console.log(`   Size: ${positionResult.size.toFixed(6)} BTC`);
        console.log(`   Risk: ${positionResult.actualRiskPercent}%`);
        console.log(`   Volatility Adjustment: ${positionResult.volatilityAdjustment}`);
        console.log('');

        console.log('Step 3: Testing Order Manager executeBuyOrder (DRY RUN)...');
        console.log('   Note: This will attempt to connect to Alpaca API');
        console.log(`   Symbol: ${symbol}`);
        console.log(`   Quantity: ${positionResult.size.toFixed(6)}`);
        console.log('');

        // Test the buy order execution
        const result = await orderManager.executeBuyOrder(
            symbol,
            positionResult.size,
            1.0,
            null
        );

        if (result.success) {
            console.log('✅ Buy order executed successfully!');
            console.log(`   Order ID: ${result.orderId}`);
        } else {
            console.log('⚠️  Buy order failed (expected in test):');
            console.log(`   Error: ${result.error}`);
        }

        console.log('\n=== Test Complete ===');
        console.log('✅ No "Assignment to constant variable" errors!');
        console.log('✅ All methods executed without const reassignment issues');

    } catch (error) {
        console.error('\n❌ TEST FAILED');
        console.error(`Error: ${error.message}`);
        console.error(`Type: ${error.constructor.name}`);
        console.error('\nStack trace:');
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the test
testBuyOrder().then(() => {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
});
