# BitFlow Quick Reference Guide

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure API keys
cp .env.template .env
# Edit .env and add your Alpaca API keys

# 3. Run the bot
node src/BitFlow.js

# 4. Run tests (optional)
node test-bitflow-full.js
```

## ⚙️ Configuration Options

### Timeframe Selection
- **1m** - High frequency (larger positions, wider TP/SL)
- **5m** - Recommended (balanced)
- **15m** - Conservative (smaller positions, tighter TP/SL)

### Symbol Selection
- BTC/USD (Bitcoin)
- ETH/USD (Ethereum)
- XRP/USD (Ripple)
- ADA/USD (Cardano)
- SOL/USD (Solana)

### TP/SL Mode
- **ML-Based** (Recommended)
  - Adaptive ATR + volatility analysis
  - Dynamic position sizing
  - Timeframe-adjusted
  - Fee-aware calculations
  
- **Manual**
  - Fixed stop loss %
  - Fixed position size (0.001 BTC)
  - Simpler calculations

### Position Sizing Mode
- **ML-Based** (Recommended)
  - Dynamic sizing based on volatility
  - Timeframe multipliers (1m: 1.5x, 5m: 1.0x, 15m: 0.7x)
  - Account risk: 1% per trade
  
- **Manual**
  - Fixed 0.001 BTC per trade

## 📊 How It Works

### Phase 1: Optimization
1. Fetches historical data (500-3500 bars)
2. Tests 182 MA combinations (7 types × 26 lengths)
3. Requires ≥60% win rate
4. Selects best MA based on composite score

### Phase 2: Trading
1. **Initialization** (5 minutes / 10 checks)
   - Establishes baseline
   - Tracks price position relative to MA
   
2. **Signal Detection**
   - Monitors price every 30 seconds (no position)
   - BUY when price crosses from BELOW to ABOVE MA
   - Requires confirmed crossover (not just above)
   
3. **Position Entry**
   - Calculates ML-based TP/SL
   - Calculates position size
   - Executes buy order
   
4. **Position Monitoring**
   - Updates every 1 second
   - Shows real-time P&L
   - Displays distance to TP/SL
   
5. **Position Exit**
   - Sells when TP or SL is hit
   - Shows final P&L

## 🎯 Trading Rules

### Entry Rules
- ✅ Price must cross from BELOW to ABOVE MA
- ✅ Must wait 5 minutes after startup
- ✅ Only ONE position at a time
- ✅ Volatility must be within limits (1m/5m only)

### Exit Rules
- ✅ Take Profit hit
- ✅ Stop Loss hit
- ✅ Manual exit (Ctrl+C closes position)

## 📈 MA Types

| Type | Description | Best For |
|------|-------------|----------|
| SMA | Simple Moving Average | Smooth trends |
| EMA | Exponential MA | Recent price action |
| WMA | Weighted MA | Linear decay |
| DEMA | Double Exponential | Reduced lag |
| TEMA | Triple Exponential | Minimal lag |
| HMA | Hull MA | Smooth + responsive |
| VWAP | Volume-Weighted | Volume-based |

## 💰 Position Sizing

### ML-Based Formula
```
Base Risk = Account Equity × 1%
Volatility Adjustment = 1 / (volatility × 50)
Timeframe Multiplier = 1.5 (1m), 1.0 (5m), 0.7 (15m)
Adjusted Risk = Base Risk × Volatility Adj × Timeframe Mult
Position Size = Adjusted Risk / Stop Distance
```

### Safety Caps
- Max position: 10% of buying power
- Max position: 15% of equity
- Min position: 0.000001 BTC

## 🛡️ Safety Features

- ✅ Paper trading only
- ✅ ONE position at a time
- ✅ Automatic position cleanup on startup
- ✅ 5-minute initialization period
- ✅ Crossover confirmation required
- ✅ Volatility filtering (1m/5m)
- ✅ Fee-aware calculations
- ✅ Error handling and recovery

## 🧪 Testing

### Quick Test
```bash
node tests/test-buy-order.js
```
Tests: ML calculations, order execution

### Full Test
```bash
node tests/test-bitflow-full.js
```
Tests: Complete trading cycle (11 steps)

### Expected Results
```
✅ No const reassignment errors
✅ ML calculations working
✅ Order execution working
✅ Position monitoring working
✅ All modules integrated
```

## 🐛 Common Issues

### "Assignment to constant variable"
**Status**: FIXED in v3.1.1
**Solution**: Update to latest version
```bash
git pull origin main
npm install
```

### Bot Not Trading
**Cause**: 5-minute initialization period
**Solution**: Wait 10 checks (5 minutes) after startup

### Low Win Rate
**Cause**: Insufficient data
**Solution**: Bot automatically fetches more data (up to 3500 bars)

### Connection Errors
**Cause**: Invalid API keys or network issues
**Solution**: Check `.env` file and internet connection

## 📊 Performance Metrics

### Composite Score Components
- **40%** - Crossover profitability
- **20%** - R² (trend fit)
- **20%** - Win rate
- **10%** - Profit factor
- **10%** - Drawdown (inverted)

### Win Rate Calculation
```
Win Rate = Winning Trades / Total Trades
Threshold: ≥60% required
```

## 🔧 Environment Variables

```bash
# Required
ALPACA_API_KEY_ID=your_key_here
ALPACA_SECRET_KEY=your_secret_here
ALPACA_PAPER=true

# Optional
DEBUG=true  # Show stack traces on errors
```

## 📞 Support

- 🐛 Bug Reports: [GitHub Issues](https://github.com/MeridianAlgo/Bitflow/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/MeridianAlgo/Bitflow/discussions)
- 📖 Full Docs: [docs/](.)

## ⚠️ Important Notes

1. **Crypto Limitation**: Alpaca doesn't support bracket orders for crypto. The bot monitors TP/SL manually every second.

2. **Initialization Period**: The bot waits 5 minutes (10 checks) after startup before allowing trades. This prevents false signals.

3. **Crossover Confirmation**: The bot only buys when price crosses from BELOW to ABOVE MA, not just when price is above MA.

4. **Paper Trading Only**: This bot is configured for paper trading only. Do not use with real money without extensive testing.

5. **One Position**: The bot only holds ONE position at a time for conservative risk management.

---

**Last Updated**: January 17, 2025 (v3.1.1)
