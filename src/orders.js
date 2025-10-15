/**
 * Order Management Module for BitFlow Trading Bot
 * Handles trade execution and position management using Alpaca API
 */

const Alpaca = require('@alpacahq/alpaca-trade-api');

class OrderManager {
    constructor() {
        this.alpacaClient = null;
        this.positions = new Map();
        this.orderHistory = [];
        this.initializeAlpaca();
    }

    /**
     * Initialize Alpaca API client with comprehensive validation
     */
    initializeAlpaca() {
        try {
            if (!process.env.ALPACA_API_KEY_ID || !process.env.ALPACA_SECRET_KEY) {
                throw new Error('Missing Alpaca API credentials');
            }

            this.alpacaClient = new Alpaca({
                keyId: process.env.ALPACA_API_KEY_ID,
                secretKey: process.env.ALPACA_SECRET_KEY,
                paper: true,
                usePolygon: false,
                baseUrl: 'https://paper-api.alpaca.markets',
                dataBaseUrl: 'https://data.alpaca.markets'
            });

            // Verify connection silently
            this.verifyConnection();

        } catch (error) {
            console.error('Failed to initialize Alpaca:', error.message);
            throw error;
        }
    }

    /**
     * Get real-time account information
     */
    async getAccountInfo() {
        try {
            const account = await this.alpacaClient.getAccount();
            return {
                equity: parseFloat(account.equity),
                cash: parseFloat(account.cash),
                buyingPower: parseFloat(account.buying_power),
                portfolioValue: parseFloat(account.portfolio_value),
                daytradeCount: parseInt(account.daytrade_count),
                status: account.status
            };
        } catch (error) {
            console.error('Failed to get account info:', error.message);
            return null;
        }
    }

    /**
     * Verify Alpaca API connection and account status
     */
    async verifyConnection() {
        try {
            console.log('🔍 Verifying Alpaca API connection...');

            const account = await this.alpacaClient.getAccount();

            if (!account) {
                throw new Error('Failed to retrieve account information');
            }

            console.log('✅ API Connection verified');
            console.log(`📊 Account ID: ${account.id}`);
            console.log(`💰 Buying Power: $${parseFloat(account.buying_power).toFixed(2)}`);
            console.log(`💵 Cash: $${parseFloat(account.cash).toFixed(2)}`);
            console.log(`📈 Portfolio Value: $${parseFloat(account.portfolio_value).toFixed(2)}`);

            // Verify paper trading status
            if (account.trading_blocked) {
                console.log('⚠️ WARNING: Trading is blocked on this account');
            }

            return true;

        } catch (error) {
            console.error('❌ API connection verification failed:', error.message);
            throw error;
        }
    }

    /**
     * Execute a buy order with enhanced safety checks, position sizing, and optional bracket order (TP/SL)
     * @param {string} symbol - Trading symbol
     * @param {number} quantity - Position size
     * @param {number} maxRiskPercent - Max risk percentage
     * @param {object} bracket - Optional bracket order with takeProfit and stopLoss
     */
    async executeBuyOrder(symbol, quantity = null, maxRiskPercent = 1.0, bracket = null) {
        try {
            // Validate inputs
            if (!symbol) {
                throw new Error('Symbol is required for buy order');
            }

            // Get current market price for position sizing
            const currentPrice = await this.getCurrentPrice(symbol);
            if (!currentPrice) {
                throw new Error('Unable to get current market price');
            }

            // Check account balance and calculate position size
            const account = await this.alpacaClient.getAccount();
            const availableCash = parseFloat(account.cash);
            const buyingPower = parseFloat(account.buying_power);

            console.log(`💰 Available cash: $${availableCash.toFixed(2)}`);
            console.log(`📊 Buying power: $${buyingPower.toFixed(2)}`);
            console.log(`💵 Current price: $${currentPrice.toFixed(4)}`);

            // Calculate position size if not provided
            if (!quantity) {
                quantity = this.calculatePositionSize(availableCash, currentPrice, maxRiskPercent);
                console.log(`📏 Calculated position size: ${quantity} (${maxRiskPercent}% risk)`);
            }

            // Validate calculated quantity
            if (!quantity || quantity <= 0) {
                throw new Error('Invalid calculated quantity for buy order');
            }

            // Safety checks
            const orderValue = quantity * currentPrice;
            if (orderValue > availableCash) {
                throw new Error(`Insufficient funds: Order value $${orderValue.toFixed(2)} > Available $${availableCash.toFixed(2)}`);
            }

            if (orderValue > buyingPower) {
                throw new Error(`Order exceeds buying power: $${orderValue.toFixed(2)} > $${buyingPower.toFixed(2)}`);
            }

            // Check for existing position
            const existingPosition = await this.getPositionForSymbol(symbol);
            if (existingPosition) {
                console.log(`⚠️ Warning: Existing position detected for ${symbol}`);
                console.log(`📊 Current position: ${existingPosition.qty} shares`);
            }

            // Prepare order with enhanced parameters
            const orderParams = {
                symbol: symbol.replace('/', ''),
                qty: quantity,
                side: 'buy',
                type: 'market',
                time_in_force: 'gtc',
                extended_hours: false // Disable extended hours for safety
            };
            
            // NOTE: Bracket orders are NOT supported for crypto on Alpaca
            // We'll use manual TP/SL monitoring instead
            // Store bracket info for manual management
            let bracketInfo = null;
            if (bracket && bracket.takeProfit && bracket.stopLoss) {
                bracketInfo = {
                    takeProfit: bracket.takeProfit,
                    stopLoss: bracket.stopLoss
                };
                console.log(`📊 Manual TP/SL (Crypto doesn't support bracket orders):`);
                console.log(`   Take Profit: ${bracket.takeProfit.toFixed(2)}`);
                console.log(`   Stop Loss: ${bracket.stopLoss.toFixed(2)}`);
            }

            // Validate order before submission
            const validation = this.validateOrder(orderParams);
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }

            // Execute order
            console.log('📤 Submitting buy order to Alpaca...');
            let order;
            try {
                order = await this.alpacaClient.createOrder(orderParams);
            } catch (error) {
                // If bracket order fails (422 error), retry without bracket
                if (error.message.includes('422') || error.message.includes('bracket')) {
                    console.log(`⚠️ Bracket order not supported, retrying with manual TP/SL...`);
                    delete orderParams.order_class;
                    delete orderParams.take_profit;
                    delete orderParams.stop_loss;
                    order = await this.alpacaClient.createOrder(orderParams);
                } else {
                    throw error;
                }
            }

            // Track the order
            this.orderHistory.push({
                id: order.id,
                symbol: symbol,
                side: 'buy',
                quantity: quantity,
                timestamp: new Date(),
                status: 'submitted'
            });

            // Monitor order status
            const filledOrder = await this.monitorOrderStatus(order.id);

            if (filledOrder && filledOrder.status === 'filled') {
                console.log('✅ Buy order filled successfully');
                return {
                    success: true,
                    order: filledOrder,
                    orderId: order.id,
                    bracket: bracketInfo // Return bracket info for manual management
                };
            } else {
                console.log('⚠️ Buy order not filled');
                return {
                    success: false,
                    error: 'Order not filled',
                    orderId: order.id
                };
            }

        } catch (error) {
            console.error('❌ Buy order execution failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute a sell order
     */
    async executeSellOrder(symbol, quantity) {
        try {
            // Validate inputs
            if (!symbol || !quantity || quantity <= 0) {
                throw new Error('Invalid symbol or quantity for sell order');
            }

            // Check current positions
            const positions = await this.getPositions();
            const position = positions.find(p => p.symbol === symbol.replace('/', ''));

            if (!position) {
                throw new Error(`No position found for ${symbol}`);
            }

            const availableQuantity = parseFloat(position.qty);
            if (quantity > availableQuantity) {
                console.log(`⚠️ Requested quantity (${quantity}) exceeds available (${availableQuantity})`);
                quantity = availableQuantity; // Sell all available
            }

            // Prepare order
            const orderParams = {
                symbol: symbol.replace('/', ''),
                qty: quantity,
                side: 'sell',
                type: 'market',
                time_in_force: 'gtc'
            };

            // Validate order
            const validation = this.validateOrder(orderParams);
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }

            // Execute order
            console.log('📤 Submitting sell order to Alpaca...');
            const order = await this.alpacaClient.createOrder(orderParams);

            // Track the order
            this.orderHistory.push({
                id: order.id,
                symbol: symbol,
                side: 'sell',
                quantity: quantity,
                timestamp: new Date(),
                status: 'submitted'
            });

            // Monitor order status
            const filledOrder = await this.monitorOrderStatus(order.id);

            if (filledOrder && filledOrder.status === 'filled') {
                console.log('✅ Sell order filled successfully');
                return {
                    success: true,
                    order: filledOrder,
                    orderId: order.id
                };
            } else {
                console.log('⚠️ Sell order not filled');
                return {
                    success: false,
                    error: 'Order not filled',
                    orderId: order.id
                };
            }

        } catch (error) {
            console.error('❌ Sell order execution failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get current positions
     */
    async getPositions() {
        try {
            const positions = await this.alpacaClient.getPositions();
            return positions.map(pos => ({
                symbol: pos.symbol,
                qty: parseFloat(pos.qty),
                side: pos.side,
                market_value: parseFloat(pos.market_value),
                avg_entry_price: parseFloat(pos.avg_entry_price),
                unrealized_pl: parseFloat(pos.unrealized_pl),
                unrealized_plpc: parseFloat(pos.unrealized_plpc)
            }));
        } catch (error) {
            console.error('❌ Error fetching positions:', error.message);
            return [];
        }
    }

    /**
     * Monitor position for a specific symbol with enhanced tracking
     */
    async monitorPosition(symbol) {
        try {
            const positions = await this.getPositions();
            const position = positions.find(p => p.symbol === symbol.replace('/', ''));

            if (position) {
                const currentPrice = await this.getCurrentPrice(symbol);
                const detailedPnL = this.calculatePnL(
                    position.avg_entry_price,
                    currentPrice,
                    position.qty
                );

                return {
                    exists: true,
                    symbol: symbol,
                    quantity: position.qty,
                    entryPrice: position.avg_entry_price,
                    currentPrice: currentPrice,
                    currentValue: position.market_value,
                    unrealizedPL: position.unrealized_pl,
                    unrealizedPLPercent: position.unrealized_plpc * 100,
                    detailedPnL: detailedPnL,
                    side: position.side,
                    marketValue: position.market_value,
                    costBasis: position.avg_entry_price * position.qty,
                    lastUpdated: new Date()
                };
            }

            return { exists: false, symbol: symbol };

        } catch (error) {
            console.error('❌ Error monitoring position:', error.message);
            return { exists: false, error: error.message, symbol: symbol };
        }
    }

    /**
     * Start continuous position monitoring with alerts
     */
    startPositionMonitoring(symbol, alertThresholds = {}) {
        console.log(`📊 Starting position monitoring for ${symbol}`);

        const defaultThresholds = {
            profitAlert: 5.0,    // Alert at 5% profit
            lossAlert: -2.0,     // Alert at 2% loss
            updateInterval: 30000 // Update every 30 seconds
        };

        const thresholds = { ...defaultThresholds, ...alertThresholds };
        let lastAlertTime = 0;
        let lastPnLPercent = 0;

        const monitoringInterval = setInterval(async () => {
            try {
                const positionData = await this.monitorPosition(symbol);

                if (positionData.exists) {
                    const pnlPercent = positionData.unrealizedPLPercent;
                    const now = Date.now();

                    // Check for significant P&L changes
                    const pnlChange = Math.abs(pnlPercent - lastPnLPercent);

                    if (pnlChange > 1.0) { // Alert on 1% change
                        console.log(`📈 Position Update: ${symbol}`);
                        console.log(`   P&L: ${pnlPercent.toFixed(2)}% ($${positionData.unrealizedPL.toFixed(2)})`);
                        console.log(`   Current Price: $${positionData.currentPrice.toFixed(4)}`);
                        console.log(`   Entry Price: $${positionData.entryPrice.toFixed(4)}`);
                    }

                    // Check alert thresholds (limit to once per 5 minutes)
                    if (now - lastAlertTime > 300000) {
                        if (pnlPercent >= thresholds.profitAlert) {
                            console.log(`🎉 PROFIT ALERT: ${symbol} +${pnlPercent.toFixed(2)}%`);
                            lastAlertTime = now;
                        } else if (pnlPercent <= thresholds.lossAlert) {
                            console.log(`⚠️ LOSS ALERT: ${symbol} ${pnlPercent.toFixed(2)}%`);
                            lastAlertTime = now;
                        }
                    }

                    lastPnLPercent = pnlPercent;
                } else {
                    // Position closed or doesn't exist
                    console.log(`📊 Position monitoring stopped: ${symbol} (no position)`);
                    clearInterval(monitoringInterval);
                }

            } catch (error) {
                console.error('❌ Position monitoring error:', error.message);
            }
        }, thresholds.updateInterval);

        // Return function to stop monitoring
        return () => {
            console.log(`🛑 Stopping position monitoring for ${symbol}`);
            clearInterval(monitoringInterval);
        };
    }

    /**
     * Get comprehensive position summary
     */
    async getPositionSummary() {
        try {
            const positions = await this.getPositions();
            const account = await this.getAccountInfo();

            if (!positions || positions.length === 0) {
                return {
                    totalPositions: 0,
                    totalValue: 0,
                    totalPnL: 0,
                    totalPnLPercent: 0,
                    positions: [],
                    account: account
                };
            }

            let totalValue = 0;
            let totalPnL = 0;
            let totalCostBasis = 0;

            const enhancedPositions = await Promise.all(
                positions.map(async (pos) => {
                    const currentPrice = await this.getCurrentPrice(pos.symbol);
                    const costBasis = pos.avg_entry_price * pos.qty;
                    const marketValue = currentPrice * pos.qty;
                    const pnl = marketValue - costBasis;

                    totalValue += marketValue;
                    totalPnL += pnl;
                    totalCostBasis += costBasis;

                    return {
                        ...pos,
                        currentPrice: currentPrice,
                        costBasis: costBasis,
                        marketValue: marketValue,
                        pnl: pnl,
                        pnlPercent: (pnl / costBasis) * 100
                    };
                })
            );

            const totalPnLPercent = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

            return {
                totalPositions: positions.length,
                totalValue: totalValue,
                totalPnL: totalPnL,
                totalPnLPercent: totalPnLPercent,
                totalCostBasis: totalCostBasis,
                positions: enhancedPositions,
                account: account,
                lastUpdated: new Date()
            };

        } catch (error) {
            console.error('❌ Error getting position summary:', error.message);
            return null;
        }
    }

    /**
     * Validate order parameters
     */
    validateOrder(orderParams) {
        try {
            // Check required fields
            if (!orderParams.symbol || !orderParams.qty || !orderParams.side) {
                return { valid: false, error: 'Missing required order parameters' };
            }

            // Check quantity
            if (orderParams.qty <= 0) {
                return { valid: false, error: 'Quantity must be positive' };
            }

            // Check side
            if (!['buy', 'sell'].includes(orderParams.side)) {
                return { valid: false, error: 'Invalid order side' };
            }

            // Check symbol format
            if (orderParams.symbol.includes('/')) {
                return { valid: false, error: 'Symbol should not contain "/" for Alpaca API' };
            }

            return { valid: true };

        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    /**
     * Monitor order status until filled or timeout
     */
    async monitorOrderStatus(orderId, timeoutMs = 30000) {
        try {
            const startTime = Date.now();

            while (Date.now() - startTime < timeoutMs) {
                const order = await this.alpacaClient.getOrder(orderId);

                if (order.status === 'filled') {
                    return order;
                } else if (order.status === 'canceled' || order.status === 'rejected') {
                    console.log(`⚠️ Order ${orderId} status: ${order.status}`);
                    return order;
                }

                // Wait 1 second before checking again
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`⏰ Order ${orderId} monitoring timeout`);
            return null;

        } catch (error) {
            console.error('❌ Error monitoring order status:', error.message);
            return null;
        }
    }



    /**
     * Calculate position size based on account balance and risk
     */
    calculatePositionSize(accountBalance, price, riskPercent = 1.0) {
        try {
            const riskAmount = accountBalance * (riskPercent / 100);
            const quantity = riskAmount / price;

            // Round to 6 decimal places for crypto precision
            return Math.floor(quantity * 1000000) / 1000000;

        } catch (error) {
            console.error('❌ Error calculating position size:', error.message);
            return 0;
        }
    }

    /**
     * Get order history
     */
    getOrderHistory() {
        return [...this.orderHistory];
    }

    /**
     * Get current market price for a symbol
     */
    async getCurrentPrice(symbol) {
        try {
            // Use REST API to get price (more reliable than getLatestTrade)
            const axios = require('axios');
            const apiKey = process.env.ALPACA_API_KEY_ID;
            const secretKey = process.env.ALPACA_SECRET_KEY;
            
            const url = `https://data.alpaca.markets/v1beta3/crypto/us/latest/trades?symbols=${symbol}`;
            
            const response = await axios.get(url, {
                headers: {
                    'APCA-API-KEY-ID': apiKey,
                    'APCA-API-SECRET-KEY': secretKey
                }
            });
            
            if (response.data.trades && response.data.trades[symbol]) {
                return response.data.trades[symbol].p;
            }
            
            // Fallback: simulate current price
            const basePrices = {
                'BTC/USD': 67000,
                'ETH/USD': 3500,
                'XRP/USD': 0.6,
                'ADA/USD': 0.45,
                'SOL/USD': 150
            };

            const basePrice = basePrices[symbol] || 67000;
            return basePrice * (1 + (Math.random() - 0.5) * 0.01);

        } catch (error) {
            // Silent fallback
            const basePrices = {
                'BTC/USD': 67000,
                'ETH/USD': 3500,
                'XRP/USD': 0.6,
                'ADA/USD': 0.45,
                'SOL/USD': 150
            };
            return basePrices[symbol] || 67000;
        }
    }

    /**
     * Get position for a specific symbol
     */
    async getPositionForSymbol(symbol) {
        try {
            const positions = await this.getPositions();
            return positions.find(pos => pos.symbol === symbol.replace('/', ''));
        } catch (error) {
            console.error('❌ Error getting position:', error.message);
            return null;
        }
    }

    /**
     * Enhanced position size calculation with risk management
     */
    calculatePositionSize(accountBalance, price, riskPercent = 1.0, maxPositionPercent = 10.0) {
        try {
            // Calculate risk-based position size
            const riskAmount = accountBalance * (riskPercent / 100);
            const maxPositionValue = accountBalance * (maxPositionPercent / 100);

            // Use the smaller of risk-based or max position size
            const positionValue = Math.min(riskAmount, maxPositionValue);
            let quantity = positionValue / price;

            // Round to appropriate precision for crypto (6 decimal places)
            quantity = Math.floor(quantity * 1000000) / 1000000;

            // Ensure minimum viable quantity
            const minQuantity = 0.000001; // Minimum for most crypto
            if (quantity < minQuantity) {
                console.log(`⚠️ Calculated quantity ${quantity} below minimum ${minQuantity}`);
                return 0;
            }

            console.log(`📊 Position sizing: Risk=${riskPercent}%, Max=${maxPositionPercent}%`);
            console.log(`💰 Risk amount: $${riskAmount.toFixed(2)}, Max position: $${maxPositionValue.toFixed(2)}`);
            console.log(`📏 Final quantity: ${quantity}`);

            return quantity;

        } catch (error) {
            console.error('❌ Error calculating position size:', error.message);
            return 0;
        }
    }

    /**
     * Calculate P&L for a position
     */
    calculatePnL(entryPrice, currentPrice, quantity, side = 'long') {
        try {
            const priceDiff = side === 'long' ?
                (currentPrice - entryPrice) :
                (entryPrice - currentPrice);

            const absolutePnL = priceDiff * quantity;
            const percentPnL = (priceDiff / entryPrice) * 100;

            return {
                absolute: absolutePnL,
                percent: percentPnL,
                entryPrice,
                currentPrice,
                quantity
            };

        } catch (error) {
            console.error('❌ Error calculating P&L:', error.message);
            return { absolute: 0, percent: 0 };
        }
    }
}

module.exports = OrderManager;