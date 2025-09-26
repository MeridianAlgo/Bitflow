const os = require('os');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const EfficientTradingLLM = require('./efficientTradingLLM');
const https = require('https');
const { parseStringPromise } = require('xml2js');
let HuggingFaceTradingLLM = null;
try {
    HuggingFaceTradingLLM = require('./huggingfaceTradingLLM');
} catch (e) {
    // Optional judge not available; we'll fallback to heuristics
}

/**
 * Smart Model Manager
 * 
 * Automatically selects the best trading LLM based on:
 * - Available RAM
 * - CPU cores
 * - Current system load
 * - Trading task requirements
 */
class SmartModelManager {
    constructor() {
        this.llm = new EfficientTradingLLM();
        this.systemSpecs = this.analyzeSystem();
        this.recommendedModel = this.selectOptimalModel();
        this.performanceHistory = [];
        this.judge = HuggingFaceTradingLLM ? new HuggingFaceTradingLLM() : null;
        this.cacheDir = path.join(__dirname, '..', 'models_cache');
        this.isInitialized = false;
        this.systemAnalyzed = false;
    }

    /**
     * Analyze system specifications
     */
    analyzeSystem() {
        const totalRAM = os.totalmem();
        const freeRAM = os.freemem();
        const usedRAM = totalRAM - freeRAM;
        const cpuCores = os.cpus().length;
        const cpuModel = os.cpus()[0].model;

        const specs = {
            totalRAM: totalRAM,
            freeRAM: freeRAM,
            usedRAM: usedRAM,
            ramUsagePercent: (usedRAM / totalRAM) * 100,
            cpuCores: cpuCores,
            cpuModel: cpuModel,
            platform: os.platform(),
            arch: os.arch()
        };

        // Only log system analysis once during initialization
        if (!this.systemAnalyzed) {
            if (process.env.BITFLOW_MIN_UI !== '1') {
                console.log(chalk.blue('\n🔍 System Analysis'));
                console.log(chalk.blue('=' .repeat(30)));
                console.log(`Total RAM: ${(totalRAM / 1024 / 1024 / 1024).toFixed(1)}GB`);
                console.log(`Free RAM: ${(freeRAM / 1024 / 1024 / 1024).toFixed(1)}GB`);
                console.log(`RAM Usage: ${specs.ramUsagePercent.toFixed(1)}%`);
                console.log(`CPU Cores: ${cpuCores}`);
                console.log(`CPU Model: ${cpuModel}`);
                console.log(`Platform: ${specs.platform} ${specs.arch}`);
                console.log(chalk.blue('=' .repeat(30)));
            }
            this.systemAnalyzed = true;
        }

        return specs;
    }

    /**
     * Select optimal model based on system specs
     */
    selectOptimalModel() {
        const { freeRAM, cpuCores, ramUsagePercent } = this.systemSpecs;
        const freeRAMGB = freeRAM / 1024 / 1024 / 1024;

        let recommendedModel;
        let reason;

        // Ultra-lightweight for low-resource systems
        if (freeRAMGB < 2 || ramUsagePercent > 80 || cpuCores < 4) {
            recommendedModel = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
            reason = 'Low resources - using ultra-lightweight model';
        }
        // Lightweight for medium systems
        else if (freeRAMGB < 4 || ramUsagePercent > 60 || cpuCores < 6) {
            recommendedModel = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
            reason = 'Medium resources - using lightweight model';
        }
        // Balanced for good systems
        else if (freeRAMGB < 8 || ramUsagePercent > 40) {
            recommendedModel = 'Xenova/distilgpt2';
            reason = 'Good resources - using balanced model';
        }
        // Financial-specific for high-end systems
        else {
            recommendedModel = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
            reason = 'High resources - using sentiment-optimized ONNX model';
        }

        // Only log model selection if not in minimal UI mode
        if (process.env.BITFLOW_MIN_UI !== '1') {
            console.log(chalk.green(`\n🎯 Recommended Model: ${recommendedModel}`));
            console.log(chalk.gray(`Reason: ${reason}`));
        }

        return recommendedModel;
    }

    /**
     * Get model recommendations for different scenarios
     */
    getModelRecommendations() {
        const { freeRAM, cpuCores, ramUsagePercent } = this.systemSpecs;
        const freeRAMGB = freeRAM / 1024 / 1024 / 1024;

        const recommendations = {
            // For sentiment analysis
            sentiment: {
                'distilbert-base-uncased': {
                    score: freeRAMGB > 1 ? 90 : 70,
                    reason: 'Best for news sentiment analysis'
                },
                'yiyanghkust/finbert-tone': {
                    score: freeRAMGB > 3 ? 95 : 60,
                    reason: 'Financial-specific sentiment model'
                }
            },
            // For trading decisions
            trading: {
                'microsoft/DialoGPT-small': {
                    score: freeRAMGB > 2 ? 85 : 65,
                    reason: 'Good for trading decision reasoning'
                },
                'distilgpt2': {
                    score: freeRAMGB > 3 ? 80 : 70,
                    reason: 'Fast text generation for explanations'
                }
            },
            // For general analysis
            general: {
                'distilbert-base-uncased': {
                    score: 85,
                    reason: 'Most versatile and efficient'
                },
                'microsoft/DialoGPT-small': {
                    score: freeRAMGB > 2 ? 80 : 60,
                    reason: 'Good balance of features and efficiency'
                }
            }
        };

        return recommendations;
    }

    /**
     * Initialize with optimal model selection
     * Automatically finds and uses the best model for the system
     */
    async initialize() {
        if (this.isInitialized) {
            return true;
        }

        // Only log initialization if not in minimal UI mode
        if (process.env.BITFLOW_MIN_UI !== '1') {
            console.log(chalk.yellow('\n🚀 Initializing Smart Model Manager...'));
            console.log(chalk.blue('🔍 Analyzing system and selecting optimal model...'));
        }

        try {
            // First analyze system specs
            this.systemSpecs = this.analyzeSystem();

            // Auto-select the best model based on system specs
            this.recommendedModel = this.selectOptimalModel();

            // Run performance benchmark to validate selection
            const benchmarkResult = await this.runQuickBenchmark();

            // If benchmark shows a better model, switch to it
            if (benchmarkResult.betterModel) {
                console.log(chalk.yellow(`📊 Benchmark suggests switching to ${benchmarkResult.betterModel}...`));
                this.recommendedModel = benchmarkResult.betterModel;
            }

            // Initialize the selected model
            const success = await this.llm.initializeModel(this.recommendedModel);

            if (success) {
                if (process.env.BITFLOW_MIN_UI !== '1') {
                    console.log(chalk.green(`✅ Smart Model Manager initialized with ${this.llm.models[this.recommendedModel].name}`));
                    console.log(chalk.blue(`🎯 Selected model: ${this.recommendedModel}`));
                    console.log(chalk.blue(`📈 Expected performance: ${benchmarkResult.expectedTime}ms average`));

                    this.llm.displayModelInfo(this.recommendedModel);
                    this.llm.displayPerformanceMetrics();
                }

                this.isInitialized = true;

                // Display initialization summary
                this.displayInitializationSummary(benchmarkResult);

                return true;
            } else {
                console.log(chalk.red('❌ Failed to initialize optimal model'));
                this.isInitialized = false;
                return false;
            }
        } catch (error) {
            console.error(chalk.red('❌ Initialization error:'), error.message);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Run quick benchmark to validate model selection
     */
    async runQuickBenchmark() {
        const quickTasks = [
            'Bitcoin shows moderate volatility with institutional adoption increasing.',
            { availableCapital: 10000, price: 50000, volatility: 0.02 }
        ];

        const results = { times: [], success: true, betterModel: null };

        try {
            for (const task of quickTasks) {
                const start = Date.now();

                if (typeof task === 'string') {
                    await this.llm.analyzeSentiment(task);
                } else {
                    await this.llm.calculateOptimalPositionSize(task.availableCapital, task);
                }

                results.times.push(Date.now() - start);
            }

            const avgTime = results.times.reduce((a, b) => a + b, 0) / results.times.length;

            // Check if another model might be better
            results.betterModel = this.suggestBetterModel(avgTime);
            results.expectedTime = Math.round(avgTime);

            return results;

        } catch (error) {
            results.success = false;
            results.expectedTime = 50; // Default estimate
            return results;
        }
    }

    /**
     * Suggest a better model based on benchmark results
     */
    suggestBetterModel(avgTime) {
        const { freeRAM, cpuCores } = this.systemSpecs;
        const freeRAMGB = freeRAM / 1024 / 1024 / 1024;

        // If current model is slow, suggest alternatives
        if (avgTime > 100 && freeRAMGB > 2) {
            // Try lighter model if current is slow
            if (this.recommendedModel === 'Xenova/bert-base-uncased') {
                return 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
            }
        } else if (avgTime < 20 && freeRAMGB > 4) {
            // Try more capable model if current is very fast
            if (this.recommendedModel === 'Xenova/distilbert-base-uncased-finetuned-sst-2-english') {
                return 'Xenova/bert-base-uncased';
            }
        }

        return null; // Current model is fine
    }

    /**
     * Display initialization summary
     */
    displayInitializationSummary(benchmarkResult) {
        if (process.env.BITFLOW_MIN_UI !== '1') {
            console.log(chalk.blue('\n📋 SMART MODEL SELECTION SUMMARY'));
            console.log(chalk.blue('═'.repeat(45)));
            console.log(`🎯 Selected Model: ${this.recommendedModel}`);
            console.log(`⚡ Benchmark Time: ${benchmarkResult.expectedTime}ms average`);
            console.log(`✅ Initialization: Successful`);
            console.log(`🔒 Model Locked: Yes (will use this model for entire session)`);
            console.log(chalk.blue('═'.repeat(45)));
            console.log(chalk.green('💡 AI will now handle TP/SL, position sizing, and risk assessment'));
            console.log(chalk.gray('   • No manual model switching during session'));
            console.log(chalk.gray('   • Consistent performance throughout'));
            console.log(chalk.gray('   • Optimized for your system specs'));
        }
    }

    /**
     * Prefetch core models on first run/new device so they're cached locally
     */
    async warmCacheIfNeeded() {
        try {
            const shouldSkip = process.env.BITFLOW_SKIP_PREFETCH === '1';
            if (shouldSkip) return;

            let needsWarm = false;
            if (!fs.existsSync(this.cacheDir)) {
                needsWarm = true;
            } else {
                const entries = fs.readdirSync(this.cacheDir).filter(Boolean);
                if (entries.length < 2) needsWarm = true;
            }
            if (!needsWarm) return;

            if (process.env.BITFLOW_MIN_UI !== '1') {
                console.log(chalk.blue('\n📥 First run detected - prefetching lightweight models locally...'));
            }
            const modelsToCache = [
                'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
                'Xenova/bert-base-uncased'
            ];
            for (const id of modelsToCache) {
                try {
                    await this.llm.initializeModel(id);
                } catch (e) {
                    if (process.env.BITFLOW_MIN_UI !== '1') {
                        console.log(chalk.yellow(`⚠️ Prefetch skipped for ${id}: ${e.message}`));
                    }
                }
            }
            if (this.recommendedModel) {
                await this.llm.switchModel(this.recommendedModel);
            }
            if (process.env.BITFLOW_MIN_UI !== '1') {
                console.log(chalk.green('✅ Model prefetch complete.'));
            }
        } catch (e) {
            if (process.env.BITFLOW_MIN_UI !== '1') {
                console.log(chalk.yellow('⚠️ Prefetch step failed (continuing): ' + e.message));
            }
        }
    }

    /**
     * Evaluate a single model on provided market context
     */
    async scoreModel(modelId, marketData, newsText = '') {
        const start = Date.now();
        const result = { modelId, ok: false, error: null };
        try {
            const initOk = await this.llm.initializeModel(modelId);
            if (!initOk) {
                result.error = 'init_failed';
                return result;
            }
            const reasoning = await this.llm.generateTradingReasoning(marketData, marketData.signal || 'BUY', modelId);
            let sentiment = { label: 'neutral', confidence: 0.5, score: 0 };
            if (newsText && newsText.length > 10) {
                sentiment = await this.llm.analyzeSentiment(newsText);
            }
            result.ok = true;
            result.reasoning = reasoning;
            result.sentiment = sentiment;
            result.processingTime = Date.now() - start;
            return result;
        } catch (err) {
            result.error = err.message;
            return result;
        }
    }

    /**
     * Ask a judge model (LLaMA/HF) to choose the best candidate
     */
    async judgeWithLlama(symbol, timeframe, marketData, newsText, candidates) {
        if (!this.judge) {
            // Heuristic fallback: prefer bullish with higher confidence and faster time
            const ranked = candidates
                .filter(c => c.ok)
                .sort((a, b) => (b.sentiment.confidence * (b.sentiment.label === 'bullish' ? 1.1 : 1))
                               - (a.sentiment.confidence * (a.sentiment.label === 'bullish' ? 1.1 : 1))
                               || a.processingTime - b.processingTime);
            return ranked.length ? ranked[0].modelId : this.recommendedModel;
        }
        try {
            await this.judge.initialize();
            const summary = candidates.map(c => `Model: ${c.modelId}\n- time: ${c.processingTime || 'n/a'}ms\n- sentiment: ${c.sentiment?.label || 'n/a'} (${(c.sentiment?.confidence||0).toFixed(2)})\n- reasoning: ${c.reasoning || 'n/a'}`).join('\n\n');
            const prompt = `You are a trading model selector. Symbol: ${symbol}, timeframe: ${timeframe}. Market data: price=${marketData.price}, rsi=${marketData.rsi}, fastMA=${marketData.ma_fast}, slowMA=${marketData.ma_slow}, trend=${marketData.trend}, vol=${marketData.volatility}. News: ${newsText.substring(0,200)}.\n\nCandidates:\n${summary}\n\nPick ONE modelId that you would trust most for trading decisions now. Reply with the exact modelId only.`;
            const resp = await this.judge.generateResponse(prompt, 64);
            const text = (resp || '').trim();
            const found = candidates.find(c => text.includes(c.modelId));
            return found ? found.modelId : (candidates.find(c => c.ok)?.modelId || this.recommendedModel);
        } catch (e) {
            return candidates.find(c => c.ok)?.modelId || this.recommendedModel;
        }
    }

    /**
     * Evaluate available models and select the best one using judge
     */
    async autoSelectBestModel({ symbol, timeframe, marketData, newsText, enableModelLocking = true }) {
        // If model locking is enabled, don't switch models
        if (enableModelLocking && this.llm.currentModel) {
            return { 
                chosenId: this.llm.currentModel, 
                evaluations: [],
                locked: true
            };
        }
        
        if (!newsText) {
            try {
                newsText = await this.fetchGoogleNews(symbol);
            } catch (e) {}
        }
        const candidateIds = [
            'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
            'Xenova/distilgpt2',
            'Xenova/bert-base-uncased'
        ];
        const evaluations = [];
        for (const id of candidateIds) {
            const res = await this.scoreModel(id, marketData, newsText);
            evaluations.push(res);
        }
        const chosenId = await this.judgeWithLlama(symbol, timeframe, marketData, newsText || '', evaluations);
        if (chosenId && chosenId !== this.llm.currentModel) {
            await this.llm.switchModel(chosenId);
        }
        return { chosenId, evaluations, locked: false };
    }

    /**
     * Get trading decision with optimal model
     */
    async getTradingDecision(marketData, signal) {
        const startTime = Date.now();
        
        try {
            // Use current model for reasoning
            const reasoning = await this.llm.generateTradingReasoning(marketData, signal);
            
            const processingTime = Date.now() - startTime;
            
            // Track performance
            this.performanceHistory.push({
                timestamp: Date.now(),
                processingTime,
                model: this.llm.currentModel,
                task: 'trading_decision'
            });

            // Keep only last 100 entries
            if (this.performanceHistory.length > 100) {
                this.performanceHistory = this.performanceHistory.slice(-100);
            }

            return reasoning;

        } catch (error) {
            console.error(chalk.red('❌ Trading decision failed:'), error.message);
            return `Trading signal ${signal} based on technical analysis.`;
        }
    }

    /**
     * Analyze sentiment with optimal model
     */
    async analyzeSentiment(text) {
        const startTime = Date.now();
        
        try {
            const sentiment = await this.llm.analyzeSentiment(text);
            
            const processingTime = Date.now() - startTime;
            
            // Track performance
            this.performanceHistory.push({
                timestamp: Date.now(),
                processingTime,
                model: this.llm.currentModel,
                task: 'sentiment_analysis'
            });

            return sentiment;

        } catch (error) {
            console.error(chalk.red('❌ Sentiment analysis failed:'), error.message);
            return { label: 'neutral', confidence: 0.5, score: 0 };
        }
    }

    /**
     * Fetch latest Google News headlines for a symbol (no API)
     */
    async fetchGoogleNews(symbol) {
        return new Promise((resolve) => {
            const q = encodeURIComponent(symbol.replace('/', ' '));
            const url = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
            let data = '';
            https.get(url, (res) => {
                res.on('data', chunk => data += chunk);
                res.on('end', async () => {
                    try {
                        const parsed = await parseStringPromise(data);
                        const items = parsed?.rss?.channel?.[0]?.item || [];
                        const headlines = items.slice(0, 5).map(it => (it.title?.[0] || '')).filter(Boolean);
                        resolve(headlines.join(' | '));
                    } catch (e) {
                        resolve('');
                    }
                });
            }).on('error', () => resolve(''));
        });
    }

    /**
     * Calculate optimal Take Profit and Stop Loss levels
     * This is what AI models should primarily do - not core trading decisions
     */
    async calculateOptimalTPSL(marketData, signal) {
        const startTime = Date.now();

        try {
            // AI analyzes market conditions to determine optimal TP/SL
            const tpSlAdvice = await this.llm.calculateOptimalTPSL(marketData, signal);

            const processingTime = Date.now() - startTime;

            // Track performance
            this.performanceHistory.push({
                timestamp: Date.now(),
                processingTime,
                model: this.llm.currentModel,
                task: 'tp_sl_optimization'
            });

            return {
                takeProfit: tpSlAdvice.takeProfit,
                stopLoss: tpSlAdvice.stopLoss,
                reasoning: tpSlAdvice.reasoning,
                processingTime,
                model: this.llm.currentModel
            };

        } catch (error) {
            console.error(chalk.red('❌ TP/SL calculation failed:'), error.message);
            return {
                takeProfit: 1.0, // Default 1% TP
                stopLoss: 2.0,   // Default 2% SL
                reasoning: 'Using conservative defaults due to AI error',
                processingTime: Date.now() - startTime,
                model: this.llm.currentModel,
                error: error.message
            };
        }
    }

    /**
     * Calculate optimal position size based on risk management
     * AI determines how much capital to risk per trade
     */
    async calculateOptimalPositionSize(availableCapital, marketData, riskTolerance = 'medium') {
        const startTime = Date.now();

        try {
            const positionAdvice = await this.llm.calculateOptimalPositionSize(availableCapital, marketData, riskTolerance);

            const processingTime = Date.now() - startTime;

            // Track performance
            this.performanceHistory.push({
                timestamp: Date.now(),
                processingTime,
                model: this.llm.currentModel,
                task: 'position_sizing'
            });

            return {
                positionSize: positionAdvice.positionSize,
                riskAmount: positionAdvice.riskAmount,
                confidence: positionAdvice.confidence,
                reasoning: positionAdvice.reasoning,
                processingTime,
                model: this.llm.currentModel
            };

        } catch (error) {
            console.error(chalk.red('❌ Position sizing failed:'), error.message);
            return {
                positionSize: Math.floor(availableCapital * 0.01 / marketData.price), // Default 1% of capital
                riskAmount: availableCapital * 0.01,
                confidence: 0.5,
                reasoning: 'Using conservative position sizing due to AI error',
                processingTime: Date.now() - startTime,
                model: this.llm.currentModel,
                error: error.message
            };
        }
    }

    /**
     * Assess overall market risk level
     * AI evaluates if current market conditions are high/low risk
     */
    async assessMarketRisk(marketData, newsText = '') {
        const startTime = Date.now();

        try {
            const riskAssessment = await this.llm.assessMarketRisk(marketData, newsText);

            const processingTime = Date.now() - startTime;

            // Track performance
            this.performanceHistory.push({
                timestamp: Date.now(),
                processingTime,
                model: this.llm.currentModel,
                task: 'risk_assessment'
            });

            return {
                riskLevel: riskAssessment.riskLevel,
                confidence: riskAssessment.confidence,
                factors: riskAssessment.factors,
                recommendation: riskAssessment.recommendation,
                processingTime,
                model: this.llm.currentModel
            };

        } catch (error) {
            console.error(chalk.red('❌ Market risk assessment failed:'), error.message);
            return {
                riskLevel: 'medium',
                confidence: 0.5,
                factors: ['Unable to assess risk due to AI error'],
                recommendation: 'Proceed with caution',
                processingTime: Date.now() - startTime,
                model: this.llm.currentModel,
                error: error.message
            };
        }
    }

    /**
     * Switch to a different model based on task
     */
    async switchModelForTask(task) {
        const recommendations = this.getModelRecommendations();
        const taskRecommendations = recommendations[task] || recommendations.general;
        
        // Find best model for this task
        let bestModel = null;
        let bestScore = 0;
        
        Object.entries(taskRecommendations).forEach(([modelId, info]) => {
            if (info.score > bestScore) {
                bestScore = info.score;
                bestModel = modelId;
            }
        });

        if (bestModel && bestModel !== this.llm.currentModel) {
            console.log(chalk.yellow(`🔄 Switching to ${bestModel} for ${task} task...`));
            await this.llm.switchModel(bestModel);
        }
    }

    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        if (this.performanceHistory.length === 0) {
            return { averageTime: 0, totalTasks: 0, modelUsage: {} };
        }

        const totalTasks = this.performanceHistory.length;
        const totalTime = this.performanceHistory.reduce((sum, entry) => sum + entry.processingTime, 0);
        const averageTime = totalTime / totalTasks;

        const modelUsage = {};
        this.performanceHistory.forEach(entry => {
            modelUsage[entry.model] = (modelUsage[entry.model] || 0) + 1;
        });

        return {
            averageTime: Math.round(averageTime),
            totalTasks,
            modelUsage,
            recentPerformance: this.performanceHistory.slice(-10)
        };
    }

    /**
     * Display performance statistics
     */
    displayPerformanceStats() {
        const stats = this.getPerformanceStats();
        
        console.log(chalk.blue('\n📊 Performance Statistics'));
        console.log(chalk.blue('=' .repeat(30)));
        console.log(`Total Tasks: ${stats.totalTasks}`);
        console.log(`Average Time: ${stats.averageTime}ms`);
        console.log(`Model Usage:`);
        Object.entries(stats.modelUsage).forEach(([model, count]) => {
            console.log(`  ${model}: ${count} tasks`);
        });
        console.log(chalk.blue('=' .repeat(30)));
    }

    /**
     * Optimize model selection based on performance
     */
    optimizeModelSelection() {
        const stats = this.getPerformanceStats();
        
        if (stats.averageTime > 2000) { // If average time > 2 seconds
            console.log(chalk.yellow('⚠️ Performance is slow, considering lighter model...'));
            
            // Switch to lighter model
            const lighterModel = 'distilbert-base-uncased';
            if (this.llm.currentModel !== lighterModel) {
                console.log(chalk.yellow(`🔄 Switching to ${lighterModel} for better performance...`));
                this.llm.switchModel(lighterModel);
            }
        }
    }

    /**
     * Get system status
     */
    getSystemStatus() {
        return {
            systemSpecs: this.systemSpecs,
            recommendedModel: this.recommendedModel,
            currentModel: this.llm.currentModel,
            isInitialized: this.isInitialized,
            performanceStats: this.getPerformanceStats()
        };
    }

    /**
     * Display system status
     */
    displaySystemStatus() {
        const status = this.getSystemStatus();
        
        console.log(chalk.blue('\n🖥️ Smart Model Manager Status'));
        console.log(chalk.blue('=' .repeat(40)));
        console.log(`Recommended Model: ${status.recommendedModel}`);
        console.log(`Current Model: ${status.currentModel || 'None'}`);
        console.log(`Initialized: ${status.isInitialized ? '✅ Yes' : '❌ No'}`);
        console.log(`Total Tasks: ${status.performanceStats.totalTasks}`);
        console.log(`Average Time: ${status.performanceStats.averageTime}ms`);
        console.log(chalk.blue('=' .repeat(40)));
    }
}

module.exports = SmartModelManager;
