/**
 * ML-Based Risk Management Module
 * Calculates optimal TP/SL based on historical volatility and MA behavior
 */

class MLRiskManager {
    constructor() {
        this.volatilityWindow = 50; // bars to analyze
        this.atrMultiplier = 1.5; // ATR-based stop loss
        this.riskRewardRatio = 2.0; // Default R:R
        
        // Safety caps (ultra-tight for scalping)
        this.maxStopLossPercent = 0.5; // Max 0.5% stop loss (scalping)
        this.maxTakeProfitPercent = 0.5; // Max 0.5% take profit (scalping)
        this.minStopLossPercent = 0.2; // Min 0.2% stop loss
        this.minTakeProfitPercent = 0.3; // Min 0.3% take profit
        
        // Position sizing limits
        this.maxPositionPercent = 10; // Max 10% of portfolio per trade
        this.minPositionSize = 0.001; // Minimum crypto position
        
        // Alpaca Crypto Trading Fees (tiered based on 30-day volume)
        this.feeTiers = [
            { volume: 0, maker: 0.0015, taker: 0.0025 },           // Tier 1: 0-100k
            { volume: 100000, maker: 0.0012, taker: 0.0022 },      // Tier 2: 100k-500k
            { volume: 500000, maker: 0.0010, taker: 0.0020 },      // Tier 3: 500k-1M
            { volume: 1000000, maker: 0.0008, taker: 0.0018 },     // Tier 4: 1M-10M
            { volume: 10000000, maker: 0.0005, taker: 0.0015 },    // Tier 5: 10M-25M
            { volume: 25000000, maker: 0.0002, taker: 0.0013 },    // Tier 6: 25M-50M
            { volume: 50000000, maker: 0.0002, taker: 0.0012 },    // Tier 7: 50M-100M
            { volume: 100000000, maker: 0.0000, taker: 0.0010 }    // Tier 8: 100M+
        ];
        
        // Default to Tier 1 (most conservative)
        this.currentTradingVolume = 0;
    }
    
    /**
     * Get fee rate based on 30-day trading volume
     * @param {number} volume30Day - 30-day trading volume in USD
     * @param {boolean} isMaker - true for maker orders, false for taker orders
     * @returns {number} Fee rate as decimal (e.g., 0.0025 = 0.25%)
     */
    getFeeRate(volume30Day = 0, isMaker = false) {
        // Find appropriate tier
        let tier = this.feeTiers[0];
        for (let i = this.feeTiers.length - 1; i >= 0; i--) {
            if (volume30Day >= this.feeTiers[i].volume) {
                tier = this.feeTiers[i];
                break;
            }
        }
        
        return isMaker ? tier.maker : tier.taker;
    }
    
    /**
     * Calculate total fees for a trade (buy + sell)
     * @param {number} positionSize - Size of position in crypto units
     * @param {number} entryPrice - Entry price
     * @param {number} exitPrice - Exit price (TP or SL)
     * @param {number} volume30Day - 30-day trading volume
     * @returns {object} Fee breakdown
     */
    calculateTradeFees(positionSize, entryPrice, exitPrice, volume30Day = 0) {
        // Assume market orders (taker fees) for conservative estimate
        const buyFeeRate = this.getFeeRate(volume30Day, false);
        const sellFeeRate = this.getFeeRate(volume30Day, false);
        
        // Buy fee: charged on crypto received
        const buyFee = positionSize * buyFeeRate;
        const buyFeeCost = buyFee * entryPrice; // USD value
        
        // Sell fee: charged on USD received
        const sellValue = positionSize * exitPrice;
        const sellFee = sellValue * sellFeeRate;
        
        // Total fees in USD
        const totalFees = buyFeeCost + sellFee;
        
        // Fee as percentage of position value
        const positionValue = positionSize * entryPrice;
        const feePercent = (totalFees / positionValue) * 100;
        
        return {
            buyFee: buyFee,
            buyFeeCost: buyFeeCost,
            sellFee: sellFee,
            totalFees: totalFees,
            feePercent: feePercent,
            buyFeeRate: buyFeeRate,
            sellFeeRate: sellFeeRate
        };
    }

    /**
     * Calculate Average True Range (ATR) for volatility
     */
    calculateATR(priceData, period = 14) {
        if (priceData.length < period + 1) {
            return null;
        }

        const trueRanges = [];
        for (let i = 1; i < priceData.length; i++) {
            const high = priceData[i].high || priceData[i].close;
            const low = priceData[i].low || priceData[i].close;
            const prevClose = priceData[i - 1].close;

            const tr = Math.max(
                high - low,
                Math.abs(high - prevClose),
                Math.abs(low - prevClose)
            );
            trueRanges.push(tr);
        }

        // Calculate ATR (simple moving average of TR)
        const recentTR = trueRanges.slice(-period);
        const atr = recentTR.reduce((sum, tr) => sum + tr, 0) / period;

        return atr;
    }

    /**
     * Calculate optimal TP/SL based on ML analysis with safety caps and fees, adjusted for timeframe
     */
    calculateOptimalTPSL(priceData, currentPrice, maType, maLength, positionSize = 0.001, volume30Day = 0, timeframe = '5m') {
        // Calculate ATR for volatility-based stops
        const atr = this.calculateATR(priceData);
        
        if (!atr) {
            // Fallback to percentage-based if not enough data
            return {
                stopLoss: currentPrice * 0.985, // 1.5%
                takeProfit: currentPrice * 1.03, // 3%
                method: 'fallback',
                confidence: 0.5
            };
        }

        // Analyze recent price action
        const recentData = priceData.slice(-this.volatilityWindow);
        const volatility = this.calculateVolatility(recentData);
        const trend = this.calculateTrend(recentData);
        
        // Calculate MA distance factor
        const maValues = this.calculateSimpleMA(recentData.map(d => d.close), maLength);
        const currentMA = maValues[maValues.length - 1];
        const maDistance = Math.abs((currentPrice - currentMA) / currentMA);

        // ML-based stop loss calculation
        // Wider stops in high volatility, tighter in low volatility
        const volatilityFactor = Math.max(0.5, Math.min(2.0, volatility / 0.02));
        let stopLossDistance = atr * this.atrMultiplier * volatilityFactor;
        
        // Apply safety caps to stop loss
        let stopLossPercent = (stopLossDistance / currentPrice * 100);
        stopLossPercent = Math.max(this.minStopLossPercent, Math.min(this.maxStopLossPercent, stopLossPercent));
        stopLossDistance = currentPrice * (stopLossPercent / 100);
        const stopLoss = currentPrice - stopLossDistance;

        // Dynamic R:R based on trend strength
        // Strong trends get higher R:R ratios
        const trendFactor = Math.abs(trend);
        const dynamicRR = this.riskRewardRatio * (1 + trendFactor * 0.5); // Reduced impact
        let takeProfitDistance = stopLossDistance * dynamicRR;
        
        // Apply safety caps to take profit
        let takeProfitPercent = (takeProfitDistance / currentPrice * 100);
        takeProfitPercent = Math.max(this.minTakeProfitPercent, Math.min(this.maxTakeProfitPercent, takeProfitPercent));
        takeProfitDistance = currentPrice * (takeProfitPercent / 100);
        let takeProfit = currentPrice + takeProfitDistance;

        // Timeframe-based adjustments for more aggressive TP/SL on shorter timeframes
        if (timeframe === '1m') {
            // For 1-minute, make TP/SL more aggressive (wider range)
            takeProfitPercent = Math.min(this.maxTakeProfitPercent * 1.3, takeProfitPercent * 1.3);
            stopLossPercent = Math.min(this.maxStopLossPercent * 1.2, stopLossPercent * 1.2);
        } else if (timeframe === '5m') {
            // Medium adjustment for 5-minute
            takeProfitPercent = Math.min(this.maxTakeProfitPercent * 1.1, takeProfitPercent * 1.1);
        }
        // 15m remains as is

        takeProfit = currentPrice * (1 + takeProfitPercent / 100);
        stopLoss = currentPrice * (1 - stopLossPercent / 100);

        // Calculate fees for both TP and SL scenarios
        const tpFees = this.calculateTradeFees(positionSize, currentPrice, takeProfit, volume30Day);
        const slFees = this.calculateTradeFees(positionSize, currentPrice, stopLoss, volume30Day);
        
        // Adjust TP to account for fees (need to make more profit to cover fees)
        const feeAdjustment = tpFees.totalFees / positionSize; // Fee per unit
        takeProfit = takeProfit + feeAdjustment;
        
        // Recalculate TP percent after fee adjustment
        takeProfitPercent = ((takeProfit - currentPrice) / currentPrice * 100);
        
        // Ensure still within caps after fee adjustment
        if (takeProfitPercent > this.maxTakeProfitPercent) {
            takeProfitPercent = this.maxTakeProfitPercent;
            takeProfit = currentPrice * (1 + takeProfitPercent / 100);
        }

        // Calculate confidence score
        const confidence = this.calculateConfidence(volatility, trend, maDistance);
        
        // Calculate net profit/loss after fees
        const tpNetProfit = (takeProfit - currentPrice) * positionSize - tpFees.totalFees;
        const slNetLoss = (currentPrice - stopLoss) * positionSize + slFees.totalFees;
        const netRiskReward = tpNetProfit / slNetLoss;

        return {
            stopLoss: stopLoss,
            takeProfit: takeProfit,
            stopLossPercent: stopLossPercent.toFixed(2),
            takeProfitPercent: takeProfitPercent.toFixed(2),
            riskRewardRatio: netRiskReward.toFixed(2),
            method: 'ml-atr-fees',
            confidence: confidence.toFixed(2),
            fees: {
                tpScenario: {
                    totalFees: tpFees.totalFees.toFixed(4),
                    feePercent: tpFees.feePercent.toFixed(3),
                    netProfit: tpNetProfit.toFixed(4)
                },
                slScenario: {
                    totalFees: slFees.totalFees.toFixed(4),
                    feePercent: slFees.feePercent.toFixed(3),
                    netLoss: slNetLoss.toFixed(4)
                },
                buyFeeRate: (tpFees.buyFeeRate * 100).toFixed(2) + '%',
                sellFeeRate: (tpFees.sellFeeRate * 100).toFixed(2) + '%'
            },
            metrics: {
                atr: atr.toFixed(2),
                volatility: (volatility * 100).toFixed(2) + '%',
                trend: trend.toFixed(3),
                maDistance: (maDistance * 100).toFixed(2) + '%'
            }
        };
    }

    /**
     * Calculate volatility (standard deviation of returns)
     */
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

    /**
     * Calculate trend strength (-1 to 1)
     */
    calculateTrend(priceData) {
        const prices = priceData.map(d => d.close);
        const n = prices.length;
        
        // Linear regression slope
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += prices[i];
            sumXY += i * prices[i];
            sumX2 += i * i;
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const avgPrice = sumY / n;
        
        // Normalize slope to -1 to 1 range
        return Math.max(-1, Math.min(1, slope / avgPrice * 100));
    }

    /**
     * Calculate simple moving average
     */
    calculateSimpleMA(prices, length) {
        const ma = [];
        for (let i = 0; i < prices.length; i++) {
            if (i < length - 1) {
                ma.push(null);
            } else {
                const sum = prices.slice(i - length + 1, i + 1).reduce((a, b) => a + b, 0);
                ma.push(sum / length);
            }
        }
        return ma;
    }

    /**
     * Calculate confidence score (0-1)
     */
    calculateConfidence(volatility, trend, maDistance) {
        // Higher confidence when:
        // - Volatility is moderate (not too high or low)
        // - Trend is strong
        // - Price is close to MA (good entry)
        
        const volScore = 1 - Math.abs(volatility - 0.02) / 0.05; // Optimal around 2%
        const trendScore = Math.abs(trend);
        const maScore = 1 - Math.min(maDistance / 0.05, 1); // Closer to MA is better

        const confidence = (volScore * 0.3 + trendScore * 0.4 + maScore * 0.3);
        return Math.max(0, Math.min(1, confidence));
    }

    /**
     * Calculate dynamic position size based on account, volatility, risk, and fees, adjusted for timeframe
     */
    calculatePositionSize(accountInfo, riskPercent, entryPrice, stopLoss, volatility, volume30Day = 0, timeframe = '5m') {
        // Use buying power for position sizing
        const availableCapital = accountInfo.buyingPower;
        
        // Base risk amount
        let riskAmount = accountInfo.equity * (riskPercent / 100);
        
        // Adjust risk based on volatility (reduce size in high volatility)
        const volatilityAdjustment = Math.max(0.5, Math.min(1.5, 1 / (volatility * 50)));
        riskAmount *= volatilityAdjustment;
        
        // Timeframe-based multiplier for position size (larger for shorter timeframes)
        let timeframeMultiplier = 1.0;
        switch (timeframe) {
            case '1m':
                timeframeMultiplier = 1.5; // Larger positions for 1-minute scalps
                break;
            case '5m':
                timeframeMultiplier = 1.0; // Medium for 5-minute
                break;
            case '15m':
                timeframeMultiplier = 0.7; // Smaller for 15-minute
                break;
            default:
                timeframeMultiplier = 1.0;
        }
        riskAmount *= timeframeMultiplier;
        
        // Distance to stop loss
        const stopDistance = Math.abs(entryPrice - stopLoss);
        
        // Calculate initial position size
        let positionSize = riskAmount / stopDistance;
        
        // Calculate fees for this position size
        const fees = this.calculateTradeFees(positionSize, entryPrice, stopLoss, volume30Day);
        
        // Adjust position size to account for fees
        // We need to ensure: (stopDistance * positionSize) + fees.totalFees <= riskAmount
        const adjustedRiskAmount = riskAmount - fees.totalFees;
        if (adjustedRiskAmount > 0) {
            positionSize = adjustedRiskAmount / stopDistance;
        }
        
        // Apply limits
        const maxSize = Math.min(
            availableCapital * (this.maxPositionPercent / 100) / entryPrice, // Max % of buying power
            accountInfo.equity * 0.15 / entryPrice // Max 15% of equity
        );
        
        positionSize = Math.max(this.minPositionSize, Math.min(maxSize, positionSize));
        
        // Recalculate final fees with adjusted position size
        const finalFees = this.calculateTradeFees(positionSize, entryPrice, stopLoss, volume30Day);
        
        // Calculate actual risk including fees
        const actualRisk = (stopDistance * positionSize) + finalFees.totalFees;
        const actualRiskPercent = (actualRisk / accountInfo.equity) * 100;
        
        return {
            size: positionSize,
            riskAmount: riskAmount,
            actualRisk: actualRisk,
            actualRiskPercent: actualRiskPercent.toFixed(2),
            volatilityAdjustment: volatilityAdjustment.toFixed(2),
            timeframeMultiplier: timeframeMultiplier.toFixed(2),
            maxAllowed: maxSize,
            fees: {
                totalFees: finalFees.totalFees.toFixed(4),
                feePercent: finalFees.feePercent.toFixed(3),
                buyFeeRate: (finalFees.buyFeeRate * 100).toFixed(2) + '%',
                sellFeeRate: (finalFees.sellFeeRate * 100).toFixed(2) + '%'
            }
        };
    }
}

module.exports = MLRiskManager;
