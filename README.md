# BitFlow 🚀

**Advanced Crypto Trading Bot with Machine Learning & AI Integration**

BitFlow is a sophisticated cryptocurrency trading bot built for Node.js and Python that combines traditional technical analysis with cutting-edge machine learning algorithms, AI-powered position sizing, and comprehensive backtesting capabilities. It features a professional CLI interface, dynamic risk management, and real-time market sentiment analysis.

![BitFlow Logo](core/bitflow_logo.png)

---

## 🌟 Key Features

### 🤖 **Advanced Machine Learning Engine**
- **50+ Technical Indicators**: RSI, MACD, Bollinger Bands, Stochastic, ATR, CCI, Williams %R, and more
- **Multi-Timeframe Analysis**: Combines signals from 1min, 5min, 15min, and 1hour charts
- **Ensemble Learning**: Uses LSTM, CNN, and Dense neural networks for signal generation
- **Market Regime Detection**: Automatically identifies trending, volatile, or sideways markets
- **Advanced Feature Engineering**: Price patterns, support/resistance levels, momentum indicators

### 🎯 **Intelligent Trading Strategy**
- **Kelly Criterion Position Sizing**: Mathematically optimal position sizes for maximum long-term growth
- **Dynamic TP/SL**: Volatility-adjusted take profit and stop loss using ATR (Average True Range)
- **Adaptive Parameters**: Self-tuning RSI periods and MA lengths based on recent performance
- **Multi-Confirmation System**: Requires multiple indicators to align before executing trades
- **Confidence Scoring**: Only trades signals with sufficient confidence levels

### 📊 **Comprehensive Analytics**
- **Real-time Performance Metrics**: Sharpe ratio, max drawdown, profit factor, win rate
- **Risk Assessment**: Multi-factor risk scoring with confidence levels
- **Market Sentiment Analysis**: AI-powered news sentiment using Gemini API
- **Position Logging**: Detailed JSON logs with market data and sentiment scores
- **Performance Alerts**: Early warning system for strategy degradation

### 🔬 **Advanced Backtesting**
- **Historical Simulation**: Test strategies on real market data
- **Synthetic Data Generation**: Create market scenarios for stress testing
- **ML Integration**: Uses enhanced strategy for realistic backtesting
- **Export Capabilities**: CSV and JSON export for further analysis
- **Python Backtest Engine**: Additional backtesting with pandas and numpy

### 🎨 **Professional User Interface**
- **Modern CLI Design**: Color-coded cards, tables, and status indicators
- **Real-time Dashboard**: Live monitoring with adaptive parameter display
- **Desktop Notifications**: Trade alerts and performance warnings
- **Interactive Prompts**: User-friendly configuration with enquirer.js

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16+ recommended)
- **Python 3.8+** (for enhanced backtesting)
- **Alpaca Trading Account** (paper trading recommended)
- **API Keys** (see configuration section)

### 1. **Clone & Install**
```bash
git clone https://github.com/MeridianAlgo/Bitflow.git
cd Bitflow
npm install
```

### 2. **Environment Setup**
Create a `.env` file in the project root:
```env
# Required APIs
ALPACA_API_KEY_ID=your_alpaca_key_id
ALPACA_SECRET_KEY=your_alpaca_secret
POLYGON_API_KEY=your_polygon_key
FINNHUB_API_KEY=your_finnhub_key

# Optional AI APIs (for enhanced features)
LLAMA_API_KEY=your_llama_key
GEMINI_API_KEY=your_gemini_key
```

### 3. **Configure Settings**
Edit `user_settings.json`:
```json
{
  "enablePositionLogging": true,
  "defaultTakeProfit": "auto",
  "defaultStopLoss": "auto",
  "defaultTimeframe": "5Min",
  "enableCrossunderSignals": true,
  "enablePerformanceMetrics": true
}
```

### 4. **Start Trading**
```bash
# Basic usage
node BitFlow.js BTC/USD

# With custom timeframe
node BitFlow.js ETH/USD 1Hour

# Test enhanced features
node test_enhanced_features.js
```

---

## ⚙️ Configuration

### User Settings (`user_settings.json`)

All preferences are read directly from `user_settings.json` - no merging, no prompts, just edit and restart!

| Setting | Type | Description | Default |
|---------|------|-------------|---------|
| `enablePositionLogging` | boolean | Log every position entry/exit to JSON file | `true` |
| `defaultTakeProfit` | string/number | Take profit percentage or "auto" for AI | `"auto"` |
| `defaultStopLoss` | string/number | Stop loss percentage or "auto" for AI | `"auto"` |
| `defaultTimeframe` | string | Chart timeframe (1Min, 5Min, 15Min, 1Hour, 1Day) | `"5Min"` |
| `enableCrossunderSignals` | boolean | Sell on MA crossunder vs only TP/SL | `true` |
| `enablePerformanceMetrics` | boolean | Show advanced metrics (Sharpe, drawdown, etc.) | `true` |

### Supported Timeframes
- **1Min**: 1 Minute (high frequency)
- **5Min**: 5 Minutes (recommended)
- **15Min**: 15 Minutes
- **1Hour**: 1 Hour
- **1Day**: 1 Day (long-term)

### Supported Trading Pairs
- **BTC/USD**: Bitcoin
- **ETH/USD**: Ethereum
- **XRP/USD**: Ripple
- **DOT/USD**: Polkadot
- **ADA/USD**: Cardano
- And any other crypto pair supported by Alpaca

---

## 🧠 Advanced Features

### Machine Learning Integration

#### Enhanced ML Engine (`core/enhanced_ml_engine.js`)
```javascript
// 50+ Technical Indicators
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- Bollinger Bands
- Stochastic Oscillator
- ATR (Average True Range)
- CCI (Commodity Channel Index)
- Williams %R
- And many more...

// Market Regime Detection
- Trending Markets: Strong directional movement
- Volatile Markets: High price swings
- Sideways Markets: Range-bound trading
```

#### AI-Powered Position Sizing
- **Llama API Integration**: Intelligent position size calculation
- **Kelly Criterion**: Mathematically optimal sizing for maximum growth
- **Risk-Adjusted Sizing**: Reduces size after losses, increases after wins
- **Volatility Adaptation**: Larger positions in low volatility, smaller in high

### Advanced Trading Strategy (`core/advanced_trading_strategy.js`)

#### Signal Generation
```javascript
// Multi-Confirmation System
- Technical Indicators: RSI, MACD, MA crossovers
- Market Regime: Adapts strategy to current market conditions
- Sentiment Analysis: News sentiment integration
- Confidence Scoring: Only high-confidence signals executed
```

#### Dynamic Risk Management
- **Adaptive TP/SL**: Adjusts based on market volatility using ATR
- **Multi-Factor Risk Assessment**: Considers multiple risk factors
- **Performance Monitoring**: Real-time strategy health tracking
- **Graceful Degradation**: Falls back to basic strategy if needed

### Sentiment Analysis

#### News Integration
- **Polygon API**: Real-time crypto news aggregation
- **Gemini AI**: Sentiment analysis of news articles
- **Confidence Scoring**: Sentiment confidence levels
- **Trade Impact**: Sentiment influence on trading decisions

---

## 📊 Backtesting & Analysis

### Enhanced Backtest Engine (`core/enhanced_backtest_engine.js`)

#### Features
- **Historical Data**: Real market data from Alpaca/Polygon
- **Synthetic Data**: Generated scenarios for stress testing
- **ML Integration**: Uses enhanced strategy for realistic results
- **Comprehensive Metrics**: Sharpe ratio, max drawdown, profit factor
- **Export Options**: CSV and JSON for further analysis

#### Usage
```bash
# Run enhanced backtesting
node core/enhanced_backtest_engine.js

# Python backtesting (additional)
python core/backtest_engine.py data/BTCUSD_5min.csv BTCUSD
```

### Performance Metrics

#### Real-time Analytics
- **Sharpe Ratio**: Risk-adjusted returns
- **Maximum Drawdown**: Largest peak-to-trough decline
- **Profit Factor**: Ratio of total wins to total losses
- **Win Rate**: Percentage of profitable trades
- **Average Trade**: Mean profit/loss per trade

#### Risk Assessment
- **Volatility Analysis**: Market volatility measurement
- **Correlation Tracking**: Asset correlation monitoring
- **VaR (Value at Risk)**: Potential loss estimation
- **Stress Testing**: Performance under adverse conditions

---

## 🛠️ Development & Testing

### Project Structure
```
BitFlow/
├── BitFlow.js                 # Main entry point
├── core/
│   ├── BitFlow.js            # Core trading logic
│   ├── enhanced_ml_engine.js # ML algorithms
│   ├── advanced_trading_strategy.js # Advanced strategy
│   ├── enhanced_backtest_engine.js # Backtesting
│   ├── backtest_engine.py    # Python backtesting
│   ├── tradeUtils.js         # Trade execution utilities
│   ├── apiHelpers.js         # API integrations
│   └── ui.js                 # User interface
├── logs/
│   ├── position_log.json     # Position history
│   └── api_errors.log        # Error logging
├── test_*.js                 # Test scripts
└── user_settings.json        # User configuration
```

### Testing Scripts

#### Enhanced Features Test
```bash
node test_enhanced_features.js
```
Tests all ML components, strategy generation, and backtesting capabilities.

#### Individual Component Tests
```bash
node test_settings.js           # Settings validation
node test_alpaca_historical.js  # Historical data
node test_gmail_api_notification.js # Notifications
node test_novu_notification.js  # Alternative notifications
```

### Dependencies

#### Core Dependencies
```json
{
  "@alpacahq/alpaca-trade-api": "^1.4.2",
  "@tensorflow/tfjs": "^4.22.0",
  "technicalindicators": "^3.1.0",
  "yahoo-finance2": "^2.13.3",
  "node-cron": "^4.1.1",
  "ws": "^8.18.2"
}
```

#### AI & Analytics
- **TensorFlow.js**: Neural network models
- **Technical Indicators**: 50+ technical analysis indicators
- **Gemini API**: Sentiment analysis and AI calculations
- **Llama API**: Intelligent position sizing

---

## 📈 Performance Monitoring

### Real-time Dashboard
The bot displays comprehensive real-time information:

```
┌─────────────────────────────────────────────────────────────┐
│                    BitFlow Trading Bot                      │
├─────────────────────────────────────────────────────────────┤
│ Symbol: BTC/USD    Timeframe: 5Min    Status: Monitoring   │
│ Current Price: $45,250.00    Change: +2.5%    Volume: 1.2M │
├─────────────────────────────────────────────────────────────┤
│ Signal Confidence: 85%    Market Regime: Trending          │
│ Risk Level: Medium    Position Size: 0.002 BTC             │
├─────────────────────────────────────────────────────────────┤
│ Performance Metrics:                                        │
│ Win Rate: 68%    Sharpe Ratio: 1.45    Max DD: -8.2%       │
│ Profit Factor: 2.1    Total Trades: 45    P&L: +$1,250     │
└─────────────────────────────────────────────────────────────┘
```

### Performance Alerts
- **Critical**: Win rate below 20% - reduces position sizes
- **Warning**: Win rate below 30% - adapts parameters
- **Info**: Win rate above 80% - considers increasing position sizes

### Logging & Analytics
- **Position Log**: Detailed JSON logs with market data
- **Error Logging**: API errors and system issues
- **Performance Tracking**: Real-time metrics and alerts
- **Trade History**: Complete trade history in CSV format

---

## 🔧 Troubleshooting

### Common Issues

#### Bot Not Using Settings
- Ensure `user_settings.json` is saved and bot is restarted
- Check for JSON syntax errors (missing commas, brackets)
- Verify file permissions

#### API Errors
- Double-check `.env` file and API keys
- Verify API key permissions and rate limits
- Check network connectivity

#### Performance Issues
- Monitor system resources (CPU, memory)
- Check for excessive API calls
- Verify data feed quality

#### Desktop Notifications
- **Windows**: Enable notifications in system settings
- **macOS**: Check notification permissions
- **Linux**: Install notification daemon

### Debug Mode
```bash
# Enable debug logging
DEBUG=* node BitFlow.js BTC/USD

# Check specific components
DEBUG=bitflow:api node BitFlow.js BTC/USD
DEBUG=bitflow:ml node BitFlow.js BTC/USD
```

---

## 📚 API Documentation

### Core Classes

#### BitFlow Class
```javascript
const BitFlow = require('./core/BitFlow');

const bot = new BitFlow('BTC/USD', {
  baseLength: 20,
  evalPeriod: 20,
  timeframe: '5Min',
  takeProfit: 'auto',
  stopLoss: 'auto'
});
```

#### Enhanced ML Engine
```javascript
const EnhancedMLEngine = require('./core/enhanced_ml_engine');

const mlEngine = new EnhancedMLEngine();
const features = mlEngine.extractFeatures(marketData);
const regime = mlEngine.detectMarketRegime(marketData);
```

#### Advanced Trading Strategy
```javascript
const AdvancedTradingStrategy = require('./core/advanced_trading_strategy');

const strategy = new AdvancedTradingStrategy(monitor);
const signal = await strategy.generateAdvancedSignal(marketData);
const positionSize = strategy.calculateOptimalPositionSize(balance, price, 'BUY');
```

### API Integrations

#### Alpaca Trading API
- Paper trading support
- Real-time market data
- Order execution
- Position management

#### Polygon API
- Historical market data
- News aggregation
- Real-time quotes

#### Finnhub API
- Market sentiment
- Economic indicators
- Alternative data

---

## 🚨 Risk Disclaimer

**⚠️ IMPORTANT: This software is for educational and research purposes only.**

- Cryptocurrency trading involves substantial risk of loss
- Past performance does not guarantee future results
- Always conduct your own research before making investment decisions
- Consider consulting with a financial advisor
- The developers are not responsible for any financial losses
- Use paper trading to test strategies before live trading
- Never invest more than you can afford to lose

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Development Setup
```bash
git clone https://github.com/MeridianAlgo/Bitflow.git
cd Bitflow
npm install
npm test
```

---

## 📞 Support & Community

### Getting Help
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **Documentation**: Check this README and code comments
- **Testing**: Run test scripts to verify functionality

### Community Resources
- **GitHub Repository**: [MeridianAlgo/Bitflow](https://github.com/MeridianAlgo/Bitflow)
- **Issues**: Bug reports and feature requests
- **Discussions**: Community support and ideas
- **Wiki**: Additional documentation and guides

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🎉 Acknowledgments

- **Alpaca Markets**: Trading API and data feeds
- **Polygon.io**: Market data and news
- **Google Gemini**: AI-powered analysis
- **TensorFlow.js**: Machine learning capabilities
- **Technical Indicators**: Comprehensive technical analysis
- **Open Source Community**: All contributors and supporters

---

**Happy Trading! 🚀📈**

*Built with ❤️ by the MeridianAlgo team*
