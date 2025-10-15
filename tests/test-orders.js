/**
 * Test Suite for Order Manager
 * Tests account info retrieval (requires valid Alpaca API keys)
 */

require('dotenv').config();
const OrderManager = require('../src/orders.js');

class OrderManagerTests {
    constructor() {
        this.orderManager = null;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    // Test helper
    assert(condition, testName) {
        if (condition) {
            console.log(`✓ ${testName}`);
            this.passedTests++;
        } else {
            console.log(`✗ ${testName}`);
            this.failedTests++;
        }
    }

    // Test 1: Initialize Order Manager
    testInitialization() {
        console.log('\n--- Test 1: Initialize Order Manager ---');
        
        try {
            this.orderManager = new OrderManager();
            this.assert(this.orderManager !== null, 'Order manager should initialize');
            this.assert(this.orderManager.alpacaClient !== null, 'Alpaca client should be initialized');
            console.log('  Order manager initialized successfully');
        } catch (error) {
            this.assert(false, `Initialization failed: ${error.message}`);
        }
    }

    // Test 2: Get Account Info
    async testGetAccountInfo() {
        console.log('\n--- Test 2: Get Account Info ---');
        
        if (!this.orderManager) {
            console.log('  ⚠ Skipping - Order manager not initialized');
            return;
        }

        try {
            const accountInfo = await this.orderManager.getAccountInfo();
            
            if (accountInfo) {
                this.assert(accountInfo.equity !== undefined, 'Should have equity');
                this.assert(accountInfo.cash !== undefined, 'Should have cash');
                this.assert(accountInfo.buyingPower !== undefined, 'Should have buying power');
                this.assert(accountInfo.portfolioValue !== undefined, 'Should have portfolio value');
                
                this.assert(accountInfo.equity >= 0, 'Equity should be non-negative');
                this.assert(accountInfo.buyingPower >= 0, 'Buying power should be non-negative');
                
                console.log(`  Equity: ${accountInfo.equity.toFixed(2)}`);
                console.log(`  Cash: ${accountInfo.cash.toFixed(2)}`);
                console.log(`  Buying Power: ${accountInfo.buyingPower.toFixed(2)}`);
                console.log(`  Portfolio Value: ${accountInfo.portfolioValue.toFixed(2)}`);
                if (accountInfo.status) {
                    console.log(`  Status: ${accountInfo.status}`);
                }
            } else {
                this.assert(false, 'Failed to get account info');
            }
        } catch (error) {
            console.log(`  ⚠ Error: ${error.message}`);
            console.log('  Note: This test requires valid Alpaca API keys in .env');
        }
    }

    // Test 3: Get Positions
    async testGetPositions() {
        console.log('\n--- Test 3: Get Positions ---');
        
        if (!this.orderManager) {
            console.log('  ⚠ Skipping - Order manager not initialized');
            return;
        }

        try {
            const positions = await this.orderManager.getPositions();
            
            this.assert(Array.isArray(positions), 'Positions should be an array');
            console.log(`  Current positions: ${positions.length}`);
            
            if (positions.length > 0) {
                const pos = positions[0];
                console.log(`  Example: ${pos.symbol} - ${pos.qty} shares`);
            }
        } catch (error) {
            console.log(`  ⚠ Error: ${error.message}`);
            console.log('  Note: This test requires valid Alpaca API keys in .env');
        }
    }

    // Test 4: Verify Connection
    async testVerifyConnection() {
        console.log('\n--- Test 4: Verify Connection ---');
        
        if (!this.orderManager) {
            console.log('  ⚠ Skipping - Order manager not initialized');
            return;
        }

        try {
            await this.orderManager.verifyConnection();
            this.assert(true, 'Connection verified successfully');
        } catch (error) {
            console.log(`  ⚠ Error: ${error.message}`);
            console.log('  Note: This test requires valid Alpaca API keys in .env');
        }
    }

    // Test 5: Paper Trading Verification
    testPaperTradingMode() {
        console.log('\n--- Test 5: Paper Trading Mode ---');
        
        if (!this.orderManager) {
            console.log('  ⚠ Skipping - Order manager not initialized');
            return;
        }

        // Check if using paper trading URL
        const baseUrl = this.orderManager.alpacaClient.configuration.baseUrl || '';
        const isPaper = baseUrl.includes('paper-api');
        
        this.assert(isPaper === true, 'Should be using paper trading API');
        
        console.log(`  Paper Trading: ${isPaper ? 'Enabled ✓' : 'Disabled ✗'}`);
        console.log(`  Base URL: ${baseUrl}`);
    }

    // Run all tests
    async runAllTests() {
        console.log('═══════════════════════════════════════════════════════');
        console.log('  Order Manager Test Suite');
        console.log('═══════════════════════════════════════════════════════');
        
        // Check for API keys
        if (!process.env.ALPACA_API_KEY_ID || !process.env.ALPACA_SECRET_KEY) {
            console.log('\n⚠ WARNING: Alpaca API keys not found in .env');
            console.log('Some tests will be skipped.\n');
        }
        
        try {
            this.testInitialization();
            await this.testGetAccountInfo();
            await this.testGetPositions();
            await this.testVerifyConnection();
            this.testPaperTradingMode();
            
            console.log('\n═══════════════════════════════════════════════════════');
            console.log(`  Results: ${this.passedTests} passed, ${this.failedTests} failed`);
            console.log('═══════════════════════════════════════════════════════\n');
            
            return this.failedTests === 0;
        } catch (error) {
            console.error('\n✗ Test suite failed with error:', error.message);
            console.error(error.stack);
            return false;
        }
    }
}

// Run tests if executed directly
if (require.main === module) {
    const tests = new OrderManagerTests();
    tests.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = OrderManagerTests;
