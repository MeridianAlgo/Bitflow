# BitFlow 🚀

**Advanced Crypto Trading Bot with Machine Learning & AI Integration**

BitFlow is a sophisticated cryptocurrency trading bot built for Node.js that combines traditional technical analysis with cutting-edge machine learning algorithms, AI-powered position sizing, and comprehensive backtesting capabilities. It features a professional CLI interface, dynamic risk management, real-time market sentiment analysis, and intelligent model selection.

## 🆕 Latest Updates

- **Google News API Integration**: Replaced Polygon API with direct Google News RSS feed integration for market sentiment analysis
- **Enhanced Backtesting**: Improved exit reason analysis with more diverse and meaningful exit conditions
- **Reduced Console Clutter**: New logging system with configurable verbosity levels
- **Market Status Check**: Updated to use the new Google News API for crypto market status

![BitFlow Logo](core/bitflow_logo.png)

---

## 🌟 Key Features

### 🤖 **Advanced Machine Learning Engine**
- **Smart Model Manager**: Automatically selects optimal AI models based on system specs
- **50+ Technical Indicators**: RSI, MACD, Bollinger Bands, Stochastic, ATR, CCI, Williams %R, and more
- **Multi-Timeframe Analysis**: Combines signals from 1min, 5min, 15min, and 1hour charts
- **Ensemble Learning**: Uses multiple AI models for enhanced signal accuracy
- **Market Regime Detection**: Automatically identifies trending, volatile, or sideways markets
- **Advanced Feature Engineering**: Price patterns, support/resistance levels, momentum indicators

### 🎯 **Intelligent Trading Strategy**
- **AI-Powered Position Sizing**: Machine learning optimized position sizes for maximum growth
- **Dynamic TP/SL**: Volatility-adjusted take profit and stop loss using ATR
- **Adaptive Parameters**: Self-tuning indicators based on recent performance
- **Multi-Confirmation System**: Requires multiple indicators to align before executing trades
- **Confidence Scoring**: Only trades signals with sufficient confidence levels
- **Risk-Adjusted Trading**: Automatically adjusts strategy based on market conditions

### 📊 **Comprehensive Analytics**
- **Real-time Performance Metrics**: Sharpe ratio, max drawdown, profit factor, win rate
- **Risk Assessment**: Multi-factor risk scoring with confidence levels
- **Market Sentiment Analysis**: AI-powered news and social media sentiment
- **Position Logging**: Detailed JSON logs with market data and reasoning
- **Performance Alerts**: Early warning system for strategy degradation
- **Advanced Backtesting**: Historical simulation with realistic market conditions

### 🔬 **Advanced Backtesting**
- **Historical Simulation**: Test strategies on real market data from multiple sources
- **Synthetic Data Generation**: Create market scenarios for stress testing
- **ML Integration**: Uses enhanced strategy for realistic backtesting results
- **Export Capabilities**: CSV and JSON export for further analysis
- **Multi-Source Data**: Alpaca, Yahoo Finance, and Polygon data integration

### 🎨 **Professional User Interface**
- **Silent Mode**: `BITFLOW_MIN_UI=1` for completely silent operation
- **Modern CLI Design**: Color-coded cards, tables, and status indicators
- **Real-time Dashboard**: Live monitoring with adaptive parameter display
- **Interactive Prompts**: User-friendly configuration with validation
- **Comprehensive Settings**: Text-based settings system for easy modification

### ⚡ **Performance Optimizations**
- **Efficient Trading LLM**: Lightweight, trading-specific language models
- **Smart Resource Management**: Automatic model selection based on system specs
- **Fast Model Switching**: Seamless transitions between different AI models
- **Memory Optimization**: Intelligent caching and memory management
- **CPU-Friendly**: Optimized for various system configurations

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16+ recommended)
- **8GB+ RAM** (recommended for optimal AI performance)
- **Trading Account** (Alpaca paper trading recommended for testing)
- **Internet Connection** (for API access and model downloads)

### 1. **Automated Setup (Recommended)**
```bash
git clone https://github.com/MeridianAlgo/Bitflow.git
cd Bitflow
node setup.js  # Installs everything automatically
```

### 2. **Manual Installation**
```bash
git clone https://github.com/MeridianAlgo/Bitflow.git
cd Bitflow
npm install
```

### 3. **Environment Setup**
Create a `.env` file in the project root:
```env
# Required APIs (use paper trading for testing)
ALPACA_API_KEY_ID=your_alpaca_key_id
ALPACA_SECRET_KEY=your_alpaca_secret
POLYGON_API_KEY=your_polygon_key
FINNHUB_API_KEY=your_finnhub_key

# Optional: AI API for enhanced features
GEMINI_API_KEY=your_gemini_key

# Optional: Llama API for fallback
LLAMA_API_KEY=your_llama_api_key
```

### 4. **Configure Settings**
BitFlow uses a simple text-based settings system. Modify files in the `user_settings/` directory:

- `defaultTimeframe.txt` - Trading timeframe (1Min, 5Min, 15Min, 1Hour, 1Day)
- `defaultTakeProfit.txt` - Take profit level (number or "auto")
- `defaultStopLoss.txt` - Stop loss level (number or "auto")
- `enableCrossunderSignals.txt` - Enable/disable MA crossunder signals (true/false)
- `enablePerformanceMetrics.txt` - Enable/disable performance metrics (true/false)
- `enablePositionLogging.txt` - Enable/disable position logging (true/false)

### 5. **Start Trading**
```bash
# Silent mode (recommended for production)
$env:BITFLOW_MIN_UI=1; node bitflow.js BTC/USD

# Verbose mode (for monitoring and debugging)
$env:BITFLOW_MIN_UI=0; node bitflow.js BTC/USD

# PowerShell (Windows)
$env:BITFLOW_MIN_UI=1; node bitflow.js BTC/USD
```

---

## 📋 Usage Guide

### Trading Commands

#### Basic Trading
```bash
# Start trading with Bitcoin (silent mode)
$env:BITFLOW_MIN_UI=1; node bitflow.js BTC/USD

# Start trading with Ethereum (verbose mode)
$env:BITFLOW_MIN_UI=0; node bitflow.js ETH/USD

# Trade with custom timeframe
node bitflow.js BTC/USD 1Hour
```

#### Silent Mode Operation
BitFlow supports completely silent operation for production use:
```bash
# Enable silent mode (no console output)
$env:BITFLOW_MIN_UI=1; node bitflow.js BTC/USD

# Disable silent mode (show all output)
$env:BITFLOW_MIN_UI=0; node bitflow.js BTC/USD
```

### Settings Management

BitFlow uses a direct file monitoring system for settings. Simply edit the text files in the `user_settings/` directory:

| Setting File | Description | Example Values |
|-------------|-------------|----------------|
| `defaultTimeframe.txt` | Chart timeframe | `1Min`, `5Min`, `15Min`, `1Hour`, `1Day` |
| `defaultTakeProfit.txt` | Take profit percentage | `1.5`, `2.0`, `auto` |
| `defaultStopLoss.txt` | Stop loss percentage | `1.0`, `1.5`, `auto` |
| `enableCrossunderSignals.txt` | MA crossunder signals | `true`, `false` |
| `enablePerformanceMetrics.txt` | Advanced metrics | `true`, `false` |
| `enablePositionLogging.txt` | Position logging | `true`, `false` |

### Testing Features

#### Quick Tests
```bash
# Quick functionality test
node debug_tools/quick_bitflow_test.js

# Trading mechanisms test
node tests/test_trading_mechanisms.js

# Model selection test
node tests/test_fast_models.js
```

#### Comprehensive Testing
```bash
# Test all enhanced features
node tests/test_enhanced_features.js

# Test full system integration
node tests/test_final_integration.js

# Test Yahoo Finance integration
node tests/test_yfinance_integration.js
```

#### Debug Tools
```bash
# Show BitFlow output (for debugging)
node debug_tools/show_bitflow_output.js

# Run BitFlow test suite
node debug_tools/run_bitflow_test.js

# Check system status
node debug_tools/debug_settings.js
```

---

## ⚙️ Configuration

### Environment Variables

#### Required Variables
```env
ALPACA_API_KEY_ID=your_alpaca_key_id
ALPACA_SECRET_KEY=your_alpaca_secret
POLYGON_API_KEY=your_polygon_key
FINNHUB_API_KEY=your_finnhub_key
```

#### Optional Variables
```env
# UI Control
BITFLOW_MIN_UI=1                    # 1=silent, 0=verbose

# Model Selection
BITFLOW_SKIP_PREFETCH=0             # 1=skip model prefetch, 0=allow

# API Fallbacks
GEMINI_API_KEY=your_gemini_key       # For enhanced AI features
LLAMA_API_KEY=your_llama_key         # For position sizing

# Debug Options
DEBUG=bitflow:*                      # Enable debug logging
```

### Supported Timeframes
- **1Min**: 1 Minute (high frequency trading)
- **5Min**: 5 Minutes (recommended for most users)
- **15Min**: 15 Minutes (balanced approach)
- **1Hour**: 1 Hour (swing trading)
- **1Day**: 1 Day (long-term trading)

### Supported Trading Pairs
- **BTC/USD**: Bitcoin
- **ETH/USD**: Ethereum
- **XRP/USD**: Ripple
- **DOT/USD**: Polkadot
- **ADA/USD**: Cardano
- **SOL/USD**: Solana
- **AVAX/USD**: Avalanche
- **MATIC/USD**: Polygon
- And any other crypto pair supported by Alpaca

---

## 🧠 Advanced Features

### Smart Model Manager

#### Automatic Model Selection
BitFlow automatically selects the best AI model based on your system specifications:

```javascript
// System analysis includes:
// - Available RAM and CPU cores
// - System architecture and platform
// - Current memory usage
// - Performance benchmarking

const SmartModelManager = require('./core/smartModelManager');
const manager = new SmartModelManager();
await manager.initialize(); // Auto-selects optimal model
```

#### Model Recommendations
- **High-End Systems**: Advanced models for maximum accuracy
- **Mid-Range Systems**: Balanced models for good performance
- **Low-End Systems**: Lightweight models for compatibility

### Efficient Trading LLM

#### Lightweight AI Models
BitFlow uses optimized, trading-specific language models:

```javascript
const EfficientTradingLLM = require('./core/efficientTradingLLM');

// Available models:
// - Xenova/distilbert-base-uncased-finetuned-sst-2-english (66MB)
// - Xenova/distilgpt2 (82MB)
// - Xenova/bert-base-uncased (418MB)
```

#### AI-Powered Features
- **Position Sizing**: Optimal capital allocation per trade
- **Dynamic TP/SL**: Intelligent exit point calculation
- **Market Analysis**: Real-time market condition assessment
- **Risk Assessment**: Multi-factor risk evaluation
- **Sentiment Analysis**: News and social media sentiment

### Advanced Trading Strategy

#### Multi-Confirmation System
```javascript
// Signal Generation Process:
// 1. Technical Analysis (RSI, MACD, MA crossovers)
// 2. Market Regime Detection (trending/volatile/sideways)
// 3. Sentiment Analysis (news and social media)
// 4. Confidence Scoring (only high-confidence signals)
// 5. Risk Assessment (position sizing and exit points)
```

#### Dynamic Risk Management
- **Adaptive TP/SL**: Adjusts based on market volatility
- **Position Sizing**: Kelly Criterion and risk-adjusted sizing
- **Performance Monitoring**: Real-time strategy health tracking
- **Graceful Degradation**: Falls back to basic strategy if needed

### Enhanced Backtesting Engine

#### Features
- **Multi-Source Data**: Alpaca, Yahoo Finance, and Polygon integration
- **Realistic Simulation**: Market impact and slippage modeling
- **Stress Testing**: Extreme market condition simulation
- **Performance Metrics**: Sharpe ratio, max drawdown, profit factor
- **Export Capabilities**: CSV, JSON, and detailed reporting

#### Usage
```bash
# Run enhanced backtesting
node core/enhanced_backtest_engine.js

# Python backtesting (additional)
python core/backtest_engine.py data/BTCUSD_5min.csv BTCUSD
```

---

## 🏗️ Architecture & Components

### Core Components

#### Main Entry Point (`BitFlow.js`)
```javascript
// Main application entry point
// Handles initialization, settings, and trading loop
// Supports silent mode operation
```

#### Smart Model Manager (`core/smartModelManager.js`)
```javascript
// Intelligent model selection and management
// Auto-selects optimal AI models based on system specs
// Handles model switching and performance tracking
```

#### Efficient Trading LLM (`core/efficientTradingLLM.js`)
```javascript
// Lightweight, trading-specific language models
// Optimized for financial analysis and decision making
// Supports multiple model types and automatic selection
```

#### Advanced Trading Strategy (`core/advanced_trading_strategy.js`)
```javascript
// Multi-confirmation trading strategy
// Combines technical analysis with AI predictions
// Dynamic risk management and position sizing
```

#### Enhanced Backtest Engine (`core/enhanced_backtest_engine.js`)
```javascript
// Comprehensive backtesting with realistic conditions
// Multi-source data integration
// Advanced performance metrics and reporting
```

### Data Sources & APIs

#### Alpaca Trading API
- **Real-time market data**
- **Order execution and management**
- **Paper trading support**
- **Historical data access**

#### Polygon API
- **Market data and quotes**
- **News aggregation**
- **Real-time data feeds**

#### Yahoo Finance
- **Fallback data source**
- **Historical price data**
- **Market information**

#### Finnhub API
- **Market sentiment data**
- **Economic indicators**
- **Alternative data sources**

### User Interface Components

#### UI System (`core/ui.js`)
```javascript
// Professional CLI interface
// Color-coded displays and cards
// Silent mode support
// Interactive prompts and validation
```

#### Direct File Monitor (`direct_file_monitor.js`)
```javascript
// Real-time settings monitoring
// Direct file reading without caching
// Automatic settings updates
```

#### Settings Manager (`core/textSettingsManager.js`)
```javascript
// Text-based settings management
// File-based configuration system
// Validation and error handling
```

---

## 🧪 Testing & Debugging

### Test Categories

#### Quick Tests
```bash
# Basic functionality test
node debug_tools/quick_bitflow_test.js

# Trading mechanisms test
node tests/test_trading_mechanisms.js

# Model selection test
node tests/test_fast_models.js
```

#### Component Tests
```bash
# Core components test
node tests/test_core_components.js

# Data sources test
node tests/test_data_sources.js

# Settings test
node tests/test_settings.js
```

#### Integration Tests
```bash
# Full system integration
node tests/test_final_integration.js

# Enhanced features test
node tests/test_enhanced_features.js

# Yahoo Finance integration
node tests/test_yfinance_integration.js
```

### Debug Tools

#### System Diagnostics
```bash
# Show BitFlow output
node debug_tools/show_bitflow_output.js

# Run test suite
node debug_tools/run_bitflow_test.js

# Check settings
node debug_tools/debug_settings.js
```

#### Performance Monitoring
```bash
# Benchmark models
node benchmark_models.js

# Check syntax
node check_syntax.js

# Monitor file changes
node direct_file_monitor.js
```

### Troubleshooting Tools

#### Error Diagnosis
```bash
# Verify system setup
node debug_tools/verify.js

# Check API connections
node tests/test_api_connections.js

# Validate settings
node tests/test_settings_validation.js
```

#### Performance Analysis
```bash
# Analyze model performance
node tests/test_model_performance.js

# Check memory usage
node tests/test_memory_usage.js

# Monitor trading performance
node tests/test_trading_performance.js
```

---

## 🔧 Troubleshooting

### Common Issues

#### Silent Mode Not Working
**Problem**: Console output still appears despite `BITFLOW_MIN_UI=1`
**Solution**:
```bash
# Ensure environment variable is set correctly
$env:BITFLOW_MIN_UI=1; node bitflow.js BTC/USD

# Check for any console.log statements not respecting the setting
# All output should be suppressed in silent mode
```

#### Model Initialization Errors
**Problem**: `displayModelInfo is not a function` or similar errors
**Solution**:
```bash
# Ensure all dependencies are installed
npm install

# Check model availability
node tests/test_fast_models.js

# Verify system requirements (8GB+ RAM recommended)
```

#### API Connection Issues
**Problem**: Cannot connect to trading APIs
**Solution**:
```bash
# Verify API keys in .env file
# Check internet connection
# Test API endpoints individually
node tests/test_api_connections.js
```

#### Settings Not Applying
**Problem**: Settings changes not taking effect
**Solution**:
```bash
# Edit settings files directly in user_settings/ directory
# Restart the application after changes
# Check file permissions and syntax
```

#### Performance Issues
**Problem**: Slow response times or high resource usage
**Solution**:
```bash
# Monitor system resources
# Consider using lighter models
# Check for memory leaks
node tests/test_memory_usage.js
```

### Debug Mode

#### Enable Debug Logging
```bash
# Enable all debug logging
DEBUG=* node bitflow.js BTC/USD

# Enable specific component logging
DEBUG=bitflow:api node bitflow.js BTC/USD
DEBUG=bitflow:ml node bitflow.js BTC/USD
DEBUG=bitflow:strategy node bitflow.js BTC/USD
```

#### Verbose Output
```bash
# Disable silent mode for detailed output
$env:BITFLOW_MIN_UI=0; node bitflow.js BTC/USD

# Monitor all system activities
# Check initialization process
# Review model selection and loading
```

### Getting Help

#### Diagnostic Steps
1. **Check Error Logs**: Review logs in the `logs/` directory
2. **Run Diagnostics**: Use `node debug_tools/verify.js`
3. **Test Components**: Run individual component tests
4. **Check System Resources**: Monitor CPU and memory usage

#### Support Channels
- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Comprehensive guides and API docs
- **Community**: GitHub Discussions for community support

---

## 📚 Documentation

### Complete Documentation Suite

#### Core Documentation
- **[README.md](README.md)** - This comprehensive guide
- **[SETUP_GUIDE.md](documentation/SETUP_GUIDE.md)** - Detailed setup instructions
- **[API_REFERENCE.md](documentation/API_REFERENCE.md)** - Complete API documentation

#### Feature Documentation
- **[SMART_MODEL_MANAGER.md](documentation/SMART_MODEL_MANAGER.md)** - AI model selection system
- **[EFFICIENT_LLM.md](documentation/EFFICIENT_LLM.md)** - Lightweight trading AI
- **[ADVANCED_STRATEGY.md](documentation/ADVANCED_STRATEGY.md)** - Trading strategy details
- **[BACKTESTING.md](documentation/BACKTESTING.md)** - Backtesting capabilities

#### Technical Documentation
- **[ARCHITECTURE.md](documentation/ARCHITECTURE.md)** - System architecture
- **[CONFIGURATION.md](documentation/CONFIGURATION.md)** - Configuration options
- **[TROUBLESHOOTING.md](documentation/TROUBLESHOOTING.md)** - Problem solving guide
- **[PERFORMANCE.md](documentation/PERFORMANCE.md)** - Performance optimization

#### Testing & Development
- **[TESTING.md](documentation/TESTING.md)** - Testing procedures
- **[CONTRIBUTING.md](documentation/CONTRIBUTING.md)** - Development guidelines
- **[DEPLOYMENT.md](documentation/DEPLOYMENT.md)** - Deployment instructions

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup
```bash
# Clone the repository
git clone https://github.com/MeridianAlgo/Bitflow.git
cd Bitflow

# Install dependencies
npm install

# Run tests
npm test

# Start development
$env:BITFLOW_MIN_UI=0; node bitflow.js BTC/USD
```

### Contribution Guidelines

#### Code Standards
- Use consistent formatting and style
- Add comments for complex logic
- Follow existing patterns and conventions
- Include error handling

#### Testing Requirements
- Add tests for new features
- Update existing tests for changes
- Ensure all tests pass before submitting
- Include both unit and integration tests

#### Documentation
- Update relevant documentation files
- Add inline code comments
- Include usage examples
- Update README if needed

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request with detailed description

---

## 📞 Support & Community

### Getting Help
- **GitHub Issues**: [Create an issue](https://github.com/MeridianAlgo/Bitflow/issues)
- **Discussions**: [GitHub Discussions](https://github.com/MeridianAlgo/Bitflow/discussions)
- **Documentation**: Comprehensive guides and references
- **Community**: Open source community support

### Resources
- **Repository**: [MeridianAlgo/Bitflow](https://github.com/MeridianAlgo/Bitflow)
- **Issues**: Bug reports and feature requests
- **Discussions**: Community support and ideas
- **Wiki**: Additional documentation and guides

### Professional Support
For enterprise support, custom development, or consulting services, please contact the development team.

---

## 🚨 Risk Disclaimer

**⚠️ IMPORTANT: This software is for educational and research purposes only.**

- Cryptocurrency trading involves substantial risk of loss and is not suitable for everyone
- Past performance does not guarantee future results
- Always conduct your own research before making investment decisions
- Consider consulting with a financial advisor
- The developers are not responsible for any financial losses
- Use paper trading to test strategies before live trading
- Never invest more than you can afford to lose
- Understand that leverage can amplify both gains and losses

**Always trade responsibly and never risk more than you can afford to lose.**

---

## 📄 License

This project is licensed under the [MIT License](LICENSE)

---
## A Quick Disclaimer

This material is for informational purposes only and does not constitute financial, investment, legal, tax, or accounting advice. It is not intended to provide personalized recommendations or solicitations to buy or sell any securities or financial products.
Investing involves substantial risks, including the potential loss of principal. Market conditions, economic factors, and other variables can lead to volatility and losses. Past performance is not indicative of future results; historical returns do not guarantee similar outcomes.
Always consult a qualified financial advisor, attorney, or tax professional to assess your specific situation, risk tolerance, and objectives before making any investment decisions. We assume no liability for actions taken based on this information.

---

**Made with ❤️ by Quantum Meridian (A MeridianAlgo Team)**

*Empowering the next generation of quantitative finance professionals through hands-on learning and practical implementation.*


