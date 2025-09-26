class FastLocalTradingAI {
    constructor() {
        this.isInitialized = true; // Always ready
        this.cache = new Map();
        
        // Simple sentiment keywords
        this.positiveWords = ['rise', 'bull', 'up', 'gain', 'profit', 'buy', 'strong', 'growth', 'positive', 'surge', 'rally'];
        this.negativeWords = ['fall', 'bear', 'down', 'loss', 'sell', 'weak', 'decline', 'negative', 'crash', 'drop'];
    }

    async initialize() {
        console.log('⚡ Fast Local Trading AI initialized instantly');
        return true;
    }

    async getPositionSizeAdvice(availableCash, price, symbol, newsText = '') {
        // Lightning-fast mathematical calculation
        const riskPercent = 1; // 1% risk
        const maxOrderSize = 100; // Max $100 order
        
        const riskAmount = availableCash * (riskPercent / 100);
        const maxQtyByRisk = Math.floor(riskAmount / price);
        const maxQtyByOrder = Math.floor(maxOrderSize / price);
        
        const qty = Math.min(maxQtyByRisk, maxQtyByOrder);
        
        // Quick sentiment analysis
        let sentimentMultiplier = 1;
        if (newsText) {
            const sentiment = this.getMarketSentiment(newsText);
            if (sentiment === 'POSITIVE') sentimentMultiplier = 1.2;
            if (sentiment === 'NEGATIVE') sentimentMultiplier = 0.8;
        }
        
        const takeProfit = Math.min(1, Math.max(0.1, 0.5 * sentimentMultiplier));
        const stopLoss = Math.min(5, Math.max(1, 2 / sentimentMultiplier));
        
        return { qty, takeProfit, stopLoss };
    }

    async getTradeReasoning(signal, marketData) {
        // Instant reasoning based on technical indicators
        const { rsi, ma_fast, ma_slow, trend, volatility } = marketData;
        
        let reasoning = `${signal} signal detected. `;
        
        if (signal === 'BUY') {
            reasoning += `RSI at ${rsi?.toFixed(1) || 'N/A'} suggests `;
            if (rsi < 30) reasoning += 'oversold conditions. ';
            else if (rsi < 70) reasoning += 'healthy momentum. ';
            else reasoning += 'potentially overbought. ';
            
            if (ma_fast > ma_slow) reasoning += 'Fast MA above slow MA confirms uptrend.';
        } else if (signal === 'SELL') {
            reasoning += `RSI at ${rsi?.toFixed(1) || 'N/A'} indicates `;
            if (rsi > 70) reasoning += 'overbought conditions. ';
            else reasoning += 'weakening momentum. ';
            
            if (ma_fast < ma_slow) reasoning += 'Fast MA below slow MA confirms downtrend.';
        }
        
        return reasoning;
    }

    getMarketSentiment(newsText) {
        if (!newsText || newsText.length < 10) return 'NEUTRAL';
        
        const text = newsText.toLowerCase();
        let positiveScore = 0;
        let negativeScore = 0;
        
        // Count positive words
        this.positiveWords.forEach(word => {
            const matches = (text.match(new RegExp(word, 'g')) || []).length;
            positiveScore += matches;
        });
        
        // Count negative words
        this.negativeWords.forEach(word => {
            const matches = (text.match(new RegExp(word, 'g')) || []).length;
            negativeScore += matches;
        });
        
        if (positiveScore > negativeScore) return 'POSITIVE';
        if (negativeScore > positiveScore) return 'NEGATIVE';
        return 'NEUTRAL';
    }

    async getQuickTradingDecision(marketData, newsText = '') {
        const startTime = Date.now();
        
        // All operations are synchronous and instant
        const sentiment = this.getMarketSentiment(newsText);
        const reasoning = await this.getTradeReasoning(marketData.signal, marketData);
        const confidence = this.calculateConfidence(marketData);
        
        const processingTime = Date.now() - startTime;
        
        return {
            sentiment,
            reasoning,
            confidence,
            processingTimeMs: processingTime
        };
    }

    calculateConfidence(marketData) {
        const { rsi, volatility, trend } = marketData;
        let confidence = 0.5; // Base confidence
        
        // RSI confidence
        if (rsi < 30 || rsi > 70) confidence += 0.2; // Strong RSI signals
        else if (rsi >= 40 && rsi <= 60) confidence += 0.1; // Neutral RSI
        
        // Trend confidence
        if (trend === 'up' || trend === 'down') confidence += 0.2;
        
        // Volatility adjustment
        if (volatility < 0.02) confidence += 0.1; // Low volatility = more predictable
        
        return Math.min(1, Math.max(0, confidence));
    }

    clearCache() {
        this.cache.clear();
    }
}

module.exports = FastLocalTradingAI;
