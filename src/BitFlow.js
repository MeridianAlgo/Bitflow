#!/usr/bin/env node

/**
 * BitFlow Modular Trading Bot v3.0
 * Main orchestrator for the modular cryptocurrency trading system
 */

require('dotenv').config();
const chalk = require('chalk');
const inquirer = require('inquirer');

// Import modules
const MLRiskManager = require('./ml-risk-manager.js');
const DataManager = require('./data');
const StrategyOptimizer = require('./strategy');
const OrderManager = require('./orders');

class BitFlowBot {
    constructor() {
        this.dataManager = null;
        this.strategyOptimizer = null;
        this.orderManager = null;
        this.mlRiskManager = new MLRiskManager();
        this.isRunning = false;
        this.currentSymbol = null;
        this.currentTimeframe = null;
        this.optimizedStrategy = null;
        this.historicalData = []; // Store full historical data in memory
        this.startTime = new Date();
        this.useMLRisk = false;
        this.accountBalance = 10000; // Paper trading balance
        this.riskPerTrade = 1; // 1% risk per trade
    }

    displayWelcome() {
        console.clear();
        console.log('\n=== BitFlow Trading Bot v3.0 ===\n');
    }

    validateEnvironment() {
        const required = ['ALPACA_API_KEY_ID', 'ALPACA_SECRET_KEY'];
        const missing = required.filter(key => !process.env[key]);

        if (missing.length > 0) {
            console.error('Missing environment variables:');
            missing.forEach(key => console.error(`  ${key}`));
            console.error('\nPlease create a .env file with your Alpaca API credentials');
            throw new Error('Environment validation failed');
        }
        console.log('Environment validated');
    }

    async getUserConfiguration() {
        const questions = [
            {
                type: 'list',
                name: 'timeframe',
                message: 'Select trading timeframe:',
                choices: [
                    { name: '1 Minute - High frequency', value: '1m' },
                    { name: '5 Minutes - Recommended', value: '5m' },
                    { name: '15 Minutes - Conservative', value: '15m' }
                ],
                default: '5m'
            },
            {
                type: 'input',
                name: 'symbol',
                message: 'Enter cryptocurrency symbol:',
                default: 'BTC/USD',
                validate: (input) => {
                    const valid = ['BTC/USD', 'ETH/USD', 'XRP/USD', 'ADA/USD', 'SOL/USD'];
                    return valid.includes(input.toUpperCase()) || `Use: ${valid.join(', ')}`;
                },
                filter: (input) => input.toUpperCase()
            },
            {
                type: 'list',
                name: 'riskMode',
                message: 'TP/SL calculation method:',
                choices: [
                    { name: 'ML-Based (Adaptive ATR + Volatility)', value: 'ml' },
                    { name: 'Manual (Fixed percentages)', value: 'manual' }
                ],
                default: 'ml'
            },
            {
                type: 'list',
                name: 'positionSizing',
                message: 'Position sizing method:',
                choices: [
                    { name: 'ML-Based (Dynamic, timeframe-adjusted)', value: 'ml' },
                    { name: 'Manual (Fixed 0.001 BTC)', value: 'manual' }
                ],
                default: 'ml'
            }
        ];

        const answers = await inquirer.prompt(questions);

        // If manual mode, ask for TP/SL settings
        if (answers.riskMode === 'manual') {
            const manualQuestions = [
                {
                    type: 'input',
                    name: 'stopLossPercent',
                    message: 'Stop Loss percentage:',
                    default: '1.5',
                    validate: (input) => {
                        const num = parseFloat(input);
                        return (num > 0 && num <= 10) || 'Enter a value between 0 and 10';
                    },
                    filter: (input) => parseFloat(input)
                },
            ];
            const manualAnswers = await inquirer.prompt(manualQuestions);
            Object.assign(answers, manualAnswers);
        }

        console.log(`\nConfiguration: ${answers.symbol} on ${answers.timeframe}`);
        if (answers.riskMode === 'ml') {
            console.log(`TP/SL: ${chalk.cyan('ML-Based')} (Adaptive ATR + Volatility Analysis)`);
            console.log(`Position Sizing: ${chalk.cyan(answers.positionSizing === 'ml' ? 'Dynamic (Adaptive based on timeframe)' : 'Fixed (0.001 BTC)')}\n`);
        } else {
            console.log(`TP/SL: ${answers.stopLossPercent}% SL, ${(answers.stopLossPercent * answers.riskRewardRatio).toFixed(2)}% TP (${answers.riskRewardRatio}:1)`);
            console.log(`Position Sizing: Fixed (0.001 BTC)\n`);
        }
        return answers;
    }

    async initialize() {
        try {
            this.displayWelcome();
            this.validateEnvironment();

            const config = await this.getUserConfiguration();
            this.currentSymbol = config.symbol;
            this.currentTimeframe = config.timeframe;
            this.useMLRisk = config.riskMode === 'ml';
            this.positionSizing = config.positionSizing || 'ml';
            this.stopLossPercent = config.stopLossPercent || 1.5;
            this.riskRewardRatio = config.riskRewardRatio || 2.0;

            this.dataManager = new DataManager(this.currentTimeframe, this.currentSymbol);
            this.strategyOptimizer = new StrategyOptimizer(this.currentTimeframe, this.currentSymbol);
            this.orderManager = new OrderManager();

            // Get real-time account information
            console.log('Fetching account information...');
            this.accountInfo = await this.orderManager.getAccountInfo();
            if (this.accountInfo) {
                console.log(`Account Balance: ${this.accountInfo.equity.toFixed(2)}`);
                if (this.accountInfo.buyingPower !== undefined) {
                    console.log(`Buying Power: ${this.accountInfo.buyingPower.toFixed(2)}`);
                }
                if (this.accountInfo.cash !== undefined) {
                    console.log(`Cash: ${this.accountInfo.cash.toFixed(2)}`);
                }
                console.log('');

                // Update account balance for ML calculations
                this.accountBalance = this.accountInfo.equity;
            } else {
                console.log('Warning: Could not fetch account info, using default 10,000\n');
                this.accountInfo = {
                    equity: 10000,
                    cash: 10000,
                    buyingPower: 20000,
                    portfolioValue: 10000
                };
                this.accountBalance = 10000;
            }

            // Close all existing positions on startup
            console.log('Checking for existing positions...');
            await this.closeAllPositions();

            console.log('Initialized\n');
            return true;
        } catch (error) {
            console.error('\nInitialization Failed');
            console.error(`Reason: ${error.message}\n`);
            return false;
        }
    }

    async closeAllPositions() {
        try {
            const positions = await this.orderManager.getPositions();

            if (positions && positions.length > 0) {
                console.log(`Found ${positions.length} open position(s). Closing...`);

                for (const pos of positions) {
                    const symbol = pos.symbol.includes('/') ? pos.symbol : pos.symbol.replace(/USD$/, '/USD');
                    console.log(`Closing ${pos.qty} ${symbol}...`);

                    const result = await this.orderManager.executeSellOrder(symbol, parseFloat(pos.qty));
                    if (result.success) {
                        console.log(`Closed ${symbol}`);
                    } else {
                        console.log(`Failed to close ${symbol}: ${result.message}`);
                    }
                }
                console.log('All positions closed\n');
            } else {
                console.log('No existing positions\n');
            }
        } catch (error) {
            console.log(`Error closing positions: ${error.message}\n`);
        }
    }

    async optimizeStrategy() {
        try {
            let barCount = 500; // Start with 500 recent bars
            let maxScore = 0;
            let winRate = 0;
            let attempts = 0;
            const maxAttempts = 3; // 500, 1500, 3500 bars

            // Keep fetching CUMULATIVE data until win rate >= 60% or max attempts
            while (winRate < 0.60 && attempts < maxAttempts) {
                attempts++;

                // CLI Progress Bar for fetching
                process.stdout.write(`\rFetching ${barCount} bars [${chalk.cyan('░░░░░░░░░░')}] 0%`);

                let allData = await this.dataManager.getHistoricalData(this.currentSymbol, barCount.toString(), this.currentTimeframe);

                process.stdout.write(`\rFetching ${barCount} bars [${chalk.green('██████████')}] 100% ✓\n`);

                // Store in memory ONLY (NO CSV, NO CACHE)
                this.historicalData = allData;
                console.log(`Loaded ${allData.length} bars (Attempt ${attempts}/${maxAttempts})\n`);

                // CLI Progress Bar for optimization
                const totalCombinations = 7 * 26; // 7 MA types * 26 lengths (5-30)
                let currentProgress = 0;

                // Pass progress callback to optimizer
                this.optimizedStrategy = await this.strategyOptimizer.optimizeMAParameters(
                    allData,
                    this.currentTimeframe,
                    (progress) => {
                        currentProgress = progress;
                        const percent = Math.floor(progress * 100);
                        const filled = Math.floor(progress * 30);
                        const empty = 30 - filled;
                        const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
                        process.stdout.write(`\rOptimizing MA [${bar}] ${percent}%`);
                    }
                );

                process.stdout.write(`\rOptimizing MA [${chalk.green('█'.repeat(30))}] 100% ✓\n`);

                // Check win rate
                winRate = this.optimizedStrategy.performance.winRate;
                maxScore = this.optimizedStrategy.score;

                const winRateColor = winRate >= 0.60 ? chalk.green : chalk.red;
                console.log(`Best: ${this.optimizedStrategy.type}(${this.optimizedStrategy.length}) | Score: ${(maxScore * 100).toFixed(1)}% | Win Rate: ${winRateColor((winRate * 100).toFixed(1) + '%')}\n`);

                // If win rate below 60%, wait and fetch MORE CUMULATIVE data
                if (winRate < 0.60) {
                    if (attempts < maxAttempts) {
                        // Wait 5 seconds before fetching more
                        console.log(chalk.yellow(`Win rate below 60%, waiting 5 seconds before fetching more data...\n`));
                        await this.sleep(5000);

                        // Add more bars cumulatively: 500 → 1500 → 3500
                        if (attempts === 1) {
                            barCount = 1500; // Add 1000 more (500 + 1000)
                        } else if (attempts === 2) {
                            barCount = 3500; // Add 2000 more (1500 + 2000)
                        }

                        console.log(chalk.yellow(`Fetching ${barCount} total bars (adding older data)...\n`));
                    } else {
                        console.log(chalk.yellow(`Warning: Could not achieve 60% win rate after ${maxAttempts} attempts. Proceeding with best available strategy.\n`));
                        break;
                    }
                } else {
                    break;
                }
            }

            console.log(chalk.green(`✓ Optimization Complete | Final Score: ${(maxScore * 100).toFixed(1)}%\n`));

        } catch (error) {
            console.error('\nOptimization Failed:', error.message);
            process.exit(1);
        }
    }

    getTimeframeMultiplier() {
        const multipliers = {
            '1m': 3 * 60 * 1000,   // 3 minutes
            '5m': 15 * 60 * 1000,  // 15 minutes
            '15m': 45 * 60 * 1000  // 45 minutes
        };
        return multipliers[this.currentTimeframe] || 15 * 60 * 1000;
    }

    calculateCurrentMA(priceHistory) {
        const maValues = this.strategyOptimizer.calculateMA(
            priceHistory,
            this.optimizedStrategy.type,
            this.optimizedStrategy.length
        );
        const currentMA = maValues && maValues.length > 0 ? maValues[maValues.length - 1] : priceHistory[priceHistory.length - 1];
        return currentMA;
    }

    calculateVolatility(priceData) {
        const returns = [];
        for (let i = 1; i < priceData.length; i++) {
            const ret = (priceData[i].close - priceData[i - 1].close) / priceData[i - 1].close;
            returns.push(ret);
        }
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        return Math.sqrt(variance);
    }

    displayDetailedSummary(currentPrice, currentMA, position) {
        const priceDiff = currentPrice - currentMA;
        const priceDiffPercent = (priceDiff / currentMA * 100).toFixed(3);
        const timestamp = new Date().toLocaleString();

        const priceVsMA = currentPrice > currentMA ? 'ABOVE' : currentPrice < currentMA ? 'BELOW' : 'AT';
        const crossoverNeeded = currentPrice > currentMA ?
            `drop below $${currentMA.toFixed(2)} to SELL` :
            `rise above $${currentMA.toFixed(2)} to BUY`;

        let summaryLine = `[${timestamp}] SUMMARY: Price $${currentPrice.toFixed(2)} | MA(${this.optimizedStrategy.length}) $${currentMA.toFixed(2)} | ${priceVsMA} MA (${priceDiffPercent}%) | Crossover: ${crossoverNeeded}`;

        if (position) {
            const pnl = ((currentPrice - position.entryPrice) / position.entryPrice * 100).toFixed(2);
            const holdTime = ((new Date() - position.entryTime) / 1000 / 60).toFixed(1);
            summaryLine += ` | Position: Entry $${position.entryPrice.toFixed(2)}, P&L ${pnl}%, Hold ${holdTime}m`;
        } else {
            summaryLine += ` | Position: NONE`;
        }

        console.log(summaryLine + '\n');
    }

    async startTrading() {
        console.log('Starting real-time trading...\n');

        const summaryInterval = this.getTimeframeMultiplier();
        const summaryMinutes = summaryInterval / 60000;
        console.log(`Summary: Every ${summaryMinutes} minutes\n`);

        this.isRunning = true;
        let position = null;

        // Use historical data from optimization as base (in memory, NO CSV)
        let priceHistory = this.historicalData.map(d => d.close);
        console.log(`Starting with ${priceHistory.length} historical prices for MA calculation\n`);

        let checkCount = 0;
        let previousPriceVsMA = null; // Track previous position relative to MA (null = not initialized yet)
        let initializationWaitTicks = 10; // Wait 10 ticks (5 minutes) after initialization before allowing trades
        let lastLogTime = Date.now(); // Track when we last printed a new line (for 1-minute logging)
        let initializationComplete = false; // Track if initialization is complete

        while (this.isRunning) {
            try {
                checkCount++;

                // Dynamic sleep interval: 1 second when in position, 30 seconds when not
                const sleepInterval = position ? 1000 : 30000;

                // Get FRESH current price with retry logic (NO CACHING)
                let currentPrice;
                let retries = 0;
                while (retries < 3) {
                    try {
                        currentPrice = await this.dataManager.getRealTimePrice(this.currentSymbol);
                        break;
                    } catch (error) {
                        retries++;
                        if (retries >= 3) throw error;
                        console.log(`Connection error, retrying (${retries}/3)...`);
                        await this.sleep(2000);
                    }
                }

                // Add FRESH current price to history (NO CACHING)
                priceHistory.push(currentPrice);

                // Keep last 1000 prices (rolling window, NO CACHING)
                if (priceHistory.length > 1000) {
                    priceHistory.shift();
                }

                const signal = this.strategyOptimizer.calculateSignals(
                    priceHistory,
                    this.optimizedStrategy.type,
                    this.optimizedStrategy.length
                );

                const currentMA = this.calculateCurrentMA(priceHistory);
                const isAbove = currentPrice > currentMA;
                const isBelow = currentPrice < currentMA;
                const priceVsMA = isAbove ? chalk.green('ABOVE MA') : isBelow ? chalk.red('BELOW MA') : chalk.yellow('AT MA');
                const maDiff = currentMA && currentPrice ? ((currentPrice - currentMA) / currentMA * 100).toFixed(2) : '0.00';
                const maDiffDisplay = isAbove ? chalk.green(`+${maDiff}%`) : chalk.red(`${maDiff}%`);

                const timestamp = new Date().toLocaleTimeString();

                // Calculate top 3 MA scores for current price (if optimization results available)
                let top3MAs = '';
                if (this.optimizedStrategy.allResults && initializationComplete) {
                    const top3 = this.optimizedStrategy.allResults
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 3)
                        .map((ma, idx) => `${idx + 1}. ${ma.type}(${ma.length}): ${(ma.score * 100).toFixed(1)}%`)
                        .join(' | ');
                    top3MAs = ` | Top MAs: ${top3}`;
                }

                // Position monitoring with REAL-TIME single-line animation (updates every second)
                if (position) {
                    const distanceToTP = ((position.takeProfit - currentPrice) / currentPrice * 100).toFixed(2);
                    const distanceToSL = ((currentPrice - position.stopLoss) / currentPrice * 100).toFixed(2);
                    const pnl = ((currentPrice - position.entryPrice) / position.entryPrice * 100).toFixed(2);
                    const pnlColor = parseFloat(pnl) >= 0 ? chalk.green : chalk.red;

                    // Determine trend direction
                    const trendingToTP = currentPrice > position.entryPrice;
                    const arrow = trendingToTP ? chalk.green('↗') : chalk.red('↘');

                    // Real-time position display with actual TP/SL prices
                    process.stdout.write(`\r${arrow} [${timestamp}] Entry ${position.entryPrice.toFixed(2)} | Now ${chalk.cyan(currentPrice.toFixed(2))} | P&L ${pnlColor(pnl + '%')} | TP ${chalk.green(position.takeProfit.toFixed(2))} (${distanceToTP}%) | SL ${chalk.red(position.stopLoss.toFixed(2))} (${distanceToSL}%)     `);
                } else {
                    // When no position: Print NEW line every 1 minute (not overwrite)
                    let posStatus = chalk.gray('NO POSITION');

                    // Show waiting status if price is above MA but we haven't seen a crossover yet
                    if (isAbove && previousPriceVsMA === 'above' && initializationComplete) {
                        posStatus = chalk.yellow('WAITING FOR CROSSOVER (need below→above)');
                    }

                    // Show initialization status during first 5 minutes
                    if (!initializationComplete) {
                        posStatus = chalk.cyan(`INITIALIZING (${10 - initializationWaitTicks}/10 checks)`);
                    }

                    const now = Date.now();
                    const timeSinceLastLog = now - lastLogTime;

                    // Print NEW line every 60 seconds (1 minute) OR during initialization
                    if (timeSinceLastLog >= 60000 || !initializationComplete) {
                        console.log(`[${timestamp}] Price ${currentPrice.toFixed(2)} | MA ${currentMA.toFixed(2)} | ${signal.action} | ${priceVsMA} (${maDiffDisplay}) | ${posStatus}${top3MAs}`);
                        lastLogTime = now;
                    }
                }

                // Removed summaries - MA shown on every tick now

                // Handle ONE position at a time with crossover confirmation
                // CRITICAL: Must see price go from BELOW to ABOVE MA

                // Initialization period - wait 10 ticks (5 minutes) before allowing any trades
                if (previousPriceVsMA === null) {
                    // First tick - establish baseline AND PRINT
                    previousPriceVsMA = isAbove ? 'above' : isBelow ? 'below' : 'at';
                    await this.sleep(sleepInterval);
                    continue;
                }

                // Count down initialization wait
                if (initializationWaitTicks > 0) {
                    initializationWaitTicks--;
                    if (initializationWaitTicks > 0) {
                        // Still waiting - update previousPriceVsMA but don't trade (PRINTS ABOVE)
                        previousPriceVsMA = isAbove ? 'above' : isBelow ? 'below' : 'at';
                        await this.sleep(sleepInterval);
                        continue;
                    } else {
                        // Initialization complete - use current state to determine what to wait for
                        initializationComplete = true;
                        const currentState = isAbove ? 'above' : isBelow ? 'below' : 'at';
                        const waitingFor = currentState === 'above' ? 'below→above' : 'above (then below→above)';
                        console.log(`\n${chalk.green('[READY]')} 5-min wait complete. Price is ${currentState} MA. Waiting for ${waitingFor} crossover...`);
                        console.log(`Current Strategy: ${this.optimizedStrategy.type}(${this.optimizedStrategy.length}) | Score: ${(this.optimizedStrategy.score * 100).toFixed(1)}%\n`);
                        previousPriceVsMA = currentState;
                    }
            }

                // Only buy if price crossed from BELOW to ABOVE MA (not just above)
                const crossedAbove = previousPriceVsMA === 'below' && isAbove;

                // Volatility filter for 1m and 5m timeframes
                const volatility = this.calculateVolatility(this.historicalData.slice(-50));
                const maxVolatilityThreshold = this.currentTimeframe === '1m' ? 0.05 : this.currentTimeframe === '5m' ? 0.03 : 0.02;
                const isHighVolatility = volatility > maxVolatilityThreshold;

                if (isHighVolatility && (this.currentTimeframe === '1m' || this.currentTimeframe === '5m')) {
                    // Skip trading in high volatility
                    if (signal.action === 'BUY' && !position && crossedAbove) {
                        console.log(`${chalk.yellow('⚠️')} High volatility detected (${(volatility * 100).toFixed(2)}%). Skipping buy signal for ${this.currentTimeframe} timeframe.`);
                    }
                } else if (signal.action === 'BUY' && !position && crossedAbove) {
                    console.log(`\n${chalk.green('BUY SIGNAL')} - Price crossed from BELOW to ABOVE MA at ${currentPrice.toFixed(2)}`);

                    let stopLoss, takeProfit, positionSize;

                    if (this.useMLRisk && this.positionSizing === 'ml') {
                        // Use ML-based TP/SL and position sizing
                        const mlResult = this.mlRiskManager.calculateOptimalTPSL(
                            this.historicalData,
                            currentPrice,
                            this.optimizedStrategy.type,
                            this.optimizedStrategy.length,
                            0.001, // Default position size for calculation
                            0,
                            this.currentTimeframe
                        );
                        stopLoss = mlResult.stopLoss;
                        takeProfit = mlResult.takeProfit;

                        // Calculate position size based on ML
                        const positionResult = this.mlRiskManager.calculatePositionSize(
                            this.accountInfo,
                            1.0, // 1% risk per trade
                            currentPrice,
                            stopLoss,
                            this.calculateVolatility(this.historicalData.slice(-50)),
                            0,
                            this.currentTimeframe
                        );
                        positionSize = positionResult.size;

                        console.log(`${chalk.green('✓')} ML-Based TP/SL: SL ${stopLoss.toFixed(2)}, TP ${takeProfit.toFixed(2)}`);
                        console.log(`${chalk.green('✓')} Position Size: ${positionSize.toFixed(6)} BTC (${positionResult.actualRiskPercent}% risk)`);
                    } else {
                        // Use manual TP/SL and fixed position size
                        const slMultiplier = 1 - (this.stopLossPercent / 100);
                        const tpMultiplier = 1 + ((this.stopLossPercent * this.riskRewardRatio) / 100);
                        stopLoss = currentPrice * slMultiplier;
                        takeProfit = currentPrice * tpMultiplier;
                        positionSize = 0.001;

                        console.log(`${chalk.green('✓')} Manual TP/SL: SL ${stopLoss.toFixed(2)}, TP ${takeProfit.toFixed(2)}`);
                    }

                    // Execute buy order
                    const result = await this.orderManager.executeBuyOrder(this.currentSymbol, positionSize, 1.0, null);
                    if (result.success) {
                        position = {
                            entryPrice: currentPrice,
                            quantity: positionSize,
                            entryTime: new Date(),
                            stopLoss: stopLoss,
                            takeProfit: takeProfit,
                            orderId: result.orderId,
                            bracketOrder: false // Crypto doesn't support bracket orders
                        };
                        console.log(`${chalk.green('✓')} Buy executed`);
                        console.log(`Entry: ${currentPrice.toFixed(2)} | SL: ${stopLoss.toFixed(2)} | TP: ${takeProfit.toFixed(2)}`);
                        console.log(`${chalk.cyan(this.useMLRisk ? 'ML TP/SL monitoring active' : 'Manual TP/SL monitoring active')}\n`);
                    } else {
                        console.log(`Buy failed: ${result.message}\n`);
                    }
                } else if (position) {
                    // Manual TP/SL management (fallback for non-bracket orders)
                    const hitTP = currentPrice >= position.takeProfit;
                    const hitSL = currentPrice <= position.stopLoss;

                    if (hitTP || hitSL) {
                        const pnl = ((currentPrice - position.entryPrice) / position.entryPrice * 100).toFixed(2);
                        const pnlDollar = ((currentPrice - position.entryPrice) * position.quantity).toFixed(2);
                        const exitReason = hitTP ? 'TAKE PROFIT' : 'STOP LOSS';

                        console.log(`\n${exitReason} HIT at ${currentPrice.toFixed(2)}`);
                        console.log(`P&L: ${pnl}% (${pnlDollar})`);

                        const result = await this.orderManager.executeSellOrder(this.currentSymbol, position.quantity);
                        if (result.success) {
                            const pnlColor = parseFloat(pnl) >= 0 ? chalk.green : chalk.red;
                            console.log(`\n\n${chalk.green('✓')} Sell executed: Exit ${currentPrice.toFixed(2)} | Final P&L ${pnlColor(pnl + '%')} (${pnlDollar})\n`);
                            position = null;
                        } else {
                            console.log(`Sell failed: ${result.message}\n`);
                        }
                    }
                }

                // Track previous position for crossover detection
                previousPriceVsMA = isAbove ? 'above' : isBelow ? 'below' : 'at';

                // Dynamic sleep: 1 second when in position (real-time monitoring), 30 seconds when not
                await this.sleep(sleepInterval);
            } catch (error) {
                console.error('\nTrading Error');
                console.error(`Reason: ${error.message}`);
                console.error('\nPossible causes:');
                console.error('  - API connection lost');
                console.error('  - Invalid price data');
                console.error('  - Order execution failed\n');

                // Exit on critical errors
                if (error.message.includes('Failed to get') || error.message.includes('Request failed')) {
                    console.error('Critical error - exiting bot\n');
                    process.exit(1);
                }

                await this.sleep(5000);
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async start() {
        if (!await this.initialize()) process.exit(1);
        await this.optimizeStrategy();
        await this.startTrading();
    }

    shutdown() {
        console.log('\nShutting down...');
        this.isRunning = false;

        if (this.dataManager) {
            this.dataManager.cleanup();
        }

        process.exit(0);
    }
}

process.on('SIGINT', () => {
    if (global.bitflowBot) global.bitflowBot.shutdown();
    else process.exit(0);
});

if (require.main === module) {
    global.bitflowBot = new BitFlowBot();
    global.bitflowBot.start().catch(error => {
        console.error('\nFatal Error');
        console.error(`Reason: ${error.message}\n`);
        process.exit(1);
    });
}

module.exports = BitFlowBot;
