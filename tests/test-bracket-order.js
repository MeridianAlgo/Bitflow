/**
 * Test Bracket Order Submission
 * Tests that bracket orders can be submitted to Alpaca without 422 errors
 */

require('dotenv').config();
const Alpaca = require('@alpacahq/alpaca-trade-api');

async function testBracketOrder() {
    console.log('\n=== Testing Bracket Order Submission ===\n');
    
    try {
        // Initialize Alpaca
        const alpaca = new Alpaca({
            keyId: process.env.ALPACA_API_KEY_ID,
            secretKey: process.env.ALPACA_SECRET_KEY,
            paper: true,
            baseUrl: 'https://paper-api.alpaca.markets'
        });
        
        console.log('✓ Alpaca client initialized');
        
        // Get current price for BTC/USD
        const symbol = 'BTCUSD';
        console.log(`\nFetching current price for ${symbol}...`);
        
        const axios = require('axios');
        const url = `https://data.alpaca.markets/v1beta3/crypto/us/latest/trades?symbols=BTC/USD`;
        
        const response = await axios.get(url, {
            headers: {
                'APCA-API-KEY-ID': process.env.ALPACA_API_KEY_ID,
                'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
            }
        });
        
        const currentPrice = response.data.trades['BTC/USD'].p;
        console.log(`✓ Current price: $${currentPrice.toFixed(2)}`);
        
        // Calculate TP/SL (1% each)
        const takeProfit = currentPrice * 1.01;
        const stopLoss = currentPrice * 0.99;
        const stopLossLimit = currentPrice * 0.98; // 1% slippage buffer
        
        console.log(`\nBracket Order Parameters:`);
        console.log(`  Symbol: ${symbol}`);
        console.log(`  Quantity: 0.001 BTC`);
        console.log(`  Entry (Limit): $${currentPrice.toFixed(2)}`);
        console.log(`  Take Profit: $${takeProfit.toFixed(2)} (+1%)`);
        console.log(`  Stop Loss: $${stopLoss.toFixed(2)} (-1%)`);
        console.log(`  Stop Loss Limit: $${stopLossLimit.toFixed(2)}`);
        
        // Create bracket order
        console.log(`\n📤 Submitting bracket order to Alpaca...`);
        
        const orderParams = {
            symbol: symbol,
            qty: '0.001',
            side: 'buy',
            type: 'limit',
            time_in_force: 'gtc',
            limit_price: currentPrice.toFixed(2),
            order_class: 'bracket',
            take_profit: {
                limit_price: takeProfit.toFixed(2)
            },
            stop_loss: {
                stop_price: stopLoss.toFixed(2),
                limit_price: stopLossLimit.toFixed(2)
            }
        };
        
        console.log('\nOrder Params:', JSON.stringify(orderParams, null, 2));
        
        const order = await alpaca.createOrder(orderParams);
        
        console.log(`\n✅ SUCCESS! Bracket order submitted`);
        console.log(`Order ID: ${order.id}`);
        console.log(`Status: ${order.status}`);
        console.log(`Order Class: ${order.order_class}`);
        
        // Wait a moment then cancel the order (we don't want it to fill)
        console.log(`\n⏳ Waiting 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log(`🗑️ Canceling test order...`);
        await alpaca.cancelOrder(order.id);
        console.log(`✓ Order canceled successfully`);
        
        console.log(`\n✅ TEST PASSED - Bracket orders work correctly!`);
        
    } catch (error) {
        console.error(`\n❌ TEST FAILED`);
        console.error(`Error: ${error.message}`);
        if (error.response) {
            console.error(`Response Status: ${error.response.status}`);
            console.error(`Response Data:`, error.response.data);
        }
        process.exit(1);
    }
}

// Run test
if (require.main === module) {
    testBracketOrder().then(() => {
        console.log(`\n✅ All bracket order tests completed successfully!\n`);
        process.exit(0);
    }).catch(error => {
        console.error(`\n❌ Test failed:`, error);
        process.exit(1);
    });
}

module.exports = testBracketOrder;
