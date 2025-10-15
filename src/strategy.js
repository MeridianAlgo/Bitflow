/**
 * Strategy Optimization Module for BitFlow Trading Bot
 * ML-powered moving average optimization and signal generation
 */

const { SMA, EMA, WMA } = require('technicalindicators');

class StrategyOptimizer {
    constructor(timeframe, symbol) {
        this.timeframe = timeframe;
        this.symbol = symbol;
        this.maTypes = ['SMA', 'EMA', 'WMA', 'DEMA', 'TEMA', 'HMA', 'VWAP']; // Extended MA types
        this.lengthRange = { min: 5, max: 30 }; // Optimized range as per requirements
        this.almaOffset = 0.85;
        this.almaSigma = 6;
    }

    /**
     * Optimize MA parameters using ML scoring with CLI progress bar
     */
    async optimizeMAParameters(historicalData, timeframe, progressCallback = null) {
        try {
            if (!historicalData || historicalData.length < 50) {
                throw new Error('Insufficient historical data for optimization');
            }

            const prices = historicalData.map(d => d.close);
            let bestConfig = null;
            let bestScore = -Infinity;
            const results = [];

            const totalCombinations = this.maTypes.length * (this.lengthRange.max - this.lengthRange.min + 1);
            let tested = 0;

            // Test all MA type and length combinations (SILENT - only progress bar)
            for (const maType of this.maTypes) {
                for (let length = this.lengthRange.min; length <= this.lengthRange.max; length++) {
                    try {
                        tested++;
                        
                        // Update progress bar
                        if (progressCallback) {
                            progressCallback(tested / totalCombinations);
                        }

                        const maValues = this.calculateMA(prices, maType, length);
                        
                        if (maValues && maValues.length > 20) {
                            // Calculate multiple scoring metrics
                            const crossoverScore = this.scoreMA(prices, maValues, length, 20);
                            const rSquared = this.calculateRSquared(prices.slice(-maValues.length), maValues, maValues.length);
                            const performance = this.evaluatePerformance(prices, maValues);
                            
                            // Composite ML score combining multiple factors
                            const compositeScore = this.calculateCompositeScore(
                                crossoverScore, 
                                rSquared, 
                                performance, 
                                timeframe
                            );
                            
                            const config = {
                                type: maType,
                                length: length,
                                score: compositeScore,
                                crossoverScore: crossoverScore,
                                rSquared: rSquared,
                                performance: performance,
                                timeframe: timeframe
                            };
                            
                            results.push(config);
                            
                            if (compositeScore > bestScore) {
                                bestScore = compositeScore;
                                bestConfig = config;
                            }
                        }
                    } catch (error) {
                        // Skip invalid configurations
                        continue;
                    }
                }
            }

            if (!bestConfig) {
                throw new Error('No valid MA configuration found');
            }

            // Store all results
            bestConfig.allResults = results;

            return bestConfig;

        } catch (error) {
            console.error('❌ MA optimization failed:', error.message);
            throw error;
        }
    }

    /**
     * Calculate composite ML score combining multiple factors
     */
    calculateCompositeScore(crossoverScore, rSquared, performance, timeframe) {
        try {
            // Weights for different factors (can be tuned)
            const weights = {
                crossover: 0.4,    // 40% - crossover profitability
                rSquared: 0.2,     // 20% - trend following ability
                winRate: 0.2,      // 20% - win rate
                profitFactor: 0.1, // 10% - profit factor
                drawdown: 0.1      // 10% - risk (inverted)
            };

            // Normalize scores to 0-1 range
            const normalizedCrossover = Math.max(0, Math.min(1, (crossoverScore + 100) / 200));
            const normalizedRSquared = Math.max(0, Math.min(1, rSquared));
            const normalizedWinRate = Math.max(0, Math.min(1, performance.winRate));
            const normalizedProfitFactor = Math.max(0, Math.min(1, performance.profitFactor / 1000));
            const normalizedDrawdown = Math.max(0, Math.min(1, 1 - (performance.maxDrawdown / 1000))); // Inverted

            // Calculate weighted composite score
            const compositeScore = 
                weights.crossover * normalizedCrossover +
                weights.rSquared * normalizedRSquared +
                weights.winRate * normalizedWinRate +
                weights.profitFactor * normalizedProfitFactor +
                weights.drawdown * normalizedDrawdown;

            // Apply timeframe-specific adjustments
            let timeframeMultiplier = 1.0;
            switch (timeframe) {
                case '1m':
                    timeframeMultiplier = 0.9; // Slightly penalize high-frequency
                    break;
                case '5m':
                    timeframeMultiplier = 1.0; // Optimal timeframe
                    break;
                case '15m':
                    timeframeMultiplier = 0.95; // Slightly penalize low-frequency
                    break;
            }

            return compositeScore * timeframeMultiplier;

        } catch (error) {
            console.error('Error calculating composite score:', error.message);
            return 0;
        }
    }

    /**
     * Calculate moving average based on type with comprehensive error handling
     */
    calculateMA(prices, type, length, almaOffset = this.almaOffset, almaSigma = this.almaSigma) {
        try {
            // Validate inputs
            if (!prices || !Array.isArray(prices) || prices.length === 0) {
                throw new Error('Invalid prices array');
            }
            
            if (!type || typeof type !== 'string') {
                throw new Error('Invalid MA type');
            }
            
            if (!length || length < 1 || length > prices.length) {
                throw new Error(`Invalid MA length: ${length} (prices: ${prices.length})`);
            }

            // Filter out invalid prices
            const validPrices = prices.filter(price => 
                typeof price === 'number' && 
                !isNaN(price) && 
                isFinite(price) && 
                price > 0
            );

            if (validPrices.length < length) {
                throw new Error(`Insufficient valid prices: ${validPrices.length} < ${length}`);
            }

            const input = { period: length, values: validPrices };
            let result = null;
            
            switch (type.toUpperCase()) {
                case 'SMA':
                    result = SMA.calculate(input);
                    break;
                case 'EMA':
                    result = EMA.calculate(input);
                    break;
                case 'WMA':
                    result = WMA.calculate(input);
                    break;
                case 'DEMA':
                    // Double EMA
                    const ema1 = EMA.calculate(input);
                    const ema2 = EMA.calculate({ period: length, values: ema1 });
                    result = ema1.slice(-ema2.length).map((e1, i) => 2 * e1 - ema2[i]);
                    break;
                case 'TEMA':
                    // Triple EMA
                    const tema1 = EMA.calculate(input);
                    const tema2 = EMA.calculate({ period: length, values: tema1 });
                    const tema3 = EMA.calculate({ period: length, values: tema2 });
                    result = tema1.slice(-tema3.length).map((e1, i) => 
                        3 * e1 - 3 * tema2.slice(-tema3.length)[i] + tema3[i]
                    );
                    break;
                case 'HMA':
                    // Hull MA
                    const halfLength = Math.floor(length / 2);
                    const sqrtLength = Math.floor(Math.sqrt(length));
                    const wma1 = WMA.calculate({ period: halfLength, values: validPrices });
                    const wma2 = WMA.calculate({ period: length, values: validPrices });
                    const diff = wma1.slice(-wma2.length).map((w1, i) => 2 * w1 - wma2[i]);
                    result = WMA.calculate({ period: sqrtLength, values: diff });
                    break;
                case 'VWAP':
                    // Simple VWAP approximation (price-based)
                    result = [];
                    for (let i = length - 1; i < validPrices.length; i++) {
                        const slice = validPrices.slice(i - length + 1, i + 1);
                        const vwap = slice.reduce((sum, p, idx) => sum + p * (idx + 1), 0) / 
                                    slice.reduce((sum, p, idx) => sum + (idx + 1), 0);
                        result.push(vwap);
                    }
                    break;
                default:
                    console.log(`Unknown MA type '${type}', using SMA`);
                    result = SMA.calculate(input);
            }

            // Validate result
            if (!result || !Array.isArray(result) || result.length === 0) {
                throw new Error(`MA calculation returned invalid result for ${type}`);
            }

            // Check for NaN or invalid values in result
            const validResult = result.filter(value => 
                typeof value === 'number' && 
                !isNaN(value) && 
                isFinite(value)
            );

            if (validResult.length !== result.length) {
                console.log(`⚠️ Filtered ${result.length - validResult.length} invalid MA values`);
            }

            return validResult;
            
        } catch (error) {
            console.error(`❌ Error calculating ${type}(${length}):`, error.message);
            return null;
        }
    }

    /**
     * Calculate Linear Regression MA
     */
    calculateLinearRegression(prices, length) {
        const result = [];
        
        for (let i = length - 1; i < prices.length; i++) {
            const slice = prices.slice(i - length + 1, i + 1);
            const n = slice.length;
            const x = Array.from({ length: n }, (_, idx) => idx);
            const y = slice;
            
            // Calculate linear regression
            const sumX = x.reduce((a, b) => a + b, 0);
            const sumY = y.reduce((a, b) => a + b, 0);
            const sumXY = x.reduce((sum, xi, idx) => sum + xi * y[idx], 0);
            const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
            
            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;
            
            // Get the last point of the regression line
            const lastX = n - 1;
            const value = slope * lastX + intercept;
            
            result.push(value);
        }
        
        return result;
    }

    /**
     * Score MA based on crossover performance
     */
    scoreMA(prices, maValues, length, evaluationPeriod = 20) {
        try {
            if (!prices || !maValues || maValues.length < evaluationPeriod) {
                return 0;
            }

            let score = 0;
            const startIdx = Math.max(0, maValues.length - evaluationPeriod);
            
            for (let i = startIdx + 1; i < maValues.length; i++) {
                const priceIdx = prices.length - maValues.length + i;
                
                if (priceIdx > 0 && priceIdx < prices.length) {
                    const prevPrice = prices[priceIdx - 1];
                    const currentPrice = prices[priceIdx];
                    const prevMA = maValues[i - 1];
                    const currentMA = maValues[i];
                    
                    // Check for crossovers
                    const longSignal = prevPrice <= prevMA && currentPrice > currentMA;
                    const shortSignal = prevPrice >= prevMA && currentPrice < currentMA;
                    
                    if (longSignal) {
                        // Reward upward crossovers
                        const profit = currentPrice - prevPrice;
                        score += profit / length; // Normalize by MA length
                    } else if (shortSignal) {
                        // Reward downward crossovers (for selling)
                        const profit = prevPrice - currentPrice;
                        score += profit / length;
                    }
                }
            }
            
            return score;
            
        } catch (error) {
            console.error('Error scoring MA:', error.message);
            return 0;
        }
    }

    /**
     * Calculate R-squared for trend fit quality
     */
    calculateRSquared(prices, maValues, length) {
        try {
            if (!prices || !maValues || prices.length !== maValues.length) {
                return 0;
            }

            const n = Math.min(prices.length, length);
            const priceSlice = prices.slice(-n);
            const maSlice = maValues.slice(-n);
            
            const priceMean = priceSlice.reduce((a, b) => a + b, 0) / n;
            
            let ssRes = 0; // Sum of squares of residuals
            let ssTot = 0; // Total sum of squares
            
            for (let i = 0; i < n; i++) {
                ssRes += Math.pow(priceSlice[i] - maSlice[i], 2);
                ssTot += Math.pow(priceSlice[i] - priceMean, 2);
            }
            
            return ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
            
        } catch (error) {
            console.error('Error calculating R-squared:', error.message);
            return 0;
        }
    }

    /**
     * Evaluate MA performance metrics
     */
    evaluatePerformance(prices, maValues) {
        try {
            let trades = [];
            let inPosition = false;
            let entryPrice = 0;
            
            // Simulate trading based on crossovers
            for (let i = 1; i < maValues.length; i++) {
                const priceIdx = prices.length - maValues.length + i;
                
                if (priceIdx > 0 && priceIdx < prices.length) {
                    const prevPrice = prices[priceIdx - 1];
                    const currentPrice = prices[priceIdx];
                    const prevMA = maValues[i - 1];
                    const currentMA = maValues[i];
                    
                    // Buy signal: price crosses above MA
                    if (!inPosition && prevPrice <= prevMA && currentPrice > currentMA) {
                        inPosition = true;
                        entryPrice = currentPrice;
                    }
                    // Sell signal: price crosses below MA
                    else if (inPosition && prevPrice >= prevMA && currentPrice < currentMA) {
                        inPosition = false;
                        const profit = currentPrice - entryPrice;
                        const profitPercent = (profit / entryPrice) * 100;
                        trades.push({
                            entry: entryPrice,
                            exit: currentPrice,
                            profit: profit,
                            profitPercent: profitPercent,
                            win: profit > 0
                        });
                    }
                }
            }
            
            // Calculate metrics
            const wins = trades.filter(t => t.win).length;
            const losses = trades.filter(t => !t.win).length;
            const totalProfit = trades.reduce((sum, t) => sum + (t.win ? t.profit : 0), 0);
            const totalLoss = Math.abs(trades.reduce((sum, t) => sum + (!t.win ? t.profit : 0), 0));
            
            let maxDrawdown = 0;
            let peak = 0;
            let runningTotal = 0;
            trades.forEach(t => {
                runningTotal += t.profit;
                if (runningTotal > peak) peak = runningTotal;
                const drawdown = peak - runningTotal;
                if (drawdown > maxDrawdown) maxDrawdown = drawdown;
            });
            
            return {
                winRate: trades.length > 0 ? wins / trades.length : 0,
                profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit,
                maxDrawdown: maxDrawdown,
                totalTrades: trades.length,
                wins: wins,
                losses: losses,
                sharpeRatio: this.calculateSharpeRatio(prices, maValues)
            };
            
        } catch (error) {
            console.error('Error evaluating performance:', error.message);
            return {
                winRate: 0,
                profitFactor: 0,
                maxDrawdown: 0,
                totalTrades: 0,
                wins: 0,
                losses: 0,
                sharpeRatio: 0
            };
        }
    }

    /**
     * Calculate Sharpe ratio
     */
    calculateSharpeRatio(prices, maValues) {
        try {
            const returns = [];
            
            for (let i = 1; i < Math.min(prices.length, maValues.length); i++) {
                const priceReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
                returns.push(priceReturn);
            }
            
            if (returns.length === 0) return 0;
            
            const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
            const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
            const stdDev = Math.sqrt(variance);
            
            return stdDev === 0 ? 0 : avgReturn / stdDev;
            
        } catch (error) {
            return 0;
        }
    }

    /**
     * Generate trading signals with comprehensive validation and candle close confirmation
     */
    calculateSignals(prices, maType, maLength, candleData = null) {
        try {
            // Input validation
            if (!prices || !Array.isArray(prices) || prices.length < maLength + 2) {
                return { 
                    action: 'HOLD', 
                    confidence: 0, 
                    reason: `Insufficient data: ${prices?.length || 0} < ${maLength + 2}`,
                    valid: false
                };
            }

            if (!maType || !maLength) {
                return { 
                    action: 'HOLD', 
                    confidence: 0, 
                    reason: 'Invalid MA parameters',
                    valid: false
                };
            }

            // Calculate MA values
            const maValues = this.calculateMA(prices, maType, maLength);
            
            if (!maValues || maValues.length < 2) {
                return { 
                    action: 'HOLD', 
                    confidence: 0, 
                    reason: 'Invalid MA calculation',
                    valid: false
                };
            }

            // Get current and previous values
            const currentPrice = prices[prices.length - 1];
            const prevPrice = prices[prices.length - 2];
            const currentMA = maValues[maValues.length - 1];
            const prevMA = maValues[maValues.length - 2];

            // Validate price and MA values
            if (!this.validatePriceData([currentPrice, prevPrice, currentMA, prevMA])) {
                return { 
                    action: 'HOLD', 
                    confidence: 0, 
                    reason: 'Invalid price or MA values',
                    valid: false
                };
            }

            // Check for candle close confirmation if candle data is provided
            const candleCloseConfirmed = this.validateCandleClose(candleData, currentPrice);
            
            if (candleData && !candleCloseConfirmed) {
                return { 
                    action: 'HOLD', 
                    confidence: 0, 
                    reason: 'Waiting for candle close confirmation',
                    valid: true,
                    pending: true
                };
            }

            // Detect crossovers with strict validation
            const crossoverResult = this.detectCrossover(
                prevPrice, currentPrice, 
                prevMA, currentMA, 
                maType, maLength
            );

            if (crossoverResult.detected) {
                const confidence = this.calculateSignalConfidence(prices, maValues);
                const validatedConfidence = this.validateSignalStrength(confidence, crossoverResult);

                return {
                    action: crossoverResult.direction,
                    confidence: validatedConfidence,
                    reason: crossoverResult.reason,
                    valid: true,
                    crossover: crossoverResult,
                    maType: maType,
                    maLength: maLength,
                    timestamp: new Date(),
                    timeframe: this.timeframe
                };
            }

            // No signal detected
            return { 
                action: 'HOLD', 
                confidence: 0, 
                reason: 'No crossover detected',
                valid: true,
                currentPrice: currentPrice,
                currentMA: currentMA,
                trend: currentPrice > currentMA ? 'BULLISH' : 'BEARISH'
            };

        } catch (error) {
            console.error('❌ Error calculating signals:', error.message);
            return { 
                action: 'HOLD', 
                confidence: 0, 
                reason: `Signal calculation error: ${error.message}`,
                valid: false
            };
        }
    }

    /**
     * Validate price data for signal calculation
     */
    validatePriceData(values) {
        return values.every(value => 
            typeof value === 'number' && 
            !isNaN(value) && 
            isFinite(value) && 
            value > 0
        );
    }

    /**
     * Validate candle close confirmation
     */
    validateCandleClose(candleData, currentPrice) {
        if (!candleData) {
            return true; // No candle data provided, assume confirmed
        }

        // Check if candle is closed (current time is past candle end time)
        const now = new Date();
        const candleEndTime = this.getCandleEndTime(candleData.startTime);
        
        if (now >= candleEndTime) {
            // Candle is closed, verify price matches candle close
            const priceDiff = Math.abs(currentPrice - candleData.close) / currentPrice;
            return priceDiff < 0.001; // Allow 0.1% difference for price discrepancies
        }

        return false; // Candle not yet closed
    }

    /**
     * Get candle end time based on timeframe
     */
    getCandleEndTime(startTime) {
        const endTime = new Date(startTime);
        
        switch (this.timeframe) {
            case '1m':
                endTime.setMinutes(endTime.getMinutes() + 1);
                break;
            case '5m':
                endTime.setMinutes(endTime.getMinutes() + 5);
                break;
            case '15m':
                endTime.setMinutes(endTime.getMinutes() + 15);
                break;
            default:
                endTime.setMinutes(endTime.getMinutes() + 5);
        }
        
        return endTime;
    }

    /**
     * Detect crossover with detailed analysis
     */
    detectCrossover(prevPrice, currentPrice, prevMA, currentMA, maType, maLength) {
        try {
            // Bullish crossover: price crosses above MA
            const bullishCrossover = prevPrice <= prevMA && currentPrice > currentMA;
            
            // Bearish crossover: price crosses below MA
            const bearishCrossover = prevPrice >= prevMA && currentPrice < currentMA;

            if (bullishCrossover) {
                const strength = this.calculateCrossoverStrength(
                    prevPrice, currentPrice, prevMA, currentMA, 'bullish'
                );
                
                return {
                    detected: true,
                    direction: 'BUY',
                    type: 'bullish',
                    strength: strength,
                    reason: `Bullish crossover: Price (${currentPrice.toFixed(4)}) crossed above ${maType}(${maLength}) at ${currentMA.toFixed(4)}`,
                    priceChange: currentPrice - prevPrice,
                    maChange: currentMA - prevMA,
                    crossoverGap: currentPrice - currentMA
                };
            }

            if (bearishCrossover) {
                const strength = this.calculateCrossoverStrength(
                    prevPrice, currentPrice, prevMA, currentMA, 'bearish'
                );
                
                return {
                    detected: true,
                    direction: 'SELL',
                    type: 'bearish',
                    strength: strength,
                    reason: `Bearish crossover: Price (${currentPrice.toFixed(4)}) crossed below ${maType}(${maLength}) at ${currentMA.toFixed(4)}`,
                    priceChange: currentPrice - prevPrice,
                    maChange: currentMA - prevMA,
                    crossoverGap: currentMA - currentPrice
                };
            }

            return { detected: false };

        } catch (error) {
            console.error('Error detecting crossover:', error.message);
            return { detected: false, error: error.message };
        }
    }

    /**
     * Calculate crossover strength
     */
    calculateCrossoverStrength(prevPrice, currentPrice, prevMA, currentMA, type) {
        try {
            // Calculate the magnitude of the crossover
            const priceMovement = Math.abs(currentPrice - prevPrice) / prevPrice;
            const maMovement = Math.abs(currentMA - prevMA) / prevMA;
            
            // Calculate gap after crossover
            const gap = type === 'bullish' ? 
                (currentPrice - currentMA) / currentMA :
                (currentMA - currentPrice) / currentMA;
            
            // Combine factors for strength score (0-1)
            const strength = Math.min(1, (priceMovement * 2 + maMovement + gap * 0.5) / 3);
            
            return Math.max(0, strength);
            
        } catch (error) {
            return 0.5; // Default strength
        }
    }

    /**
     * Validate signal strength and adjust confidence
     */
    validateSignalStrength(baseConfidence, crossoverResult) {
        try {
            let adjustedConfidence = baseConfidence;
            
            // Adjust based on crossover strength
            if (crossoverResult.strength) {
                adjustedConfidence *= (0.5 + crossoverResult.strength * 0.5);
            }
            
            // Adjust based on crossover gap (larger gap = higher confidence)
            if (crossoverResult.crossoverGap) {
                const gapFactor = Math.min(1, Math.abs(crossoverResult.crossoverGap) / 100);
                adjustedConfidence *= (0.8 + gapFactor * 0.2);
            }
            
            // Ensure confidence is within valid range
            return Math.max(0, Math.min(100, Math.round(adjustedConfidence)));
            
        } catch (error) {
            return baseConfidence;
        }
    }

    /**
     * Calculate signal confidence
     */
    calculateSignalConfidence(prices, maValues) {
        try {
            if (!prices || !maValues || prices.length < 10) return 0;

            // Base confidence on recent price action and MA alignment
            const recentPrices = prices.slice(-10);
            const recentMA = maValues.slice(-10);
            
            let alignment = 0;
            for (let i = 0; i < Math.min(recentPrices.length, recentMA.length); i++) {
                if (recentPrices[i] > recentMA[i]) alignment++;
            }
            
            const confidence = Math.min(100, Math.max(0, (alignment / recentPrices.length) * 100));
            return Math.round(confidence);
            
        } catch (error) {
            return 50; // Default confidence
        }
    }
}

module.exports = StrategyOptimizer;