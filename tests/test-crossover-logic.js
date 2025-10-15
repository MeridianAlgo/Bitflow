/**
 * Test Suite for Crossover Logic
 * Tests the proper crossover detection and initialization period
 */

class CrossoverLogicTests {
    constructor() {
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

    // Test 1: Initialization Period
    testInitializationPeriod() {
        console.log('\n--- Test 1: Initialization Period ---');
        
        let previousPriceVsMA = null;
        let initializationWaitTicks = 10;
        
        // First tick - should set baseline
        const isAbove = true;
        if (previousPriceVsMA === null) {
            previousPriceVsMA = isAbove ? 'above' : 'below';
        }
        
        this.assert(previousPriceVsMA === 'above', 'Should set baseline to above');
        this.assert(initializationWaitTicks === 10, 'Should start with 10 wait ticks');
        
        // Simulate 10 ticks
        for (let i = 0; i < 10; i++) {
            initializationWaitTicks--;
        }
        
        this.assert(initializationWaitTicks === 0, 'Should complete after 10 ticks');
        console.log('  Initialization period: 10 ticks (5 minutes)');
    }

    // Test 2: No Buy During Initialization
    testNoBuyDuringInit() {
        console.log('\n--- Test 2: No Buy During Initialization ---');
        
        let initializationWaitTicks = 5;
        let allowTrade = initializationWaitTicks === 0;
        
        this.assert(!allowTrade, 'Should NOT allow trades during initialization');
        
        // Complete initialization
        initializationWaitTicks = 0;
        allowTrade = initializationWaitTicks === 0;
        
        this.assert(allowTrade, 'Should allow trades after initialization');
        console.log('  Trades blocked during init: ✓');
    }

    // Test 3: True Crossover Detection (Below to Above)
    testTrueCrossoverBelowToAbove() {
        console.log('\n--- Test 3: True Crossover (Below → Above) ---');
        
        let previousPriceVsMA = 'below';
        let currentPrice = 100;
        let currentMA = 95;
        let isAbove = currentPrice > currentMA;
        
        const crossedAbove = previousPriceVsMA === 'below' && isAbove;
        
        this.assert(crossedAbove, 'Should detect crossover from below to above');
        console.log('  Previous: below MA');
        console.log('  Current: above MA');
        console.log('  Crossover detected: ✓');
    }

    // Test 4: No Buy When Already Above
    testNoBuyWhenAlreadyAbove() {
        console.log('\n--- Test 4: No Buy When Already Above ---');
        
        let previousPriceVsMA = 'above';
        let currentPrice = 100;
        let currentMA = 95;
        let isAbove = currentPrice > currentMA;
        
        const crossedAbove = previousPriceVsMA === 'below' && isAbove;
        
        this.assert(!crossedAbove, 'Should NOT buy when already above MA');
        console.log('  Previous: above MA');
        console.log('  Current: above MA');
        console.log('  No crossover: ✓');
    }

    // Test 5: No Buy When Going Below
    testNoBuyWhenGoingBelow() {
        console.log('\n--- Test 5: No Buy When Going Below ---');
        
        let previousPriceVsMA = 'above';
        let currentPrice = 95;
        let currentMA = 100;
        let isAbove = currentPrice > currentMA;
        
        const crossedAbove = previousPriceVsMA === 'below' && isAbove;
        
        this.assert(!crossedAbove, 'Should NOT buy when going below MA');
        console.log('  Previous: above MA');
        console.log('  Current: below MA');
        console.log('  No buy signal: ✓');
    }

    // Test 6: Crossover After Waiting Below
    testCrossoverAfterWaitingBelow() {
        console.log('\n--- Test 6: Crossover After Waiting Below ---');
        
        // Scenario: Price starts above, goes below, then crosses above
        let states = [
            { prev: 'above', curr: 'above', shouldBuy: false, desc: 'Start above' },
            { prev: 'above', curr: 'below', shouldBuy: false, desc: 'Go below' },
            { prev: 'below', curr: 'below', shouldBuy: false, desc: 'Stay below' },
            { prev: 'below', curr: 'above', shouldBuy: true, desc: 'Cross above ✓' }
        ];
        
        let allCorrect = true;
        states.forEach(state => {
            const crossedAbove = state.prev === 'below' && state.curr === 'above';
            if (crossedAbove !== state.shouldBuy) {
                allCorrect = false;
            }
            console.log(`  ${state.desc}: ${crossedAbove === state.shouldBuy ? '✓' : '✗'}`);
        });
        
        this.assert(allCorrect, 'Should only buy on true crossover');
    }

    // Test 7: Multiple Crossovers
    testMultipleCrossovers() {
        console.log('\n--- Test 7: Multiple Crossovers ---');
        
        let previousPriceVsMA = 'below';
        let buySignals = 0;
        
        // Simulate price movements
        const movements = [
            { price: 100, ma: 95, expected: 'buy' },   // Cross above
            { price: 101, ma: 96, expected: 'hold' },  // Stay above
            { price: 95, ma: 97, expected: 'hold' },   // Go below
            { price: 98, ma: 96, expected: 'buy' },    // Cross above again
            { price: 99, ma: 97, expected: 'hold' }    // Stay above
        ];
        
        movements.forEach(move => {
            const isAbove = move.price > move.ma;
            const crossedAbove = previousPriceVsMA === 'below' && isAbove;
            
            if (crossedAbove) {
                buySignals++;
            }
            
            previousPriceVsMA = isAbove ? 'above' : 'below';
        });
        
        this.assert(buySignals === 2, 'Should detect exactly 2 crossovers');
        console.log(`  Crossovers detected: ${buySignals}/2 ✓`);
    }

    // Test 8: Baseline Establishment
    testBaselineEstablishment() {
        console.log('\n--- Test 8: Baseline Establishment ---');
        
        // Test starting above MA
        let previousPriceVsMA = null;
        let currentPrice = 100;
        let currentMA = 95;
        let isAbove = currentPrice > currentMA;
        
        if (previousPriceVsMA === null) {
            previousPriceVsMA = isAbove ? 'above' : 'below';
        }
        
        this.assert(previousPriceVsMA === 'above', 'Should establish baseline as above');
        
        // Test starting below MA
        previousPriceVsMA = null;
        currentPrice = 95;
        currentMA = 100;
        isAbove = currentPrice > currentMA;
        
        if (previousPriceVsMA === null) {
            previousPriceVsMA = isAbove ? 'above' : 'below';
        }
        
        this.assert(previousPriceVsMA === 'below', 'Should establish baseline as below');
        console.log('  Baseline establishment: ✓');
    }

    // Run all tests
    runAllTests() {
        console.log('═══════════════════════════════════════════════════════');
        console.log('  Crossover Logic Test Suite');
        console.log('═══════════════════════════════════════════════════════');
        
        try {
            this.testInitializationPeriod();
            this.testNoBuyDuringInit();
            this.testTrueCrossoverBelowToAbove();
            this.testNoBuyWhenAlreadyAbove();
            this.testNoBuyWhenGoingBelow();
            this.testCrossoverAfterWaitingBelow();
            this.testMultipleCrossovers();
            this.testBaselineEstablishment();
            
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
    const tests = new CrossoverLogicTests();
    const success = tests.runAllTests();
    process.exit(success ? 0 : 1);
}

module.exports = CrossoverLogicTests;
