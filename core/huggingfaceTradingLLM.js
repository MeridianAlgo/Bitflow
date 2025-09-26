const path = require('path');
const fs = require('fs');
// Use local transformers.js instead of HuggingFace API
const { pipeline } = require('@xenova/transformers');

class HuggingFaceTradingLLM {
    constructor() {
        // Always use local models
        this.apiAvailable = false;
        
        // Define local model paths
        this.localModelsDir = path.join(__dirname, 'models');
        
        // Ensure models directory exists
        if (!fs.existsSync(this.localModelsDir)) {
            fs.mkdirSync(this.localModelsDir, { recursive: true });
        }
        
        // Use smaller, faster models that can run locally
        this.sentimentModel = "Xenova/distilbert-base-uncased-finetuned-sst-2-english";
        this.textModel = "Xenova/distilgpt2"; // Small, fast text generation
        
        this.sentimentPipeline = null;
        this.textPipeline = null;
        this.isInitialized = false;
        this.cache = new Map(); // Simple caching for repeated queries
    }

    async initialize() {
        if (this.isInitialized) return true;

        try {
            // Initialize local models
            console.log('🔄 Initializing fast trading models...');
            
            // Initialize sentiment analysis pipeline
            this.sentimentPipeline = await pipeline('sentiment-analysis', this.sentimentModel);
            
            try {
                // Initialize text generation pipeline with specific model
                console.log(`Loading text generation model: ${this.textModel}`);
                this.textPipeline = await pipeline('text-generation', this.textModel, {
                    revision: 'main',
                    quantized: true,
                    cache_dir: this.localModelsDir
                });
            } catch (modelError) {
                console.warn(`⚠️ Could not load ${this.textModel}, using fallback model...`);
                // Try with a different model as fallback
                this.textModel = "Xenova/gpt2";
                try {
                    this.textPipeline = await pipeline('text-generation', this.textModel, {
                        revision: 'main',
                        quantized: true,
                        cache_dir: this.localModelsDir
                    });
                } catch (fallbackError) {
                    console.warn('⚠️ Fallback model failed, using sentiment model for generation');
                    // Use sentiment model for generation as last resort
                    this.textPipeline = null;
                }
            }

            this.isInitialized = true;
            console.log('✅ Fast local trading models initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Error initializing local models:', error.message);
            console.log('⚠️ Falling back to rule-based analysis');
            this.isInitialized = true;
            return true;
        }
    }

    async generateResponse(prompt, maxTokens = 50) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            // Check cache first for faster responses
            const cacheKey = `${prompt}_${maxTokens}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            // Use local text generation if available
            let result = '';
            if (this.textPipeline) {
                const output = await this.textPipeline(prompt, {
                    max_new_tokens: maxTokens,
                    temperature: 0.3,
                    do_sample: true
                });
                
                // Extract generated text
                result = output[0].generated_text.slice(prompt.length).trim();
            } else {
                // Fallback to rule-based response
                result = this.generateRuleBasedResponse(prompt);
            }
            
            // Cache the result
            this.cache.set(cacheKey, result);
            
            // Limit cache size
            if (this.cache.size > 100) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }

            return result;
        } catch (error) {
            console.error('❌ Error generating response from local model:', error.message);
            return this.generateRuleBasedResponse(prompt);
        }
    }
    
    // Fallback method when model is not available
    generateRuleBasedResponse(prompt) {
        // Simple rule-based response generation
        if (prompt.includes('buy') || prompt.includes('bullish')) {
            return "The market conditions appear favorable for a potential buy opportunity.";
        } else if (prompt.includes('sell') || prompt.includes('bearish')) {
            return "Current indicators suggest caution and potential selling pressure.";
        } else if (prompt.includes('hold')) {
            return "The market is showing mixed signals. Consider holding current positions.";
        } else {
            return "Market analysis is inconclusive at this time.";
        }
    }

    async getPositionSizeAdvice(availableCash, price, symbol, newsText = '') {
        // Use simple mathematical calculation for speed instead of LLM
        const riskPercent = 1; // 1% risk
        const maxOrderSize = 100; // Max $100 order
        const fee = 0.25; // 0.25% fee
        
        const riskAmount = availableCash * (riskPercent / 100);
        const maxQtyByRisk = Math.floor(riskAmount / price);
        const maxQtyByOrder = Math.floor(maxOrderSize / price);
        
        const qty = Math.min(maxQtyByRisk, maxQtyByOrder);
        
        // Quick sentiment analysis for take profit/stop loss adjustment
        let sentimentMultiplier = 1;
        if (newsText) {
            try {
                const sentiment = await this.getMarketSentiment(newsText);
                if (sentiment === 'POSITIVE') sentimentMultiplier = 1.2;
                if (sentiment === 'NEGATIVE') sentimentMultiplier = 0.8;
            } catch (error) {
                console.warn('⚠️ Sentiment analysis failed, using default values');
            }
        }
        
        const takeProfit = Math.min(1, Math.max(0.1, 0.5 * sentimentMultiplier));
        const stopLoss = Math.min(5, Math.max(1, 2 / sentimentMultiplier));
        
        return { qty, takeProfit, stopLoss };
    }

    async getTradeReasoning(signal, marketData) {
        // Generate quick, simple reasoning based on technical indicators
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

    async getMarketSentiment(newsText) {
        if (!newsText || newsText.length < 10) return 'NEUTRAL';
        
        try {
            // Use local sentiment analysis model if available
            if (this.sentimentPipeline) {
                const result = await this.sentimentPipeline(newsText);
                if (result && result.length > 0) {
                    const sentiment = result[0].label;
                    if (sentiment === 'POSITIVE' || sentiment === 'LABEL_1') return 'POSITIVE';
                    if (sentiment === 'NEGATIVE' || sentiment === 'LABEL_0') return 'NEGATIVE';
                    return 'NEUTRAL';
                }
            }
            if (!this.apiAvailable) {
                // Simple keyword-based sentiment analysis as fallback
                const text = newsText.toLowerCase();
                const positiveWords = ['rise', 'bull', 'up', 'gain', 'profit', 'buy', 'strong', 'growth', 'positive'];
                const negativeWords = ['fall', 'bear', 'down', 'loss', 'sell', 'weak', 'decline', 'negative', 'crash'];
                
                let positiveScore = 0;
                let negativeScore = 0;
                
                positiveWords.forEach(word => {
                    const matches = (text.match(new RegExp(word, 'g')) || []).length;
                    positiveScore += matches;
                });
                
                negativeWords.forEach(word => {
                    const matches = (text.match(new RegExp(word, 'g')) || []).length;
                    negativeScore += matches;
                });
                
                if (positiveScore > negativeScore) return 'POSITIVE';
                if (negativeScore > positiveScore) return 'NEGATIVE';
                return 'NEUTRAL';
            }
            
            const result = await this.hf.textClassification({
                model: this.sentimentModel,
                inputs: newsText.substring(0, 512) // Limit input length for speed
            });
            
            if (result && result.length > 0) {
                const topResult = result[0];
                const label = topResult.label.toUpperCase();
                
                // Map financial sentiment labels to our format
                if (label.includes('POSITIVE') || label.includes('BULLISH')) return 'POSITIVE';
                if (label.includes('NEGATIVE') || label.includes('BEARISH')) return 'NEGATIVE';
                return 'NEUTRAL';
            }
            
            return 'NEUTRAL';
        } catch (error) {
            console.error('❌ Error getting market sentiment:', error.message);
            return 'NEUTRAL';
        }
    }

    // Quick decision maker for real-time trading
    async getQuickTradingDecision(marketData, newsText = '') {
        const startTime = Date.now();
        
        try {
            // Parallel processing for speed
            const [sentiment, reasoning] = await Promise.all([
                this.getMarketSentiment(newsText),
                this.getTradeReasoning(marketData.signal, marketData)
            ]);
            
            const processingTime = Date.now() - startTime;
            
            return {
                sentiment,
                reasoning,
                confidence: this.calculateConfidence(marketData),
                processingTimeMs: processingTime
            };
        } catch (error) {
            console.error('❌ Error in quick trading decision:', error.message);
            return {
                sentiment: 'NEUTRAL',
                reasoning: `${marketData.signal} signal based on technical analysis`,
                confidence: 0.5,
                processingTimeMs: Date.now() - startTime
            };
        }
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

module.exports = HuggingFaceTradingLLM;
