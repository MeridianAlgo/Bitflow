// Advanced Trading Strategy with ML Integration
const EnhancedMLEngine = require('./enhanced_ml_engine');
const { SMA, EMA, RSI, MACD } = require('technicalindicators');
const fs = require('fs');
const path = require('path');

class AdvancedTradingStrategy {
    constructor(monitor) {
        this.monitor = monitor;
        this.mlEngine = new EnhancedMLEngine();
        this.tradeHistory = this.loadTradeHistory();
        this.performanceMetrics = this.calculatePerformanceMetrics();
        this.adaptiveParams = {
            rsiPeriod: 14,
            maPeriods: { fast: 10, slow: 20 },
            volatilityWindow: 20,
            confidenceThreshold: 0.6
        };
    }

    loadTradeHistory() {
        const csvPath = path.join(__dirname, '../positions_sold.csv');
        if (!fs.existsSync(csvPath)) return [];

        try {
            const data = fs.readFileSync(csvPath, 'utf8').split('\n');
            const headers = data[0].split(',');
            return data.slice(1).filter(Boolean).map(line => {
                const vals = line.split(',');
                if (vals.length !== headers.length) return null;
                const obj = {};
                headers.forEach((h, i) => obj[h.trim()] = vals[i]);
                return obj;
            }).filter(Boolean);
        } catch (error) {
            console.log('Error loading trade history:', error.message);
            return [];
        }
    }

    calculatePerformanceMetrics() {
        if (this.tradeHistory.length === 0) {
            return {
                winRate: 0.5,
                avgWin: 0.02,
                avgLoss: 0.015,
                totalTrades: 0,
                profitFactor: 1.0
            };
        }

        const completedTrades = this.tradeHistory.filter(t => 
            t.pnl && t.pnl !== '-' && !isNaN(parseFloat(t.pnl))
        );

        if (completedTrades.length === 0) {
            return {
                winRate: 0.5,
                avgWin: 0.02,
                avgLoss: 0.015,
                totalTrades: 0,
                profitFactor: 1.0
            };
        }

        const wins = completedTrades.filter(t => parseFloat(t.pnl) > 0);
        const losses = completedTrades.filter(t => parseFloat(t.pnl) < 0);

        const winRate = wins.length / completedTrades.length;
        const avgWin = wins.length > 0 ? 
            wins.reduce((sum, t) => sum + Math.abs(parseFloat(t.pnlPercent || 0)), 0) / wins.length / 100 : 0.02;
        const avgLoss = losses.length > 0 ? 
            losses.reduce((sum, t) => sum + Math.abs(parseFloat(t.pnlPercent || 0)), 0) / losses.length / 100 : 0.015;

        const totalWins = wins.reduce((sum, t) => sum + parseFloat(t.pnl), 0);
        const totalLosses = Math.abs(losses.reduce((sum, t) => sum + parseFloat(t.pnl), 0));
        const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 1.0;

        return {
            winRate,
            avgWin,
            avgLoss,
            totalTrades: completedTrades.length,
            profitFactor
        };
    }

    // Adaptive parameter optimization based on recent performance
    adaptParameters() {
        const recentTrades = this.tradeHistory.slice(-20); // Last 20 trades
        if (recentTrades.length < 10) return;

        const recentWinRate = recentTrades.filter(t => parseFloat(t.pnl || 0) > 0).length / recentTrades.length;
        
        // Adjust RSI period based on recent performance
        if (recentWinRate < 0.4) {
            this.adaptiveParams.rsiPeriod = Math.min(21, this.adaptiveParams.rsiPeriod + 1);
        } else if (recentWinRate > 0.6) {
            this.adaptiveParams.rsiPeriod = Math.max(7, this.adaptiveParams.rsiPeriod - 1);
        }

        // Adjust MA periods
        if (recentWinRate < 0.4) {
            this.adaptiveParams.maPeriods.fast = Math.min(15, this.adaptiveParams.maPeriods.fast + 1);
            this.adaptiveParams.maPeriods.slow = Math.min(30, this.adaptiveParams.maPeriods.slow + 2);
        }

        // Adjust confidence threshold
        if (recentWinRate < 0.3) {
            this.adaptiveParams.confidenceThreshold = Math.min(0.8, this.adaptiveParams.confidenceThreshold + 0.05);
        } else if (recentWinRate > 0.7) {
            this.adaptiveParams.confidenceThreshold = Math.max(0.4, this.adaptiveParams.confidenceThreshold - 0.05);
        }
    }

    // Enhanced signal generation with multiple confirmations
    async generateAdvancedSignal(ohlcvData) {
        if (ohlcvData.length < 100) return { signal: null, confidence: 0, reason: 'Insufficient data' };

        // Adapt parameters based on recent performance
        this.adaptParameters();

        const closes = ohlcvData.map(d => d.close || d.c);
        const highs = ohlcvData.map(d => d.high || d.h);
        const lows = ohlcvData.map(d => d.low || d.l);
        const volumes = ohlcvData.map(d => d.volume || d.v || 1000);

        // 1. Multi-timeframe ML signal
        const mlSignal = await this.mlEngine.generateMultiTimeframeSignal(this.monitor.symbol, this.monitor);

        // 2. Market regime detection
        const marketRegime = this.mlEngine.detectMarketRegime(ohlcvData);

        // 3. Risk assessment
        const riskAssessment = this.mlEngine.assessRisk(ohlcvData, closes[closes.length - 1], 10000);

        // 4. Technical indicators with adaptive parameters
        const fastMA = SMA.calculate({ period: this.adaptiveParams.maPeriods.fast, values: closes });
        const slowMA = EMA.calculate({ period: this.adaptiveParams.maPeriods.slow, values: closes });
        const rsi = RSI.calculate({ period: this.adaptiveParams.rsiPeriod, values: closes });
        const macd = MACD.calculate({ fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, values: closes });

        if (fastMA.length < 2 || slowMA.length < 2 || rsi.length < 2 || macd.length < 2) {
            return { signal: null, confidence: 0, reason: 'Insufficient indicator data' };
        }

        // 5. Signal scoring system
        let buyScore = 0;
        let sellScore = 0;
        const reasons = [];

        // ML Signal (40% weight)
        if (mlSignal > 0.3) {
            buyScore += 0.4 * mlSignal;
            reasons.push(`ML bullish (${(mlSignal * 100).toFixed(1)}%)`);
        } else if (mlSignal < -0.3) {
            sellScore += 0.4 * Math.abs(mlSignal);
            reasons.push(`ML bearish (${(mlSignal * 100).toFixed(1)}%)`);
        }

        // MA Crossover (20% weight)
        const currentFast = fastMA[fastMA.length - 1];
        const currentSlow = slowMA[slowMA.length - 1];
        const prevFast = fastMA[fastMA.length - 2];
        const prevSlow = slowMA[slowMA.length - 2];

        if (prevFast <= prevSlow && currentFast > currentSlow) {
            buyScore += 0.2;
            reasons.push('MA bullish crossover');
        } else if (prevFast >= prevSlow && currentFast < currentSlow) {
            sellScore += 0.2;
            reasons.push('MA bearish crossover');
        }

        // RSI (15% weight)
        const currentRSI = rsi[rsi.length - 1];
        if (currentRSI < 30 && currentRSI > 20) {
            buyScore += 0.15;
            reasons.push(`RSI oversold recovery (${currentRSI.toFixed(1)})`);
        } else if (currentRSI > 70 && currentRSI < 80) {
            sellScore += 0.15;
            reasons.push(`RSI overbought (${currentRSI.toFixed(1)})`);
        }

        // MACD (15% weight)
        const currentMACD = macd[macd.length - 1];
        const prevMACD = macd[macd.length - 2];
        if (prevMACD.MACD <= prevMACD.signal && currentMACD.MACD > currentMACD.signal) {
            buyScore += 0.15;
            reasons.push('MACD bullish crossover');
        } else if (prevMACD.MACD >= prevMACD.signal && currentMACD.MACD < currentMACD.signal) {
            sellScore += 0.15;
            reasons.push('MACD bearish crossover');
        }

        // Volume confirmation (10% weight)
        const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
        const currentVolume = volumes[volumes.length - 1];
        if (currentVolume > avgVolume * 1.2) {
            if (buyScore > sellScore) {
                buyScore += 0.1;
                reasons.push('Volume confirmation');
            } else if (sellScore > buyScore) {
                sellScore += 0.1;
                reasons.push('Volume confirmation');
            }
        }

        // Market regime adjustments
        if (marketRegime === 'trending') {
            if (buyScore > sellScore) buyScore *= 1.2;
            else sellScore *= 1.2;
            reasons.push(`Trending market boost`);
        } else if (marketRegime === 'sideways') {
            buyScore *= 0.8;
            sellScore *= 0.8;
            reasons.push(`Sideways market penalty`);
        }

        // Risk-based adjustments
        if (riskAssessment.risk === 'high') {
            buyScore *= 0.7;
            sellScore *= 0.7;
            reasons.push(`High risk penalty`);
        } else if (riskAssessment.risk === 'low') {
            buyScore *= 1.1;
            sellScore *= 1.1;
            reasons.push(`Low risk bonus`);
        }

        // Determine final signal
        const netScore = buyScore - sellScore;
        const confidence = Math.min(1, Math.max(Math.abs(netScore), riskAssessment.confidence));
        
        let signal = null;
        if (netScore > this.adaptiveParams.confidenceThreshold && confidence > 0.5) {
            signal = 'BUY';
        } else if (netScore < -this.adaptiveParams.confidenceThreshold && confidence > 0.5) {
            signal = 'SELL';
        }

        return {
            signal,
            confidence,
            buyScore,
            sellScore,
            netScore,
            reasons: reasons.join(', '),
            marketRegime,
            riskLevel: riskAssessment.risk,
            mlSignal: mlSignal.toFixed(3)
        };
    }

    // Enhanced position sizing with Kelly Criterion
    calculateOptimalPositionSize(balance, currentPrice, signal) {
        const metrics = this.performanceMetrics;
        
        // Kelly Criterion position sizing
        const kellySize = this.mlEngine.calculateKellyPosition(
            metrics.winRate,
            metrics.avgWin,
            metrics.avgLoss,
            balance,
            currentPrice
        );

        // Risk-based adjustments
        const riskMultiplier = this.getRiskMultiplier();
        const adjustedSize = kellySize * riskMultiplier;

        // Ensure minimum and maximum position sizes
        const minSize = 0.0001;
        const maxSize = balance * 0.1 / currentPrice; // Max 10% of balance

        return Math.max(minSize, Math.min(maxSize, adjustedSize));
    }

    getRiskMultiplier() {
        const recentTrades = this.tradeHistory.slice(-10);
        if (recentTrades.length === 0) return 1.0;

        const recentLosses = recentTrades.filter(t => parseFloat(t.pnl || 0) < 0).length;
        
        // Reduce position size after consecutive losses
        if (recentLosses >= 3) return 0.5;
        if (recentLosses >= 2) return 0.7;
        
        // Increase position size after consecutive wins
        const recentWins = recentTrades.filter(t => parseFloat(t.pnl || 0) > 0).length;
        if (recentWins >= 3) return 1.2;
        
        return 1.0;
    }

    // Dynamic TP/SL calculation
    calculateDynamicTPSL(ohlcvData, entryPrice) {
        const marketRegime = this.mlEngine.detectMarketRegime(ohlcvData);
        const tpsl = this.mlEngine.calculateDynamicTPSL(ohlcvData, entryPrice, marketRegime);
        
        // Adjust based on recent performance
        const metrics = this.performanceMetrics;
        if (metrics.winRate < 0.4) {
            // Reduce TP and increase SL when performance is poor
            tpsl.tp *= 0.8;
            tpsl.sl *= 1.2;
        } else if (metrics.winRate > 0.6) {
            // Increase TP and reduce SL when performance is good
            tpsl.tp *= 1.2;
            tpsl.sl *= 0.9;
        }

        return {
            takeProfit: Math.max(0.5, Math.min(5.0, tpsl.tp)),
            stopLoss: Math.max(0.3, Math.min(3.0, tpsl.sl))
        };
    }

    // Performance monitoring and alerts
    getPerformanceAlert() {
        const metrics = this.performanceMetrics;
        const recentTrades = this.tradeHistory.slice(-10);
        
        if (recentTrades.length < 5) return null;

        const recentWinRate = recentTrades.filter(t => parseFloat(t.pnl || 0) > 0).length / recentTrades.length;
        
        if (recentWinRate < 0.2) {
            return {
                level: 'critical',
                message: `Poor recent performance: ${(recentWinRate * 100).toFixed(1)}% win rate. Consider reducing position sizes.`
            };
        } else if (recentWinRate < 0.3) {
            return {
                level: 'warning',
                message: `Below average performance: ${(recentWinRate * 100).toFixed(1)}% win rate. Strategy adapting parameters.`
            };
        } else if (recentWinRate > 0.8) {
            return {
                level: 'info',
                message: `Excellent performance: ${(recentWinRate * 100).toFixed(1)}% win rate. Consider increasing position sizes.`
            };
        }

        return null;
    }

    // Strategy summary for logging
    getStrategySummary() {
        const metrics = this.performanceMetrics;
        const alert = this.getPerformanceAlert();
        
        return {
            totalTrades: metrics.totalTrades,
            winRate: (metrics.winRate * 100).toFixed(1) + '%',
            profitFactor: metrics.profitFactor.toFixed(2),
            adaptiveParams: this.adaptiveParams,
            performanceAlert: alert,
            lastUpdated: new Date().toISOString()
        };
    }
}

module.exports = AdvancedTradingStrategy;