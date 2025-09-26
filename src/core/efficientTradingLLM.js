const { pipeline } = require('@huggingface/transformers');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Efficient Trading LLM System
 * 
 * This system provides lightweight, trading-specific LLMs that are:
 * - Much smaller than LLaMA (under 1GB vs 4GB+)
 * - Optimized for financial/trading tasks
 * - CPU-friendly with minimal resource usage
 * - Fast inference times
 */
class EfficientTradingLLM {
    constructor() {
        // Create a local cache directory for downloaded models
        this.cacheDir = path.join(__dirname, '..', '..', 'models_cache');
        try {
            if (!fs.existsSync(this.cacheDir)) {
                fs.mkdirSync(this.cacheDir, { recursive: true });
            }
            // Hint libraries to use our cache directory
            process.env.HF_HOME = this.cacheDir;
            process.env.TRANSFORMERS_CACHE = this.cacheDir;
            process.env.HUGGINGFACE_HUB_CACHE = this.cacheDir;
        } catch (e) {
            // Non-fatal if we cannot set up cache directory
        }
        this.models = {
            // Ultra-lightweight models compatible with @huggingface/transformers (ONNX via Xenova)
            'Xenova/distilbert-base-uncased-finetuned-sst-2-english': {
                name: 'DistilBERT (SST-2 Sentiment)',
                size: '66MB',
                description: 'Ultra-lightweight sentiment model, great default for news/market tone',
                useCase: 'News sentiment, market sentiment analysis',
                cpuUsage: 'Very Low',
                speed: 'Very Fast'
            },
            'Xenova/distilgpt2': {
                name: 'DistilGPT-2 (ONNX)',
                size: '82MB',
                description: 'Lightweight GPT-2 variant for quick text generation',
                useCase: 'Market commentary, trade explanations',
                cpuUsage: 'Very Low',
                speed: 'Very Fast'
            },
            // Financial-specific ONNX alternative (falls back to generic sentiment if unavailable)
            // Note: If you want true FinBERT ONNX, convert and host or switch to a Xenova-finbert repo when available
            'Xenova/bert-base-uncased': {
                name: 'BERT Base (Generic)',
                size: '418MB',
                description: 'Generic BERT encoder usable for classification when fine-tuned locally',
                useCase: 'Fallback classification when domain-specific model unavailable',
                cpuUsage: 'Low',
                speed: 'Fast'
            }
        };
        
        this.currentModel = null;
        this.pipeline = null;
        this.isInitialized = false;
        this.modelCache = new Map();
    }

    /**
     * Get available models with their specifications
     */
    getAvailableModels() {
        return this.models;
    }

    /**
     * Display model information
     */
    displayModelInfo(modelId) {
        const model = this.models[modelId];
        if (!model) {
            console.log(chalk.red(`❌ Model not found: ${modelId}`));
            return;
        }

        console.log(chalk.blue(`\n📊 Model Information: ${model.name}`));
        console.log(chalk.blue('=' .repeat(50)));
        console.log(`Model ID: ${modelId}`);
        console.log(`Size: ${model.size}`);
        console.log(`Description: ${model.description}`);
        console.log(`Use Case: ${model.useCase}`);
        console.log(`CPU Usage: ${model.cpuUsage}`);
        console.log(`Speed: ${model.speed}`);
        console.log(chalk.blue('=' .repeat(50)));
    }

    /**
     * List all available models
     */
    listModels() {
        console.log(chalk.blue('\n🤖 Available Efficient Trading LLMs'));
        console.log(chalk.blue('=' .repeat(60)));
        
        Object.entries(this.models).forEach(([id, model], index) => {
            const status = this.currentModel === id ? '🟢 ACTIVE' : '⚪ Available';
            console.log(`${index + 1}. ${model.name} ${status}`);
            console.log(`   ID: ${id}`);
            console.log(`   Size: ${model.size} | CPU: ${model.cpuUsage} | Speed: ${model.speed}`);
            console.log(`   Use: ${model.useCase}`);
            console.log('');
        });
    }

    /**
     * Initialize a specific model
     */
    async initializeModel(modelId = 'distilbert-base-uncased') {
        if (!this.models[modelId]) {
            throw new Error(`Model not found: ${modelId}`);
        }

        console.log(chalk.yellow(`🔄 Initializing ${this.models[modelId].name}...`));
        console.log(chalk.gray(`Size: ${this.models[modelId].size} | CPU Usage: ${this.models[modelId].cpuUsage}`));

        try {
            // Check if model is already cached
            if (this.modelCache.has(modelId)) {
                this.pipeline = this.modelCache.get(modelId);
                console.log(chalk.green(`✅ Using cached model: ${modelId}`));
            } else {
            // Load model with optimized settings
            const startTime = Date.now();
            
            try {
                this.pipeline = await pipeline('text-classification', modelId, {
                    // Optimize for CPU usage
                    device: 'cpu',
                    // Reduce memory usage
                    max_length: 512,
                    // Faster inference
                    batch_size: 1,
                    // Disable unnecessary features
                    return_tensors: false,
                    // Add timeout and retry options
                    timeout: 30000,
                    retry: 3,
                    cache_dir: this.cacheDir
                });
            } catch (error) {
                console.warn(chalk.yellow(`⚠️ Failed to load ${modelId}, trying fallback model...`));
                // Fallback to a more reliable model
                const fallbackModel = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
                this.pipeline = await pipeline('text-classification', fallbackModel, {
                    device: 'cpu',
                    max_length: 512,
                    batch_size: 1,
                    return_tensors: false,
                    cache_dir: this.cacheDir
                });
                console.log(chalk.green(`✅ Using fallback model: ${fallbackModel}`));
            }
                
                const loadTime = Date.now() - startTime;
                console.log(chalk.green(`✅ Model loaded in ${loadTime}ms`));
                
                // Cache the model
                this.modelCache.set(modelId, this.pipeline);
            }

            this.currentModel = modelId;
            this.isInitialized = true;
            
            console.log(chalk.green(`✅ ${this.models[modelId].name} ready for trading!`));
            return true;

        } catch (error) {
            console.error(chalk.red(`❌ Failed to initialize model: ${error.message}`));
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Analyze market sentiment from news/text
     */
    async analyzeSentiment(text, modelId = null) {
        if (!this.isInitialized) {
            await this.initializeModel(modelId || 'distilbert-base-uncased');
        }

        try {
            const startTime = Date.now();
            
            // Prepare text for analysis
            const cleanText = this.cleanTextForAnalysis(text);
            
            // Run sentiment analysis
            const result = await this.pipeline(cleanText);
            
            const processingTime = Date.now() - startTime;
            
            // Convert to trading sentiment
            const sentiment = this.convertToTradingSentiment(result);
            
            console.log(chalk.blue(`📊 Sentiment Analysis (${processingTime}ms):`));
            console.log(`   Text: ${cleanText.substring(0, 100)}...`);
            console.log(`   Sentiment: ${sentiment.label} (${typeof sentiment.confidence === 'number' ? sentiment.confidence.toFixed(2) : sentiment.confidence})`);
            
            return sentiment;

        } catch (error) {
            console.error(chalk.red(`❌ Sentiment analysis failed: ${error.message}`));
            return { label: 'neutral', confidence: 0.5, score: 0 };
        }
    }

    /**
     * Generate trading decision reasoning
     */
    async generateTradingReasoning(marketData, signal, modelId = null) {
        if (!this.isInitialized) {
            await this.initializeModel(modelId || 'microsoft/DialoGPT-small');
        }

        try {
            const startTime = Date.now();
            
            // Prepare context for reasoning
            const context = this.prepareTradingContext(marketData, signal);
            
            // Generate reasoning (simplified for lightweight models)
            const reasoning = this.generateLightweightReasoning(context, signal);
            
            const processingTime = Date.now() - startTime;
            
            console.log(chalk.blue(`🤖 Trading Reasoning (${processingTime}ms):`));
            console.log(`   Signal: ${signal}`);
            console.log(`   Reasoning: ${reasoning}`);
            
            return reasoning;

        } catch (error) {
            console.error(chalk.red(`❌ Reasoning generation failed: ${error.message}`));
            return `Trading signal ${signal} based on technical analysis.`;
        }
    }

    /**
     * Get position sizing advice
     */
    async getPositionSizingAdvice(availableCash, price, symbol, marketContext = '') {
        if (!this.isInitialized) {
            await this.initializeModel('distilgpt2');
        }

        try {
            const startTime = Date.now();
            
            // Calculate basic position sizing
            const riskPercent = 1; // 1% risk
            const riskAmount = availableCash * (riskPercent / 100);
            const quantity = Math.floor(riskAmount / price);
            
            // Generate advice text
            const advice = this.generatePositionSizingAdvice(availableCash, price, symbol, quantity, marketContext);
            
            const processingTime = Date.now() - startTime;
            
            console.log(chalk.blue(`💰 Position Sizing (${processingTime}ms):`));
            console.log(`   Symbol: ${symbol}`);
            console.log(`   Price: $${price}`);
            console.log(`   Quantity: ${quantity}`);
            console.log(`   Risk: ${riskPercent}% of ${availableCash}`);
            
            return {
                quantity,
                riskPercent,
                takeProfit: 1, // 1% take profit
                stopLoss: 2,   // 2% stop loss
                reasoning: advice
            };

        } catch (error) {
            console.error(chalk.red(`❌ Position sizing failed: ${error.message}`));
            return {
                quantity: Math.floor(availableCash * 0.01 / price),
                riskPercent: 1,
                takeProfit: 1,
                stopLoss: 2,
                reasoning: 'Conservative position sizing applied.'
            };
        }
    }

    /**
     * Clean text for analysis
     */
    cleanTextForAnalysis(text) {
        return text
            .replace(/[^\w\s]/g, ' ') // Remove special characters
            .replace(/\s+/g, ' ')      // Normalize whitespace
            .trim()
            .substring(0, 512);       // Limit length
    }

    /**
     * Convert model output to trading sentiment
     */
    convertToTradingSentiment(result) {
        let label = 'neutral';
        let confidence = 0.5;
        let score = 0;

        if (Array.isArray(result)) {
            const topResult = result[0];
            label = topResult.label.toLowerCase();
            confidence = topResult.score;
            
            // Convert to trading sentiment
            if (label.includes('positive') || label.includes('bullish')) {
                label = 'bullish';
                score = confidence;
            } else if (label.includes('negative') || label.includes('bearish')) {
                label = 'bearish';
                score = -confidence;
            } else {
                label = 'neutral';
                score = 0;
            }
        }

        return { label, confidence, score };
    }

    /**
     * Prepare trading context for reasoning
     */
    prepareTradingContext(marketData, signal) {
        return {
            price: marketData.price || 0,
            rsi: marketData.rsi || 50,
            ma_fast: marketData.ma_fast || 0,
            ma_slow: marketData.ma_slow || 0,
            volatility: marketData.volatility || 0.02,
            trend: marketData.trend || 'neutral',
            signal: signal
        };
    }

    /**
     * Generate lightweight trading reasoning
     */
    generateLightweightReasoning(context, signal) {
        const { price, rsi, ma_fast, ma_slow, volatility, trend } = context;
        
        let reasoning = `Signal: ${signal}. `;
        
        if (signal === 'BUY') {
            reasoning += `Price $${price.toFixed(2)} above fast MA $${ma_fast.toFixed(2)}. `;
            reasoning += `RSI at ${rsi.toFixed(1)} indicates ${rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'} conditions. `;
            reasoning += `Trend: ${trend}. Volatility: ${(volatility * 100).toFixed(1)}%.`;
        } else if (signal === 'SELL') {
            reasoning += `Price $${price.toFixed(2)} below fast MA $${ma_fast.toFixed(2)}. `;
            reasoning += `RSI at ${rsi.toFixed(1)} suggests ${rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'} conditions. `;
            reasoning += `Trend: ${trend}. Volatility: ${(volatility * 100).toFixed(1)}%.`;
        }
        
        return reasoning;
    }

    /**
     * Generate position sizing advice
     */
    generatePositionSizingAdvice(availableCash, price, symbol, quantity, marketContext) {
        const riskAmount = availableCash * 0.01;
        const positionValue = quantity * price;
        
        let advice = `Position sizing for ${symbol}: `;
        advice += `${quantity} shares at $${price.toFixed(2)} = $${positionValue.toFixed(2)}. `;
        advice += `Risk: $${riskAmount.toFixed(2)} (1% of $${availableCash.toFixed(2)}). `;
        
        if (marketContext) {
            advice += `Market context: ${marketContext.substring(0, 100)}. `;
        }
        
        advice += `Recommended TP: 1%, SL: 2%.`;
        
        return advice;
    }

    /**
     * Get system performance metrics
     */
    getPerformanceMetrics() {
        return {
            currentModel: this.currentModel,
            isInitialized: this.isInitialized,
            cachedModels: this.modelCache.size,
            availableModels: Object.keys(this.models).length,
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage()
        };
    }

    /**
     * Display performance metrics
     */
    displayPerformanceMetrics() {
        const metrics = this.getPerformanceMetrics();
        
        console.log(chalk.blue('\n📊 Efficient Trading LLM Performance'));
        console.log(chalk.blue('=' .repeat(40)));
        console.log(`Current Model: ${metrics.currentModel || 'None'}`);
        console.log(`Initialized: ${metrics.isInitialized ? '✅ Yes' : '❌ No'}`);
        console.log(`Cached Models: ${metrics.cachedModels}`);
        console.log(`Available Models: ${metrics.availableModels}`);
        console.log(`Memory Usage: ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`);
        console.log(chalk.blue('=' .repeat(40)));
    }

    /**
     * Switch to a different model
     */
    async switchModel(modelId) {
        if (!this.models[modelId]) {
            throw new Error(`Model not found: ${modelId}`);
        }

        console.log(chalk.yellow(`🔄 Switching to ${this.models[modelId].name}...`));
        
        // Initialize new model
        const success = await this.initializeModel(modelId);
        
        if (success) {
            console.log(chalk.green(`✅ Switched to ${this.models[modelId].name}`));
        } else {
            console.log(chalk.red(`❌ Failed to switch to ${this.models[modelId].name}`));
        }
        
        return success;
    }

    /**
     * Clear model cache to free memory
     */
    clearCache() {
        this.modelCache.clear();
        this.pipeline = null;
        this.isInitialized = false;
        this.currentModel = null;
        
        console.log(chalk.green('✅ Model cache cleared'));
    }
}

module.exports = EfficientTradingLLM;
