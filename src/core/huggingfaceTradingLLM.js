// Using local models instead of API
const fs = require('fs');
const path = require('path');
const { pipeline } = require('@xenova/transformers');

class HuggingFaceTradingLLM {
    constructor() {
        // Set up local model paths
        this.modelsDir = path.join(__dirname, '..', '..', 'models');
        this.ensureModelsDirectory();
        
        // Use local models that will be downloaded automatically
        this.sentimentModel = "Xenova/distilbert-base-uncased-finetuned-sst-2-english";
        this.textModel = "Xenova/distilgpt2"; // Small, fast text generation
        
        this.apiAvailable = false; // Always use local models
        this.isInitialized = false;
        this.cache = new Map(); // Simple caching for repeated queries
        this.sentimentPipeline = null;
        this.textPipeline = null;
    }
    
    ensureModelsDirectory() {
        if (!fs.existsSync(this.modelsDir)) {
            fs.mkdirSync(this.modelsDir, { recursive: true });
        }
        // Set environment variable to store models locally
        process.env.TRANSFORMERS_CACHE = this.modelsDir;
    }

    async initialize() {
        if (this.isInitialized) return true;

        try {
            const ora = require('ora');
            
            // Initialize local models
            console.log('📂 Models will be stored in:', this.modelsDir);
            
            // Initialize sentiment analysis pipeline
            const sentimentSpinner = ora('Loading sentiment analysis model...').start();
            try {
                this.sentimentPipeline = await pipeline('sentiment-analysis', this.sentimentModel);
                sentimentSpinner.succeed(`Sentiment model loaded: ${this.sentimentModel}`);
            } catch (error) {
                sentimentSpinner.fail(`Failed to load sentiment model: ${error.message}`);
                throw error;
            }
            
            // Load text generation model
            const textSpinner = ora('Loading text generation model...').start();
            try {
                await this.loadTextPipeline();
                textSpinner.succeed(`Text generation model loaded: ${this.textModel}`);
            } catch (error) {
                textSpinner.fail(`Failed to load text model: ${error.message}`);
                throw error;
            }
            
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('❌ Error initializing local models:', error.message);
            console.log('⚠️ Switching to basic fallback mode');
            this.apiAvailable = false;
            this.isInitialized = true;
            return true;
        }
    }

    async generateResponse(prompt, maxTokens = 50) {
        const cacheKey = `${prompt}_${maxTokens}`;
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
        
        try {
            let response = '';
            
            // Use local text generation if available
            if (this.textPipeline) {
                const result = await this.textPipeline(prompt, {
                    max_new_tokens: maxTokens,
                    temperature: 0.7
                });
                response = result[0].generated_text;
            } else {
                // Fallback response generation
                const keywords = {
                    'buy': ['uptrend', 'support', 'bullish', 'oversold', 'accumulation'],
                    'sell': ['downtrend', 'resistance', 'bearish', 'overbought', 'distribution'],
                    'hold': ['consolidation', 'sideways', 'range-bound', 'unclear', 'wait']
                };
                
                // Simple keyword matching for fallback
                const promptLower = prompt.toLowerCase();
                let action = 'hold'; // Default action
                
                if (promptLower.includes('buy') || promptLower.includes('bullish')) {
                    action = 'buy';
                } else if (promptLower.includes('sell') || promptLower.includes('bearish')) {
                    action = 'sell';
                }
                
                // Generate simple response based on action
                const actionWords = keywords[action];
                const randomWord = actionWords[Math.floor(Math.random() * actionWords.length)];
                response = `Based on the ${randomWord} pattern, I would recommend to ${action}.`;
            }
            
            this.cache.set(cacheKey, response);
            return response;
        } catch (error) {
            console.warn('⚠️ Error generating response:', error.message);
            return 'Unable to generate response at this time.';
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
            // Check if sentiment pipeline is initialized
            if (this.sentimentPipeline) {
                // Use local sentiment model
                const result = await this.sentimentPipeline(newsText.substring(0, 512));
                
                if (result && result.length > 0) {
                    // Map the sentiment label to our format
                    const sentiment = result[0].label.toUpperCase();
                    if (sentiment === 'POSITIVE' || sentiment === 'NEGATIVE') {
                        return sentiment;
                    }
                    return 'NEUTRAL';
                }
            } else {
                // Fallback keyword-based sentiment analysis
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
        } catch (error) {
            console.warn('⚠️ Error in sentiment analysis:', error.message);
            return 'NEUTRAL';
        }
    async loadTextPipeline() {
        try {
            console.log('🔄 Loading text generation model:', this.textModel);
            this.textPipeline = await pipeline('text-generation', this.textModel);
            console.log('✅ Text generation model loaded successfully');
            return true;
        } catch (error) {
            console.error('❌ Error loading text generation model:', error.message);
            return false;
        }
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
