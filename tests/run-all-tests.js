/**
 * Master Test Runner
 * Runs all test suites and reports results
 */

const MLRiskManagerTests = require('./test-ml-risk-manager.js');
const OrderManagerTests = require('./test-orders.js');
const CrossoverLogicTests = require('./test-crossover-logic.js');
const ScalpingTPSLTests = require('./test-scalping-tpsl.js');

class MasterTestRunner {
    constructor() {
        this.totalPassed = 0;
        this.totalFailed = 0;
        this.suiteResults = [];
    }

    async runAllTestSuites() {
        console.log('\n');
        console.log('╔═══════════════════════════════════════════════════════╗');
        console.log('║                                                       ║');
        console.log('║          BitFlow v3.0 - Master Test Suite            ║');
        console.log('║                                                       ║');
        console.log('╚═══════════════════════════════════════════════════════╝');
        console.log('\n');

        // Test Suite 1: Crossover Logic
        console.log('Running Crossover Logic Tests...');
        const crossoverTests = new CrossoverLogicTests();
        const crossoverSuccess = crossoverTests.runAllTests();
        this.suiteResults.push({
            name: 'Crossover Logic',
            passed: crossoverTests.passedTests,
            failed: crossoverTests.failedTests,
            success: crossoverSuccess
        });
        this.totalPassed += crossoverTests.passedTests;
        this.totalFailed += crossoverTests.failedTests;

        // Test Suite 2: Scalping TP/SL
        console.log('\nRunning Scalping TP/SL Tests...');
        const scalpingTests = new ScalpingTPSLTests();
        const scalpingSuccess = scalpingTests.runAllTests();
        this.suiteResults.push({
            name: 'Scalping TP/SL',
            passed: scalpingTests.passedTests,
            failed: scalpingTests.failedTests,
            success: scalpingSuccess
        });
        this.totalPassed += scalpingTests.passedTests;
        this.totalFailed += scalpingTests.failedTests;

        // Test Suite 3: ML Risk Manager
        console.log('\nRunning ML Risk Manager Tests...');
        const mlTests = new MLRiskManagerTests();
        const mlSuccess = mlTests.runAllTests();
        this.suiteResults.push({
            name: 'ML Risk Manager',
            passed: mlTests.passedTests,
            failed: mlTests.failedTests,
            success: mlSuccess
        });
        this.totalPassed += mlTests.passedTests;
        this.totalFailed += mlTests.failedTests;

        // Test Suite 4: Order Manager
        console.log('\nRunning Order Manager Tests...');
        const orderTests = new OrderManagerTests();
        const orderSuccess = await orderTests.runAllTests();
        this.suiteResults.push({
            name: 'Order Manager',
            passed: orderTests.passedTests,
            failed: orderTests.failedTests,
            success: orderSuccess
        });
        this.totalPassed += orderTests.passedTests;
        this.totalFailed += orderTests.failedTests;

        // Print summary
        this.printSummary();

        return this.totalFailed === 0;
    }

    printSummary() {
        console.log('\n');
        console.log('╔═══════════════════════════════════════════════════════╗');
        console.log('║                   Test Summary                        ║');
        console.log('╚═══════════════════════════════════════════════════════╝');
        console.log('\n');

        // Individual suite results
        this.suiteResults.forEach(suite => {
            const status = suite.success ? '✓ PASS' : '✗ FAIL';
            const statusColor = suite.success ? '\x1b[32m' : '\x1b[31m';
            const resetColor = '\x1b[0m';
            
            console.log(`${statusColor}${status}${resetColor} ${suite.name}`);
            console.log(`     Passed: ${suite.passed}, Failed: ${suite.failed}`);
        });

        console.log('\n' + '─'.repeat(55));
        
        // Overall results
        const allPassed = this.totalFailed === 0;
        const overallStatus = allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED';
        const statusColor = allPassed ? '\x1b[32m' : '\x1b[31m';
        const resetColor = '\x1b[0m';
        
        console.log(`\n${statusColor}${overallStatus}${resetColor}`);
        console.log(`Total: ${this.totalPassed} passed, ${this.totalFailed} failed`);
        console.log('\n');

        if (allPassed) {
            console.log('🎉 All systems operational! Ready to trade.');
        } else {
            console.log('⚠️  Some tests failed. Please review the errors above.');
        }
        
        console.log('\n');
    }
}

// Run all tests
if (require.main === module) {
    const runner = new MasterTestRunner();
    runner.runAllTestSuites().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Fatal error running tests:', error);
        process.exit(1);
    });
}

module.exports = MasterTestRunner;
