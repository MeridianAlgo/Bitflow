# BitFlow Trading Bot v3.1.1

Automated cryptocurrency trading bot with ML-powered moving average optimization, dynamic risk management, and fee-aware position sizing.

> **✅ Latest Update (v3.1.1)**: All const reassignment errors fixed! Bot is fully operational and tested.

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
- **Manual TP/SL Monitoring**: Crypto doesn't support bracket orders, bot monitors positions
- **1% Max TP/SL**: Capped for faster trades
- **Dynamic Position Sizing**: Adjusts for volatility and account risk
- **Timeframe-Adjusted**: Position sizing adapts to 1m, 5m, or 15m timeframes

### User Experience
- **CLI Progress Bars**: Clean `[██████████] 100%` progress indicators
- **Single-Line Updates**: No terminal spam
- **Real-Time Monitoring**: Live P&L and trend direction
- **Fresh Data Only**: No caching, 100% fresh calculations every run

### Safety
- **Paper Trading Enforced**: Cannot trade real money
- **ONE Position at a Time**: Conservative risk management
- **Manual TP/SL Monitoring**: Bot monitors positions every second for TP/SL hits
- **Position Cleanup**: Closes existing positions on startup
- **Crossover Confirmation**: 5-minute initialization period before first trade

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

### Phase 2: Real-Time Trading (with Manual TP/SL Monitoring)
```
🟢 BUY SIGNAL - Price crossed from BELOW to ABOVE MA at 100000.00

✓ ML-Based TP/SL: SL 99500.00, TP 100500.00
✓ Position Size: 0.001000 BTC (1.00% risk)

✓ Buy executed
Entry: 100000.00 | SL: 99500.00 | TP: 100500.00
ML TP/SL monitoring active

↗ Entry 100000.00 | Now 100300.00 | P&L +0.30% | TP 100500.00 (+0.20%) | SL 99500.00 (-0.50%)

TAKE PROFIT HIT at 100500.00
P&L: +0.50% (+5.00)

✓ Sell executed: Exit 100500.00 | Final P&L +0.50% (+5.00)
```

1. **Monitors price** every 30 seconds (no position) or 1 second (in position)
2. **5-minute initialization** period to establish baseline
3. **BUY** when price crosses from BELOW to ABOVE MA
4. **Calculates ML-based TP/SL** with ATR and volatility
5. **Monitors position** every second for TP/SL hits
6. **Executes sell** when TP or SL is reached

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
- **Safety caps**: Max 5% SL, Max 10% TP
- **Manual TP/SL monitoring**: Bot checks every second for TP/SL hits
- **Volatility adjustment**: Reduces size in high volatility
- **Timeframe adjustment**: Larger positions for 1m, smaller for 15m
- **Volatility filter**: Skips trades in extreme volatility (1m/5m only)

### Manual Mode:
- Fixed stop loss % (user configurable)
- Fixed position size (0.001 BTC)
- Manual TP/SL monitoring every second
- Simpler calculations for beginners

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
# Quick buy order test
node tests/test-buy-order.js

# Full trading cycle test (recommended)
node tests/test-bitflow-full.js
```

**Test Results:**
```
=== BitFlow Full Trading Cycle Test ===

✅ All modules initialized
✅ Fetched 99 bars
✅ Strategy optimized (HMA(6) - 75.5% score, 55.6% win rate)
✅ Current price: $107,119.27
✅ TP/SL calculated (SL: 0.20%, TP: 0.50%)
✅ Account info retrieved
✅ Position size calculated (0.134666 BTC, 0.10% risk)
✅ Signal: BUY
✅ Buy order executed successfully!
✅ Position confirmed
✅ Position closed successfully

✅ ALL TESTS PASSED!
✅ No const reassignment errors
✅ ML calculations working correctly
✅ Order execution working correctly
✅ BitFlow is ready to trade!
```

**What the tests verify:**
- ✅ No const reassignment errors
- ✅ ML risk calculations work correctly
- ✅ Order execution works on Alpaca
- ✅ Position monitoring works
- ✅ All modules integrate properly

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
- **Manual TP/SL Monitoring** - Bot checks every second for TP/SL hits
- **Fresh Data Every Run** - No stale cached data
- **Real-Time Pricing** - Uses latest trade data from Alpaca
- **Auto Position Cleanup** - Closes existing positions on startup
- **Error Handling** - Improved error messages and recovery
- **Fee-Aware** - All calculations include trading fees
- **Initialization Period** - 5-minute wait before first trade to establish baseline
- **Crossover Confirmation** - Only buys on confirmed below→above MA crossover
- **Volatility Filter** - Skips trades in extreme volatility (1m/5m timeframes)

## 🔧 Requirements

- Node.js 14+
- Alpaca paper trading account (free at https://alpaca.markets/)

## 🐛 Troubleshooting

**Quick Fixes:**

- **"Assignment to constant variable"** - ✅ Fixed in v3.1.1! Update: `git pull origin main && npm install`
- **Bot not trading** - Wait 5 minutes for initialization period
- **Connection errors** - Check `.env` file has valid Alpaca API keys
- **Tests failing** - Run `node test-bitflow-full.js` to diagnose
- **Position stuck** - Press Ctrl+C, bot will close position on restart

📖 **Full Troubleshooting Guide**: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions to all common issues.

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
