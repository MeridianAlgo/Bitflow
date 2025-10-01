const Alpaca = require('@alpacahq/alpaca-trade-api');
const WebSocket = require('ws');
const axios = require('axios');
const { checkLlamaAPI, checkPolygonNewsAPI, fetchPolygonNews, fetchArticleText, isCryptoTicker } = require('./apiHelpers');
const { executeTrade } = require('./tradeUtils');
const fetch = require('node-fetch');
const LLAMA_API_KEY = process.env.LLAMA_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const { SMA, EMA } = require('technicalindicators');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const readline = require('readline');
const { printStatus, printSuccess, printWarning, printError, printBanner, printSection, printCard, printTableCard, printDivider, statusDot, formatMoney, formatNumber } = require('./ui');
const EnhancedMemorySystem = require('./enhancedMemorySystem');
const SmartModelManager = require('./smartModelManager');

function boolStatus(val) {
    return val ? chalk.green('Enabled') : chalk.red('Disabled');
}

class BitFlow {
    constructor(symbol, baseLength = 20, evalPeriod = 20, timeframe = '5Min', polygonKey = process.env.POLYGON_API_KEY, takeProfit = 'auto', stopLoss = 'auto', userPreferences = {}, errorHandler = null) {
        this.symbol = symbol.toUpperCase(); // e.g., BTC/USD
        this.baseLength = baseLength;
        this.evalPeriod = evalPeriod;
        this.previousPrices = [];
        this.previousMA = [];
        this.isMonitoring = false;
        this.timeframe = timeframe;
        this.validTimeframes = {
            '1Min': '1 Minute',
            '5Min': '5 Minutes',
            '15Min': '15 Minutes',
            '1Hour': '1 Hour',
            '1Day': '1 Day'
        };
        this.finnhubKey = process.env.FINNHUB_API_KEY;
        this.ws = null;
        this.currentPrice = null;
        this.polygonKey = polygonKey;
        this.marketStatus = null;
        this.lastSignal = null;
        this.historicalData = [];
        this.alpaca = new Alpaca({
            keyId: process.env.ALPACA_API_KEY_ID,
            secretKey: process.env.ALPACA_SECRET_KEY,
            paper: true,
            usePolygon: false
        });
        this.position = null;
        this.lastMarketCheck = false;
        this.accumulatedPrices = []; // Store prices if insufficient data
        this.takeProfit = takeProfit;
        this.stopLoss = stopLoss;
        this.hasPrintedNoPosition = false; // Track if 'No open position' was printed
        
        // Initialize enhanced memory system and load user settings
        this.memorySystem = new EnhancedMemorySystem();
        this.userSettings = userPreferences.length ? userPreferences : this.memorySystem.loadAllSettings();

        // Initialize smart model manager and error handler
        this.smartModelManager = new SmartModelManager();
        this.errorHandler = errorHandler || new (require('./errorHandler'))();
    }

    static async configureTimeframe() {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const validTimeframes = {
            '1Min': '1 Minute',
            '5Min': '5 Minutes',
            '15Min': '15 Minutes',
            '1Hour': '1 Hour',
            '1Day': '1 Day'
        };
        console.log('\n=== Timeframe Configuration ===');
        console.log('Available timeframes:');
        Object.entries(validTimeframes).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
        });
        return new Promise((resolve) => {
            rl.question('\nSelect timeframe (default: 5Min): ', (answer) => {
                rl.close();
                const tfMap = {
                    '1min': '1Min', '1 min': '1Min', '1minute': '1Min', '1 minute': '1Min', '1Min': '1Min',
                    '5min': '5Min', '5 min': '5Min', '5minute': '5Min', '5 minutes': '5Min', '5Min': '5Min',
                    '15min': '15Min', '15 min': '15Min', '15minute': '15Min', '15 minutes': '15Min', '15Min': '15Min',
                    '1hour': '1Hour', '1 hour': '1Hour', '1hr': '1Hour', '1Hr': '1Hour', '1Hour': '1Hour',
                    '1day': '1Day', '1 day': '1Day', '1Day': '1Day'
                };
                const tf = tfMap[answer.trim()] || '5Min';
                console.log(`\nSelected timeframe: ${tf}`);
                resolve(tf);
            });
        });
    }

    static async configureCrossunderSignals() {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        console.log('\n=== Crossunder Signals Configuration ===');
        console.log('This setting controls whether the bot uses MA crossunder signals to sell positions.');
        console.log('When enabled: Bot will sell on MA crossunder OR when TP/SL is hit');
        console.log('When disabled: Bot will ONLY sell when TP/SL is hit (no crossunder signals)');
        
        return new Promise((resolve) => {
            rl.question('\nEnable MA crossunder signals for selling? (y/n, default: y): ', (answer) => {
                rl.close();
                const enable = answer.trim().toLowerCase() !== 'n' && answer.trim().toLowerCase() !== 'no';
                console.log(`\nCrossunder signals: ${enable ? 'ENABLED' : 'DISABLED'}`);
                resolve(enable);
            });
        });
    }

    // --- Fetch historical OHLCV from Alpaca REST API ---
    async fetchAlpacaHistorical(symbol, timeframe = this.timeframe, limit = 1000) {
        const url = `https://data.alpaca.markets/v1beta3/crypto/us/bars?symbols=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=${limit}`;
        try {
            const resp = await axios.get(url, {
                headers: {
                    'Apca-Api-Key-Id': process.env.ALPACA_API_KEY_ID,
                    'Apca-Api-Secret-Key': process.env.ALPACA_SECRET_KEY,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            const bars = resp.data.bars && resp.data.bars[symbol];
            if (!bars || !Array.isArray(bars) || bars.length === 0) {
                throw new Error('No OHLCV data from Alpaca');
            }
            return bars;
        } catch (err) {
            console.error('Error fetching Alpaca OHLCV:', err.message);
            return [];
        }
    }

    // --- Market Status Check ---
    async checkMarketStatus() {
        // 1. Check if crypto market is open using Polygon
        let polygonStatus = {
            available: !!this.polygonKey,
            open: false,
            message: '',
            error: null
        };
        if (this.polygonKey) {
            try {
                const marketResponse = await axios.get(
                    'https://api.polygon.io/v1/marketstatus/now',
                    { headers: { 'Authorization': `Bearer ${this.polygonKey}` } }
                );
                if (marketResponse.data && marketResponse.data.currencies && marketResponse.data.currencies.crypto === 'open') {
                    polygonStatus.open = true;
                    polygonStatus.message = 'Crypto market is OPEN (Polygon)';
                } else {
                    polygonStatus.open = false;
                    polygonStatus.message = 'Crypto market is CLOSED or in maintenance (Polygon)';
                }
            } catch (error) {
                polygonStatus.error = 'Polygon market status check failed: ' + error.message;
            }
        } else {
            polygonStatus.message = 'No Polygon API key provided, skipping Polygon market status check.';
        }
        // 2. Check if the pair is tradable using Alpaca
        const alpacaStatus = await this.checkAlpacaAssetStatus();
        // Only allow monitoring if both Polygon is open and Alpaca is tradable
        const canMonitor = polygonStatus.open && alpacaStatus.tradable;
        return { polygonStatus, alpacaStatus, canMonitor };
    }

    async checkAlpacaAssetStatus() {
        let status = {
            available: true,
            tradable: false,
            message: '',
            error: null
        };
        try {
            // Use Alpaca's getAssets to check if pair is tradable
            const assets = await this.alpaca.getAssets({ asset_class: 'crypto', status: 'active' });
            const found = assets.find(a => (a.symbol === this.symbol || a.symbol === this.symbol.replace('/', '')) && a.tradable);
            if (found) {
                status.tradable = true;
                status.message = `${this.symbol} is available for trading (Alpaca)`;
            } else {
                status.tradable = false;
                status.message = `❌ ${this.symbol} is not available for trading (Alpaca)`;
            }
        } catch (error) {
            status.error = 'Alpaca asset status check failed: ' + error.message;
            status.available = false;
        }
        return status;
    }

    // --- Historical Data Initialization ---
    async initializeHistoricalData() {
        console.log('📊 Initializing historical data...');
        
        const idealBars = Math.max(this.baseLength * 2, 100);
        const minimumBars = Math.max(this.baseLength + 10, 30); // Absolute minimum
        let bars = [];
        
        // Try Alpaca first
        console.log('📊 Trying Alpaca for historical data...');
        bars = await this.fetchAlpacaHistorical(this.symbol, this.timeframe, idealBars * 2);
        
        if (bars.length < minimumBars) {
            console.log('⚠️ Alpaca insufficient, trying Yahoo Finance...');
            const yahooBars = await this.fetchYahooHistorical(this.symbol, this.timeframe, idealBars);
            
            if (yahooBars.length > bars.length) {
                bars = yahooBars; // Use Yahoo if it has more data
                console.log('✅ Using Yahoo Finance as primary data source');
            }
        }
        
        if (bars.length === 0) {
            console.error('❌ CRITICAL ERROR: No historical data available from any source!');
            console.error('❌ Cannot calculate moving averages without data.');
            console.error('❌ Possible causes:');
            console.error('   • Internet connection issues');
            console.error('   • Invalid symbol format');
            console.error('   • API service outages');
            console.error('❌ STOPPING PROGRAM - Fix data sources before continuing.');
            process.exit(1);
        }
        
        if (bars.length < minimumBars) {
            console.error(`❌ CRITICAL ERROR: Insufficient data for reliable MA calculation!`);
            console.error(`❌ Need at least ${minimumBars} bars, only got ${bars.length}`);
            console.error(`❌ Ideal amount: ${idealBars} bars`);
            console.error('❌ Possible solutions:');
            console.error('   • Try a different timeframe (5Min, 15Min, 1Hour)');
            console.error('   • Check if the symbol is correct');
            console.error('   • Wait for more market data to accumulate');
            console.error('❌ STOPPING PROGRAM - Need more historical data.');
            process.exit(1);
        }
        
        if (bars.length < idealBars) {
            console.warn(`⚠️ Warning: Using ${bars.length} bars (recommended: ${idealBars})`);
            console.warn('⚠️ Moving averages may be less reliable with limited data');
        }
        
        this.historicalData = bars;
        console.log(`✅ Historical data initialized: ${bars.length} bars loaded`);
        return true;
    }

    // --- Yahoo Finance Historical Data Fallback ---
    async fetchYahooHistorical(symbol, timeframe, limit) {
        try {
            const yahooFinance = require('yahoo-finance2').default;
            const yfSymbol = symbol.replace('/', '-'); // BTC/USD -> BTC-USD
            
            // Yahoo Finance supported intervals (1m not supported for historical)
            let intervalMap = {
                '1Min': '5m',   // Use 5m as closest to 1m
                '5Min': '5m', 
                '15Min': '15m',
                '1Hour': '1h',
                '1Day': '1d'
            };
            
            const interval = intervalMap[timeframe] || '5m';
            
            // Calculate period - use chart() instead of historical()
            let period1, period2;
            
            if (timeframe === '1Min' || timeframe === '5Min') {
                // For short timeframes, get last 7 days
                period2 = new Date();
                period1 = new Date(period2.getTime() - (7 * 24 * 60 * 60 * 1000));
            } else if (timeframe === '15Min') {
                // For 15min, get last 30 days
                period2 = new Date();
                period1 = new Date(period2.getTime() - (30 * 24 * 60 * 60 * 1000));
            } else {
                // For hourly/daily, get more history
                period2 = new Date();
                period1 = new Date(period2.getTime() - (90 * 24 * 60 * 60 * 1000));
            }
            
            console.log(`📊 Fetching Yahoo Finance data: ${yfSymbol} (${interval}) from ${period1.toLocaleDateString()}`);
            
            // Use chart() instead of historical() for better reliability
            const chartData = await yahooFinance.chart(yfSymbol, {
                period1: period1,
                period2: period2,
                interval: interval
            });
            
            if (!chartData || !chartData.quotes || chartData.quotes.length === 0) {
                console.log('⚠️ Yahoo Finance chart returned no data');
                return [];
            }
            
            // Convert Yahoo Finance chart format to our format
            const bars = chartData.quotes
                .filter(quote => quote.close !== null) // Filter out invalid bars
                .map(quote => ({
                    timestamp: new Date(quote.date),
                    open: quote.open,
                    high: quote.high,
                    low: quote.low,
                    close: quote.close,
                    volume: quote.volume || 0
                }));
            
            console.log(`✅ Yahoo Finance data: ${bars.length} bars retrieved`);
            return bars.slice(-limit); // Return only the requested number of bars
            
        } catch (error) {
            console.error('❌ Yahoo Finance historical data failed:', error.message);
            return [];
        }
    }

    // --- Yahoo Finance WebSocket for Real-Time Price Updates ---
    startYahooFinanceWebSocket() {
        const yahooFinance = require('yahoo-finance2').default;
        
        // Convert symbol to Yahoo Finance format (BTC/USD -> BTC-USD)
        const yfSymbol = this.symbol.replace('/', '-');
        
        // Set up periodic price updates using yahoo-finance2
        this.priceUpdateInterval = setInterval(async () => {
            try {
                const quote = await yahooFinance.quote(yfSymbol);
                if (quote && quote.regularMarketPrice) {
                    this.currentPrice = quote.regularMarketPrice;
                    console.log(`📈 [Yahoo Finance] ${yfSymbol}: $${quote.regularMarketPrice}`);
                }
            } catch (error) {
                console.error('❌ Error fetching Yahoo Finance quote:', error.message);
            }
        }, 30000); // Update every 30 seconds for real-time feel

        console.log('📡 Yahoo Finance price updates started for', yfSymbol);
    }

    stopYahooFinanceWebSocket() {
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
            console.log('🛑 Yahoo Finance price updates stopped');
        }
    }

    // --- Get Crypto Data (for regular updates) ---
    async getCryptoData() {
        // Try Alpaca first, then Yahoo Finance as fallback
        let bars = await this.fetchAlpacaHistorical(this.symbol, this.timeframe, 200);
        
        if (bars.length === 0) {
            console.log('⚠️ Alpaca update failed, using Yahoo Finance...');
            bars = await this.fetchYahooHistorical(this.symbol, this.timeframe, 200);
        }
        
        if (bars.length === 0) {
            console.error('❌ CRITICAL: No data from any source during update!');
            console.error('❌ Cannot continue without price data.');
            console.error('❌ Check internet connection and data sources.');
            return this.accumulatedPrices; // Return existing data if available
        }
        
        // Update historical data with fresh bars
        this.historicalData = bars;
        
        // Get the latest price from the most recent bar
        const latestPrice = bars[bars.length - 1].close || bars[bars.length - 1].c;
        this.currentPrice = latestPrice;
        
        // Append new prices to accumulatedPrices
        const newPrices = bars.map(b => b.close || b.c);
        // Only add truly new prices
        for (const price of newPrices) {
            if (this.accumulatedPrices.length === 0 || price !== this.accumulatedPrices[this.accumulatedPrices.length - 1]) {
                this.accumulatedPrices.push(price);
            }
        }
        // Limit to last 1000 prices to avoid memory bloat
        if (this.accumulatedPrices.length > 1000) {
            this.accumulatedPrices = this.accumulatedPrices.slice(-1000);
        }
        
        return this.accumulatedPrices;
    }

    // --- Adaptive MA Crossover + RSI Signal Generation ---
    async checkSignals(prices) {
        if (prices.length < Math.max(this.baseLength, 14) + 2) return;
        // Adaptive: Use volatility to adjust MA lengths
        const recentPrices = prices.slice(-100);
        const volatility = this.calculateVolatility(recentPrices);
        let fastLength = Math.max(5, Math.round((this.baseLength || 20) - (this.volScale || 10) * volatility));
        let slowLength = Math.max(fastLength + 5, Math.round((this.baseLength || 20) + (this.volScale || 10) * volatility));
        // Calculate MAs
        const fastMA = require('technicalindicators').SMA.calculate({ period: fastLength, values: prices });
        const slowMA = require('technicalindicators').EMA.calculate({ period: slowLength, values: prices });
        // Calculate RSI
        const rsi = this.calculateRSI(prices, this.rsiPeriod || 14);
        // Use last two closed candles for crossover
        const idx = prices.length - 2;
        const prevFast = fastMA[fastMA.length - 2];
        const prevSlow = slowMA[slowMA.length - 2];
        const lastFast = fastMA[fastMA.length - 1];
        const lastSlow = slowMA[slowMA.length - 1];
        const lastRSI = rsi[rsi.length - 1];
        let signal = null;
        // Buy if MA crossover and RSI is between 0 and 70
        if (prevFast <= prevSlow && lastFast > lastSlow && lastRSI >= 0 && lastRSI <= 70) {
            signal = 'BUY';
        } else if (prevFast >= prevSlow && lastFast < lastSlow && lastRSI < (this.rsiSellMax || 50) && lastRSI > (this.rsiSellMin || 30)) {
            signal = 'SELL';
        }
        if (signal && signal !== this.lastSignal) {
            this.lastSignal = signal;
            this.printStatus({
                signal,
                price: prices[idx],
                fastMA: lastFast,
                slowMA: lastSlow,
                fastLength,
                slowLength,
                rsi: lastRSI
            });
            if (signal === 'BUY') {
                const currentPosition = await this.getCurrentPosition();
                if (currentPosition.exists && currentPosition.quantity > 0) {
                    console.log('🔄 BUY signal detected but a position is already open. Will not run due to current position.');
                    return;
                }
            }
            require('./tradeUtils').executeTrade(this, signal);
        }
    }

    calculateVolatility(prices) {
        if (prices.length < 2) return 1;
        const returns = prices.slice(1).map((p, i) => Math.log(p / prices[i]));
        const std = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - (returns.reduce((a, b) => a + b, 0) / returns.length), 2), 0) / (returns.length - 1));
        return std * Math.sqrt(365 * 24 * 12); // annualized for 5min bars
    }

    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return [];
        let gains = 0, losses = 0;
        for (let i = 1; i <= period; i++) {
            const diff = prices[i] - prices[i - 1];
            if (diff >= 0) gains += diff; else losses -= diff;
        }
        let avgGain = gains / period;
        let avgLoss = losses / period;
        const rsi = [100 - 100 / (1 + (avgGain / (avgLoss || 1e-10)))];
        for (let i = period + 1; i < prices.length; i++) {
            const diff = prices[i] - prices[i - 1];
            if (diff >= 0) {
                avgGain = (avgGain * (period - 1) + diff) / period;
                avgLoss = (avgLoss * (period - 1)) / period;
            } else {
                avgGain = (avgGain * (period - 1)) / period;
                avgLoss = (avgLoss * (period - 1) - diff) / period;
            }
            rsi.push(100 - 100 / (1 + (avgGain / (avgLoss || 1e-10))));
        }
        return rsi;
    }

    // --- Logging ---
    printStatus(result) {
        const timestamp = new Date().toLocaleString();
        const signalEmoji = result.signal === 'BUY' ? '🔼' : '🔽';
        printBanner('MARKET UPDATE - ' + this.symbol);
        printStatus('Time: ' + timestamp);
        printStatus('Price: $' + result.price.toFixed(2));
        printStatus('Fast MA: $' + (result.fastMA ? result.fastMA.toFixed(2) : 'N/A'));
        printStatus('Slow MA: $' + (result.slowMA ? result.slowMA.toFixed(2) : 'N/A'));
        printStatus('RSI: ' + (result.rsi ? result.rsi.toFixed(2) : 'N/A'));
        if (result.signal) {
            printWarning(`${signalEmoji} ${result.signal} SIGNAL DETECTED ${signalEmoji}`);
            this.sendDesktopNotification(
                `${result.signal} Signal - ${this.symbol}`,
                `Price: $${result.price.toFixed(2)} | Fast MA: $${result.fastMA ? result.fastMA.toFixed(2) : 'N/A'} | Slow MA: $${result.slowMA ? result.slowMA.toFixed(2) : 'N/A'} | RSI: ${result.rsi ? result.rsi.toFixed(2) : 'N/A'}`
            );
        }
    }

    // --- Desktop Notifications ---
    sendDesktopNotification(title, message) {
        try {
            const notifier = require('node-notifier');
            
            notifier.notify({
                title: title,
                message: message,
                icon: undefined, // Use default icon
                sound: true, // Play notification sound
                timeout: 5000, // Auto-dismiss after 5 seconds
                wait: false // Don't wait for user interaction
            }, (err, response) => {
                if (err) {
                    // Fallback to console notification
                    console.log(`🔔 NOTIFICATION: ${title} - ${message}`);
                }
            });
        } catch (error) {
            // Fallback to console notification
            console.log(`🔔 NOTIFICATION: ${title} - ${message}`);
        }
    }

    // --- Smart Model Manager Position Sizing Helper ---
    async getPositionSizeWithLLM(availableCash, price, symbol) {
        const startTime = Date.now();
        
        try {
            // Fetch news for context (but limit to recent/relevant)
            let newsText = '';
            try {
                const newsArticles = await fetchNewsArticles(symbol);
                if (newsArticles && newsArticles.length > 0) {
                    // Only use first article for speed
                    const firstArticle = newsArticles[0];
                    newsText = `${firstArticle.title || ''} ${firstArticle.description || ''}`.substring(0, 200);
                }
            } catch (newsError) {
                console.warn('⚠️ News fetch failed, proceeding without news context');
            }

            // Get position sizing advice from smart model manager
            const sizing = await this.smartModelManager.getPositionSizingAdvice(availableCash, price, symbol, newsText);

            const processingTime = Date.now() - startTime;
            console.log(`⚡ Position sizing completed in ${processingTime}ms`);

            return sizing;
        } catch (err) {
            const processingTime = Date.now() - startTime;
            console.error(`Smart Model Manager position sizing failed (${processingTime}ms):`, err.message);
            // Fallback calculation
            const riskAmount = availableCash * 0.01; // 1% risk
            const qty = Math.floor(riskAmount / price);
            return { qty, takeProfit: 1, stopLoss: 2 };
        }
    }

    // --- Initial Analysis ---
    async displayInitialAnalysis() {
        try {
            const freshBars = await this.fetchAlpacaHistorical(this.symbol, this.timeframe, 1000);
            if (!freshBars || freshBars.length === 0) {
                printWarning('No fresh data available for initial analysis');
                return;
            }
            const prices = freshBars.map(d => d.close || d.c);
            this.accumulatedPrices = prices.slice();
            this.historicalData = freshBars;
            let effectiveLength = this.baseLength;
            if (prices.length < effectiveLength) {
                printWarning(`Not enough data for full MA calculation (need ${effectiveLength}, have ${prices.length}). Using available data.`);
                effectiveLength = prices.length;
            }
            if (!prices.length || prices.some(v => v == null || isNaN(v))) {
                printWarning('No valid price data for MA calculation.');
                return;
            }
            const volatility = this.calculateVolatility(prices.slice(-100));
            let fastLength = Math.max(5, Math.round((this.baseLength || 20) - (this.volScale || 10) * volatility));
            let slowLength = Math.max(fastLength + 5, Math.round((this.baseLength || 20) + (this.volScale || 10) * volatility));
            const fastMA = SMA.calculate({ period: fastLength, values: prices });
            const slowMA = EMA.calculate({ period: slowLength, values: prices });
            const rsi = this.calculateRSI(prices, this.rsiPeriod || 14);
            let currentPrice = prices[prices.length - 1];
            let currentFastMA = fastMA[fastMA.length - 1];
            let currentSlowMA = slowMA[slowMA.length - 1];
            let currentRSI = rsi[rsi.length - 1];
            let rsiStatus = 'Neutral';
            if (currentRSI >= 70) rsiStatus = 'Bullish';
            else if (currentRSI <= 30) rsiStatus = 'Bearish';
            const timestamp = new Date().toLocaleString();
            printTableCard(`${this.symbol} Market Analysis`, [
                ['Data fetched at', timestamp],
                ['Current Price', formatMoney(currentPrice)],
                [`Fast MA (${fastLength})`, formatMoney(currentFastMA)],
                [`Slow MA (${slowLength})`, formatMoney(currentSlowMA)],
                [`RSI (${this.rsiPeriod || 14})`, `${formatNumber(currentRSI)} [${rsiStatus}]`],
                ['Volatility', formatNumber(volatility, 2)]
            ]);
        } catch (error) {
            printError('❌ Error in analysis: ' + error.message);
            this.sendDesktopNotification('Analysis Error', `Error in analysis: ${error.message}`);
        }
    }

    // --- Regular Updates ---
    async displayRegularUpdate() {
        try {
            const prices = await this.getCryptoData();
            let effectiveLength = this.baseLength;
            if (prices.length < effectiveLength) {
                console.error(`❌ CRITICAL ERROR: Not enough data for MA calculation!`);
                console.error(`❌ Need ${effectiveLength} data points, only have ${prices.length}`);
                console.error('❌ Cannot trade without sufficient historical data.');
                console.error('❌ STOPPING PROGRAM - Fix data sources and restart.');
                process.exit(1); // Stop the program completely
            }
            if (!prices.length || prices.some(v => v == null || isNaN(v))) {
                console.error('❌ CRITICAL ERROR: Invalid price data detected!');
                console.error('❌ Cannot calculate moving averages with null/NaN values.');
                console.error('❌ STOPPING PROGRAM - Data integrity issue.');
                process.exit(1); // Stop the program completely
            }

            // Calculate MA crossover information for display
            const recentPrices = prices.slice(-100);
            const volatility = this.calculateVolatility(recentPrices);
            let fastLength = Math.max(5, Math.round((this.baseLength || 20) - (this.volScale || 10) * volatility));
            let slowLength = Math.max(fastLength + 5, Math.round((this.baseLength || 20) + (this.volScale || 10) * volatility));
            
            const fastMA = require('technicalindicators').SMA.calculate({ period: fastLength, values: prices });
            const slowMA = require('technicalindicators').EMA.calculate({ period: slowLength, values: prices });
            const rsi = this.calculateRSI(prices, this.rsiPeriod || 14);
            
            const currentPrice = prices[prices.length - 1];
            const currentFastMA = fastMA[fastMA.length - 1];
            const currentSlowMA = slowMA[slowMA.length - 1];
            const currentRSI = rsi[rsi.length - 1];
            
            // Display MA Crossover Information
            const logger = require('./logger');
            logger.market('📊 MA CROSSOVER STATUS');
            logger.market(`Current Price: $${currentPrice.toFixed(4)}`);
            logger.market(`Fast MA (${fastLength}): $${currentFastMA.toFixed(4)}`);
            logger.market(`Slow MA (${slowLength}): $${currentSlowMA.toFixed(4)}`);
            logger.market(`RSI: ${currentRSI.toFixed(2)}`);
            
            // Determine crossover status and what's needed for buy signal
            const isFastAboveSlow = currentFastMA > currentSlowMA;
            const crossoverPrice = currentSlowMA; // Price that fast MA needs to cross
            const rsiInBuyRange = currentRSI >= 0 && currentRSI <= 70;
            
            if (isFastAboveSlow) {
                logger.market(`✅ Fast MA is ABOVE Slow MA (Bullish)`);
                logger.market(`🎯 For BUY signal: Wait for pullback and re-cross above $${crossoverPrice.toFixed(4)}`);
            } else {
                logger.market(`❌ Fast MA is BELOW Slow MA (Bearish)`);
                logger.market(`🎯 For BUY signal: Fast MA must cross above $${crossoverPrice.toFixed(4)}`);
            }
            
            if (rsiInBuyRange) {
                logger.market(`✅ RSI in buy range (0-70): ${currentRSI.toFixed(2)}`);
            } else {
                logger.market(`❌ RSI outside buy range (0-70): ${currentRSI.toFixed(2)}`);
            }
            
            logger.market(`🔄 Next update in ${this.timeframe === '5Min' ? '5' : '1'} minute(s)`);
            printDivider();

            await this.checkSignals(prices);
            if (this.userSettings.enablePositionLogging) {
                try {
                    const positions = await this.alpaca.getPositions();
                    const pos = positions.find(p => p.symbol === this.symbol.replace('/', ''));
                    if (pos) {
                        const entry = parseFloat(pos.avg_entry_price);
                        const qty = parseFloat(pos.qty);
                        const marketValue = parseFloat(pos.market_value);
                        const unrealized = parseFloat(pos.unrealized_pl);
                        const unrealizedPct = parseFloat(pos.unrealized_plpc) * 100;
                        const pnlEmoji = unrealized >= 0 ? '📈' : '📉';
                        printBanner('POSITION UPDATE - ' + this.symbol);
                        printStatus(`Quantity: ${qty.toFixed(6)} ${this.symbol.split('/')[0]}`);
                        printStatus(`Entry Price: $${entry.toFixed(2)}`);
                        printStatus(`Current Price: $${this.currentPrice ? this.currentPrice.toFixed(2) : 'N/A'}`);
                        printStatus(`Market Value: $${marketValue.toFixed(2)}`);
                        printStatus(`${pnlEmoji} P/L: $${unrealized.toFixed(2)} (${unrealizedPct.toFixed(2)}%)`);
                        printStatus(`Take Profit: ${this.takeProfit}`);
                        printStatus(`Stop Loss: ${this.stopLoss}`);
                        this.hasPrintedNoPosition = false; // Reset flag if position exists
                    } else if (!this.hasPrintedNoPosition) {
                        printWarning(`No open position for ${this.symbol}`);
                        this.hasPrintedNoPosition = true;
                    }
                } catch (e) {
                    printWarning('[POSITION] Could not fetch position info: ' + e.message);
                    this.sendDesktopNotification('Position Error', `Could not fetch position info: ${e.message}`);
                }
            }
        } catch (error) {
            printError('❌ Error in regular update: ' + error.message);
            this.sendDesktopNotification('Update Error', `Error in regular update: ${error.message}`);
        }
    }

    async captureTradeEntry(signal, price, marketData) {
        try {
            // Get AI reasoning for this trade using Fast Local Trading AI
            const aiReasoning = await this.getAITradeReasoning(signal, marketData);

            const tradeData = {
                symbol: this.symbol,
                action: signal,
                price: price,
                quantity: this.calculateQuantity(price),
                rsi: marketData.rsi || 50,
                macd: marketData.macd || 0,
                ma_fast: marketData.ma_fast || price,
                ma_slow: marketData.ma_slow || price,
                volume: marketData.volume || 0, // Use 0 if no real volume data
                volatility: marketData.volatility || 0.02,
                trend: marketData.trend || 'neutral',
                support: marketData.support || price * 0.95,
                resistance: marketData.resistance || price * 1.05,
                ai_reasoning: aiReasoning,
                sentiment: marketData.sentiment || 'neutral',
                news_context: marketData.news || ''
            };

            // Note: Using fast local AI for instant analysis
            console.log(chalk.blue(`🤖 Trade analyzed with Fast Local AI: ${signal} ${this.symbol}`));

        } catch (error) {
            console.log(chalk.yellow(`⚠️ Could not analyze trade with Fast Local AI: ${error.message}`));
        }
    }

    async captureTradeExit(exitPrice, exitReason) {
        // Simplified trade exit tracking without learning system
        console.log(chalk.green(`📊 Trade exit recorded: ${exitReason} at $${exitPrice}`));
    }

    async getAITradeReasoning(signal, marketData) {
        const startTime = Date.now();
        
        try {
            // Use the smart model manager for real-time trading
            const reasoning = await this.smartModelManager.getTradingDecision(marketData, signal);

            const processingTime = Date.now() - startTime;
            
            // Log performance for monitoring
            if (processingTime > 1000) { // Warn if taking more than 1 second
                console.warn(`⚠️ AI reasoning took ${processingTime}ms - unusually slow for efficient AI`);
            } else {
                console.log(`⚡ AI reasoning completed in ${processingTime}ms`);
            }

            return reasoning || `${signal} signal based on technical indicators`;

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.log(chalk.yellow(`⚠️ Could not get AI reasoning (${processingTime}ms): ${error.message}`));
            return `${signal} signal based on technical analysis`;
        }
    }

    async calculateQuantity(price) {
        try {
            // Get real account balance from Alpaca
            const account = await this.alpaca.getAccount();
            const accountBalance = parseFloat(account.cash);
            const riskPercent = 1; // 1% risk
            const riskAmount = accountBalance * (riskPercent / 100);
            return Math.floor(riskAmount / price);
        } catch (error) {
            console.warn('Could not fetch account balance, using conservative default');
            // Fallback to small amount if API fails
            const fallbackBalance = 100; // Very conservative fallback
            const riskPercent = 1;
            const riskAmount = fallbackBalance * (riskPercent / 100);
            return Math.floor(riskAmount / price);
        }
    }

    // --- Enhanced Signal Generation with Learning ---
    async checkSignalsWithLearning(prices) {
        if (prices.length < Math.max(this.baseLength, 14) + 2) return;

        // Original signal logic
        const recentPrices = prices.slice(-100);
        const volatility = this.calculateVolatility(recentPrices);
        let fastLength = Math.max(5, Math.round((this.baseLength || 20) - (this.volScale || 10) * volatility));
        let slowLength = Math.max(fastLength + 5, Math.round((this.baseLength || 20) + (this.volScale || 10) * volatility));
        
        const fastMA = require('technicalindicators').SMA.calculate({ period: fastLength, values: prices });
        const slowMA = require('technicalindicators').EMA.calculate({ period: slowLength, values: prices });
        const rsi = this.calculateRSI(prices, this.rsiPeriod || 14);
        
        const idx = prices.length - 2;
        const prevFast = fastMA[fastMA.length - 2];
        const prevSlow = slowMA[slowMA.length - 2];
        const lastFast = fastMA[fastMA.length - 1];
        const lastSlow = slowMA[slowMA.length - 1];
        const lastRSI = rsi[rsi.length - 1];
        
        let signal = null;
        
        // Buy if MA crossover and RSI is between 0 and 70
        if (prevFast <= prevSlow && lastFast > lastSlow && lastRSI >= 0 && lastRSI <= 70) {
            signal = 'BUY';
        } else if (prevFast >= prevSlow && lastFast < lastSlow && lastRSI < (this.rsiSellMax || 50) && lastRSI > (this.rsiSellMin || 30)) {
            signal = 'SELL';
        }

        if (signal && signal !== this.lastSignal) {
            this.lastSignal = signal;
            
            // Prepare market data for learning
            const marketData = {
                price: prices[idx],
                rsi: lastRSI,
                ma_fast: lastFast,
                ma_slow: lastSlow,
                volatility: volatility,
                trend: lastFast > lastSlow ? 'up' : 'down',
                volume: this.historicalData && this.historicalData.length > 0 ? 
                    this.historicalData[this.historicalData.length - 1].volume || 0 : 0, // Use real volume from latest bar
                support: Math.min(...prices.slice(-20)),
                resistance: Math.max(...prices.slice(-20))
            };

            this.printStatus({
                signal,
                price: prices[idx],
                fastMA: lastFast,
                slowMA: lastSlow,
                fastLength,
                slowLength,
                rsi: lastRSI
            });

            // Capture trade entry for learning
            await this.captureTradeEntry(signal, prices[idx], marketData);

            if (signal === 'BUY') {
                const currentPosition = await this.getCurrentPosition();
                if (currentPosition.exists && currentPosition.quantity > 0) {
                    console.log('🔄 BUY signal detected but a position is already open. Will not run due to current position.');
                    return;
                }
            }

            require('./tradeUtils').executeTrade(this, signal);
        }
    }

    // --- Helper: Check Smart Model Manager ---
    async checkSmartModelManager() {
        try {
            // Initialize smart model manager if not already done
            if (!this.smartModelManager.isInitialized) {
                await this.smartModelManager.initialize();
            }
            return this.smartModelManager.isInitialized;
        } catch (err) {
            return false;
        }
    }

    // --- Helper: Check Polygon News API ---
    async checkPolygonNewsAPI() {
        if (!this.polygonKey) return false;
        try {
            const url = `https://api.polygon.io/v2/reference/news?apiKey=${this.polygonKey}&limit=1`;
            const response = await fetch(url);
            const data = await response.json();
            return data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0;
        } catch (err) {
            return false;
        }
    }

    // --- Get Current Position Info ---
    async getCurrentPosition() {
        try {
            const positions = await this.alpaca.getPositions();
            const pos = positions.find(p => p.symbol === this.symbol.replace('/', ''));
            if (pos) {
                const entry = parseFloat(pos.avg_entry_price);
                const qty = parseFloat(pos.qty);
                const marketValue = parseFloat(pos.market_value);
                const unrealized = parseFloat(pos.unrealized_pl);
                const unrealizedPct = parseFloat(pos.unrealized_plpc) * 100;
                return {
                    symbol: this.symbol,
                    quantity: qty,
                    entryPrice: entry,
                    marketValue: marketValue,
                    unrealizedPL: unrealized,
                    unrealizedPLPercent: unrealizedPct,
                    exists: true
                };
            }
            return { exists: false };
        } catch (e) {
            console.warn('⚠️ [POSITION] Could not fetch position info:', e.message);
            return { exists: false, error: e.message };
        }
    }

    // --- Display Position Info ---
    displayPositionInfo(position) {
        if (!position || !position.exists) {
            if (!this.hasPrintedNoPosition) {
                printWarning(`No open position for ${this.symbol}`);
                this.hasPrintedNoPosition = true;
            }
            return;
        }
        this.hasPrintedNoPosition = false; // Reset flag if position exists
        const pnlEmoji = position.unrealizedPL >= 0 ? '📈' : '📉';
        printBanner('CURRENT POSITION - ' + this.symbol);
        printStatus(`Quantity: ${position.quantity.toFixed(6)} ${this.symbol.split('/')[0]}`);
        printStatus(`Entry Price: $${position.entryPrice.toFixed(2)}`);
        printStatus(`Market Value: $${position.marketValue.toFixed(2)}`);
        printStatus(`${pnlEmoji} P/L: $${position.unrealizedPL.toFixed(2)} (${position.unrealizedPLPercent.toFixed(2)}%)`);
        if (this.takeProfit !== 'auto' && this.stopLoss !== 'auto') {
            const tpPrice = position.entryPrice * (1 + parseFloat(this.takeProfit) / 100);
            const slPrice = position.entryPrice * (1 - parseFloat(this.stopLoss) / 100);
            printStatus(`Take Profit: $${tpPrice.toFixed(2)} (${this.takeProfit}%)`);
            printStatus(`Stop Loss: $${slPrice.toFixed(2)} (${this.stopLoss}%)`);
        } else {
            printStatus(`Take Profit: ${this.takeProfit}`);
            printStatus(`Stop Loss: ${this.stopLoss}`);
        }
    }

    // --- Save TP/SL Values ---
    saveTPSLValues(symbol, entryPrice, takeProfitPercent, stopLossPercent) {
        // Do nothing (disable logging of TP/SL)
    }

    async loadTPSLValues(symbol) {
        return null; // Always use Fast Local Trading AI for fresh calculations
    }

    // --- Clear TP/SL Values ---
    clearTPSLValues(symbol) {
        // Do nothing
    }

    // --- Start TP/SL Monitoring for Existing Position ---
    async startExistingPositionMonitoring() {
        const position = await this.getCurrentPosition();
        if (!position.exists) return;
        this.position = position;
        let takeProfitPercent = this.takeProfit;
        let stopLossPercent = this.stopLoss;
        const savedTPSL = this.loadTPSLValues(this.symbol);
        if (savedTPSL) {
            const priceDiff = Math.abs(savedTPSL.entryPrice - position.entryPrice) / position.entryPrice;
            if (priceDiff < 0.01) {
                takeProfitPercent = savedTPSL.takeProfit;
                stopLossPercent = savedTPSL.stopLoss;
                printStatus(`Loaded saved TP/SL values: TP ${takeProfitPercent}%, SL ${stopLossPercent}%`);
            } else {
                printWarning(`Saved TP/SL values don't match current position entry price. Using defaults.`);
                this.clearTPSLValues(this.symbol);
            }
        }
        if (takeProfitPercent === 'auto') takeProfitPercent = 1;
        if (stopLossPercent === 'auto') stopLossPercent = 1;
        takeProfitPercent = parseFloat(takeProfitPercent);
        stopLossPercent = parseFloat(stopLossPercent);
        printBanner('TP/SL MONITORING STARTED');
        printStatus(`Entry: $${position.entryPrice.toFixed(2)}`);
        printStatus(`Take Profit: ${takeProfitPercent}%`);
        printStatus(`Stop Loss: ${stopLossPercent}%`);
        const { monitorTakeProfitStopLoss } = require('./tradeUtils');
        monitorTakeProfitStopLoss(this, position.entryPrice, position.quantity, takeProfitPercent, stopLossPercent);
    }

    // --- Monitoring Control ---
    async startMonitoring() {
        if (process.stdout.isTTY) {
            process.stdout.write('\x1Bc');
        }
        // --- Modern Card UI ---
        // Header Card
        printCard(
            `${this.symbol} Monitor`,
            [
                `Symbol: ${this.symbol}    Timeframe: ${this.timeframe}`,
                `Crossunder: ${statusDot(this.userSettings.enableCrossunderSignals)} ${boolStatus(this.userSettings.enableCrossunderSignals)}`,
                `Metrics: ${statusDot(this.userSettings.enablePerformanceMetrics)} ${boolStatus(this.userSettings.enablePerformanceMetrics)}`,
                `Logging: ${statusDot(this.userSettings.enablePositionLogging)} ${boolStatus(this.userSettings.enablePositionLogging)}`,
                `Model Switching: ${statusDot(!this.userSettings.enableModelLocking)} ${boolStatus(!this.userSettings.enableModelLocking)}`,
                this.hasPrintedNoPosition ? 'No open position' : ''
            ]
        );
        // Account Info Card (after Alpaca init)
        const existingPosition = await this.getCurrentPosition();
        this.displayPositionInfo(existingPosition);
        if (existingPosition.exists) {
            await this.startExistingPositionMonitoring();
        }
        this.isMonitoring = true;
        const account = await this.getAccountInfo();
        if (account) {
            printTableCard('Alpaca Paper Trading', [
                ['Buying Power', formatMoney(account.buying_power)],
                ['Portfolio Value', formatMoney(account.portfolio_value)],
                ['Cash', formatMoney(account.cash)]
            ]);
        }
        const alpacaInitialized = !!account;
        const polygonInitialized = !!this.polygonKey;
        const finnhubInitialized = !!this.finnhubKey;
        const [smartModelConnected, polygonNewsConnected, geminiConnected] = await Promise.all([
            this.checkSmartModelManager()
        ]);
        printTableCard('System Status', [
            ['Alpaca', statusDot(alpacaInitialized) + ' ' + (alpacaInitialized ? 'Connected' : 'Not Connected')],
            ['Polygon', statusDot(polygonInitialized) + ' ' + (polygonInitialized ? 'Connected' : 'Not Connected')],
            ['Yahoo Finance', statusDot(finnhubInitialized) + ' ' + (finnhubInitialized ? 'Connected' : 'Not Connected')],
            ['Smart Model Manager', statusDot(smartModelConnected) + ' ' + (smartModelConnected ? 'Ready' : 'Not Ready')],
            ['Google News', statusDot(true) + ' Connected']
        ]);
        // Market Status Card
        const { polygonStatus, alpacaStatus, canMonitor } = await this.checkMarketStatus();
        printTableCard('Market Status', [
            ['Market', polygonStatus.open ? chalk.green('OPEN') : chalk.red('CLOSED')],
            [this.symbol, alpacaStatus.tradable ? chalk.green('Tradable') : chalk.red('Not Tradable')]
        ]);
        if (polygonStatus.error) {
            printWarning(`⚠️ ${polygonStatus.error}`);
            this.sendDesktopNotification('Market Error', polygonStatus.error);
        }
        if (alpacaStatus.error) {
            printWarning(`⚠️ ${alpacaStatus.error}`);
            this.sendDesktopNotification('Market Error', alpacaStatus.error);
        }
        if (!canMonitor) {
            printError('Cannot start monitoring - market conditions not met');
            this.sendDesktopNotification('Monitor Error', 'Cannot start monitoring - market conditions not met');
            this.stopMonitoring();
            process.exit(1);
            return;
        }
        const dataInitialized = await this.initializeHistoricalData();
        if (!dataInitialized) {
            printError('Cannot start monitoring - historical data unavailable');
            this.sendDesktopNotification('Data Error', 'Cannot start monitoring - historical data unavailable');
            this.stopMonitoring();
            process.exit(1);
            return;
        }
        await this.displayInitialAnalysis();

        // Auto-select best efficient model using judge with current context
        try {
            const prices = this.historicalData.map(d => d.close || d.c).filter(x => !isNaN(x));
            const rsiArr = this.calculateRSI(prices, this.rsiPeriod || 14);
            const fastLength = Math.max(5, Math.round((this.baseLength || 20)));
            const slowLength = Math.max(fastLength + 5, Math.round((this.baseLength || 20) + 10));
            const fastMA = require('technicalindicators').SMA.calculate({ period: fastLength, values: prices });
            const slowMA = require('technicalindicators').EMA.calculate({ period: slowLength, values: prices });
            const marketData = {
                signal: 'BUY',
                price: prices[prices.length - 1],
                rsi: rsiArr[rsiArr.length - 1],
                ma_fast: fastMA[fastMA.length - 1],
                ma_slow: slowMA[slowMA.length - 1],
                volatility: this.calculateVolatility(prices.slice(-100)),
                trend: fastMA[fastMA.length - 1] > slowMA[slowMA.length - 1] ? 'up' : 'down'
            };
            const newsText = '';
            await this.smartModelManager.autoSelectBestModel({ symbol: this.symbol, timeframe: this.timeframe, marketData, newsText });
        } catch (e) {
            console.warn('⚠️ Auto-select best model failed:', e.message);
        }
        if (this.finnhubKey) {
            this.startYahooFinanceWebSocket();
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        printDivider();
        printStatus(chalk.gray('Waiting for data to stabilize and accumulate sufficient price points...'));
        
        // Wait for data to accumulate and stabilize
        let stabilizationAttempts = 0;
        const maxStabilizationAttempts = 10;
        
        while (stabilizationAttempts < maxStabilizationAttempts) {
            const prices = await this.getCryptoData();
            const minRequiredPrices = Math.max(this.baseLength * 3, 150); // Need more data for reliable signals
            
            if (prices.length >= minRequiredPrices) {
                console.log(`✅ Data stabilized: ${prices.length} price points available`);
                break;
            } else {
                console.log(`⏳ Data stabilizing: ${prices.length}/${minRequiredPrices} price points (${stabilizationAttempts + 1}/${maxStabilizationAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
                stabilizationAttempts++;
            }
        }
        
        if (stabilizationAttempts >= maxStabilizationAttempts) {
            console.warn('⚠️ Warning: Data stabilization timeout, proceeding with available data');
        }
        let updateInterval;
        switch(this.timeframe) {
            case '1Min':
                updateInterval = 60 * 1000;
                break;
            case '5Min':
                updateInterval = 5 * 60 * 1000;
                break;
            case '15Min':
                updateInterval = 15 * 60 * 1000;
                break;
            case '1Hour':
                updateInterval = 60 * 60 * 1000;
                break;
            case '1Day':
                updateInterval = 24 * 60 * 60 * 1000;
                break;
            default:
                updateInterval = 5 * 60 * 1000;
        }
        await this.displayRegularUpdate();
        this.monitorInterval = setInterval(async () => {
            if (this.isMonitoring) {
                await this.displayRegularUpdate();
            }
        }, updateInterval);
        // --- Heartbeat for 1Min, 5Min, 15Min timeframes ---
        if (["1Min", "5Min", "15Min"].includes(this.timeframe)) {
            this.heartbeatInterval = setInterval(() => {
                const now = new Date().toLocaleString();
                printStatus(`💓 [HEARTBEAT] Still running for ${this.symbol} at ${now}`);
            }, 10 * 60 * 1000);
        }
        // Load and print last 5 sold positions for this symbol
        const soldPositions = loadSoldPositions(this.symbol);
        if (soldPositions.length > 0) {
            printBanner(`Last 5 sold positions for ${this.symbol}`);
            soldPositions.slice(-5).forEach(pos => {
                printStatus(`Date: ${pos.exit_date}, Entry: $${pos.entry_price}, Exit: $${pos.exit_price}, PnL: $${pos.pnl}, Reason: ${pos.reason}`);
            });
        } else {
            printWarning(`No sold positions found for ${this.symbol}.`);
        }
        printBanner(`MONITORING ACTIVE - ${this.symbol}`);
        this.sendDesktopNotification('Monitor Started', `Successfully started monitoring ${this.symbol}`);
        this.listenForManualSell();
    }

    async initializeAlpaca() {
        try {
            const account = await this.alpaca.getAccount();
            console.log('\n' + '-'.repeat(50));
            console.log(`ALPACA PAPER TRADING ACCOUNT`);
            console.log('-'.repeat(50));
            console.log(`Buying Power: $${account.buying_power}`);
            console.log(`Portfolio Value: $${account.portfolio_value}`);
            console.log(`Cash: $${account.cash}`);
            console.log('-'.repeat(50));
            return true;
        } catch (error) {
            console.error('❌ Error initializing Alpaca:', error.message);
            this.sendDesktopNotification('Alpaca Error', `Error initializing Alpaca: ${error.message}`);
            return false;
        }
    }

    async getAccountInfo() {
        try {
            const account = await this.alpaca.getAccount();
            return account;
        } catch (error) {
            printError('❌ Error initializing Alpaca: ' + error.message);
            this.sendDesktopNotification('Alpaca Error', `Error initializing Alpaca: ${error.message}`);
            return null;
        }
    }

    stopMonitoring() {
        this.isMonitoring = false;
        this.stopYahooFinanceWebSocket();
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        console.log(`\n🛑 Stopped monitoring ${this.symbol}`);
    }

    toggleCrossunderSignals() {
        this.userSettings.enableCrossunderSignals = !this.userSettings.enableCrossunderSignals;
        const status = this.userSettings.enableCrossunderSignals ? 'ENABLED' : 'DISABLED';
        console.log(`\n🔄 Crossunder signals ${status.toLowerCase()}`);
        this.sendDesktopNotification('Setting Changed', `Crossunder signals ${status.toLowerCase()}`);
        
        // Save to enhanced memory system
        this.memorySystem.saveSetting('enableCrossunderSignals', this.userSettings.enableCrossunderSignals);
    }

    async autoConfigure() {
        const params = await autoOptimizeParams(this.symbol, this.timeframe);
        this.baseLength = params.baseLength;
        this.evalPeriod = params.evalPeriod;
        this.volScale = params.volScale;
        this.rsiPeriod = params.rsiPeriod;
        this.rsiBuyMin = params.rsiBuyMin;
        this.rsiBuyMax = params.rsiBuyMax;
        this.rsiSellMin = params.rsiSellMin;
        this.rsiSellMax = params.rsiSellMax;
        console.log('Auto-configured best parameters:', params);
    }

    listenForManualSell() {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.on('line', async (input) => {
            if (input.trim().toLowerCase() === 'sell') {
                console.log(chalk.bold.bgRed.white('Manual sell command received. Attempting to close position...'));
                const pos = await this.getCurrentPosition();
                if (pos.exists && pos.quantity > 0) {
                    try {
                        await this.alpaca.createOrder({
                            symbol: this.symbol.replace('/', ''),
                            qty: pos.quantity,
                            side: 'sell',
                            type: 'market',
                            time_in_force: 'gtc'
                        });
                        await new Promise(res => setTimeout(res, 2000));
                        const exitPrice = this.currentPrice || pos.entryPrice;
                        const pnl = (exitPrice - pos.entryPrice) * pos.quantity;
                        const pnlPct = ((exitPrice - pos.entryPrice) / pos.entryPrice) * 100;
                        console.log(chalk.greenBright(`Manual sell order placed.`));
                        console.log(chalk.bold.bgMagenta.white(`Manual Sell P/L: $${pnl.toFixed(2)} (${pnlPct.toFixed(2)}%) | Entry: $${pos.entryPrice} | Exit: $${exitPrice}`));
                        this.sendDesktopNotification('Manual Sell', `Manual sell order placed for ${this.symbol}. P/L: $${pnl.toFixed(2)} (${pnlPct.toFixed(2)}%)`);
                    } catch (e) {
                        console.log(chalk.redBright('Manual sell failed:'), e.message);
                        this.sendDesktopNotification('Manual Sell Error', `Manual sell failed: ${e.message}`);
                    }
                } else {
                    console.log(chalk.yellowBright('No open position to sell.'));
                }
            }
        });
    }

    async checkGeminiAPI() {
        if (!GEMINI_API_KEY) return false;
        try {
            const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
            const params = new URLSearchParams({ key: GEMINI_API_KEY });
            const data = { contents: [{ parts: [{ text: 'Hello' }] }] };
            
            const response = await fetch(`${url}?${params.toString()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                timeout: 5000
            });
            
            return response.ok;
        } catch (e) {
            return false;
        }
    }
}

// --- Helper: Run optimizer and cache best params ---
async function autoOptimizeParams(symbol, timeframe, limit = 1000) {
    const cacheFile = path.join(__dirname, `../best_strategy_params_${symbol.replace('/', '')}_${timeframe}.json`);
    // Use cache if exists and is recent (e.g., <24h old)
    if (fs.existsSync(cacheFile)) {
        const stats = fs.statSync(cacheFile);
        if (Date.now() - stats.mtimeMs < 24*60*60*1000) {
            return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        }
    }
    // Fetch data and optimize
    const BitFlow = module.exports;
    const instance = new BitFlow(symbol, 20, 20, timeframe);
    const bars = await instance.fetchAlpacaHistorical(symbol, timeframe, limit);
    const prices = bars.map(b => b.close || b.c).filter(x => !isNaN(x));
    // Inline optimizer (random search)
    let best = null, bestParams = null;
    for (let i = 0; i < 20; i++) {
        const params = {
            baseLength: Math.floor(Math.random()*20)+10,
            evalPeriod: Math.floor(Math.random()*10)+10,
            volScale: Math.random()*10+5,
            rsiPeriod: 14,
            rsiBuyMin: 50+Math.random()*10,
            rsiBuyMax: 60+Math.random()*10,
            rsiSellMin: 30+Math.random()*10,
            rsiSellMax: 40+Math.random()*10
        };
        let position = null, entry = 0, trades = [];
        for (let j = 0; j < prices.length; j++) {
            const slice = prices.slice(0, j+1);
            const volatility = instance.calculateVolatility(slice.slice(-100));
            let fastLength = Math.max(5, Math.round(params.baseLength - volatility * params.volScale));
            let slowLength = Math.max(fastLength + 5, Math.round(params.baseLength + volatility * params.volScale));
            const fastMA = SMA.calculate({ period: fastLength, values: slice });
            const slowMA = EMA.calculate({ period: slowLength, values: slice });
            const rsi = instance.calculateRSI(slice, params.rsiPeriod);
            if (fastMA.length < 2 || slowMA.length < 2 || rsi.length < 1) continue;
            const prevFast = fastMA[fastMA.length-2], prevSlow = slowMA[slowMA.length-2];
            const lastFast = fastMA[fastMA.length-1], lastSlow = slowMA[slowMA.length-1];
            const lastRSI = rsi[rsi.length-1];
            if (!position && prevFast <= prevSlow && lastFast > lastSlow && lastRSI > params.rsiBuyMin && lastRSI < params.rsiBuyMax) {
                position = { entry: slice[slice.length-2] };
                entry = slice[slice.length-2];
            }
            if (position && ((prevFast >= prevSlow && lastFast < lastSlow && lastRSI < params.rsiSellMax && lastRSI > params.rsiSellMin) || j === prices.length-1)) {
                const exit = slice[slice.length-2];
                trades.push({ entry, exit, pnl: exit - entry });
                position = null;
            }
        }
        // Performance
        let pnl = 0, wins = 0, losses = 0, maxDrawdown = 0, peak = 0, equity = 0;
        let equityCurve = [];
        for (const t of trades) {
            pnl += t.pnl;
            if (t.pnl > 0) wins++; else losses++;
            equity += t.pnl;
            peak = Math.max(peak, equity);
            maxDrawdown = Math.max(maxDrawdown, peak - equity);
            equityCurve.push(equity);
        }
        const returns = equityCurve.map((v, i, arr) => i === 0 ? 0 : (v - arr[i-1]) / arr[i-1]).filter(x => !isNaN(x));
        const mean = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
        const std = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length || 1));
        const sharpe = std ? (mean - 0.0005) / std * Math.sqrt(252) : 0;
        if (!best || sharpe > best.sharpe) {
            best = { pnl, winRate: wins/(wins+losses||1), maxDrawdown, sharpe };
            bestParams = params;
        }
    }
    fs.writeFileSync(cacheFile, JSON.stringify(bestParams, null, 2));
    return bestParams;
}

function loadSoldPositions(symbol) {
    const csvPath = path.join(__dirname, '../positions_sold.csv');
    if (!fs.existsSync(csvPath)) return [];
    const data = fs.readFileSync(csvPath, 'utf8').split('\n');
    const headers = data[0].split(',');
    const rows = data.slice(1).filter(Boolean).map(line => {
        const vals = line.split(',');
        const obj = {};
        headers.forEach((h, i) => obj[h.trim()] = vals[i]);
        return obj;
    });
    return rows.filter(r => r.symbol === symbol);
}

module.exports = BitFlow;