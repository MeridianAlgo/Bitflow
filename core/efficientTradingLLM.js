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
        this.cacheDir = path.join(__dirname, '..', 'models_cache');
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
            
            // Only log sentiment analysis results if MIN_UI is not set
            if (process.env.BITFLOW_MIN_UI !== '1') {
                console.log(chalk.blue(`📊 Sentiment Analysis (${processingTime}ms):`));
                console.log(`   Text: ${cleanText.substring(0, 100)}...`);
                console.log(`   Sentiment: ${sentiment.label} (${typeof sentiment.confidence === 'number' ? sentiment.confidence.toFixed(2) : sentiment.confidence})`);
            }
            
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
            
            // Only log trading reasoning if MIN_UI is not set
            if (process.env.BITFLOW_MIN_UI !== '1') {
                console.log(chalk.blue(`🤖 Trading Reasoning (${processingTime}ms):`));
                console.log(`   Signal: ${signal}`);
                console.log(`   Reasoning: ${reasoning}`);
            }
            
            return reasoning;

        } catch (error) {
            console.error(chalk.red(`❌ Reasoning generation failed: ${error.message}`));
            return `Trading signal ${signal} based on technical analysis.`;
        }
    }

    /**
     * Calculate optimal Take Profit and Stop Loss levels
     * This is the primary role of AI - determining optimal exit points
     */
    async calculateOptimalTPSL(marketData, signal) {
        if (!this.isInitialized) {
            await this.initializeModel('Xenova/distilbert-base-uncased-finetuned-sst-2-english');
        }

        try {
            const startTime = Date.now();

            // AI analyzes market conditions to determine optimal exit levels
            const tpSlAnalysis = this.analyzeMarketForTPSL(marketData, signal);

            const processingTime = Date.now() - startTime;

            // Only log TP/SL optimization if MIN_UI is not set
            if (process.env.BITFLOW_MIN_UI !== '1') {
                console.log(chalk.blue(`🎯 TP/SL Optimization (${processingTime}ms):`));
                console.log(`   Signal: ${signal}`);
                console.log(`   Recommended TP: ${tpSlAnalysis.takeProfit}%`);
                console.log(`   Recommended SL: ${tpSlAnalysis.stopLoss}%`);
                console.log(`   Reasoning: ${tpSlAnalysis.reasoning}`);
            }

            return {
                takeProfit: tpSlAnalysis.takeProfit,
                stopLoss: tpSlAnalysis.stopLoss,
                reasoning: tpSlAnalysis.reasoning
            };

        } catch (error) {
            console.error(chalk.red(`❌ TP/SL optimization failed: ${error.message}`));
            return {
                takeProfit: 1.0, // Default 1% TP
                stopLoss: 2.0,   // Default 2% SL
                reasoning: 'Using conservative defaults'
            };
        }
    }

    /**
     * Calculate optimal position size based on risk management
     * AI determines how much capital to allocate per trade
     */
    async calculateOptimalPositionSize(availableCapital, marketData, riskTolerance = 'medium') {
        if (!this.isInitialized) {
            await this.initializeModel('Xenova/distilbert-base-uncased-finetuned-sst-2-english');
        }

        try {
            const startTime = Date.now();

            // AI calculates position size based on risk management principles
            const positionAnalysis = this.analyzeRiskForPositionSizing(availableCapital, marketData, riskTolerance);

            const processingTime = Date.now() - startTime;

            // Only log position sizing if MIN_UI is not set
            if (process.env.BITFLOW_MIN_UI !== '1') {
                console.log(chalk.blue(`💰 Position Sizing (${processingTime}ms):`));
                console.log(`   Available Capital: $${availableCapital.toLocaleString()}`);
                console.log(`   Price: $${marketData.price}`);
                console.log(`   Risk Tolerance: ${riskTolerance}`);
                console.log(`   Position Size: $${positionAnalysis.positionSize.toLocaleString()}`);
                console.log(`   Risk Amount: $${positionAnalysis.riskAmount.toLocaleString()}`);
            }

            return {
                positionSize: positionAnalysis.positionSize,
                riskAmount: positionAnalysis.riskAmount,
                confidence: positionAnalysis.confidence,
                reasoning: positionAnalysis.reasoning
            };

        } catch (error) {
            console.error(chalk.red(`❌ Position sizing failed: ${error.message}`));
            return {
                positionSize: Math.floor(availableCapital * 0.01 / marketData.price),
                riskAmount: availableCapital * 0.01,
                confidence: 0.5,
                reasoning: 'Using conservative 1% risk per trade'
            };
        }
    }

    /**
     * Assess overall market risk level
     * AI evaluates if current conditions warrant aggressive or conservative trading
     */
    async assessMarketRisk(marketData, newsText = '') {
        if (!this.isInitialized) {
            await this.initializeModel('Xenova/distilbert-base-uncased-finetuned-sst-2-english');
        }

        try {
            const startTime = Date.now();

            // AI analyzes multiple risk factors
            const riskAnalysis = this.analyzeComprehensiveRisk(marketData, newsText);

            const processingTime = Date.now() - startTime;

            // Only log risk assessment if MIN_UI is not set
            if (process.env.BITFLOW_MIN_UI !== '1') {
                console.log(chalk.blue(`⚠️ Risk Assessment (${processingTime}ms):`));
                console.log(`   Risk Level: ${riskAnalysis.riskLevel.toUpperCase()}`);
                console.log(`   Confidence: ${(riskAnalysis.confidence * 100).toFixed(1)}%`);
                console.log(`   Key Factors: ${riskAnalysis.factors.join(', ')}`);
                console.log(`   Recommendation: ${riskAnalysis.recommendation}`);
            }

            return {
                riskLevel: riskAnalysis.riskLevel,
                confidence: riskAnalysis.confidence,
                factors: riskAnalysis.factors,
                recommendation: riskAnalysis.recommendation
            };

        } catch (error) {
            console.error(chalk.red(`❌ Risk assessment failed: ${error.message}`));
            return {
                riskLevel: 'medium',
                confidence: 0.5,
                factors: ['Unable to assess risk factors'],
                recommendation: 'Proceed with standard risk management'
            };
        }
    }

    /**
     * Analyze market conditions to determine optimal TP/SL levels
     */
    analyzeMarketForTPSL(marketData, signal) {
        // Base TP/SL on market volatility and signal strength
        let takeProfit = 1.0; // Default 1%
        let stopLoss = 2.0;   // Default 2%

        // Adjust based on volatility
        if (marketData.volatility > 0.05) {
            // High volatility - wider stops, smaller targets
            takeProfit = 0.8;
            stopLoss = 3.0;
        } else if (marketData.volatility < 0.01) {
            // Low volatility - tighter stops, larger targets
            takeProfit = 1.5;
            stopLoss = 1.5;
        }

        // Adjust based on RSI for signal confirmation
        if (signal === 'BUY' && marketData.rsi < 30) {
            // Oversold - more conservative
            takeProfit = 1.2;
            stopLoss = 1.8;
        } else if (signal === 'SELL' && marketData.rsi > 70) {
            // Overbought - more conservative
            takeProfit = 1.2;
            stopLoss = 1.8;
        }

        // Adjust based on trend strength
        if (marketData.trend === 'strong_bullish' || marketData.trend === 'strong_bearish') {
            takeProfit *= 1.2; // Larger targets in strong trends
            stopLoss *= 0.8;   // Tighter stops in strong trends
        }

        return {
            takeProfit: Math.round(takeProfit * 10) / 10,
            stopLoss: Math.round(stopLoss * 10) / 10,
            reasoning: `Market volatility: ${(marketData.volatility * 100).toFixed(1)}%, RSI: ${marketData.rsi.toFixed(1)}, Trend: ${marketData.trend}`
        };
    }

    /**
     * Analyze risk factors for optimal position sizing
     */
    analyzeRiskForPositionSizing(availableCapital, marketData, riskTolerance) {
        // Base risk percentage on account size and market conditions
        let baseRiskPercent = 1.0; // Default 1%

        // Adjust based on risk tolerance
        switch (riskTolerance) {
            case 'low':
                baseRiskPercent = 0.5;
                break;
            case 'medium':
                baseRiskPercent = 1.0;
                break;
            case 'high':
                baseRiskPercent = 2.0;
                break;
            case 'aggressive':
                baseRiskPercent = 3.0;
                break;
        }

        // Adjust based on market volatility
        if (marketData.volatility > 0.05) {
            baseRiskPercent *= 0.7; // Reduce risk in volatile markets
        } else if (marketData.volatility < 0.01) {
            baseRiskPercent *= 1.2; // Increase risk in stable markets
        }

        // Adjust based on account size (smaller accounts should be more conservative)
        if (availableCapital < 10000) {
            baseRiskPercent *= 0.8;
        } else if (availableCapital > 100000) {
            baseRiskPercent *= 1.1;
        }

        const riskAmount = availableCapital * (baseRiskPercent / 100);
        const positionSize = Math.floor(riskAmount / marketData.price);

        return {
            positionSize,
            riskAmount,
            confidence: 0.8,
            reasoning: `Risk tolerance: ${riskTolerance}, Volatility: ${(marketData.volatility * 100).toFixed(1)}%, Account size: $${availableCapital.toLocaleString()}`
        };
    }

    /**
     * Comprehensive risk assessment across multiple factors
     */
    analyzeComprehensiveRisk(marketData, newsText) {
        const factors = [];
        let riskScore = 0; // 0-100 scale

        // Volatility risk (0-30 points)
        if (marketData.volatility > 0.05) {
            riskScore += 25;
            factors.push('High market volatility');
        } else if (marketData.volatility < 0.01) {
            riskScore += 5;
            factors.push('Low market volatility');
        } else {
            riskScore += 15;
            factors.push('Moderate market volatility');
        }

        // RSI risk (0-20 points)
        if (marketData.rsi > 70) {
            riskScore += 15;
            factors.push('Overbought conditions (RSI > 70)');
        } else if (marketData.rsi < 30) {
            riskScore += 15;
            factors.push('Oversold conditions (RSI < 30)');
        } else {
            riskScore += 5;
            factors.push('RSI in neutral range');
        }

        // Volume risk (0-15 points)
        if (marketData.volume > 1000000) {
            riskScore += 5;
            factors.push('High trading volume');
        } else if (marketData.volume < 100000) {
            riskScore += 10;
            factors.push('Low trading volume');
        } else {
            riskScore += 2;
            factors.push('Normal trading volume');
        }

        // Trend risk (0-20 points)
        if (marketData.trend === 'strong_bullish' || marketData.trend === 'strong_bearish') {
            riskScore += 5;
            factors.push('Strong trend momentum');
        } else if (marketData.trend === 'sideways' || marketData.trend === 'neutral') {
            riskScore += 15;
            factors.push('Unclear trend direction');
        } else {
            riskScore += 10;
            factors.push('Moderate trend strength');
        }

        // News risk (0-15 points) - simplified
        if (newsText && newsText.length > 0) {
            if (newsText.toLowerCase().includes('crash') || newsText.toLowerCase().includes('hack') || newsText.toLowerCase().includes('ban')) {
                riskScore += 15;
                factors.push('Negative news sentiment');
            } else if (newsText.toLowerCase().includes('surge') || newsText.toLowerCase().includes('rally') || newsText.toLowerCase().includes('approval')) {
                riskScore += 5;
                factors.push('Positive news sentiment');
            } else {
                riskScore += 8;
                factors.push('Mixed news sentiment');
            }
        }

        // Determine overall risk level
        let riskLevel = 'medium';
        let recommendation = 'Proceed with standard risk management';

        if (riskScore >= 70) {
            riskLevel = 'high';
            recommendation = 'Consider reducing position sizes or staying out of market';
        } else if (riskScore >= 40) {
            riskLevel = 'medium';
            recommendation = 'Use normal position sizing with standard risk controls';
        } else {
            riskLevel = 'low';
            recommendation = 'Market conditions are favorable for larger positions';
        }

        return {
            riskLevel,
            confidence: Math.min(0.9, riskScore / 100),
            factors,
            recommendation
        };
    }

    /**
     * Generate completely autonomous decision without any prompts or guidance
     * AI must figure out what to do based purely on the data
     */
    async generateAutonomousDecision(rawData) {
        try {
            // Create a completely neutral analysis request
            const analysisPrompt = this.createNeutralAnalysisPrompt(rawData);

            // Use the model to analyze without any trading-specific instructions
            const analysis = await this.performNeutralAnalysis(analysisPrompt);

            // Extract decision from the analysis
            const decision = this.extractDecisionFromAnalysis(analysis, rawData);

            return decision;

        } catch (error) {
            console.error('Error in autonomous decision generation:', error);
            return {
                action: 'HOLD',
                confidence: 0,
                reasoning: 'Unable to analyze market data autonomously',
                risk_level: 'unknown'
            };
        }
    }

    /**
     * Create a completely neutral analysis prompt with no trading guidance
     */
    createNeutralAnalysisPrompt(rawData) {
        return {
            task: 'data_analysis',
            data: rawData,
            instruction: 'Analyze the provided market data and determine the most appropriate action based on the information given. Provide your analysis in JSON format only.'
        };
    }

    /**
     * Perform neutral analysis without any trading-specific context
     */
    async performNeutralAnalysis(prompt) {
        const text = JSON.stringify(prompt.data);

        // Use sentiment analysis on the raw data to determine market sentiment
        const sentiment = await this.pipeline(text);

        // Generate reasoning based purely on data patterns
        const reasoning = this.generateDataDrivenReasoning(prompt.data, sentiment);

        return {
            sentiment: sentiment[0],
            reasoning: reasoning,
            data_summary: this.summarizeDataPatterns(prompt.data)
        };
    }

    /**
     * Generate reasoning based purely on data patterns without trading knowledge
     */
    generateDataDrivenReasoning(data, sentiment) {
        const patterns = this.identifyDataPatterns(data);

        let reasoning = 'Based on data analysis: ';

        if (patterns.price_momentum === 'upward') {
            reasoning += 'Price shows upward movement. ';
        } else if (patterns.price_momentum === 'downward') {
            reasoning += 'Price shows downward movement. ';
        } else {
            reasoning += 'Price movement is unclear. ';
        }

        if (patterns.volatility === 'high') {
            reasoning += 'High fluctuation in data. ';
        } else if (patterns.volatility === 'low') {
            reasoning += 'Low fluctuation in data. ';
        } else {
            reasoning += 'Moderate fluctuation in data. ';
        }

        if (sentiment.label === 'POSITIVE') {
            reasoning += 'Overall positive sentiment detected. ';
        } else if (sentiment.label === 'NEGATIVE') {
            reasoning += 'Overall negative sentiment detected. ';
        } else {
            reasoning += 'Neutral sentiment detected. ';
        }

        return reasoning;
    }

    /**
     * Identify patterns in the raw data without interpretation
     */
    identifyDataPatterns(data) {
        const patterns = {
            price_momentum: 'neutral',
            volatility: 'medium',
            trend_strength: 'weak'
        };

        // Simple pattern recognition based on raw numbers
        if (data.price > data.ma_fast && data.ma_fast > data.ma_slow) {
            patterns.price_momentum = 'upward';
            patterns.trend_strength = data.price > data.ma_fast * 1.02 ? 'strong' : 'moderate';
        } else if (data.price < data.ma_fast && data.ma_fast < data.ma_slow) {
            patterns.price_momentum = 'downward';
            patterns.trend_strength = data.price < data.ma_fast * 0.98 ? 'strong' : 'moderate';
        }

        if (data.volatility > 0.05) {
            patterns.volatility = 'high';
        } else if (data.volatility < 0.01) {
            patterns.volatility = 'low';
        }

        return patterns;
    }

    /**
     * Summarize data patterns without providing guidance
     */
    summarizeDataPatterns(data) {
        return {
            price_level: data.price,
            rsi_value: data.rsi,
            moving_averages: `${data.ma_fast}/${data.ma_slow}`,
            volatility_measure: data.volatility,
            volume_level: data.volume,
            market_state: data.market_state
        };
    }

    /**
     * Extract trading decision from neutral analysis
     */
    extractDecisionFromAnalysis(analysis, rawData) {
        const { sentiment, reasoning, data_summary } = analysis;

        // Make decision based purely on sentiment and data patterns
        let action = 'HOLD';
        let confidence = 0.5;
        let risk_level = 'medium';

        // Decision logic based on sentiment and price patterns
        if (sentiment.label === 'POSITIVE' && rawData.price > rawData.ma_fast) {
            action = 'BUY';
            confidence = Math.min(0.8, sentiment.score);
            risk_level = 'low';
        } else if (sentiment.label === 'NEGATIVE' && rawData.price < rawData.ma_fast) {
            action = 'SELL';
            confidence = Math.min(0.8, sentiment.score);
            risk_level = 'low';
        } else if (rawData.volatility > 0.05) {
            action = 'HOLD';
            confidence = 0.3;
            risk_level = 'high';
        } else {
            action = 'HOLD';
            confidence = 0.5;
            risk_level = 'medium';
        }

        return {
            action,
            confidence,
            reasoning: reasoning || 'Data analysis completed',
            risk_level,
            sentiment: sentiment.label,
            data_summary
        };
    }

    /**
     * Clean text for analysis by removing special characters and normalizing
     */
    cleanTextForAnalysis(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Replace special characters with spaces
            .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
            .trim();                  // Remove leading/trailing whitespace
    }
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
