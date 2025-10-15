# BitFlow Setup Guide

## Complete Setup Instructions

### Prerequisites
- Node.js 14+ installed
- Alpaca paper trading account (free)
- Git (optional, for cloning)

### Step 1: Get the Code

**Option A: Clone from GitHub**
```bash
git clone https://github.com/MeridianAlgo/Bitflow.git
cd Bitflow
```

**Option B: Download ZIP**
1. Download from GitHub
2. Extract to your desired location
3. Open terminal in that folder

### Step 2: Install Dependencies
```bash
npm install
```

This installs:
- `@alpacahq/alpaca-trade-api` - Trading API
- `chalk` - Terminal colors
- `inquirer` - Interactive prompts
- `technicalindicators` - MA calculations
- `axios` - HTTP requests
- `ws` - WebSocket support
- `dotenv` - Environment variables

### Step 3: Get Alpaca API Keys

1. Go to https://alpaca.markets/
2. Sign up for a free account
3. Navigate to "Paper Trading"
4. Generate API keys:
   - API Key ID
   - Secret Key

**Important**: These are paper trading keys - no real money involved!

### Step 4: Configure Environment

```bash
# Copy the template
cp .env.template .env
```

Edit `.env` file:
```
ALPACA_API_KEY_ID=PK...your_key_here
ALPACA_SECRET_KEY=...your_secret_here
ALPACA_PAPER=true
```

**Security Note**: Never commit `.env` to git! It's already in `.gitignore`.

### Step 5: Run the Bot

```bash
node src/BitFlow.js
```

### First Run Configuration

You'll be prompted to configure:

1. **Timeframe**:
   - 1 Minute (high frequency, more signals)
   - 5 Minutes (recommended, balanced)
   - 15 Minutes (conservative, fewer signals)

2. **Symbol**:
   - BTC/USD (most liquid)
   - ETH/USD
   - XRP/USD
   - ADA/USD
   - SOL/USD

3. **TP/SL Mode**:
   - **ML-Based** (Recommended):
     - Adaptive stops based on volatility
     - Dynamic position sizing
     - ATR-based calculations
     - Safety caps (max 5% SL, 10% TP)
   
   - **Manual**:
     - Fixed percentage stops
     - Fixed position size
     - Simple and predictable

### What Happens Next

1. **Account Check**: Fetches your Alpaca account balance and buying power
2. **Data Fetching**: Downloads 500+ bars of historical data
3. **Optimization**: Tests 208 MA combinations
4. **Auto-Retest**: If scores < 85%, fetches more data automatically
5. **Trading**: Starts monitoring price and executing trades

### Example Output

```
=== BitFlow Trading Bot v3.0 ===

Environment validated
Configuration: BTC/USD on 5m
TP/SL: ML-Based (Adaptive ATR + Volatility Analysis)
Position Sizing: Dynamic (1% account risk per trade)

Fetching account information...
Account Balance: $100,000.00
Buying Power: $200,000.00
Cash: $100,000.00

Fetching 500 bars from Alpaca........ ✓ 497 bars saved
Optimizing MA strategies........ ✓
Best: EMA(14) | Score: 87.2% | Win Rate: 72.5%

✓ Optimization Complete | Final Score: 87.2%

Starting real-time trading...

[10:30:15 AM] Price $113,250.00 | MA $113,180.50 | HOLD | ABOVE MA (+0.06%) | NO POSITION
```

### Monitoring Your Trades

- **Console**: Real-time updates every 30 seconds
- **Alpaca Dashboard**: View positions and orders at alpaca.markets
- **CSV Files**: Check `historical_data/` for MA scores

### Stopping the Bot

Press `Ctrl+C` to stop gracefully. The bot will:
1. Close any open positions
2. Save final data
3. Exit cleanly

### Troubleshooting

**"Missing environment variables"**
- Check your `.env` file exists
- Verify API keys are correct
- Ensure no extra spaces

**"Connection error"**
- Check internet connection
- Verify Alpaca API status
- Try again in a few seconds (bot has retry logic)

**"Low scores detected"**
- Normal! Bot automatically fetches more data
- Wait for re-optimization to complete

**"Buy failed"**
- Check Alpaca account status
- Verify sufficient buying power
- Check symbol is supported

### Advanced Configuration

Edit `src/BitFlow.js` to customize:
- `this.riskPerTrade = 1` - Risk per trade (%)
- `this.accountBalance = 10000` - Default balance if API fails

Edit `src/ml-risk-manager.js` to customize:
- `this.maxStopLossPercent = 5.0` - Max stop loss
- `this.maxTakeProfitPercent = 10.0` - Max take profit
- `this.maxPositionPercent = 10` - Max position size

### Next Steps

1. **Monitor Performance**: Watch for a few hours
2. **Review Trades**: Check Alpaca dashboard
3. **Adjust Settings**: Try different timeframes/symbols
4. **Contribute**: Found a bug? Open an issue!

### Getting Help

- 📖 Read [README.md](../README.md)
- 🐛 Report bugs: [GitHub Issues](https://github.com/MeridianAlgo/Bitflow/issues)
- 💬 Ask questions: [GitHub Discussions](https://github.com/MeridianAlgo/Bitflow/discussions)
- 🔒 Security: See [SECURITY.md](../SECURITY.md)

---

**Made with ❤️ by MeridianAlgo**
