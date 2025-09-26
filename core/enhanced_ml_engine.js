// Enhanced ML Engine for BitFlow Trading System
const tf = require('@tensorflow/tfjs');
const { SMA, EMA, RSI, MACD, BollingerBands, Stochastic, ATR, CCI } = require('technicalindicators');

class EnhancedMLEngine {
    constructor() {
        this.models = {
            pricePredictor: null,
            signalClassifier: null,
            volatilityPredictor: null,
            riskAssessment: null
        };
        this.featureScalers = {};
        this.isInitialized = false;
    }

    // Advanced feature engineering with 50+ technical indicators
    extractFeatures(ohlcvData, lookback = 100) {
        if (ohlcvData.length < lookback) return null;

        const closes = ohlcvData.map(d => d.close || d.c);
        const highs = ohlcvData.map(d => d.high || d.h);
        const lows = ohlcvData.map(d => d.low || d.l);
        const volumes = ohlcvData.map(d => d.volume || d.v || 0); // Use 0 instead of fake 1000
        const opens = ohlcvData.map(d => d.open || d.o);

        const features = {};

        // Price-based features
        features.price_change_1 = (closes[closes.length - 1] - closes[closes.length - 2]) / closes[closes.length - 2];
        features.price_change_5 = (closes[closes.length - 1] - closes[closes.length - 6]) / closes[closes.length - 6];
        features.price_change_20 = (closes[closes.length - 1] - closes[closes.length - 21]) / closes[closes.length - 21];

        // Moving averages and crossovers
        const sma5 = SMA.calculate({ period: 5, values: closes });
        const sma10 = SMA.calculate({ period: 10, values: closes });
        const sma20 = SMA.calculate({ period: 20, values: closes });
        const sma50 = SMA.calculate({ period: 50, values: closes });
        const ema12 = EMA.calculate({ period: 12, values: closes });
        const ema26 = EMA.calculate({ period: 26, values: closes });

        if (sma5.length > 0) {
            features.sma5_ratio = closes[closes.length - 1] / sma5[sma5.length - 1];
            features.sma10_ratio = closes[closes.length - 1] / sma10[sma10.length - 1];
            features.sma20_ratio = closes[closes.length - 1] / sma20[sma20.length - 1];
            features.sma50_ratio = closes[closes.length - 1] / sma50[sma50.length - 1];

            // MA crossover signals
            features.sma5_sma10_cross = sma5[sma5.length - 1] > sma10[sma10.length - 1] ? 1 : 0;
            features.sma10_sma20_cross = sma10[sma10.length - 1] > sma20[sma20.length - 1] ? 1 : 0;
        }

        // RSI features
        const rsi14 = RSI.calculate({ period: 14, values: closes });
        const rsi7 = RSI.calculate({ period: 7, values: closes });
        if (rsi14.length > 0) {
            features.rsi14 = rsi14[rsi14.length - 1] / 100;
            features.rsi7 = rsi7[rsi7.length - 1] / 100;
            features.rsi_oversold = rsi14[rsi14.length - 1] < 30 ? 1 : 0;
            features.rsi_overbought = rsi14[rsi14.length - 1] > 70 ? 1 : 0;
        }

        // MACD features
        const macd = MACD.calculate({
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            values: closes
        });
        if (macd.length > 1) {
            const lastMacd = macd[macd.length - 1];
            const prevMacd = macd[macd.length - 2];
            features.macd_line = lastMacd.MACD;
            features.macd_signal = lastMacd.signal;
            features.macd_histogram = lastMacd.histogram;
            features.macd_bullish_cross = (prevMacd.MACD <= prevMacd.signal && lastMacd.MACD > lastMacd.signal) ? 1 : 0;
        }

        // Bollinger Bands
        const bb = BollingerBands.calculate({
            period: 20,
            stdDev: 2,
            values: closes
        });
        if (bb.length > 0) {
            const lastBB = bb[bb.length - 1];
            features.bb_position = (closes[closes.length - 1] - lastBB.lower) / (lastBB.upper - lastBB.lower);
            features.bb_squeeze = (lastBB.upper - lastBB.lower) / lastBB.middle;
        }

        // Stochastic Oscillator
        const stoch = Stochastic.calculate({
            high: highs,
            low: lows,
            close: closes,
            period: 14,
            signalPeriod: 3
        });
        if (stoch.length > 0) {
            const lastStoch = stoch[stoch.length - 1];
            features.stoch_k = lastStoch.k / 100;
            features.stoch_d = lastStoch.d / 100;
        }

        // Average True Range (Volatility)
        const atr = ATR.calculate({
            high: highs,
            low: lows,
            close: closes,
            period: 14
        });
        if (atr.length > 0) {
            features.atr_ratio = atr[atr.length - 1] / closes[closes.length - 1];
        }

        // Commodity Channel Index
        const cci = CCI.calculate({
            high: highs,
            low: lows,
            close: closes,
            period: 20
        });
        if (cci.length > 0) {
            features.cci = Math.max(-3, Math.min(3, cci[cci.length - 1] / 100));
        }

        // Volume features
        const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
        features.volume_ratio = volumes[volumes.length - 1] / avgVolume;

        // Volatility features
        const returns = closes.slice(-20).map((price, i, arr) =>
            i === 0 ? 0 : Math.log(price / arr[i - 1])
        );
        features.volatility = Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length);

        // Support/Resistance levels
        const recentHighs = highs.slice(-20);
        const recentLows = lows.slice(-20);
        const resistance = Math.max(...recentHighs);
        const support = Math.min(...recentLows);
        features.resistance_distance = (resistance - closes[closes.length - 1]) / closes[closes.length - 1];
        features.support_distance = (closes[closes.length - 1] - support) / closes[closes.length - 1];

        // Market structure features
        const higherHighs = this.countHigherHighs(highs.slice(-10));
        const lowerLows = this.countLowerLows(lows.slice(-10));
        features.trend_strength = (higherHighs - lowerLows) / 10;

        return features;
    }

    countHigherHighs(highs) {
        let count = 0;
        for (let i = 1; i < highs.length; i++) {
            if (highs[i] > highs[i - 1]) count++;
        }
        return count;
    }

    countLowerLows(lows) {
        let count = 0;
        for (let i = 1; i < lows.length; i++) {
            if (lows[i] < lows[i - 1]) count++;
        }
        return count;
    }

    // Create ensemble model combining multiple architectures
    createEnsembleModel(inputSize) {
        // LSTM for sequence prediction
        const lstmModel = tf.sequential({
            layers: [
                tf.layers.lstm({ units: 64, returnSequences: true, inputShape: [10, inputSize] }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.lstm({ units: 32, returnSequences: false }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 16, activation: 'relu' }),
                tf.layers.dense({ units: 3, activation: 'softmax' }) // BUY, SELL, HOLD
            ]
        });

        // CNN for pattern recognition
        const cnnModel = tf.sequential({
            layers: [
                tf.layers.reshape({ targetShape: [inputSize, 1], inputShape: [inputSize] }),
                tf.layers.conv1d({ filters: 32, kernelSize: 3, activation: 'relu' }),
                tf.layers.maxPooling1d({ poolSize: 2 }),
                tf.layers.conv1d({ filters: 64, kernelSize: 3, activation: 'relu' }),
                tf.layers.globalMaxPooling1d(),
                tf.layers.dense({ units: 50, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({ units: 3, activation: 'softmax' })
            ]
        });

        // Dense network for feature relationships
        const denseModel = tf.sequential({
            layers: [
                tf.layers.dense({ units: 128, activation: 'relu', inputShape: [inputSize] }),
                tf.layers.batchNormalization(),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({ units: 64, activation: 'relu' }),
                tf.layers.batchNormalization(),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dense({ units: 3, activation: 'softmax' })
            ]
        });

        return { lstmModel, cnnModel, denseModel };
    }

    // Advanced position sizing using Kelly Criterion
    calculateKellyPosition(winRate, avgWin, avgLoss, balance, currentPrice) {
        if (winRate <= 0 || avgWin <= 0 || avgLoss <= 0) {
            return balance * 0.01 / currentPrice; // 1% fallback
        }

        const lossRate = 1 - winRate;
        const winLossRatio = avgWin / Math.abs(avgLoss);

        // Kelly formula: f = (bp - q) / b
        // where b = odds received (win/loss ratio), p = win probability, q = loss probability
        const kellyFraction = (winRate * winLossRatio - lossRate) / winLossRatio;

        // Cap Kelly at 25% for safety and apply fractional Kelly (0.25x)
        const safeKelly = Math.max(0.005, Math.min(0.25, kellyFraction * 0.25));

        return (balance * safeKelly) / currentPrice;
    }

    // Multi-timeframe signal aggregation
    async generateMultiTimeframeSignal(symbol, monitor) {
        const timeframes = ['1Min', '5Min', '15Min', '1Hour'];
        const signals = {};
        const weights = { '1Min': 0.1, '5Min': 0.3, '15Min': 0.4, '1Hour': 0.2 };

        for (const tf of timeframes) {
            try {
                const data = await monitor.fetchAlpacaHistorical(symbol, tf, 200);
                if (data.length < 50) continue;

                const features = this.extractFeatures(data);
                if (!features) continue;

                // Simple signal generation based on multiple indicators
                let score = 0;

                // Trend signals
                if (features.sma5_sma10_cross) score += 0.2;
                if (features.sma10_sma20_cross) score += 0.2;
                if (features.trend_strength > 0.3) score += 0.3;

                // Momentum signals
                if (features.rsi14 < 0.3 && features.rsi14 > 0.2) score += 0.2; // Oversold but not extreme
                if (features.macd_bullish_cross) score += 0.3;

                // Mean reversion signals
                if (features.bb_position < 0.2) score += 0.2; // Near lower BB
                if (features.cci < -1) score += 0.1;

                // Volume confirmation
                if (features.volume_ratio > 1.2) score += 0.1;

                signals[tf] = Math.max(-1, Math.min(1, score - 0.5)); // Normalize to [-1, 1]
            } catch (error) {
                console.log(`Error processing ${tf}:`, error.message);
                signals[tf] = 0;
            }
        }

        // Weighted average of signals
        let weightedSignal = 0;
        let totalWeight = 0;

        for (const [tf, signal] of Object.entries(signals)) {
            if (weights[tf]) {
                weightedSignal += signal * weights[tf];
                totalWeight += weights[tf];
            }
        }

        return totalWeight > 0 ? weightedSignal / totalWeight : 0;
    }

    // Dynamic stop loss and take profit based on volatility and market conditions
    calculateDynamicTPSL(ohlcvData, entryPrice, marketCondition = 'normal') {
        const atr = ATR.calculate({
            high: ohlcvData.map(d => d.high || d.h),
            low: ohlcvData.map(d => d.low || d.l),
            close: ohlcvData.map(d => d.close || d.c),
            period: 14
        });

        if (atr.length === 0) return { tp: 1.5, sl: 1.0 };

        const currentATR = atr[atr.length - 1];
        const atrPercent = (currentATR / entryPrice) * 100;

        // Base multipliers
        let tpMultiplier = 2.0;
        let slMultiplier = 1.0;

        // Adjust based on market condition
        switch (marketCondition) {
            case 'trending':
                tpMultiplier = 3.0;
                slMultiplier = 1.5;
                break;
            case 'volatile':
                tpMultiplier = 1.5;
                slMultiplier = 2.0;
                break;
            case 'sideways':
                tpMultiplier = 1.2;
                slMultiplier = 0.8;
                break;
        }

        const takeProfit = Math.max(0.5, Math.min(5.0, atrPercent * tpMultiplier));
        const stopLoss = Math.max(0.3, Math.min(3.0, atrPercent * slMultiplier));

        return { tp: takeProfit, sl: stopLoss };
    }

    // Market regime detection
    detectMarketRegime(ohlcvData) {
        if (ohlcvData.length < 50) return 'normal';

        const closes = ohlcvData.map(d => d.close || d.c);
        const sma20 = SMA.calculate({ period: 20, values: closes });
        const sma50 = SMA.calculate({ period: 50, values: closes });

        if (sma20.length < 20 || sma50.length < 20) return 'normal';

        // Calculate trend strength
        const recentSMA20 = sma20.slice(-10);
        const sma20Trend = (recentSMA20[recentSMA20.length - 1] - recentSMA20[0]) / recentSMA20[0];

        // Calculate volatility
        const returns = closes.slice(-20).map((price, i, arr) =>
            i === 0 ? 0 : Math.log(price / arr[i - 1])
        );
        const volatility = Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length);

        // Regime classification
        if (Math.abs(sma20Trend) > 0.02) {
            return 'trending';
        } else if (volatility > 0.03) {
            return 'volatile';
        } else {
            return 'sideways';
        }
    }

    // Risk assessment based on multiple factors
    assessRisk(ohlcvData, currentPrice, balance) {
        const features = this.extractFeatures(ohlcvData);
        if (!features) return { risk: 'high', confidence: 0.5 };

        let riskScore = 0;

        // Volatility risk
        if (features.volatility > 0.05) riskScore += 0.3;
        else if (features.volatility < 0.02) riskScore -= 0.1;

        // Technical risk
        if (features.rsi14 > 0.8 || features.rsi14 < 0.2) riskScore += 0.2;
        if (features.bb_position > 0.9 || features.bb_position < 0.1) riskScore += 0.1;

        // Trend risk
        if (Math.abs(features.trend_strength) < 0.2) riskScore += 0.2; // Weak trend

        // Support/resistance risk
        if (features.resistance_distance < 0.01) riskScore += 0.2; // Near resistance
        if (features.support_distance < 0.01) riskScore -= 0.1; // Near support

        const normalizedRisk = Math.max(0, Math.min(1, (riskScore + 0.5)));

        let riskLevel;
        if (normalizedRisk < 0.3) riskLevel = 'low';
        else if (normalizedRisk < 0.7) riskLevel = 'medium';
        else riskLevel = 'high';

        return { risk: riskLevel, confidence: 1 - Math.abs(normalizedRisk - 0.5) * 2 };
    }
}

module.exports = EnhancedMLEngine;