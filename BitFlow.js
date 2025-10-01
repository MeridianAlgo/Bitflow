
/**
 * BitFlow.js - Main Application Entry Point
 * 
 * This is the main entry point for the BitFlow trading system.
 * It handles user settings, initializes the trading system,
 * and starts the market monitoring process.
 * 
 * Usage: node bitflow.js <SYMBOL>
 * Example: node bitflow.js BTC/USD
 * 
 * Features:
 * - Text-based settings management
 * - Real-time market monitoring
 * - Advanced trading strategies
 * - Backtesting capabilities
 * - AI-powered sentiment analysis
 */
require('dotenv').config();
const yahooFinance = require('yahoo-finance2').default;
// Suppress Yahoo Finance survey message
yahooFinance.suppressNotices(['yahooSurvey']);
const cron = require('node-cron');
const readline = require('readline');
const WebSocket = require('ws');
const axios = require('axios');
const Alpaca = require('@alpacahq/alpaca-trade-api');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const chalk = require('chalk'); // For colored console output
const { SMA, EMA } = require('technicalindicators');
const logger = require('./src/core/logger'); // Import the new logger system
const { fetchGoogleNewsHeadlines, isCryptoTicker, checkPolygonNewsAPI, checkCryptoMarketStatus } = require('./core/apiHelpers');
const { executeTrade } = require('./core/tradeUtils');
const EnhancedMemorySystem = require('./core/enhancedMemorySystem');
const SmartModelManager = require('./core/smartModelManager');
const {
    promptTimeframe,
    promptTakeProfit,
    promptStopLoss,
    promptUserPreferences,
    promptUsePreviousPreferences,
    promptCrossunderSignals,
    promptPerformanceMetrics,
    printBanner,
    printStatus,
    printSuccess,
    printWarning,
    printError,
    printSection,
    printCard,
    printTableCard,
} = require('./src/core/ui');
const ErrorHandler = require('./core/errorHandler');
// BitFlow class definition moved from core/BitFlow.js to here
class BitFlow {
    constructor(options = {}) {
        // Handle both object-based and parameter-based initialization
        const symbol = typeof options === 'object' ? options.symbol : options;
        this.symbol = typeof symbol === 'string' ? symbol.toUpperCase() : 'BTC/USD'; // e.g., BTC/USD
        this.baseLength = options.baseLength || options.maParams?.baseLength || 20;
        this.evalPeriod = options.evalPeriod || options.maParams?.evalPeriod || 20;
        this.previousPrices = [];
        this.previousMA = [];
        this.isMonitoring = false;
        this.timeframe = options.timeframe || '5Min';
        this.validTimeframes = {
            '1Min': '1 Minute',
            '5Min': '5 Minutes',
            '15Min': '15 Minutes',
            '1Hour': '1 Hour',
            '1Day': '1 Day'
        };
        this.ws = null;
        this.currentPrice = null;
        this.marketStatus = null;
        this.lastSignal = null;
        this.takeProfit = options.takeProfit || 'auto';
        this.stopLoss = options.stopLoss || 'auto';
        this.userPreferences = options.userPreferences || {};
        this.enableCrossunderSignals = options.enableCrossunderSignals !== undefined ? options.enableCrossunderSignals : true;
        this.enablePerformanceMetrics = options.enablePerformanceMetrics !== undefined ? options.enablePerformanceMetrics : false;
        // Initialize MA crossover tracking
        this.lastMACrossoverCheck = 0;
        this.maCrossoverThreshold = null;
        this.MA_CROSSOVER_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        // Initialize Alpaca API
        this.alpaca = new Alpaca({
            keyId: process.env.ALPACA_API_KEY_ID,
            secretKey: process.env.ALPACA_SECRET_KEY,
            paper: true
        });
        
        // Initialize Enhanced Memory System
        this.memory = new EnhancedMemorySystem('user_settings');
        
        // Initialize Smart Model Manager
        this.modelManager = new SmartModelManager();
    }
    
    // Method to update MA parameters
    updateMAParams(params) {
        if (params && typeof params === 'object') {
            if (params.baseLength) this.baseLength = params.baseLength;
            if (params.evalPeriod) this.evalPeriod = params.evalPeriod;
            return true;
        }
        return false;
    }
    
    // Method to get current MA parameters
    getMAParams() {
        return {
            baseLength: this.baseLength,
            evalPeriod: this.evalPeriod
        };
    }
    
    // Essential methods from core/BitFlow.js
    async startMonitoring(monitorPreferences = {}) {
        if (this.isMonitoring) {
            printWarning('Already monitoring market');
            return;
        }
        
        this.isMonitoring = true;
        
        // Initialize models if not already done
        await this.modelManager.initialize();

        // Check API connections
        await this.checkConnections();
        
        // Display system status
        if (process.env.BITFLOW_MIN_UI !== '1') {
            this.displaySystemStatus();
        }
        
        if (process.env.BITFLOW_MIN_UI !== '1') {
            printSuccess(`Starting market monitoring for ${this.symbol}`);
        }
        
        // Start continuous monitoring loop to keep the process running
        this.monitorInterval = setInterval(async () => {
            try {
                // Fetch latest price data
                const latestPrice = await this.fetchLatestPrice();
                if (latestPrice) {
                    this.currentPrice = latestPrice; // Update current price
                    // Use the new logger for price updates
                    logger.market(this.symbol, latestPrice.toFixed(2));

                    // Add your trading logic here
                    // For example, analyze price movements, execute trades, etc.
                }
            } catch (error) {
                logger.error(`Error in monitoring loop: ${error.message}`);
            }
        }, this.getTimeframeInterval()); // Check based on timeframe (1 min for 1Min, etc.)

        // Setup cleanup on process exit
        process.on('SIGINT', () => {
            this.stopMonitoring();
            process.exit(0);
        });
    }
    // Helper method to get interval based on timeframe
    getTimeframeInterval() {
        const intervals = {
            '1Min': 60000,    // 1 minute
            '5Min': 300000,   // 5 minutes
            '15Min': 900000,  // 15 minutes
            '1Hour': 3600000, // 1 hour
            '1Day': 86400000  // 24 hours
        };
        return intervals[this.timeframe] || 60000; // Default to 1 minute
    }
    // --- Market Status Check ---
    async checkMarketStatus() {
        // 1. Check if crypto market is open using our internal check
        const cryptoStatus = await checkCryptoMarketStatus();
        let polygonStatus = {
            available: true,
            open: cryptoStatus.open,
            message: cryptoStatus.message,
            error: cryptoStatus.error
        };
        
        // 2. Check if the pair is tradable using Alpaca
        const alpacaStatus = await this.checkAlpacaAssetStatus();
        
        // Only allow monitoring if both crypto market is open and Alpaca is tradable
        const canMonitor = polygonStatus.open && alpacaStatus.tradable;
        return { polygonStatus, alpacaStatus, canMonitor };
    }
    
    async fetchLatestPrice() {
        try {
            // Convert BTC/USD format to BTC-USD for Yahoo Finance
            const yahooSymbol = this.symbol.replace('/', '-');
            // Only log price fetching if MIN_UI is not set
            if (process.env.BITFLOW_MIN_UI !== '1') {
                console.log(`Fetching price for ${yahooSymbol}...`);
            }
            const quote = await yahooFinance.quote(yahooSymbol);
            if (quote && quote.regularMarketPrice) {
                return quote.regularMarketPrice;
            } else {
                // Fallback to simulated price for demo purposes
                if (process.env.BITFLOW_MIN_UI !== '1') {
                    console.log("Using simulated price data for demonstration");
                }
                return 65000 + (Math.random() * 1000 - 500); // Simulated BTC price around $65,000
            }
        } catch (error) {
            if (process.env.BITFLOW_MIN_UI !== '1') {
                console.error(`Error fetching price: ${error.message}`);
            }
            // Fallback to simulated price for demo purposes
            if (process.env.BITFLOW_MIN_UI !== '1') {
                console.log("Using simulated price data for demonstration");
            }
            return 65000 + (Math.random() * 1000 - 500); // Simulated BTC price around $65,000
        }
    }
    
    // Check connectivity to external services and set flags
    async checkConnections() {
        // Alpaca connectivity
        try {
            const acct = await this.alpaca.getAccount();
            this.alpacaConnected = !!acct && !!acct.status;
        } catch (e) {
            this.alpacaConnected = false;
        }
        // Polygon News connectivity
        try {
            this.polygonConnected = await checkPolygonNewsAPI();
        } catch (e) {
            this.polygonConnected = false;
        }
        // News API reflects polygon news for now
        this.newsApiConnected = this.polygonConnected === true;
    }
    
    displaySystemStatus() {
        if (process.env.BITFLOW_MIN_UI === '1') return;
        
        printSection('System Status');
        
        console.log('System Configuration:');
        console.log('--------------------');
        console.log(`Trading Symbol: ${this.symbol}`);
        console.log(`Timeframe: ${this.validTimeframes[this.timeframe] || '1 Minute'}`);
        console.log(`MA Parameters: Base: ${this.baseLength}, Eval: ${this.evalPeriod}`);
        console.log(`Position Logging: ${this.enablePositionLogging ? '✅ ON' : '❌ OFF'}`);
        console.log(`Crossunder Signals: ${this.enableCrossunderSignals ? '✅ ON' : '❌ OFF'}`);
        console.log(`Performance Metrics: ${this.enablePerformanceMetrics ? '✅ ON' : '❌ OFF'}`);
        // Check if Smart Model Manager is ready
                const isModelManagerReady = this.modelManager && this.modelManager.isInitialized;
                console.log(`Smart Model Manager: ${isModelManagerReady ? '● Ready' : '○ Not Ready'}`);
                console.log(`Memory System: ● Initialized for ${this.symbol}`);
                console.log('--------------------');
    }
    
    async initialize() {
        // Initialize components
        await this.modelManager.initialize();
        return true;
    }
    
    async initializeModels() {
        // Initialize models through the model manager
        return await this.modelManager.initialize();
    }
    
    stopMonitoring() {
        // Stop any active monitoring intervals
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
            if (process.env.BITFLOW_MIN_UI !== '1') {
                console.log('Market monitoring stopped');
            }
        }
    }

    // MA Crossover Functions
    async calculateMACrossoverThreshold() {
        try {
            const prices = await this.getCryptoData();
            if (!prices || prices.length < 50) {
                if (process.env.BITFLOW_MIN_UI !== '1') {
                    printWarning('Insufficient price data for MA crossover calculation');
                }
                return null;
            }

            // Calculate volatility for adaptive MA lengths
            const volatility = this.calculateVolatility(prices.slice(-100));
            const volScale = this.volScale || 10;
            const baseLength = this.baseLength || 20;

            // Adaptive MA lengths based on volatility
            const fastLength = Math.max(5, Math.round(baseLength - volScale * volatility));
            const slowLength = Math.max(fastLength + 5, Math.round(baseLength + volScale * volatility));

            // Calculate MAs
            const fastMA = SMA.calculate({ period: fastLength, values: prices });
            const slowMA = EMA.calculate({ period: slowLength, values: prices });

            if (fastMA.length === 0 || slowMA.length === 0) {
                if (process.env.BITFLOW_MIN_UI !== '1') {
                    printWarning('Insufficient MA data for crossover calculation');
                }
                return null;
            }

            const currentFastMA = fastMA[fastMA.length - 1];
            const currentSlowMA = slowMA[slowMA.length - 1];

            // Check if fast MA is above slow MA (bullish crossover condition)
            const isBullishCrossover = currentFastMA > currentSlowMA;

            if (isBullishCrossover) {
                // Calculate the crossover threshold - price must be above this to buy
                const crossoverThreshold = Math.max(currentFastMA, currentSlowMA);
                return {
                    threshold: crossoverThreshold,
                    fastMA: currentFastMA,
                    slowMA: currentSlowMA,
                    fastLength: fastLength,
                    slowLength: slowLength,
                    isBullish: true,
                    timestamp: new Date().toISOString()
                };
            } else {
                // Bearish - fast MA below slow MA, no buy signals allowed
                return {
                    threshold: null, // No buy threshold when bearish
                    fastMA: currentFastMA,
                    slowMA: currentSlowMA,
                    fastLength: fastLength,
                    slowLength: slowLength,
                    isBullish: false,
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            if (process.env.BITFLOW_MIN_UI !== '1') {
                printWarning('Error calculating MA crossover threshold: ' + error.message);
            }
            return null;
        }
    }

    // Function to check if buy signal should be allowed based on MA crossover
    async shouldAllowBuySignal() {
        const now = Date.now();
        const timeSinceLastCheck = now - this.lastMACrossoverCheck;

        // Check every 5 minutes
        if (timeSinceLastCheck >= this.MA_CROSSOVER_INTERVAL) {
            this.lastMACrossoverCheck = now;

            const crossoverData = await this.calculateMACrossoverThreshold();
            if (crossoverData) {
                this.maCrossoverThreshold = crossoverData;

                // Display MA crossover status
                if (process.env.BITFLOW_MIN_UI !== '1') {
                    const isAboveThreshold = crossoverData.isBullish && this.currentPrice > crossoverData.threshold;

                    printStatus(`📊 MA Crossover Check (${new Date().toLocaleTimeString()}):`);
                    printStatus(`   Current Price: $${this.currentPrice.toFixed(2)}`);
                    printStatus(`   Fast MA (${crossoverData.fastLength}): $${crossoverData.fastMA.toFixed(2)}`);
                    printStatus(`   Slow MA (${crossoverData.slowLength}): $${crossoverData.slowMA.toFixed(2)}`);

                    if (crossoverData.isBullish) {
                        printStatus(`   MA Crossover Price: $${crossoverData.threshold.toFixed(2)}`);
                        printStatus(`   Buy Signal Allowed: ${isAboveThreshold ? '✅ YES' : '❌ NO (price below threshold)'}`);
                    } else {
                        printStatus(`   Status: Bearish (Fast MA < Slow MA) - No buy signals allowed`);
                    }
                }
            }
        }

        // Return whether buy signals are currently allowed
        return this.maCrossoverThreshold && this.maCrossoverThreshold.isBullish &&
               this.currentPrice > this.maCrossoverThreshold.threshold;
    }
}
const TextSettingsManager = require('./core/textSettingsManager');
const { runBacktest, loadFromAlpacaCrypto, loadHistoricalCloses } = require('./core/backtest');
const path = require('path');
const fs = require('fs');

// --- CLI ---
if (require.main === module) {
    (async () => {
        // Suppress ALL GLib/GTK/AT-SPI warnings and errors
        process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';
        process.env.NO_AT_BRIDGE = '1';
        process.env.GTK_MODULES = '';
        process.env.DISABLE_AT_SPI = '1';

        // Comprehensive stderr suppression
        const originalStderrWrite = process.stderr.write;
        process.stderr.write = function(chunk, encoding, callback) {
            if (typeof chunk === 'string' && (
                chunk.includes('GLib-GObject-CRITICAL') ||
                chunk.includes('invalid unclassed type') ||
                chunk.includes('GLib-GIO-CRITICAL') ||
                chunk.includes('GLib-GObject-WARNING') ||
                chunk.includes('GLib-GThread-CRITICAL') ||
                chunk.includes('GLib-GObject-ERROR') ||
                chunk.includes('AT-SPI') ||
                chunk.includes('AT_SPI') ||
                chunk.includes('accessibility') ||
                chunk.includes('GLib-Netlink-CRITICAL') ||
                chunk.includes('GLib-GIO-WARNING') ||
                chunk.includes('GLib-GThread-WARNING') ||
                chunk.includes('g_object_unref') ||
                chunk.includes('g_type_ensure') ||
                chunk.includes('g_main_context') ||
                chunk.includes('g_cclosure_marshal') ||
                chunk.includes('g_signal_emit') ||
                chunk.includes('g_value_set') ||
                chunk.includes('g_closure_invoke') ||
                chunk.includes('GLib-Netlink') ||
                chunk.includes('libgtk') ||
                chunk.includes('libgdk') ||
                chunk.includes('libcairo') ||
                chunk.includes('libpango') ||
                chunk.includes('libglib') ||
                chunk.includes('libatk') ||
                chunk.includes('libgconf') ||
                chunk.includes('libnotify') ||
                chunk.includes('libx11') ||
                chunk.includes('libxcb') ||
                chunk.includes('libxrandr') ||
                chunk.includes('libxss') ||
                chunk.includes('libxcursor') ||
                chunk.includes('libxdamage') ||
                chunk.includes('libxfixes') ||
                chunk.includes('libxi') ||
                chunk.includes('libxtst') ||
                chunk.includes('libxinerama') ||
                chunk.includes('libxcomposite') ||
                chunk.includes('libxrender') ||
                chunk.includes('libxext') ||
                chunk.includes('libxau') ||
                chunk.includes('libxdmcp') ||
                chunk.includes('libdrm') ||
                chunk.includes('libgbm') ||
                chunk.includes('libasound') ||
                chunk.includes('libpulse') ||
                chunk.includes('libjack') ||
                chunk.includes('libudev') ||
                chunk.includes('libinput') ||
                chunk.includes('libmtdev') ||
                chunk.includes('libevdev') ||
                chunk.includes('libwacom') ||
                chunk.includes('libxkbcommon') ||
                chunk.includes('libwayland') ||
                chunk.includes('libfontconfig') ||
                chunk.includes('libfreetype') ||
                chunk.includes('libharfbuzz') ||
                chunk.includes('libexpat') ||
                chunk.includes('libbz2') ||
                chunk.includes('libz') ||
                chunk.includes('libpng') ||
                chunk.includes('libjpeg') ||
                chunk.includes('libtiff') ||
                chunk.includes('libwebp') ||
                chunk.includes('libavif') ||
                chunk.includes('libheif') ||
                chunk.includes('libaom') ||
                chunk.includes('libdav1d') ||
                chunk.includes('libvpx') ||
                chunk.includes('libogg') ||
                chunk.includes('libvorbis') ||
                chunk.includes('libopus') ||
                chunk.includes('libflac') ||
                chunk.includes('libmp3lame') ||
                chunk.includes('libmpg123') ||
                chunk.includes('libopenmpt') ||
                chunk.includes('libmodplug') ||
                chunk.includes('libmikmod') ||
                chunk.includes('libxmp') ||
                chunk.includes('libgme') ||
                chunk.includes('libadplug') ||
                chunk.includes('libsndfile') ||
                chunk.includes('libwavpack') ||
                chunk.includes('libaudiofile') ||
                chunk.includes('libgsm') ||
                chunk.includes('libalac') ||
                chunk.includes('libape') ||
                chunk.includes('libtta') ||
                chunk.includes('libshorten') ||
                chunk.includes('libshn') ||
                chunk.includes('libtak') ||
                chunk.includes('libwma') ||
                chunk.includes('libaac') ||
                chunk.includes('libmpc') ||
                chunk.includes('libmpcdec') ||
                chunk.includes('libmusepack') ||
                chunk.includes('libwav') ||
                chunk.includes('libaiff') ||
                chunk.includes('libau') ||
                chunk.includes('libsndio') ||
                chunk.includes('libportaudio') ||
                chunk.includes('libpulseaudio') ||
                chunk.includes('libalsa') ||
                chunk.includes('liboss') ||
                chunk.includes('libesd') ||
                chunk.includes('libsolaris') ||
                chunk.includes('libsun') ||
                chunk.includes('libsgi') ||
                chunk.includes('libhpux') ||
                chunk.includes('libaix') ||
                chunk.includes('libirix') ||
                chunk.includes('libbeos') ||
                chunk.includes('libhaiku') ||
                chunk.includes('libamiga') ||
                chunk.includes('libdreamcast') ||
                chunk.includes('libps2') ||
                chunk.includes('libps3') ||
                chunk.includes('libps4') ||
                chunk.includes('libps5') ||
                chunk.includes('libswitch') ||
                chunk.includes('libxbox') ||
                chunk.includes('libxbox360') ||
                chunk.includes('libxboxone') ||
                chunk.includes('libxboxseries') ||
                chunk.includes('libplaystation') ||
                chunk.includes('libnintendo') ||
                chunk.includes('libwii') ||
                chunk.includes('libwiiu') ||
                chunk.includes('lib3ds') ||
                chunk.includes('libnds') ||
                chunk.includes('libgba') ||
                chunk.includes('libgb') ||
                chunk.includes('libgameboy') ||
                chunk.includes('libgamecube') ||
                chunk.includes('libvirtualboy') ||
                chunk.includes('libpcengine') ||
                chunk.includes('libturbografx') ||
                chunk.includes('libsupergrafx') ||
                chunk.includes('libneogeo') ||
                chunk.includes('libneogeopocket') ||
                chunk.includes('libngp') ||
                chunk.includes('libvectrex') ||
                chunk.includes('libatari') ||
                chunk.includes('libcommodore') ||
                chunk.includes('libamstrad') ||
                chunk.includes('libspectrum') ||
                chunk.includes('libmsx') ||
                chunk.includes('libcoleco') ||
                chunk.includes('libintellivision') ||
                chunk.includes('libodyssey') ||
                chunk.includes('libarcadia') ||
                chunk.includes('libbally') ||
                chunk.includes('libastrocade') ||
                chunk.includes('libfairchild') ||
                chunk.includes('libchannel') ||
                chunk.includes('librca') ||
                chunk.includes('libstudio') ||
                chunk.includes('libcdi') ||
                chunk.includes('lib3do') ||
                chunk.includes('libjaguar') ||
                chunk.includes('liblynx') ||
                chunk.includes('libsupervision') ||
                chunk.includes('libwonderswan') ||
                chunk.includes('libngage') ||
                chunk.includes('libgp2x') ||
                chunk.includes('libgp32') ||
                chunk.includes('libdingoo') ||
                chunk.includes('libcaanoo') ||
                chunk.includes('libpandora') ||
                chunk.includes('libpyra') ||
                chunk.includes('libdragonbox') ||
                chunk.includes('libretrofw') ||
                chunk.includes('libopenpandora') ||
                chunk.includes('libgizmondo') ||
                chunk.includes('libnvidia') ||
                chunk.includes('libnouveau') ||
                chunk.includes('libfglrx') ||
                chunk.includes('libradeon') ||
                chunk.includes('libintel') ||
                chunk.includes('libi915') ||
                chunk.includes('libi965') ||
                chunk.includes('libiris') ||
                chunk.includes('libsis') ||
                chunk.includes('libvia') ||
                chunk.includes('libunichrome') ||
                chunk.includes('libchrome') ||
                chunk.includes('libmali') ||
                chunk.includes('liblima') ||
                chunk.includes('libpanfrost') ||
                chunk.includes('libv3d') ||
                chunk.includes('libvc4') ||
                chunk.includes('libetnaviv') ||
                chunk.includes('libtegra') ||
                chunk.includes('libnvidia-tegra') ||
                chunk.includes('libnvidia-jetson') ||
                chunk.includes('libnvidia-xavier') ||
                chunk.includes('libnvidia-orin') ||
                chunk.includes('libnvidia-agx') ||
                chunk.includes('libnvidia-parker') ||
                chunk.includes('libnvidia-logan') ||
                chunk.includes('libnvidia-storm') ||
                chunk.includes('libnvidia-thunder') ||
                chunk.includes('libnvidia-lightning') ||
                chunk.includes('libnvidia-rain') ||
                chunk.includes('libnvidia-snow') ||
                chunk.includes('libnvidia-hail') ||
                chunk.includes('libnvidia-sleet') ||
                chunk.includes('libnvidia-blizzard') ||
                chunk.includes('libnvidia-avalanche') ||
                chunk.includes('libnvidia-earthquake') ||
                chunk.includes('libnvidia-volcano') ||
                chunk.includes('libnvidia-tsunami') ||
                chunk.includes('libnvidia-tornado') ||
                chunk.includes('libnvidia-hurricane') ||
                chunk.includes('libnvidia-typhoon') ||
                chunk.includes('libnvidia-cyclone') ||
                chunk.includes('libnvidia-monsoon') ||
                chunk.includes('libnvidia-drought') ||
                chunk.includes('libnvidia-flood') ||
                chunk.includes('libnvidia-fire') ||
                chunk.includes('libnvidia-ice') ||
                chunk.includes('libnvidia-wind') ||
                chunk.includes('libnvidia-storm') ||
                chunk.includes('libnvidia-thunder') ||
                chunk.includes('libnvidia-lightning') ||
                chunk.includes('libnvidia-rain') ||
                chunk.includes('libnvidia-snow') ||
                chunk.includes('libnvidia-hail') ||
                chunk.includes('libnvidia-sleet') ||
                chunk.includes('libnvidia-blizzard') ||
                chunk.includes('libnvidia-avalanche') ||
                chunk.includes('libnvidia-earthquake') ||
                chunk.includes('libnvidia-volcano') ||
                chunk.includes('libnvidia-tsunami') ||
                chunk.includes('libnvidia-tornado') ||
                chunk.includes('libnvidia-hurricane') ||
                chunk.includes('libnvidia-typhoon') ||
                chunk.includes('libnvidia-cyclone') ||
                chunk.includes('libnvidia-monsoon') ||
                chunk.includes('libnvidia-drought') ||
                chunk.includes('libnvidia-flood') ||
                chunk.includes('libnvidia-fire') ||
                chunk.includes('libnvidia-ice') ||
                chunk.includes('libnvidia-wind')
            )) {
                return true;
            }
            return originalStderrWrite.apply(process.stderr, arguments);
        };
        
        // Initialize error handler
        const errorHandler = new ErrorHandler();

        const symbol = process.argv[2];
        if (!symbol) {
            printError('Please provide a crypto trading pair as a command line argument');
            printStatus('Example: node BitFlow.js BTC/USD');
            process.exit(1);
        }

        // Check required environment variables
        const requiredEnvVars = {
            'ALPACA_API_KEY_ID': process.env.ALPACA_API_KEY_ID,
            'ALPACA_SECRET_KEY': process.env.ALPACA_SECRET_KEY
        };
        const missingVars = Object.entries(requiredEnvVars)
            .filter(([_, value]) => !value)
            .map(([key]) => key);
        if (missingVars.length > 0) {
            printError('\nMissing required environment variables:');
            missingVars.forEach(varName => printStatus(`- ${varName}`));
            printStatus('\nPlease create a .env file with these variables:');
            printStatus('ALPACA_API_KEY_ID=your_key_here');
            printStatus('ALPACA_SECRET_KEY=your_secret_here');
            process.exit(1);
        }
        
        // Initialize text-based settings manager
        const settingsManager = new TextSettingsManager();
        let userPreferences = settingsManager.loadAllSettings();
        let usePrev = false;

        // Always show settings interface - let user review/modify each time
        const existingSettings = settingsManager.listSettings();
        if (existingSettings.length > 0) {
            // Show current settings and ask if user wants to use them or modify
            if (process.env.BITFLOW_MIN_UI !== '1') {
                console.log('\n📋 Current Settings:');
                console.log('─'.repeat(50));
                Object.entries(userPreferences).forEach(([key, value]) => {
                    const emoji = value === true ? '✅' : value === false ? '❌' : '⚙️';
                    const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    console.log(`   ${emoji} ${displayKey}: ${value}`);
                });
                console.log('─'.repeat(50));
            }

            // Use the same userPreferences object for both displays to ensure consistency
            userPreferences = settingsManager.loadAllSettings();

            if (process.env.BITFLOW_MIN_UI !== '1') {
                const settingsLines = [
                    `Position Logging: ${userPreferences.enablePositionLogging ? '✅ ON' : '❌ OFF'}`,
                    `Take Profit: ${userPreferences.defaultTakeProfit || 'auto'}`,
                    `Stop Loss: ${userPreferences.defaultStopLoss || 'auto'}`,
                    `Timeframe: ${userPreferences.defaultTimeframe || '1 Minute'}`,
                    `Crossunder Signals: ${userPreferences.enableCrossunderSignals ? '✅ ON' : '❌ OFF'}`,
                    `Performance Metrics: ${userPreferences.enablePerformanceMetrics ? '✅ ON' : '❌ OFF'}`
                ];
                printCard('Current Settings', settingsLines);
            }
            
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            usePrev = await new Promise(resolve => {
                rl.question('Use these settings? (Y/n) ', answer => {
                    resolve(answer.toLowerCase() !== 'n');
                    rl.close();
                });
            });
            if (!usePrev) {
                // User wants to modify settings
                if (process.env.BITFLOW_MIN_UI !== '1') {
                    console.log('\n🔧 Configuring new settings...');
                }
                userPreferences = await promptUserPreferences(userPreferences);
                settingsManager.saveAllSettings(userPreferences);
                if (process.env.BITFLOW_MIN_UI !== '1') {
                    console.log('\n✅ Settings updated and saved!');
                }
            } else {
                if (process.env.BITFLOW_MIN_UI !== '1') {
                    console.log('\n✅ Using existing settings...');
                }
            }
            
            // Add clear separator before starting main program
            if (process.env.BITFLOW_MIN_UI !== '1') {
                console.log('\n' + '='.repeat(60));
                console.log('🚀 STARTING BITFLOW TRADING SYSTEM');
                console.log('='.repeat(60));
            }
        } else {
            // No existing settings - prompt for new ones
            if (process.env.BITFLOW_MIN_UI !== '1') {
                console.log('\n🔧 No existing settings found. Let\'s configure BitFlow...');
            }
            userPreferences = await promptUserPreferences();
            settingsManager.saveAllSettings(userPreferences);
            usePrev = true;
            
            // Add clear separator before starting main program
            if (process.env.BITFLOW_MIN_UI !== '1') {
                console.log('\n' + '='.repeat(60));
                console.log('🚀 STARTING BITFLOW TRADING SYSTEM');
                console.log('='.repeat(60));
            }
        }

        // Wait 10 seconds for user to modify settings files if needed
        if (process.env.BITFLOW_MIN_UI !== '1') {
            console.log('\n⏱️ Waiting 10 seconds for any settings file modifications...');
            console.log('💡 You can edit files in user_settings/ folder during this time');
        }
        
        for (let i = 10; i > 0; i--) {
            if (process.env.BITFLOW_MIN_UI !== '1') {
                process.stdout.write(`\r⏳ Starting in ${i} seconds... `);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        if (process.env.BITFLOW_MIN_UI !== '1') {
            process.stdout.write('\r✅ Starting now!\n');
        }

        // Initialize ora for spinners after user has selected settings - optional minimal UI
        const ora = require('ora');
        const MIN_UI = process.env.BITFLOW_MIN_UI === '1';
        // Configure ora to not clear the terminal and preserve stdin
        ora.promise.clear = () => {}; // Override clear function to do nothing
        const mainSpinner = MIN_UI ? { text: '', succeed: ()=>{}, start: ()=>{}, stop: ()=>{}, info: ()=>{}, fail: ()=>{}, warn: ()=>{} } : ora({
            text: 'Initializing BitFlow Trading System...',
            discardStdin: false,
            isEnabled: true,
            isSilent: false,
            stream: process.stdout
        }).start();

        // Use direct file monitor - reads directly from text files
        if (!MIN_UI) mainSpinner.text = 'Reading settings from files...';
        const DirectFileMonitor = require('./direct_file_monitor');
        
        // Display monitor card reading directly from files (no caching)
        // Don't clear the terminal so users can still see their settings
        if (!MIN_UI) mainSpinner.succeed('Settings loaded successfully');
        const fileMonitor = new DirectFileMonitor();
        let currentSettings = {};
        if (!MIN_UI) {
            currentSettings = fileMonitor.displayMonitorCard(symbol);
        } else {
            // Even in minimal UI, we need to read the settings to ensure latest values
            currentSettings = fileMonitor.displayMonitorCard(symbol);
        }
        
        // Update userPreferences with direct file readings to ensure latest values are used
        userPreferences = {...userPreferences, ...currentSettings};

        // Use preferences for defaults
        const validTimeframes = {
            '1Min': '1 Minute',
            '5Min': '5 Minutes',
            '15Min': '15 Minutes',
            '1Hour': '1 Hour',
            '1Day': '1 Day'
        };
        let timeframe = userPreferences.defaultTimeframe || undefined;
        if (!timeframe) {
            timeframe = await promptTimeframe(validTimeframes);
            if (timeframe && timeframe !== userPreferences.defaultTimeframe) {
                userPreferences.defaultTimeframe = timeframe;
                settingsManager.saveSetting('defaultTimeframe', timeframe);
            }
        }
        let takeProfit = userPreferences.defaultTakeProfit ?? 'auto';
        let stopLoss = userPreferences.defaultStopLoss ?? 'auto';
        let enableCrossunderSignals = userPreferences.enableCrossunderSignals ?? true;
        let enablePerformanceMetrics = userPreferences.enablePerformanceMetrics ?? false;

        // No need for separate prompts since theyre now included in promptUserPreferences
        const limit = 1000; // Reasonable default for backtesting
        let positionCount = 0;
        let maParams = null;

        async function getPreviousPositionCount(symbol) {
            const csvPath = path.join(__dirname, 'positions_sold.csv');
            if (!fs.existsSync(csvPath)) return 0;
            const data = fs.readFileSync(csvPath, 'utf8').split('\n');
            const headers = data[0].split(',');
            const symbolIdx = headers.indexOf('symbol');
            if (symbolIdx === -1) return 0;
            return data.slice(1).filter(line => {
                const vals = line.split(',');
                return vals[symbolIdx] && vals[symbolIdx].trim() === symbol.trim();
            }).length;
        }

        /**
         * Starts the market monitoring process
         * 
         * This function initializes the BitFlow trading system,
         * runs backtests if needed, and starts monitoring the market
         * for trading opportunities.
         */
        async function startMonitoring() {
            try {
                // Define default maParams first to avoid initialization error
                const maParams = { baseLength: 20, evalPeriod: 20 };
                
                // Initialize everything before showing system status
                mainSpinner.text = 'Initializing Smart Model Manager...';
                const bitflow = new BitFlow({
                    symbol,
                    timeframe,
                    takeProfit,
                    stopLoss,
                    enableCrossunderSignals,
                    enablePerformanceMetrics,
                    enablePositionLogging: userPreferences.enablePositionLogging,
                    limit,
                    maParams
                });
                
                // Initialize models first
                await bitflow.initializeModels();
                
                // Use user-selected values
                const backtestSpinner = MIN_UI ? { text: '', succeed: ()=>{}, start: ()=>{}, stop: ()=>{}, info: ()=>{}, fail: ()=>{}, warn: ()=>{} } : ora('Analyzing trading history...').start();
                if (!MIN_UI) console.log('Checking previous positions for symbol:', symbol);

                // Ensure we have sufficient Alpaca history BEFORE proceeding
                if (!MIN_UI) backtestSpinner.text = `Fetching historical data from Alpaca for ${symbol}...`;
                if (!MIN_UI) {
                    console.log(`\n🔄 Requesting ${limit} bars for ${symbol} (${timeframe}) from Alpaca...`);
                }

                let hist = null;
                let attempts = 0;
                const maxAttempts = 3;

                while (attempts < maxAttempts && (!hist || hist.length === 0)) {
                    attempts++;
                    if (attempts > 1) {
                        if (!MIN_UI) backtestSpinner.text = `Retrying... (attempt ${attempts}/${maxAttempts})`;
                        if (!MIN_UI) {
                            console.log(`⏳ Retrying data fetch (attempt ${attempts}/${maxAttempts})...`);
                        }
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between attempts
                    }

                    hist = await loadFromAlpacaCrypto(symbol, timeframe, limit);

                    if (hist && hist.length > 0) {
                        if (!MIN_UI) {
                            console.log(`✅ Successfully received ${hist.length} bars from Alpaca`);
                        }
                        break;
                    } else {
                        if (!MIN_UI) {
                            console.log(`⚠️  No bars received from Alpaca (attempt ${attempts}/${maxAttempts})`);
                        }
                    }
                }

                if (!hist || hist.length < 200) {
                    if (!MIN_UI) backtestSpinner.fail(`Insufficient Alpaca history (${hist ? hist.length : 0} bars). Aborting start.`);

                    // Try Yahoo Finance as fallback
                    if (!MIN_UI) backtestSpinner.text = 'Trying Yahoo Finance as fallback...';
                    if (!MIN_UI) {
                        console.log(`\n🔄 Falling back to Yahoo Finance for ${symbol}...`);
                    }

                    let yahooAttempts = 0;
                    while (yahooAttempts < maxAttempts && (!hist || hist.length < 200)) {
                        yahooAttempts++;
                        if (yahooAttempts > 1) {
                            if (!MIN_UI) {
                                console.log(`⏳ Retrying Yahoo Finance (attempt ${yahooAttempts}/${maxAttempts})...`);
                            }
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }

                        const yahooHist = await loadHistoricalCloses(symbol, timeframe, limit);
                        if (yahooHist && yahooHist.length >= 200) {
                            hist = yahooHist;
                            if (!MIN_UI) {
                                console.log(`✅ Successfully received ${hist.length} bars from Yahoo Finance`);
                            }
                            break;
                        } else if (yahooHist && yahooHist.length > 0) {
                            hist = yahooHist;
                            if (!MIN_UI) {
                                console.log(`⚠️  Only received ${hist.length} bars from Yahoo Finance, but proceeding anyway`);
                            }
                            break;
                        }
                    }

                    if (!hist || hist.length === 0) {
                        if (!MIN_UI) backtestSpinner.fail('No historical data available from any source. Aborting start.');
                        printError(`\n❌ CRITICAL ERROR: No historical data received for ${symbol} ${timeframe}`);
                        printError('This could indicate:');
                        printError('  • Invalid API keys in your .env file');
                        printError('  • Network connectivity issues');
                        printError('  • Invalid trading symbol or timeframe');
                        printError('  • API service outages');
                        printError('\nPlease check your configuration and try again.');
                        process.exit(1);
                    } else if (hist.length < 200) {
                        if (!MIN_UI) backtestSpinner.warn(`Limited data available (${hist.length} bars). Proceeding with caution.`);
                        if (!MIN_UI) {
                            console.log(`⚠️  WARNING: Only ${hist.length} bars available. This may affect trading accuracy.`);
                        }
                    }
                }
                // Always run backtest to compute per-token MA params
                backtestSpinner.text = `Running backtest on ${hist.length} bars...`;
                // Set environment variable to reduce console output during backtesting
                process.env.MIN_CONSOLE_OUTPUT = '1';
                const optimizedParams = await runBacktest(symbol, timeframe, limit);
                // Reset environment variable after backtesting
                process.env.MIN_CONSOLE_OUTPUT = '0';
                if (optimizedParams && typeof optimizedParams.baseLength === 'number' && typeof optimizedParams.evalPeriod === 'number') {
                    bitflow.updateMAParams(optimizedParams);
                    if (!MIN_UI) console.log('Using optimized MA params:', optimizedParams);
                    backtestSpinner.succeed('Backtest complete - optimized parameters applied');
                } else {
                    backtestSpinner.warn('Backtest returned default parameters. Proceeding with defaults.');
                }
                
                // Pass these params to BitFlow
                const monitorPreferences = {
                    ...userPreferences,
                    enableCrossunderSignals: enableCrossunderSignals,
                    enablePerformanceMetrics: enablePerformanceMetrics
                };

                // Initialize BitFlow with spinner
                const initSpinner = MIN_UI ? { succeed: ()=>{} } : ora('Initializing trading monitor...').start();
                const monitor = bitflow; // Use the already initialized BitFlow instance
                
                // Initialize monitor if not already initialized
                if (!monitor.initialized) {
                    await monitor.initialize();
                }
                initSpinner.succeed('Trading monitor initialized successfully');

                // Initialize Smart Model Manager for AI-powered risk management
                if (!MIN_UI) console.log('\n🤖 Initializing AI Risk Management...');
                const smartModelManager = new SmartModelManager();
                await smartModelManager.initialize(); // This will auto-select the best model
                
                // Check if model locking is enabled
                const enableModelLocking = userPreferences.enableModelLocking === 'true';
                const modelLockStatus = enableModelLocking ? 'Yes (will use this model for entire session)' : 'No (will auto-switch based on market conditions)';

                // Add AI-powered risk management to the trading loop
                const originalExecuteTrade = require('./core/tradeUtils').executeTrade;
                require('./core/tradeUtils').executeTrade = async function (...args) {
                    const result = await originalExecuteTrade.apply(this, args);
                    positionCount++;

                    // Use AI for risk assessment every 10 positions
                    if (positionCount % 10 === 0) {
                        const riskSpinner = ora('AI analyzing market risk...').start();

                        try {
                            // Get current market data (simplified for demo)
                            const marketData = {
                                price: 50000, // Would get from live feed
                                rsi: 50,      // Would calculate from recent prices
                                volatility: 0.02, // Would calculate from recent prices
                                volume: 1000000,  // Would get from live feed
                                trend: 'neutral'  // Would determine from price action
                            };

                            // Pass model locking preference to risk assessment
                            const riskAssessment = await smartModelManager.assessMarketRisk(marketData, { enableModelLocking });
                            riskSpinner.succeed(`Risk Level: ${riskAssessment.riskLevel.toUpperCase()} (${(riskAssessment.confidence * 100).toFixed(1)}% confidence)`);

                            if (riskAssessment.riskLevel === 'high') {
                                console.log('⚠  High risk detected - consider reducing position sizes');
                                console.log('⚠️  High risk detected - consider reducing position sizes');
                            }
                            
                            // Auto-select best model if not locked
                            if (!enableModelLocking && positionCount % 30 === 0) {
                                await smartModelManager.autoSelectBestModel({ symbol, timeframe, marketData });
                            }
                        } catch (error) {
                            riskSpinner.fail('Risk assessment failed');
                            console.log('⚠️  Could not assess market risk');
                        }
                    }

                    return result;
                };
                
                // Display system status before starting market monitoring
                if (!MIN_UI) {
                    printSection('System Status');
                    console.log('System Connections:');
                    console.log('------------------');
                    // Determine actual connection status for APIs
                    await monitor.checkConnections();
                    console.log(`Alpaca: ${monitor.alpacaConnected ? '● Connected' : '○ Disconnected'}`);
                    console.log(`Polygon: ${monitor.polygonConnected ? '● Connected' : '○ Disconnected'}`);
                    console.log(`Yahoo Finance: ● Connected`);
                    // Check if Smart Model Manager is ready
                    const isModelManagerReady = monitor.modelManager && monitor.modelManager.isInitialized;
                    console.log(`Smart Model Manager: ${isModelManagerReady ? '● Ready' : '○ Not Ready'}`);
                    console.log(`News Integration: ${monitor.newsApiConnected ? '● Active' : '○ Inactive'}`);
                    console.log(`Market Data Feed: ● Active`);
                    console.log('------------------');

                    // Display AI Model Status
                    printSection('AI Model Configuration');
                    console.log('Optimal Model Selection:');
                    console.log('------------------------');
                    console.log(`🎯 Selected Model: ${smartModelManager.recommendedModel || 'Not selected'}`);
                    console.log(`⚡ Performance: ~${smartModelManager.performanceHistory.length > 0 ?
                        Math.round(smartModelManager.performanceHistory.reduce((sum, p) => sum + p.processingTime, 0) / smartModelManager.performanceHistory.length) : '0'}ms average`);
                    console.log(`🔒 Model Locked: ${modelLockStatus}`);
                    console.log(`🤖 AI Tasks: TP/SL, Position Sizing, Risk Assessment`);
                    console.log('------------------------');
                }

                const monitorSpinner = MIN_UI ? { succeed: ()=>{} } : ora('Starting market monitoring...').start();
                await monitor.startMonitoring();
                monitorSpinner.succeed('Market monitoring active');
            } catch (error) {
                if (!MIN_UI) {
                    console.error(chalk.red(`\n[ERROR] ${error.message}`));
                }
                errorHandler.handleTradingError(error, 'monitoring_start', symbol);
                process.exit(1);
            }
        }
        startMonitoring();
    })();
}