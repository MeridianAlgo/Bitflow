# BitFlow Test Suite

Comprehensive tests for all BitFlow components.

## Test Files

### 1. `test-ml-risk-manager.js`
Tests the ML-based risk management system:
- ✓ ATR calculation
- ✓ Volatility analysis
- ✓ Trend detection
- ✓ TP/SL calculation with safety caps
- ✓ Position sizing
- ✓ High/low volatility scenarios
- ✓ Confidence scoring
- ✓ Extreme price scenarios
- ✓ Small account handling

### 2. `test-orders.js`
Tests Alpaca API integration:
- ✓ Order manager initialization
- ✓ Get account info
- ✓ Get positions
- ✓ Verify connection
- ✓ Account info structure
- ✓ Paper trading verification

**Note**: Requires valid Alpaca API keys in `.env` file.

## Running Tests

### Run All Tests
```bash
node tests/run-all-tests.js
```

### Run Individual Test Suites
```bash
# ML Risk Manager
node tests/test-ml-risk-manager.js

# Order Manager (requires API keys)
node tests/test-orders.js
```

## Test Output

### Success Example
```
╔═══════════════════════════════════════════════════════╗
║          BitFlow v3.0 - Master Test Suite            ║
╚═══════════════════════════════════════════════════════╝

Running ML Risk Manager Tests...
✓ ATR should not be null
✓ ATR should be positive
✓ Volatility should not be null
...

╔═══════════════════════════════════════════════════════╗
║                   Test Summary                        ║
╚═══════════════════════════════════════════════════════╝

✓ PASS ML Risk Manager
     Passed: 30, Failed: 0
✓ PASS Order Manager
     Passed: 6, Failed: 0

✓ ALL TESTS PASSED
Total: 36 passed, 0 failed

🎉 All systems operational! Ready to trade.
```

## What Each Test Validates

### ML Risk Manager Tests
1. **ATR Calculation**: Verifies Average True Range is calculated correctly
2. **Volatility**: Ensures volatility metrics are within reasonable bounds
3. **Trend Detection**: Validates trend strength calculation (-1 to 1)
4. **TP/SL Caps**: Confirms safety caps are enforced (max 5% SL, 10% TP)
5. **Position Sizing**: Tests dynamic sizing based on account and volatility
6. **Confidence Score**: Validates confidence scoring (0-1 range)
7. **Edge Cases**: Tests extreme prices and small accounts

### Order Manager Tests
1. **Initialization**: Verifies Alpaca client setup
2. **Account Info**: Tests real-time account data retrieval
3. **Positions**: Validates position tracking
4. **Connection**: Ensures API connectivity
5. **Paper Trading**: Confirms paper trading mode is enforced
6. **Data Structure**: Validates account info format

## Requirements

- Node.js 14+
- All dependencies installed (`npm install`)
- Valid Alpaca API keys in `.env` (for Order Manager tests)

## Troubleshooting

### "Missing Alpaca API keys"
- Order Manager tests require API keys
- Copy `.env.template` to `.env`
- Add your Alpaca paper trading keys
- Other tests will still run without keys

### "File not found" errors
- Ensure you're running from project root
- Check that `src/` folder exists with all modules

### Tests fail after code changes
- Review the specific test that failed
- Check if your changes affected the tested functionality
- Update tests if behavior intentionally changed

## Adding New Tests

To add new tests:

1. Create `test-your-module.js` in `tests/` folder
2. Follow the existing test structure:
   ```javascript
   class YourModuleTests {
       constructor() {
           this.passedTests = 0;
           this.failedTests = 0;
       }
       
       assert(condition, testName) {
           // Test helper
       }
       
       testYourFeature() {
           // Your test
       }
       
       runAllTests() {
           // Run all tests
       }
   }
   ```
3. Add to `run-all-tests.js`
4. Update this README

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: node tests/run-all-tests.js
```

## Test Coverage

Current coverage:
- ML Risk Manager: 100%
- Order Manager: 90% (some features require live trading)
- Strategy Optimizer: Planned
- Data Manager: Planned

**Note**: Data persistence removed - all data is now stored in memory for fresh calculations every time.

## Contributing

When contributing code:
1. Write tests for new features
2. Ensure all existing tests pass
3. Add test documentation
4. Update this README

---

**Made with ❤️ by MeridianAlgo**
