# BitFlow Trading Bot v3.0

Automated cryptocurrency trading bot with ML-powered moving average optimization, dynamic risk management, and fee-aware position sizing.

## ✨ Key Features

### Trading Intelligence
- **7 MA Types Tested**: SMA, EMA, WMA, DEMA, TEMA, HMA, VWAP
- **182 Combinations**: Tests all MA types with lengths 5-30
- **60% Win Rate Threshold**: Only trades with high-confidence strategies
- **Smart Retry Logic**: Fetches fresh data if win rate < 60%
- **Crossover Confirmation**: Only buys when price crosses from below to above MA

### Risk Management
- **ML-Based TP/SL**: Adaptive ATR + volatility analysis
- **Fee-Aware Calculations**: Accounts for Alpaca's tiered crypto fees (0.10% - 0.25%)
- **Bracket Orders**: TP/SL sent directly to Alpaca for instant execution
- **1% Max TP/SL**: Capped for faster trades
- **Dynamic Position Sizing**: Adjusts for volatility and account risk

### User Experience
- **CLI Progress Bars**: Clean `[██████████] 100%` progress indicators
- **Single-Line Updates**: No terminal spam
- **Real-Time Monitoring**: Live P&L and trend direction
- **Fresh Data Only**: No caching, 100% fresh calculations every run

### Safety
- **Paper Trading Enforced**: Cannot trade real money
- **ONE Position at a Time**: Conservative risk management
- **Automatic Bracket Orders**: Alpaca manages TP/SL execution
- **Position Cleanup**: Closes existing positions on startup

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/MeridianAlgo/Bitflow.git
cd Bitflow
npm install
```

### 2. Configure API Keys
```bash
# Copy the template
cp .env.template .env

# Edit .env and add your Alpaca API keys
# Get free paper trading keys at: https://alpaca.markets/
```

**Important**: Rename `.env.template` to `.env` and add your API keys:
```
ALPACA_API_KEY_ID=your_key_here
ALPACA_SECRET_KEY=your_secret_here
ALPACA_PAPER=true
```

### 3. Run
```bash
node src/BitFlow.js
```

📖 **Detailed Setup Guide**: See [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for complete instructions.

## 🎯 How It Works

### Phase 1: Optimization (with CLI Progress Bars)
```
Fetching 2000 bars [██████████] 100% ✓
Loaded 1000 bars (Attempt 1/5)

Optimizing MA [██████████████████████████████] 100% ✓
Best: TEMA(6) | Score: 60.3% | Win Rate: 35.3%
```

1. **Fetches 2000 recent bars** from Alpaca
2. **Tests 182 MA combinations** (7 types × 26 lengths)
3. **Checks win rate**: Must be ≥ 60%
4. **If < 60%**: Fetches 2000 more bars OR waits 5s and retries with fresh data
5. **Selects best MA** based on composite score

### Phase 2: Real-Time Trading (with Bracket Orders)
```
🟢 BUY SIGNAL - Price crossed from BELOW to ABOVE MA at 100000.00

📊 Bracket Order:
   Take Profit: 101000.00
   Stop Loss: 99000.00

✓ Buy executed with bracket order
🔵 Alpaca managing TP/SL automatically

↗ Position: Entry 100000.00 | Current 100500.00 | P&L +0.50% | Trending towards TP

✓ Position closed by Alpaca bracket order
Exit: 101000.00 | P&L: +1.00% (+10.00)
```

1. **Monitors price** every 30 seconds
2. **BUY** when price crosses from BELOW to ABOVE MA
3. **Sends bracket order** with TP/SL to Alpaca
4. **Alpaca executes** TP or SL automatically (instant fills)
5. **Monitors position** until Alpaca closes it

## ⚙️ Configuration

On startup, you'll be prompted to configure:

1. **Timeframe**: 1m, 5m, or 15m
2. **Symbol**: BTC/USD, ETH/USD, XRP/USD, ADA/USD, or SOL/USD
3. **TP/SL Mode**:
   - **ML-Based** (Recommended): Adaptive ATR + volatility analysis
   - **Manual**: Fixed percentages

### ML Mode Features (Recommended):
- **Real-time account data**: Fetches balance and buying power
- **ATR-based TP/SL**: Adaptive to market volatility
- **Fee-aware calculations**: Accounts for Alpaca's 0.25% taker fees
- **Dynamic position sizing**: 1% account risk per trade
- **Safety caps**: Max 1% SL, Max 1% TP (for faster trades)
- **Bracket orders**: TP/SL sent to Alpaca for instant execution
- **Volatility adjustment**: Reduces size in high volatility

### Manual Mode:
- Fixed stop loss % (0.5-5%)
- Fixed risk/reward ratio (1-5x)
- Fixed position size (0.001 BTC)
- Still uses bracket orders for automatic TP/SL

## 📊 MA Types Explained

- **SMA** - Simple Moving Average (equal weight)
- **EMA** - Exponential (recent prices weighted more)
- **WMA** - Weighted (linear weight decay)
- **DEMA** - Double Exponential (reduced lag)
- **TEMA** - Triple Exponential (even less lag)
- **HMA** - Hull (reduced lag, smoother)
- **VWAP** - Volume-Weighted Average Price (considers volume)

## 📈 Performance Metrics

Each MA combination is scored on:
- **Crossover Score**: Win rate and profit factor from backtested signals
- **R² Score**: How well the MA fits the price trend
- **Composite Score**: Weighted combination of both

## 🧪 Testing

Run the comprehensive test suite to verify everything works:

```bash
# Run all tests
node tests/run-all-tests.js

# Run individual test suites
node tests/test-ml-risk-manager.js
node tests/test-orders.js  # Requires API keys
```

**Test Results:**
```
✓ PASS ML Risk Manager (30 tests)
✓ PASS Order Manager (11 tests)

✓ ALL TESTS PASSED
Total: 41 passed, 0 failed

🎉 All systems operational! Ready to trade.
```

See [tests/README.md](tests/README.md) for detailed test documentation.

## 📚 Documentation

### Setup & Usage
- 📖 **[Setup Guide](docs/SETUP_GUIDE.md)** - Complete setup instructions
- 🧪 **[Test Documentation](tests/README.md)** - Test suite guide

### Technical Details
- 🤖 **[ML Risk Management](docs/ML_RISK_IMPLEMENTATION.md)** - ML-based TP/SL calculator
- 💰 **[Fee Integration](docs/FEE_INTEGRATION_SUMMARY.md)** - Alpaca crypto fee calculations
- 📦 **[Bracket Orders](docs/BRACKET_ORDER_SUMMARY.md)** - Automatic TP/SL execution
- 🗑️ **[Cache Removal](docs/CACHE_REMOVAL_SUMMARY.md)** - Fresh data implementation
- ✅ **[Final Fixes](docs/FINAL_FIXES_SUMMARY.md)** - All improvements summary

### Project Info
- 📋 **[Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)** - Technical implementation
- 🎯 **[Final Implementation](docs/FINAL_IMPLEMENTATION.md)** - Complete feature list
- 🤝 **[Contributing](docs/CONTRIBUTING.md)** - Contribution guidelines
- 🔒 **[Security](docs/SECURITY.md)** - Security policy

## 🛡️ Safety Features

- **Paper Trading** - Cannot trade real money
- **ONE Position at a Time** - No over-leveraging
- **Bracket Orders** - Alpaca manages TP/SL automatically
- **Fresh Data Every Run** - No stale cached data
- **Quote-Based Pricing** - Uses bid/ask for accurate prices
- **Auto Position Cleanup** - Closes existing positions on startup
- **Error Handling** - Exits cleanly on critical errors
- **Fee-Aware** - All calculations include trading fees

## 🔧 Requirements

- Node.js 14+
- Alpaca paper trading account (free at https://alpaca.markets/)

## 🐛 Troubleshooting

**Stale Prices**: If prices don't update, the market may have low liquidity. The bot uses quotes instead of trades for fresher data.

**Low Win Rate**: If win rate is below 60%, the bot automatically fetches more data and retests.

**Connection Errors**: Check your Alpaca API credentials in the `.env` file and ensure you have an active internet connection.

**Position Stuck**: The bot automatically closes all positions on startup. Use Ctrl+C to exit cleanly.

**Tests Failing**: Run `node tests/run-all-tests.js` to diagnose issues.

## 🤝 Contributing

We welcome contributions! Please see **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** for guidelines.

Issues and pull requests welcome at: https://github.com/MeridianAlgo/Bitflow

## 🔒 Security

Security is important to us. Please see **[SECURITY.md](docs/SECURITY.md)** for our security policy and how to report vulnerabilities.

## ⚠️ Disclaimer

This bot is for educational purposes only. Cryptocurrency trading carries significant risk. Past performance does not guarantee future results. Always test thoroughly in paper trading before considering live trading.

**This software is provided "as is" without warranty of any kind. The developers are not responsible for any financial losses. Trade at your own risk.**

## 📄 License

MIT License - See **[LICENSE.txt](LICENSE.txt)** for complete terms and conditions.

## 📞 Support & Resources

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/MeridianAlgo/Bitflow/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/MeridianAlgo/Bitflow/discussions)
- 📖 **Documentation**: [docs/](docs/)
- 🔒 **Security Policy**: [docs/SECURITY.md](docs/SECURITY.md)
- 🤝 **Contributing**: [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
- 📋 **License**: [LICENSE.txt](LICENSE.txt)

---

<div align="center">

**Made with ❤️ by [MeridianAlgo](https://github.com/MeridianAlgo)**

⭐ Star us on GitHub if you find this useful!

[Report Bug](https://github.com/MeridianAlgo/Bitflow/issues) · [Request Feature](https://github.com/MeridianAlgo/Bitflow/issues) · [Documentation](docs/)

</div>
