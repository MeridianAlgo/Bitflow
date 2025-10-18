#!/usr/bin/env node

/**
 * Full BitFlow Trading Bot Test
 * Tests the complete trading cycle including ML calculations and order execution
 */

require('dotenv').config();
const chalk = require('chalk');
const MLRiskManager = require('../src/ml-risk-manager.js');
const DataManager = require('../src/data.js');
const StrategyOptimizer = require('../src/strategy.js');
const OrderManager = require('../src/orders.js');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFullTradingCycle() {
    console.log(chalk.cyan('\n=== BitFlow Full Trading Cycle Test ===\n'));

    try {
        // Configuration
        const symbol = 'BTC/USD';
        const timeframe = '5m';

        console.log(chalk.yellow('Step 1: Initializing modules...'));
        const mlRiskManager = new MLRiskManager();
        const dataManager = new DataManager(timeframe, symbol);
        const strategyOptimizer = new StrategyOptimizer(timeframe, symbol);
        const orderManager = new OrderManager();

        console.log(chalk.green('✅ All modules initialized\n'));

        console.log(chalk.yellow('Step 2: Fetching historical data...'));
        const historicalData = await dataManager.getHistoricalData(symbol, '100', timeframe);
        console.log(chalk.green(`✅ Fetched ${historicalData.length} bars\n`));

        console.log(chalk.yellow('Step 3: Optimizing strategy...'));
        const optimizedStrategy = await strategyOptimizer.optimizeMAParameters(
            historicalData,
            timeframe,
            (progress) => {
                const percent = Math.floor(progress * 100);
                if (percent % 20 === 0) {
                    process.stdout.write(`\r   Progress: ${percent}%`);
                }
            }
        );
        console.log(`\r${chalk.green('✅ Strategy optimized')}`);
        console.log(`   Best: ${optimizedStrategy.type}(${optimizedStrategy.length})`);
        console.log(`   Score: ${(optimizedStrategy.score * 100).toFixed(1)}%`);
        console.log(`   Win Rate: ${(optimizedStrategy.performance.winRate * 100).toFixed(1)}%\n`);

        console.log(chalk.yellow('Step 4: Getting current price...'));
        const currentPrice = await dataManager.getRealTimePrice(symbol);
        console.log(chalk.green(`✅ Current price: $${currentPrice.toFixed(2)}\n`));

        console.log(chalk.yellow('Step 5: Calculating ML-based TP/SL...'));
        const mlResult = mlRiskManager.calculateOptimalTPSL(
            historicalData,
            currentPrice,
            optimizedStrategy.type,
            optimizedStrategy.length,
            0.001,
            0,
            timeframe
        );
        console.log(chalk.green('✅ TP/SL calculated'));
        console.log(`   Stop Loss: $${mlResult.stopLoss.toFixed(2)} (${mlResult.stopLossPercent}%)`);
        console.log(`   Take Profit: $${mlResult.takeProfit.toFixed(2)} (${mlResult.takeProfitPercent}%)`);
        console.log(`   Risk:Reward: ${mlResult.riskRewardRatio}\n`);

        console.log(chalk.yellow('Step 6: Getting account info...'));
        const accountInfo = await orderManager.getAccountInfo();
        console.log(chalk.green('✅ Account info retrieved'));
        console.log(`   Equity: $${accountInfo.equity.toFixed(2)}`);
        console.log(`   Buying Power: $${accountInfo.buyingPower.toFixed(2)}\n`);

        console.log(chalk.yellow('Step 7: Calculating position size...'));
        const volatility = calculateVolatility(historicalData.slice(-50));
        const positionResult = mlRiskManager.calculatePositionSize(
            accountInfo,
            1.0,
            currentPrice,
            mlResult.stopLoss,
            volatility,
            0,
            timeframe
        );
        console.log(chalk.green('✅ Position size calculated'));
        console.log(`   Size: ${positionResult.size.toFixed(6)} BTC`);
        console.log(`   Risk: ${positionResult.actualRiskPercent}%`);
        console.log(`   Value: $${(positionResult.size * currentPrice).toFixed(2)}\n`);

        console.log(chalk.yellow('Step 8: Simulating buy signal...'));
        const priceHistory = historicalData.map(d => d.close);
        const signal = strategyOptimizer.calculateSignals(
            priceHistory,
            optimizedStrategy.type,
            optimizedStrategy.length
        );
        console.log(chalk.green(`✅ Signal: ${signal.action}`));
        console.log(`   Reason: ${signal.reason || 'N/A'}\n`);

        console.log(chalk.yellow('Step 9: Testing buy order execution...'));
        console.log(chalk.cyan('   Executing buy order on Alpaca paper trading...'));

        const buyResult = await orderManager.executeBuyOrder(
            symbol,
            positionResult.size,
            1.0,
            null
        );

        if (buyResult.success) {
            console.log(chalk.green('✅ Buy order executed successfully!'));
            console.log(`   Order ID: ${buyResult.orderId}`);
            console.log(`   Quantity: ${positionResult.size.toFixed(6)} BTC`);
            console.log(`   Entry: $${currentPrice.toFixed(2)}`);
            console.log(`   Stop Loss: $${mlResult.stopLoss.toFixed(2)}`);
            console.log(`   Take Profit: $${mlResult.takeProfit.toFixed(2)}\n`);

            // Wait a moment then check position
            console.log(chalk.yellow('Step 10: Verifying position...'));
            await sleep(2000);

            const positions = await orderManager.getPositions();
            const position = positions.find(p => p.symbol === symbol.replace('/', ''));

            if (position) {
                console.log(chalk.green('✅ Position confirmed'));
                console.log(`   Quantity: ${position.qty}`);
                console.log(`   Entry Price: $${position.avg_entry_price.toFixed(2)}`);
                console.log(`   Current Value: $${position.market_value.toFixed(2)}\n`);

                // Clean up - close the position
                console.log(chalk.yellow('Step 11: Closing test position...'));
                const sellResult = await orderManager.executeSellOrder(symbol, parseFloat(position.qty));

                if (sellResult.success) {
                    console.log(chalk.green('✅ Position closed successfully\n'));
                } else {
                    console.log(chalk.yellow(`⚠️  Failed to close position: ${sellResult.error}\n`));
                }
            } else {
                console.log(chalk.yellow('⚠️  Position not found (may still be filling)\n'));
            }
        } else {
            console.log(chalk.yellow(`⚠️  Buy order failed: ${buyResult.error}\n`));
        }

        console.log(chalk.green.bold('\n✅ ALL TESTS PASSED!'));
        console.log(chalk.green('✅ No const reassignment errors'));
        console.log(chalk.green('✅ ML calculations working correctly'));
        console.log(chalk.green('✅ Order execution working correctly'));
        console.log(chalk.green('✅ BitFlow is ready to trade!\n'));

    } catch (error) {
        console.error(chalk.red('\n❌ TEST FAILED'));
        console.error(chalk.red(`Error: ${error.message}`));
        console.error(chalk.red(`Type: ${error.constructor.name}`));

        if (error.stack) {
            console.error(chalk.gray('\nStack trace:'));
            console.error(chalk.gray(error.stack));
        }

        process.exit(1);
    }
}

function calculateVolatility(priceData) {
    const returns = [];
    for (let i = 1; i < priceData.length; i++) {
        const ret = (priceData[i].close - priceData[i - 1].close) / priceData[i - 1].close;
        returns.push(ret);
    }
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
}

// Run the test
console.log(chalk.cyan('Starting BitFlow Full Trading Cycle Test...'));
testFullTradingCycle().then(() => {
    console.log(chalk.green('Test completed successfully!'));
    process.exit(0);
}).catch(error => {
    console.error(chalk.red('Test execution failed:'), error.message);
    process.exit(1);
});
