// Enhanced Backtest Engine with ML Integration
const fs = require('fs');
const path = require('path');
const EnhancedMLEngine = require('./enhanced_ml_engine');
const AdvancedTradingStrategy = require('./advanced_trading_strategy');

class EnhancedBacktestEngine {
    constructor(symbol = 'BTC/USD', initialBalance = 10000) {
        this.symbol = symbol;
        this.initialBalance = initialBalance;
        this.balance = initialBalance;
        this.position = null;
        this.trades = [];
        this.mlEngine = new EnhancedMLEngine();
        this.strategy = null; // Will be initialized with mock monitor
        this.performanceMetrics = {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            totalPnL: 0,
            maxDrawdown: 0,
            maxDrawdownPercent: 0,
            sharpeRatio: 0,
            profitFactor: 0,
            winRate: 0,
            avgWin: 0,
            avgLoss: 0,
            maxConsecutiveWins: 0,
            maxConsecutiveLosses: 0,
            largestWin: 0,
            largestLoss: 0
        };
    }

    // Create mock monitor for strategy initialization
    createMockMonitor(ohlcvData) {
        return {
            symbol: this.symbol,
            historicalData: ohlcvData,
            fetchAlpacaHistorical: async (symbol, timeframe, limit) => {
                return ohlcvData.slice(-limit);
            },
            calculateVolatility: (prices) => {
                if (prices.length < 2) return 0.02;
                const returns = prices.slice(1).map((p, i) => Math.log(p / prices[i]));
                const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
                return Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1));
            }
        };
    }

    // Load historical data from various sources
    async loadHistoricalData(source, params = {}) {
        switch (source) {
            case 'csv':
                return this.loadFromCSV(params.filePath);
            case 'alpaca':
                return this.loadFromAlpaca(params.symbol, params.timeframe, params.limit);
            case 'generated':
                return this.generateSyntheticData(params.days || 365, params.volatility || 0.02);
            default:
                throw new Error('Unsupported data source');
        }
    }

    loadFromCSV(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`CSV file not found: ${filePath}`);
        }

        const data = fs.readFileSync(filePath, 'utf8').split('\n');
        const headers = data[0].toLowerCase().split(',');
        
        return data.slice(1).filter(Boolean).map(line => {
            const values = line.split(',');
            const candle = {};
            
            headers.forEach((header, index) => {
                const cleanHeader = header.trim();
                const value = values[index];
                
                if (cleanHeader.includes('date') || cleanHeader.includes('time')) {
                    candle.timestamp = new Date(value);
                } else if (cleanHeader.includes('open')) {
                    candle.open = parseFloat(value);
                } else if (cleanHeader.includes('high')) {
                    candle.high = parseFloat(value);
                } else if (cleanHeader.includes('low')) {
                    candle.low = parseFloat(value);
                } else if (cleanHeader.includes('close')) {
                    candle.close = parseFloat(value);
                } else if (cleanHeader.includes('volume')) {
                    candle.volume = parseFloat(value) || 1000;
                }
            });
            
            return candle;
        }).filter(candle => candle.close && !isNaN(candle.close));
    }

    // Generate synthetic price data for testing
    generateSyntheticData(days = 365, volatility = 0.02, startPrice = 50000) {
        const data = [];
        let price = startPrice;
        const intervalsPerDay = 288; // 5-minute intervals
        
        for (let i = 0; i < days * intervalsPerDay; i++) {
            const timestamp = new Date(Date.now() - (days * intervalsPerDay - i) * 5 * 60 * 1000);
            
            // Random walk with trend
            const trend = 0.0001; // Slight upward trend
            const randomChange = (Math.random() - 0.5) * volatility;
            const priceChange = trend + randomChange;
            
            const open = price;
            price *= (1 + priceChange);
            const close = price;
            
            // Generate realistic OHLC
            const high = Math.max(open, close) * (1 + Math.random() * 0.01);
            const low = Math.min(open, close) * (1 - Math.random() * 0.01);
            const volume = 1000 + Math.random() * 5000;
            
            data.push({
                timestamp,
                open,
                high,
                low,
                close,
                volume
            });
        }
        
        return data;
    }

    // Run comprehensive backtest
    async runBacktest(ohlcvData, config = {}) {
        console.log(`Starting enhanced backtest for ${this.symbol}...`);
        console.log(`Data points: ${ohlcvData.length}`);
        console.log(`Initial balance: $${this.initialBalance}`);
        
        // Initialize strategy with mock monitor
        const mockMonitor = this.createMockMonitor(ohlcvData);
        this.strategy = new AdvancedTradingStrategy(mockMonitor);
        
        // Reset state
        this.balance = this.initialBalance;
        this.position = null;
        this.trades = [];
        
        let equity = this.initialBalance;
        let peak = this.initialBalance;
        let consecutiveWins = 0;
        let consecutiveLosses = 0;
        let maxConsecutiveWins = 0;
        let maxConsecutiveLosses = 0;
        
        // Backtest parameters
        const lookbackPeriod = config.lookbackPeriod || 100;
        const transactionCost = config.transactionCost || 0.0025; // 0.25% per trade
        
        for (let i = lookbackPeriod; i < ohlcvData.length; i++) {
            const currentData = ohlcvData.slice(0, i + 1);
            const currentPrice = ohlcvData[i].close;
            
            try {
                // Generate signal using advanced strategy
                const signalData = await this.strategy.generateAdvancedSignal(currentData);
                
                if (!signalData.signal) continue;
                
                // Execute trade based on signal
                if (signalData.signal === 'BUY' && !this.position) {
                    await this.executeBuyOrder(currentPrice, signalData, transactionCost);
                } else if (signalData.signal === 'SELL' && this.position) {
                    await this.executeSellOrder(currentPrice, 'Signal', transactionCost);
                }
                
                // Check stop loss and take profit
                if (this.position) {
                    const pnlPercent = ((currentPrice - this.position.entryPrice) / this.position.entryPrice) * 100;
                    
                    if (pnlPercent >= this.position.takeProfitPercent) {
                        await this.executeSellOrder(currentPrice, 'Take Profit', transactionCost);
                    } else if (pnlPercent <= -this.position.stopLossPercent) {
                        await this.executeSellOrder(currentPrice, 'Stop Loss', transactionCost);
                    }
                }
                
                // Update equity and drawdown tracking
                const currentEquity = this.calculateCurrentEquity(currentPrice);
                if (currentEquity > peak) {
                    peak = currentEquity;
                }
                
                const drawdown = peak - currentEquity;
                const drawdownPercent = (drawdown / peak) * 100;
                
                if (drawdown > this.performanceMetrics.maxDrawdown) {
                    this.performanceMetrics.maxDrawdown = drawdown;
                    this.performanceMetrics.maxDrawdownPercent = drawdownPercent;
                }
                
            } catch (error) {
                console.log(`Error at index ${i}:`, error.message);
                continue;
            }
        }
        
        // Close any remaining position
        if (this.position) {
            await this.executeSellOrder(ohlcvData[ohlcvData.length - 1].close, 'End of Test', transactionCost);
        }
        
        // Calculate final performance metrics
        this.calculatePerformanceMetrics();
        
        return {
            trades: this.trades,
            metrics: this.performanceMetrics,
            finalBalance: this.balance,
            totalReturn: ((this.balance - this.initialBalance) / this.initialBalance) * 100
        };
    }

    async executeBuyOrder(price, signalData, transactionCost) {
        // Calculate position size using advanced strategy
        const positionSize = this.strategy.calculateOptimalPositionSize(this.balance, price, signalData.signal);
        const positionValue = positionSize * price;
        const fee = positionValue * transactionCost;
        
        if (positionValue + fee > this.balance) {
            return; // Insufficient funds
        }
        
        // Calculate dynamic TP/SL
        const tpsl = this.strategy.calculateDynamicTPSL(this.strategy.monitor.historicalData, price);
        
        this.position = {
            entryPrice: price,
            quantity: positionSize,
            entryTime: new Date(),
            takeProfitPercent: tpsl.takeProfit,
            stopLossPercent: tpsl.stopLoss,
            signalConfidence: signalData.confidence,
            marketRegime: signalData.marketRegime
        };
        
        this.balance -= (positionValue + fee);
        
        console.log(`BUY: ${positionSize.toFixed(6)} @ $${price.toFixed(2)} | Confidence: ${(signalData.confidence * 100).toFixed(1)}% | TP: ${tpsl.takeProfit}% | SL: ${tpsl.stopLoss}%`);
    }

    async executeSellOrder(price, reason, transactionCost) {
        if (!this.position) return;
        
        const positionValue = this.position.quantity * price;
        const fee = positionValue * transactionCost;
        const pnl = positionValue - (this.position.quantity * this.position.entryPrice) - fee;
        const pnlPercent = (pnl / (this.position.quantity * this.position.entryPrice)) * 100;
        
        const trade = {
            symbol: this.symbol,
            entryPrice: this.position.entryPrice,
            exitPrice: price,
            quantity: this.position.quantity,
            entryTime: this.position.entryTime,
            exitTime: new Date(),
            pnl: pnl,
            pnlPercent: pnlPercent,
            reason: reason,
            takeProfitPercent: this.position.takeProfitPercent,
            stopLossPercent: this.position.stopLossPercent,
            signalConfidence: this.position.signalConfidence,
            marketRegime: this.position.marketRegime,
            fee: fee
        };
        
        this.trades.push(trade);
        this.balance += positionValue - fee;
        
        console.log(`SELL: ${this.position.quantity.toFixed(6)} @ $${price.toFixed(2)} | P&L: ${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%) | Reason: ${reason}`);
        
        this.position = null;
    }

    calculateCurrentEquity(currentPrice) {
        let equity = this.balance;
        if (this.position) {
            equity += this.position.quantity * currentPrice;
        }
        return equity;
    }

    calculatePerformanceMetrics() {
        const trades = this.trades;
        const winningTrades = trades.filter(t => t.pnl > 0);
        const losingTrades = trades.filter(t => t.pnl < 0);
        
        this.performanceMetrics.totalTrades = trades.length;
        this.performanceMetrics.winningTrades = winningTrades.length;
        this.performanceMetrics.losingTrades = losingTrades.length;
        this.performanceMetrics.winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
        
        this.performanceMetrics.totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
        this.performanceMetrics.avgWin = winningTrades.length > 0 ? 
            winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
        this.performanceMetrics.avgLoss = losingTrades.length > 0 ? 
            Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0)) / losingTrades.length : 0;
        
        const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
        const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
        this.performanceMetrics.profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
        
        this.performanceMetrics.largestWin = winningTrades.length > 0 ? 
            Math.max(...winningTrades.map(t => t.pnl)) : 0;
        this.performanceMetrics.largestLoss = losingTrades.length > 0 ? 
            Math.min(...losingTrades.map(t => t.pnl)) : 0;
        
        // Calculate Sharpe ratio (simplified)
        if (trades.length > 1) {
            const returns = trades.map(t => t.pnlPercent);
            const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
            const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1));
            this.performanceMetrics.sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
        }
    }

    // Generate detailed backtest report
    generateReport() {
        const report = {
            summary: {
                symbol: this.symbol,
                initialBalance: this.initialBalance,
                finalBalance: this.balance,
                totalReturn: ((this.balance - this.initialBalance) / this.initialBalance) * 100,
                totalTrades: this.performanceMetrics.totalTrades,
                winRate: this.performanceMetrics.winRate,
                profitFactor: this.performanceMetrics.profitFactor,
                sharpeRatio: this.performanceMetrics.sharpeRatio,
                maxDrawdown: this.performanceMetrics.maxDrawdownPercent
            },
            trades: this.trades,
            metrics: this.performanceMetrics
        };
        
        return report;
    }

    // Save backtest results to files
    saveResults(outputDir = './backtest_results') {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const report = this.generateReport();
        
        // Save JSON report
        const jsonPath = path.join(outputDir, `backtest_${this.symbol.replace('/', '')}_${timestamp}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
        
        // Save CSV of trades
        const csvPath = path.join(outputDir, `trades_${this.symbol.replace('/', '')}_${timestamp}.csv`);
        const csvHeader = 'symbol,entryPrice,exitPrice,quantity,entryTime,exitTime,pnl,pnlPercent,reason,takeProfitPercent,stopLossPercent,signalConfidence,marketRegime,fee\n';
        const csvData = this.trades.map(t => 
            `${t.symbol},${t.entryPrice},${t.exitPrice},${t.quantity},${t.entryTime.toISOString()},${t.exitTime.toISOString()},${t.pnl},${t.pnlPercent},${t.reason},${t.takeProfitPercent},${t.stopLossPercent},${t.signalConfidence},${t.marketRegime},${t.fee}`
        ).join('\n');
        fs.writeFileSync(csvPath, csvHeader + csvData);
        
        console.log(`Results saved to ${jsonPath} and ${csvPath}`);
        return { jsonPath, csvPath };
    }
}

// Export for use in other modules
module.exports = EnhancedBacktestEngine;

// CLI usage
if (require.main === module) {
    (async () => {
        const engine = new EnhancedBacktestEngine('BTC/USD', 10000);
        
        try {
            // Generate synthetic data for testing
            console.log('Generating synthetic data...');
            const data = engine.generateSyntheticData(30, 0.03, 50000); // 30 days, 3% volatility
            
            console.log('Running backtest...');
            const results = await engine.runBacktest(data);
            
            console.log('\n=== BACKTEST RESULTS ===');
            console.log(`Total Trades: ${results.metrics.totalTrades}`);
            console.log(`Win Rate: ${results.metrics.winRate.toFixed(2)}%`);
            console.log(`Total Return: ${results.totalReturn.toFixed(2)}%`);
            console.log(`Profit Factor: ${results.metrics.profitFactor.toFixed(2)}`);
            console.log(`Sharpe Ratio: ${results.metrics.sharpeRatio.toFixed(2)}`);
            console.log(`Max Drawdown: ${results.metrics.maxDrawdownPercent.toFixed(2)}%`);
            console.log(`Final Balance: $${results.finalBalance.toFixed(2)}`);
            
            // Save results
            engine.saveResults();
            
        } catch (error) {
            console.error('Backtest failed:', error.message);
        }
    })();
}