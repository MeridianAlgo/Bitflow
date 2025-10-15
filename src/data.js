/**
 * Data Management Module for BitFlow Trading Bot
 * Handles historical and real-time market data using Alpaca WebSocket
 */

const axios = require('axios');
const WebSocket = require('ws');

class DataManager {
    constructor(timeframe, symbol) {
        this.timeframe = timeframe;
        this.symbol = symbol;
        // NO CACHING - Always fetch fresh data
        this.lastUpdate = null;
        
        // Alpaca WebSocket configuration
        this.alpacaWs = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        
        // API credentials from environment
        this.apiKey = process.env.ALPACA_API_KEY_ID;
        this.secretKey = process.env.ALPACA_SECRET_KEY;
        this.isPaper = process.env.ALPACA_PAPER === 'true';
        
        // WebSocket URLs - Use trading WebSocket for account updates
        this.tradingWsUrl = this.isPaper 
            ? 'wss://paper-api.alpaca.markets/stream'
            : 'wss://api.alpaca.markets/stream';
            
        // Data WebSocket for market data
        this.dataWsUrl = this.isPaper 
            ? 'wss://stream.data.alpaca.markets/v2/iex'
            : 'wss://stream.data.alpaca.markets/v2/sip';
            
        this.cryptoDataWsUrl = 'wss://stream.data.alpaca.markets/v1beta3/crypto/us';
        
        // Track authentication state
        this.isAuthenticated = false;
        
        // Price tracking
        this.currentPrices = new Map();
        this.priceCallbacks = new Map();
    }

    /**
     * Initialize Alpaca WebSocket connection (OPTIONAL - not required for trading)
     */
    async initializeWebSocket() {
        try {
            if (this.isConnected) {
                console.log('📡 WebSocket already connected');
                return;
            }

            console.log('🔌 Connecting to Alpaca WebSocket (optional)...');
            
            // Determine if symbol is crypto or stock
            const isCrypto = this.symbol.includes('/');
            const wsUrl = isCrypto ? this.cryptoDataWsUrl : this.dataWsUrl;
            
            this.alpacaWs = new WebSocket(wsUrl);
            
            this.alpacaWs.on('open', () => {
                console.log('✅ WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // Authenticate
                this.authenticate();
            });
            
            this.alpacaWs.on('message', (data) => {
                this.handleWebSocketMessage(data);
            });
            
            this.alpacaWs.on('close', () => {
                console.log('⚠️ WebSocket disconnected - using REST API for prices');
                this.isConnected = false;
            });
            
            this.alpacaWs.on('error', (error) => {
                console.log('⚠️ WebSocket error - using REST API for prices');
                this.isConnected = false;
            });
            
        } catch (error) {
            console.log('⚠️ WebSocket unavailable - using REST API for prices');
        }
    }

    /**
     * Authenticate with Alpaca WebSocket
     */
    authenticate() {
        const authMessage = {
            action: 'auth',
            key: this.apiKey,
            secret: this.secretKey
        };
        
        console.log('🔐 Authenticating with Alpaca...');
        this.alpacaWs.send(JSON.stringify(authMessage));
    }

    /**
     * Subscribe to real-time price updates
     */
    subscribeToSymbol(symbol) {
        if (!this.isConnected) {
            console.log('⚠️ WebSocket not connected, cannot subscribe');
            return;
        }

        const isCrypto = symbol.includes('/');
        
        if (isCrypto) {
            // Crypto WebSocket expects BTC/USD format (with slash)
            const subscribeMessage = {
                action: 'subscribe',
                trades: [symbol]
            };
            
            console.log(`📡 Subscribing to ${symbol} real-time data...`);
            this.alpacaWs.send(JSON.stringify(subscribeMessage));
        } else {
            // Stock subscription
            const subscribeMessage = {
                action: 'subscribe',
                trades: [symbol],
                quotes: [symbol]
            };
            
            console.log(`📡 Subscribing to ${symbol} real-time data...`);
            this.alpacaWs.send(JSON.stringify(subscribeMessage));
        }
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleWebSocketMessage(data) {
        try {
            const messages = JSON.parse(data.toString());
            
            if (!Array.isArray(messages)) {
                return;
            }
            
            messages.forEach(message => {
                switch (message.T) {
                    case 'success':
                        if (!this.isAuthenticated) {
                            console.log('✅ WebSocket authenticated successfully');
                            this.isAuthenticated = true;
                            // Subscribe to our symbol after authentication
                            this.subscribeToSymbol(this.symbol);
                        }
                        break;
                        
                    case 'error':
                        console.error('❌ WebSocket error:', message.msg);
                        break;
                        
                    case 't': // Trade update
                        this.handleTradeUpdate(message);
                        break;
                        
                    case 'q': // Quote update
                        this.handleQuoteUpdate(message);
                        break;
                        
                    default:
                        // Ignore other message types
                        break;
                }
            });
            
        } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error.message);
        }
    }

    /**
     * Handle trade updates from WebSocket
     */
    handleTradeUpdate(trade) {
        const symbol = this.formatSymbolFromAlpaca(trade.S);
        const price = trade.p;
        const timestamp = new Date(trade.t);
        
        // Update current price
        this.currentPrices.set(symbol, {
            price,
            timestamp,
            volume: trade.s || 0,
            source: 'alpaca_ws'
        });
        
        // Call any registered callbacks
        const callback = this.priceCallbacks.get(symbol);
        if (callback) {
            callback({
                symbol,
                price,
                timestamp,
                volume: trade.s || 0,
                type: 'trade'
            });
        }
        
        console.log(`📈 ${symbol}: $${price.toFixed(4)} (Trade)`);
    }

    /**
     * Handle quote updates from WebSocket
     */
    handleQuoteUpdate(quote) {
        const symbol = this.formatSymbolFromAlpaca(quote.S);
        const bidPrice = quote.bp;
        const askPrice = quote.ap;
        const midPrice = (bidPrice + askPrice) / 2;
        const timestamp = new Date(quote.t);
        
        // Update current price with mid-price
        this.currentPrices.set(symbol, {
            price: midPrice,
            bid: bidPrice,
            ask: askPrice,
            timestamp,
            source: 'alpaca_ws'
        });
        
        console.log(`📊 ${symbol}: Bid $${bidPrice.toFixed(4)} Ask $${askPrice.toFixed(4)}`);
    }

    /**
     * Format symbol from Alpaca format to our format
     */
    formatSymbolFromAlpaca(alpacaSymbol) {
        // Alpaca already uses BTC/USD format, so just return as-is
        return alpacaSymbol;
    }

    /**
     * Schedule WebSocket reconnection
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            console.log('💡 Tip: Close all other BitFlow instances to avoid connection limits');
            return;
        }
        
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
        
        setTimeout(() => {
            this.reconnectAttempts++;
            this.initializeWebSocket();
        }, delay);
    }

    /**
     * Get real-time price (WebSocket or REST API) - NO CACHING
     */
    async getRealTimePrice(symbol) {
        // ALWAYS fetch FRESH price from REST API (NO CACHING)
        const restPrice = await this.getAlpacaRestPrice(symbol);
        if (restPrice) {
            return restPrice;
        }
        
        throw new Error(`Failed to get real-time price for ${symbol}`);
    }

    /**
     * Get price from Alpaca REST API (using quotes for fresher data)
     */
    async getAlpacaRestPrice(symbol) {
        const isCrypto = symbol.includes('/');
        
        if (isCrypto) {
            // Crypto API - Use quotes instead of trades for fresher data
            const url = `https://data.alpaca.markets/v1beta3/crypto/us/latest/quotes?symbols=${symbol}`;
            
            const response = await axios.get(url, {
                headers: {
                    'APCA-API-KEY-ID': this.apiKey,
                    'APCA-API-SECRET-KEY': this.secretKey
                }
            });
            
            if (response.data.quotes && response.data.quotes[symbol]) {
                const quote = response.data.quotes[symbol];
                // Use mid-price (average of bid and ask)
                const midPrice = (quote.bp + quote.ap) / 2;
                return midPrice;
            }
        } else {
            // Stock API - Use quotes instead of trades
            const url = `https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest`;
            
            const response = await axios.get(url, {
                headers: {
                    'APCA-API-KEY-ID': this.apiKey,
                    'APCA-API-SECRET-KEY': this.secretKey
                }
            });
            
            if (response.data.quote) {
                const quote = response.data.quote;
                // Use mid-price (average of bid and ask)
                const midPrice = (quote.bp + quote.ap) / 2;
                return midPrice;
            }
        }
        
        throw new Error(`Failed to get price for ${symbol}`);
    }

    /**
     * Get historical data for backtesting
     */
    async getHistoricalData(symbol, period = '1000', interval = '5m') {
        // Silent fetch - progress bar shown in BitFlow.js
        const alpacaData = await this.getAlpacaHistoricalData(symbol, period, interval);
        return this.validateAndCleanData(alpacaData);
    }

    /**
     * Get historical data from Alpaca
     */
    async getAlpacaHistoricalData(symbol, period, interval) {
        const isCrypto = symbol.includes('/');
        
        if (isCrypto) {
            // Crypto API expects BTC/USD format (with slash)
            const { startDate, endDate } = this.calculateDateRange(period, interval);
            const startISO = new Date(startDate * 1000).toISOString();
            const endISO = new Date(endDate * 1000).toISOString();
            
            // Use proper crypto bars endpoint with correct timeframe format
            const timeframe = this.convertIntervalToAlpacaTimeframe(interval);
            // Alpaca limit is 10000 max, use period as limit
            const limit = Math.min(parseInt(period) || 1000, 10000);
            const url = `https://data.alpaca.markets/v1beta3/crypto/us/bars?symbols=${symbol}&timeframe=${timeframe}&start=${startISO}&end=${endISO}&limit=${limit}`;
            
            const response = await axios.get(url, {
                headers: {
                    'APCA-API-KEY-ID': this.apiKey,
                    'APCA-API-SECRET-KEY': this.secretKey
                }
            });
            
            if (response.data.bars && response.data.bars[symbol]) {
                return response.data.bars[symbol].map(bar => ({
                    timestamp: new Date(bar.t),
                    open: bar.o,
                    high: bar.h,
                    low: bar.l,
                    close: bar.c,
                    volume: bar.v || 0
                }));
            }
        } else {
            // Stock API
            const { startDate, endDate } = this.calculateDateRange(period, interval);
            const startISO = new Date(startDate * 1000).toISOString();
            const endISO = new Date(endDate * 1000).toISOString();
            
            const timeframe = this.convertIntervalToAlpacaTimeframe(interval);
            // Alpaca limit is 10000 max, use period as limit
            const limit = Math.min(parseInt(period) || 1000, 10000);
            const url = `https://data.alpaca.markets/v2/stocks/${symbol}/bars?timeframe=${timeframe}&start=${startISO}&end=${endISO}&limit=${limit}`;
            
            const response = await axios.get(url, {
                headers: {
                    'APCA-API-KEY-ID': this.apiKey,
                    'APCA-API-SECRET-KEY': this.secretKey
                }
            });
            
            if (response.data.bars) {
                return response.data.bars.map(bar => ({
                    timestamp: new Date(bar.t),
                    open: bar.o,
                    high: bar.h,
                    low: bar.l,
                    close: bar.c,
                    volume: bar.v || 0
                }));
            }
        }
        
        throw new Error(`Failed to fetch historical data for ${symbol}`);
    }

    /**
     * Convert interval to Alpaca timeframe format
     */
    convertIntervalToAlpacaTimeframe(interval) {
        const intervalMap = {
            '1m': '1Min',
            '5m': '5Min',
            '15m': '15Min',
            '1h': '1Hour',
            '1d': '1Day'
        };
        
        return intervalMap[interval] || '5Min';
    }

    /**
     * Calculate date range for historical data
     */
    calculateDateRange(period, interval) {
        const now = new Date();
        const periodNum = parseInt(period);
        
        // Calculate milliseconds per interval
        const intervalMs = {
            '1m': 60 * 1000,
            '5m': 5 * 60 * 1000,
            '15m': 15 * 60 * 1000,
            '1h': 60 * 60 * 1000,
            '1d': 24 * 60 * 60 * 1000
        };
        
        const msPerInterval = intervalMs[interval] || intervalMs['5m'];
        const totalMs = periodNum * msPerInterval;
        
        const startDate = new Date(now.getTime() - totalMs);
        
        return {
            startDate: Math.floor(startDate.getTime() / 1000),
            endDate: Math.floor(now.getTime() / 1000)
        };
    }



    /**
     * Subscribe to real-time data stream
     */
    async subscribeToRealTimeData(symbol, callback) {
        console.log(`📡 Starting real-time data stream for ${symbol} (${this.timeframe})`);
        
        // Initialize WebSocket connection
        await this.initializeWebSocket();
        
        // Register callback for price updates
        this.priceCallbacks.set(symbol, callback);
        
        // Set update interval based on timeframe
        const updateInterval = this.getUpdateInterval();
        console.log(`⏱️ Update interval: ${updateInterval / 1000}s`);
        
        const interval = setInterval(async () => {
            try {
                const price = await this.getRealTimePrice(symbol);
                if (price && callback) {
                    const candleData = await this.buildCandleData(symbol, price);
                    
                    callback({
                        symbol,
                        price,
                        timestamp: new Date(),
                        candle: candleData,
                        timeframe: this.timeframe
                    });
                }
            } catch (error) {
                console.error('❌ Real-time data error:', error.message);
            }
        }, updateInterval);
        
        return () => {
            console.log(`🛑 Stopping real-time data stream for ${symbol}`);
            clearInterval(interval);
            this.priceCallbacks.delete(symbol);
            if (this.alpacaWs) {
                this.alpacaWs.close();
            }
        };
    }

    /**
     * Get update interval based on timeframe
     */
    getUpdateInterval() {
        const intervals = {
            '1m': 5000,   // 5 seconds for 1-minute timeframe
            '5m': 15000,  // 15 seconds for 5-minute timeframe
            '15m': 30000  // 30 seconds for 15-minute timeframe
        };
        
        return intervals[this.timeframe] || 15000;
    }

    /**
     * Build candle data from real-time prices
     */
    async buildCandleData(symbol, currentPrice) {
        try {
            const cacheKey = `candle_${symbol}_${this.timeframe}`;
            let candleCache = this.cache.get(cacheKey);
            
            const now = new Date();
            const candleStart = this.getCandleStartTime(now);
            
            if (!candleCache || candleCache.startTime.getTime() !== candleStart.getTime()) {
                // New candle period
                candleCache = {
                    startTime: candleStart,
                    open: currentPrice,
                    high: currentPrice,
                    low: currentPrice,
                    close: currentPrice,
                    volume: 0,
                    trades: 1
                };
            } else {
                // Update existing candle
                candleCache.high = Math.max(candleCache.high, currentPrice);
                candleCache.low = Math.min(candleCache.low, currentPrice);
                candleCache.close = currentPrice;
                candleCache.trades += 1;
            }
            
            this.cache.set(cacheKey, candleCache);
            return { ...candleCache };
            
        } catch (error) {
            console.error('❌ Error building candle data:', error.message);
            return null;
        }
    }

    /**
     * Get candle start time based on timeframe
     */
    getCandleStartTime(timestamp) {
        const date = new Date(timestamp);
        
        switch (this.timeframe) {
            case '1m':
                date.setSeconds(0, 0);
                break;
            case '5m':
                const minutes5 = Math.floor(date.getMinutes() / 5) * 5;
                date.setMinutes(minutes5, 0, 0);
                break;
            case '15m':
                const minutes15 = Math.floor(date.getMinutes() / 15) * 15;
                date.setMinutes(minutes15, 0, 0);
                break;
            default:
                date.setMinutes(0, 0, 0);
        }
        
        return date;
    }

    /**
     * Validate and clean historical data
     */
    validateAndCleanData(data) {
        if (!data || !Array.isArray(data)) {
            throw new Error('Invalid data format');
        }
        
        // Remove invalid entries
        const cleanData = data.filter(item => 
            item.timestamp &&
            typeof item.close === 'number' &&
            !isNaN(item.close) &&
            item.close > 0 &&
            typeof item.open === 'number' &&
            !isNaN(item.open) &&
            item.open > 0
        );
        
        if (cleanData.length === 0) {
            throw new Error('No valid data points found');
        }
        
        // Sort by timestamp
        cleanData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Silent - no logging
        return cleanData;
    }

    /**
     * Validate data integrity
     */
    validateData(data) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return false;
        }
        
        return data.every(item => 
            item.timestamp &&
            typeof item.close === 'number' &&
            !isNaN(item.close) &&
            item.close > 0
        );
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.alpacaWs) {
            this.alpacaWs.close();
        }
        this.currentPrices.clear();
        this.priceCallbacks.clear();
        // NO CACHE to clear - always fetch fresh data
    }
}

module.exports = DataManager;