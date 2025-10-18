# Changelog

All notable changes to BitFlow Trading Bot will be documented in this file.

## [3.1.1] - 2025-01-17

### 🐛 Fixed
- **Critical**: Fixed "Assignment to constant variable" error in `ml-risk-manager.js`
  - Changed `const stopLoss` to `let stopLoss` to allow reassignment after timeframe adjustments
- **Critical**: Fixed parameter reassignment errors in `orders.js`
  - Changed `quantity` parameter reassignments to use `finalQuantity` variable
  - Applied fix to both `executeBuyOrder` and `executeSellOrder` methods
- Improved error handling in `BitFlow.js`
  - Removed misleading error messages
  - Added cleaner error display with color coding
  - Added debug mode for stack traces (set `DEBUG=true`)

### ✅ Tested
- Created comprehensive test suite (`test-buy-order.js` and `test-bitflow-full.js`)
- All tests passing successfully
- Verified buy order execution works correctly
- Verified ML calculations work without errors
- Verified position monitoring and closing works

### 📝 Documentation
- Updated README.md with accurate information
- Clarified that crypto doesn't support bracket orders (manual TP/SL monitoring instead)
- Added troubleshooting section for const reassignment error
- Updated test documentation
- Added this CHANGELOG

## [3.0.0] - 2025-01-15

### ✨ Features
- ML-powered moving average optimization (7 MA types, 182 combinations)
- Dynamic risk management with ATR-based TP/SL
- Fee-aware position sizing (Alpaca crypto fees)
- Timeframe-adjusted position sizing (1m, 5m, 15m)
- Volatility filtering for 1m and 5m timeframes
- Crossover confirmation (below→above MA)
- 5-minute initialization period before first trade
- Real-time position monitoring (1-second updates)
- Automatic position cleanup on startup
- ONE position at a time for conservative risk management

### 🎯 Trading Intelligence
- 60% win rate threshold
- Smart retry logic (up to 3500 bars)
- Composite scoring (crossover + R² + performance metrics)
- Fresh data only (no caching)

### 🛡️ Safety
- Paper trading enforced
- Manual TP/SL monitoring (crypto limitation)
- Error handling and recovery
- Critical error detection

### 📊 User Experience
- CLI progress bars
- Single-line position updates
- Color-coded output
- Real-time P&L display
- Trend direction indicators

---

## Version History

- **3.1.1** - Bug fixes and improved error handling
- **3.0.0** - Initial release with ML optimization and dynamic risk management
