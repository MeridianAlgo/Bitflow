# BitFlow API Reference 📚

**Complete API Documentation for Developers**

This comprehensive API reference provides detailed information about all BitFlow classes, methods, interfaces, and integration points for developers building applications or integrations.

---

## 📋 Table of Contents

- [Core Classes](#core-classes)
  - [BitFlow Class](#bitflow-class)
  - [SmartModelManager Class](#smartmodelmanager-class)
  - [EfficientTradingLLM Class](#efficienttradingllm-class)
  - [AdvancedTradingStrategy Class](#advancedtradingstrategy-class)
  - [EnhancedMLEngine Class](#enhancedmlengine-class)
  - [EnhancedBacktestEngine Class](#enhancedbacktestengine-class)
- [Utility Classes](#utility-classes)
  - [TradeUtils Class](#tradeutils-class)
  - [APIHelpers Class](#apihelpers-class)
  - [UI Class](#ui-class)
  - [ErrorHandler Class](#errorhandler-class)
  - [SettingsManager Class](#settingsmanager-class)
- [Data Models](#data-models)
  - [MarketData Interface](#marketdata-interface)
  - [TradingSignal Interface](#tradingsignal-interface)
  - [Position Interface](#position-interface)
  - [PerformanceMetrics Interface](#performancemetrics-interface)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Settings Files](#settings-files)
  - [API Endpoints](#api-endpoints)
- [Integration Examples](#integration-examples)
  - [Basic Trading Bot](#basic-trading-bot)
  - [Custom Strategy Integration](#custom-strategy-integration)
  - [Data Analysis Integration](#data-analysis-integration)
- [Event System](#event-system)
  - [Event Types](#event-types)
  - [Event Listeners](#event-listeners)
  - [Custom Events](#custom-events)
- [Testing API](#testing-api)
  - [Unit Testing](#unit-testing)
  - [Integration Testing](#integration-testing)
  - [Mock Objects](#mock-objects)

---

## 🏗️ Core Classes

### BitFlow Class

The main BitFlow trading engine class that orchestrates all trading activities.

#### Constructor
```javascript
const BitFlow = require('./core/BitFlow');

const bitflow = new BitFlow(symbol, options);
```

**Parameters:**
- `symbol` (string): Trading pair symbol (e.g., 'BTC/USD')
- `options` (object): Configuration options

**Options:**
```javascript
{
  // Trading parameters
  baseLength: 20,           // Moving average base length
  evalPeriod: 20,           // Evaluation period
  timeframe: '5Min',        // Chart timeframe
  takeProfit: 'auto',       // Take profit percentage
  stopLoss: 'auto',         // Stop loss percentage

  // Feature flags
  enablePositionLogging: true,    // Enable position logging
  enableCrossunderSignals: true,  // Enable MA crossunder signals
  enablePerformanceMetrics: true, // Enable performance metrics

  // Advanced options
  limit: 1000,              // Data limit for backtesting
  maParams: {},             // Moving average parameters
  riskTolerance: 'medium'   // Risk tolerance level
}
```

#### Methods

##### Core Methods
```javascript
// Initialize the trading system
await bitflow.initialize()

// Start market monitoring
await bitflow.startMonitoring()

// Stop market monitoring
bitflow.stopMonitoring()

// Execute a trade
await bitflow.executeTrade(signal, amount, price)

// Get current position
const position = bitflow.getCurrentPosition()

// Get account balance
const balance = await bitflow.getAccountBalance()

// Update moving average parameters
bitflow.updateMAParams(newParams)
```

##### Data Access Methods
```javascript
// Get historical data
const historicalData = await bitflow.getHistoricalData(limit)

// Get current market data
const marketData = bitflow.getCurrentMarketData()

// Get performance metrics
const metrics = bitflow.getPerformanceMetrics()

// Get system status
const status = bitflow.getSystemStatus()
```

##### Configuration Methods
```javascript
// Update trading parameters
bitflow.updateParameters(newParams)

// Switch trading strategy
await bitflow.switchStrategy(strategyName)

// Enable/disable features
bitflow.setFeatureFlag(feature, enabled)
```

#### Events
```javascript
// Listen for trading signals
bitflow.on('signal', (signal) => {
  console.log('New signal:', signal);
});

// Listen for position updates
bitflow.on('positionUpdate', (position) => {
  console.log('Position updated:', position);
});

// Listen for performance metrics
bitflow.on('metrics', (metrics) => {
  console.log('Performance:', metrics);
});
```

### SmartModelManager Class

Intelligent AI model selection and management system.

#### Constructor
```javascript
const SmartModelManager = require('./core/smartModelManager');

const modelManager = new SmartModelManager(llmInstance);
```

#### Methods

##### Model Management
```javascript
// Initialize with optimal model selection
await modelManager.initialize()

// Select optimal model based on system specs
const modelId = modelManager.selectOptimalModel()

// Get model recommendations for different tasks
const recommendations = modelManager.getModelRecommendations()

// Switch to different model
await modelManager.switchModel(modelId)

// Run performance benchmark
const benchmark = await modelManager.runQuickBenchmark()
```

##### System Analysis
```javascript
// Analyze system specifications
const specs = modelManager.analyzeSystem()

// Get system status
const status = modelManager.getSystemStatus()

// Display system status
modelManager.displaySystemStatus()

// Get performance statistics
const stats = modelManager.getPerformanceStats()
```

##### Trading Integration
```javascript
// Get trading decision with optimal model
const decision = await modelManager.getTradingDecision(marketData, signal)

// Analyze sentiment with optimal model
const sentiment = await modelManager.analyzeSentiment(text)

// Calculate optimal position size
const positionSize = await modelManager.calculateOptimalPositionSize(capital, marketData)

// Calculate optimal TP/SL levels
const tpSl = await modelManager.calculateOptimalTPSL(marketData, signal)

// Assess market risk
const risk = await modelManager.assessMarketRisk(marketData, newsText)
```

### EfficientTradingLLM Class

Lightweight, trading-specific language model system.

#### Constructor
```javascript
const EfficientTradingLLM = require('./core/efficientTradingLLM');

const llm = new EfficientTradingLLM();
```

#### Methods

##### Model Management
```javascript
// Initialize specific model
await llm.initializeModel(modelId)

// Get available models
const models = llm.getAvailableModels()

// Display model information
llm.displayModelInfo(modelId)

// List all available models
llm.listModels()

// Switch to different model
await llm.switchModel(modelId)
```

##### AI Analysis
```javascript
// Analyze market sentiment
const sentiment = await llm.analyzeSentiment(text)

// Generate trading reasoning
const reasoning = await llm.generateTradingReasoning(marketData, signal)

// Calculate optimal TP/SL levels
const tpSl = await llm.calculateOptimalTPSL(marketData, signal)

// Calculate optimal position size
const positionSize = await llm.calculateOptimalPositionSize(capital, marketData)

// Assess market risk
const risk = await llm.assessMarketRisk(marketData, newsText)
```

##### Utility Methods
```javascript
// Clean text for analysis
const cleanText = llm.cleanTextForAnalysis(text)

// Convert sentiment result
const sentiment = llm.convertToTradingSentiment(result)

// Prepare trading context
const context = llm.prepareTradingContext(marketData, signal)

// Get performance metrics
const metrics = llm.getPerformanceMetrics()
```

### AdvancedTradingStrategy Class

Multi-confirmation trading strategy with advanced risk management.

#### Constructor
```javascript
const AdvancedTradingStrategy = require('./core/advancedTradingStrategy');

const strategy = new AdvancedTradingStrategy(monitor);
```

#### Methods

##### Signal Generation
```javascript
// Generate advanced trading signal
const signal = await strategy.generateAdvancedSignal(marketData)

// Generate multi-timeframe signal
const mtfSignal = await strategy.generateMTFSignal(marketData)

// Calculate signal confidence
const confidence = strategy.calculateSignalConfidence(signal)
```

##### Position Management
```javascript
// Calculate optimal position size
const positionSize = strategy.calculateOptimalPositionSize(balance, price, signal)

// Calculate dynamic TP/SL levels
const levels = strategy.calculateDynamicTPSL(marketData, signal)

// Adjust position based on market conditions
const adjustment = strategy.adjustPositionForMarket(marketData, position)
```

##### Risk Management
```javascript
// Assess trade risk
const risk = strategy.assessTradeRisk(marketData, signal, positionSize)

// Calculate risk-adjusted position
const riskPosition = strategy.calculateRiskAdjustedPosition(marketData, balance)

// Apply risk controls
const controls = strategy.applyRiskControls(marketData, position)
```

### EnhancedMLEngine Class

Advanced machine learning engine with 50+ technical indicators.

#### Constructor
```javascript
const EnhancedMLEngine = require('./core/enhanced_ml_engine');

const mlEngine = new EnhancedMLEngine();
```

#### Methods

##### Feature Extraction
```javascript
// Extract technical indicators
const features = mlEngine.extractFeatures(marketData)

// Extract advanced features
const advancedFeatures = mlEngine.extractAdvancedFeatures(marketData)

// Get feature importance
const importance = mlEngine.getFeatureImportance()
```

##### Market Analysis
```javascript
// Detect market regime
const regime = mlEngine.detectMarketRegime(marketData)

// Analyze price patterns
const patterns = mlEngine.analyzePricePatterns(marketData)

// Calculate support/resistance levels
const levels = mlEngine.calculateSupportResistance(marketData)
```

##### Signal Processing
```javascript
// Process raw signals
const processedSignal = mlEngine.processSignal(rawSignal)

// Combine multiple signals
const combinedSignal = mlEngine.combineSignals(signals)

// Validate signal quality
const isValid = mlEngine.validateSignal(signal)
```

### EnhancedBacktestEngine Class

Comprehensive backtesting engine with realistic market simulation.

#### Constructor
```javascript
const EnhancedBacktestEngine = require('./core/enhanced_backtest_engine');

const backtestEngine = new EnhancedBacktestEngine();
```

#### Methods

##### Backtesting
```javascript
// Run backtest with historical data
const results = await backtestEngine.runBacktest(data, strategy, parameters)

// Run multi-symbol backtest
const multiResults = await backtestEngine.runMultiSymbolBacktest(symbols, strategy)

// Run stress test
const stressResults = await backtestEngine.runStressTest(data, scenarios)
```

##### Data Management
```javascript
// Load historical data
const data = await backtestEngine.loadHistoricalData(symbol, timeframe, limit)

// Generate synthetic data
const syntheticData = backtestEngine.generateSyntheticData(baseData, scenarios)

// Export results
await backtestEngine.exportResults(results, format, filename)
```

##### Analysis
```javascript
// Calculate performance metrics
const metrics = backtestEngine.calculatePerformanceMetrics(results)

// Optimize strategy parameters
const optimizedParams = await backtestEngine.optimizeParameters(data, strategy)

// Compare strategies
const comparison = backtestEngine.compareStrategies(data, strategies)
```

---

## 🛠️ Utility Classes

### TradeUtils Class

Trading utilities and execution helpers.

#### Methods
```javascript
// Execute trade
await TradeUtils.executeTrade(signal, amount, price, options)

// Calculate position size
const size = TradeUtils.calculatePositionSize(balance, risk, price)

// Calculate fees
const fees = TradeUtils.calculateFees(amount, price, type)

// Validate order
const isValid = TradeUtils.validateOrder(order)
```

### APIHelpers Class

API integration and data fetching utilities.

#### Methods
```javascript
// Fetch market data from Alpaca
const data = await APIHelpers.fetchAlpacaData(symbol, timeframe, limit)

// Fetch data from Yahoo Finance
const data = await APIHelpers.fetchYahooData(symbol, timeframe, limit)

// Fetch news from Polygon
const news = await APIHelpers.fetchPolygonNews(symbol, limit)

// Fetch sentiment from Finnhub
const sentiment = await APIHelpers.fetchFinnhubSentiment(symbol)
```

### UI Class

User interface components and display utilities.

#### Methods
```javascript
// Display trading card
UI.printCard(title, content, options)

// Display table
UI.printTable(data, headers, options)

// Display status message
UI.printStatus(message, type)

// Display error message
UI.printError(message)
```

### ErrorHandler Class

Centralized error handling and logging.

#### Methods
```javascript
// Handle trading error
ErrorHandler.handleTradingError(error, context, symbol)

// Handle API error
ErrorHandler.handleAPIError(error, api, endpoint)

// Log error
ErrorHandler.logError(error, level, context)
```

### SettingsManager Class

Settings management and validation.

#### Methods
```javascript
// Load all settings
const settings = SettingsManager.loadAllSettings()

// Save setting
SettingsManager.saveSetting(key, value)

// Validate settings
const isValid = SettingsManager.validateSettings(settings)

// Get default settings
const defaults = SettingsManager.getDefaults()
```

---

## 📊 Data Models

### MarketData Interface
```javascript
interface MarketData {
  symbol: string;           // Trading pair symbol
  price: number;            // Current price
  timestamp: number;        // Unix timestamp
  volume: number;           // Trading volume
  rsi: number;              // RSI indicator
  macd: MACDData;          // MACD data
  ma_fast: number;          // Fast moving average
  ma_slow: number;          // Slow moving average
  volatility: number;       // Price volatility
  trend: string;            // Market trend
  regime: string;           // Market regime
}
```

### TradingSignal Interface
```javascript
interface TradingSignal {
  type: 'BUY' | 'SELL' | 'HOLD';  // Signal type
  confidence: number;             // Confidence score (0-1)
  strength: number;               // Signal strength
  price: number;                  // Suggested price
  amount: number;                 // Suggested amount
  reasoning: string;              // Signal reasoning
  indicators: IndicatorData[];    // Supporting indicators
  timestamp: number;              // Signal timestamp
}
```

### Position Interface
```javascript
interface Position {
  id: string;               // Position ID
  symbol: string;           // Trading pair
  type: 'long' | 'short';   // Position type
  entryPrice: number;       // Entry price
  currentPrice: number;     // Current price
  amount: number;           // Position amount
  value: number;            // Position value
  pnl: number;              // Profit/loss
  pnlPercent: number;       // Profit/loss percentage
  stopLoss: number;         // Stop loss level
  takeProfit: number;       // Take profit level
  status: 'open' | 'closed'; // Position status
  timestamp: number;        // Position timestamp
}
```

### PerformanceMetrics Interface
```javascript
interface PerformanceMetrics {
  totalTrades: number;           // Total number of trades
  winningTrades: number;         // Number of winning trades
  losingTrades: number;          // Number of losing trades
  winRate: number;               // Win rate percentage
  totalPnL: number;              // Total profit/loss
  averageWin: number;            // Average winning trade
  averageLoss: number;           // Average losing trade
  profitFactor: number;          // Profit factor
  sharpeRatio: number;           // Sharpe ratio
  maxDrawdown: number;           // Maximum drawdown
  maxDrawdownPercent: number;    // Maximum drawdown percentage
  averageTrade: number;          // Average trade duration
  totalVolume: number;           // Total trading volume
}
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
NODE_ENV=production                 # Set environment mode

# Performance
NODE_OPTIONS=--max-old-space-size=4096  # Set Node.js memory limit
UV_THREADPOOL_SIZE=4                # Set thread pool size
```

### Settings Files

#### Core Settings
- `defaultTimeframe.txt` - Trading timeframe
- `defaultTakeProfit.txt` - Take profit percentage
- `defaultStopLoss.txt` - Stop loss percentage
- `enableCrossunderSignals.txt` - MA crossunder signals
- `enablePerformanceMetrics.txt` - Advanced metrics
- `enablePositionLogging.txt` - Position logging

#### Advanced Settings
- `riskTolerance.txt` - Risk tolerance level
- `maxPositionSize.txt` - Maximum position size
- `minConfidence.txt` - Minimum signal confidence
- `maxDrawdown.txt` - Maximum allowed drawdown
- `rebalanceFrequency.txt` - Portfolio rebalancing frequency

### API Endpoints

#### Alpaca Trading API
```javascript
// Base URL
const ALPACA_BASE_URL = 'https://paper-api.alpaca.markets';

// Endpoints
const ENDPOINTS = {
  ACCOUNT: '/v2/account',
  ORDERS: '/v2/orders',
  POSITIONS: '/v2/positions',
  ASSETS: '/v2/assets',
  MARKET_DATA: '/v2/stocks/quotes'
};
```

#### Polygon API
```javascript
// Base URL
const POLYGON_BASE_URL = 'https://api.polygon.io';

// Endpoints
const ENDPOINTS = {
  AGGREGATES: '/v2/aggs/ticker',
  QUOTES: '/v2/quotes',
  TRADES: '/v2/trades',
  NEWS: '/v2/reference/news'
};
```

#### Finnhub API
```javascript
// Base URL
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Endpoints
const ENDPOINTS = {
  QUOTE: '/quote',
  COMPANY_NEWS: '/company-news',
  MARKET_NEWS: '/news',
  SENTIMENT: '/news-sentiment'
};
```

---

## 💡 Integration Examples

### Basic Trading Bot

```javascript
const BitFlow = require('./core/BitFlow');

class SimpleTradingBot {
  constructor() {
    this.bitflow = new BitFlow('BTC/USD', {
      timeframe: '5Min',
      takeProfit: 2.0,
      stopLoss: 1.5
    });
  }

  async start() {
    // Initialize the system
    await this.bitflow.initialize();

    // Set up event listeners
    this.bitflow.on('signal', this.handleSignal.bind(this));
    this.bitflow.on('positionUpdate', this.handlePositionUpdate.bind(this));

    // Start monitoring
    await this.bitflow.startMonitoring();
  }

  async handleSignal(signal) {
    console.log('Received signal:', signal);

    if (signal.confidence > 0.7) {
      await this.bitflow.executeTrade(signal);
    }
  }

  async handlePositionUpdate(position) {
    console.log('Position updated:', position);

    // Implement position management logic
    if (position.pnlPercent < -5) {
      // Close losing position
      await this.bitflow.closePosition(position.id);
    }
  }
}

// Start the bot
const bot = new SimpleTradingBot();
bot.start().catch(console.error);
```

### Custom Strategy Integration

```javascript
const AdvancedTradingStrategy = require('./core/advancedTradingStrategy');

class CustomStrategy extends AdvancedTradingStrategy {
  async generateCustomSignal(marketData) {
    // Implement custom signal generation logic
    const customIndicator = this.calculateCustomIndicator(marketData);
    const marketRegime = this.detectMarketRegime(marketData);
    const sentiment = await this.analyzeSentiment(marketData);

    // Combine factors into signal
    const signal = this.combineCustomFactors(
      customIndicator,
      marketRegime,
      sentiment
    );

    return signal;
  }

  calculateCustomIndicator(marketData) {
    // Custom indicator calculation
    const indicator = marketData.price * marketData.volume / 1000000;
    return indicator;
  }

  combineCustomFactors(indicator, regime, sentiment) {
    // Custom signal combination logic
    let signalStrength = 0;
    let confidence = 0.5;

    if (indicator > 100) signalStrength += 0.3;
    if (regime === 'trending') signalStrength += 0.4;
    if (sentiment === 'bullish') signalStrength += 0.3;

    if (signalStrength > 0.6) confidence = 0.8;

    return {
      type: signalStrength > 0.5 ? 'BUY' : 'SELL',
      strength: signalStrength,
      confidence: confidence,
      reasoning: `Custom strategy: indicator=${indicator}, regime=${regime}, sentiment=${sentiment}`
    };
  }
}
```

### Data Analysis Integration

```javascript
const EnhancedMLEngine = require('./core/enhanced_ml_engine');

class DataAnalysisTool {
  constructor() {
    this.mlEngine = new EnhancedMLEngine();
  }

  async analyzeMarketData(data) {
    // Extract features
    const features = this.mlEngine.extractFeatures(data);

    // Detect patterns
    const patterns = this.mlEngine.analyzePricePatterns(data);

    // Calculate support/resistance
    const levels = this.mlEngine.calculateSupportResistance(data);

    // Generate analysis report
    const report = {
      features: features,
      patterns: patterns,
      levels: levels,
      regime: this.mlEngine.detectMarketRegime(data),
      indicators: this.getAllIndicators(data)
    };

    return report;
  }

  getAllIndicators(data) {
    return {
      rsi: this.mlEngine.calculateRSI(data),
      macd: this.mlEngine.calculateMACD(data),
      bollinger: this.mlEngine.calculateBollingerBands(data),
      stochastic: this.mlEngine.calculateStochastic(data),
      atr: this.mlEngine.calculateATR(data)
    };
  }
}
```

---

## 📡 Event System

### Event Types

#### Trading Events
```javascript
// Signal generated
bitflow.emit('signal', {
  type: 'BUY',
  confidence: 0.85,
  price: 45000,
  amount: 0.001
});

// Position opened
bitflow.emit('positionOpened', {
  id: 'pos_123',
  symbol: 'BTC/USD',
  type: 'long',
  amount: 0.001,
  price: 45000
});

// Position closed
bitflow.emit('positionClosed', {
  id: 'pos_123',
  symbol: 'BTC/USD',
  pnl: 150,
  pnlPercent: 3.33
});
```

#### System Events
```javascript
// Model loaded
smartModelManager.emit('modelLoaded', {
  modelId: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
  loadTime: 2500
});

// Performance metrics updated
bitflow.emit('metrics', {
  winRate: 68,
  sharpeRatio: 1.45,
  totalPnL: 1250
});

// Error occurred
errorHandler.emit('error', {
  type: 'API_ERROR',
  message: 'Failed to fetch market data',
  context: { symbol: 'BTC/USD' }
});
```

### Event Listeners

#### Basic Event Listener
```javascript
// Listen for all signals
bitflow.on('signal', (signal) => {
  console.log('Signal received:', signal);
  // Process signal
});

// Listen for position updates
bitflow.on('positionUpdate', (position) => {
  console.log('Position updated:', position);
  // Update dashboard
});

// Listen for errors
bitflow.on('error', (error) => {
  console.error('Error occurred:', error);
  // Handle error
});
```

#### Advanced Event Handling
```javascript
// Multiple event listeners
const signalHandler = (signal) => {
  if (signal.confidence > 0.8) {
    executeTrade(signal);
  }
};

bitflow.on('signal', signalHandler);

// Remove event listener
bitflow.off('signal', signalHandler);

// Listen once
bitflow.once('positionOpened', (position) => {
  notifyUser('New position opened', position);
});
```

### Custom Events

#### Creating Custom Events
```javascript
class CustomEventEmitter extends EventEmitter {
  emitCustomSignal(signalData) {
    this.emit('customSignal', {
      type: 'CUSTOM',
      data: signalData,
      timestamp: Date.now()
    });
  }

  emitMarketAlert(alertData) {
    this.emit('marketAlert', {
      level: 'WARNING',
      message: alertData.message,
      symbol: alertData.symbol
    });
  }
}
```

#### Event-Driven Architecture
```javascript
// Event-driven trading system
class EventDrivenBot {
  constructor() {
    this.bitflow = new BitFlow('BTC/USD');
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Signal processing pipeline
    this.bitflow.on('signal', this.validateSignal.bind(this));
    this.bitflow.on('signal', this.assessRisk.bind(this));
    this.bitflow.on('signal', this.executeTrade.bind(this));

    // Position management pipeline
    this.bitflow.on('positionOpened', this.setStopLoss.bind(this));
    this.bitflow.on('positionOpened', this.setTakeProfit.bind(this));
    this.bitflow.on('positionUpdate', this.monitorPosition.bind(this));
  }

  async validateSignal(signal) {
    // Validate signal quality
    if (signal.confidence < 0.7) {
      this.bitflow.emit('signalRejected', { signal, reason: 'Low confidence' });
      return;
    }
    this.bitflow.emit('signalValidated', signal);
  }

  async assessRisk(signal) {
    // Assess trade risk
    const risk = await this.calculateRisk(signal);
    if (risk > this.maxRisk) {
      this.bitflow.emit('signalRejected', { signal, reason: 'High risk' });
      return;
    }
    this.bitflow.emit('riskAssessed', { signal, risk });
  }

  async executeTrade(signal) {
    // Execute the trade
    try {
      const result = await this.bitflow.executeTrade(signal);
      this.bitflow.emit('tradeExecuted', result);
    } catch (error) {
      this.bitflow.emit('tradeFailed', { signal, error });
    }
  }
}
```

---

## 🧪 Testing API

### Unit Testing

#### Testing Individual Components
```javascript
const assert = require('assert');
const BitFlow = require('./core/BitFlow');

describe('BitFlow', () => {
  let bitflow;

  beforeEach(() => {
    bitflow = new BitFlow('BTC/USD', {
      timeframe: '5Min',
      takeProfit: 2.0,
      stopLoss: 1.5
    });
  });

  describe('#calculatePositionSize', () => {
    it('should calculate correct position size', () => {
      const balance = 1000;
      const risk = 0.02;
      const price = 50000;

      const size = bitflow.calculatePositionSize(balance, risk, price);
      assert.equal(size, 0.4); // 1000 * 0.02 / 50000
    });
  });

  describe('#validateSignal', () => {
    it('should validate signal correctly', () => {
      const signal = {
        type: 'BUY',
        confidence: 0.8,
        price: 50000
      };

      const isValid = bitflow.validateSignal(signal);
      assert.equal(isValid, true);
    });
  });
});
```

### Integration Testing

#### Testing System Integration
```javascript
describe('BitFlow Integration', () => {
  let bitflow;

  before(async () => {
    bitflow = new BitFlow('BTC/USD', {
      timeframe: '5Min',
      enablePositionLogging: false
    });
    await bitflow.initialize();
  });

  describe('End-to-End Trading', () => {
    it('should execute complete trade cycle', async () => {
      // Mock market data
      const marketData = {
        symbol: 'BTC/USD',
        price: 50000,
        rsi: 65,
        trend: 'bullish'
      };

      // Generate signal
      const signal = await bitflow.generateSignal(marketData);
      assert(signal.type === 'BUY' || signal.type === 'SELL');

      // Execute trade
      const result = await bitflow.executeTrade(signal);
      assert(result.success === true);

      // Verify position
      const position = bitflow.getCurrentPosition();
      assert(position.symbol === 'BTC/USD');
    });
  });
});
```

### Mock Objects

#### Mock API Responses
```javascript
const mockAlpacaResponse = {
  id: 'order_123',
  symbol: 'BTC/USD',
  qty: 0.001,
  filled_qty: 0.001,
  status: 'filled',
  side: 'buy',
  type: 'market'
};

const mockMarketData = {
  symbol: 'BTC/USD',
  price: 50000,
  timestamp: Date.now(),
  volume: 1250000,
  rsi: 65,
  macd: { signal: 1250, histogram: 45 },
  ma_fast: 49500,
  ma_slow: 48500,
  volatility: 0.025,
  trend: 'bullish'
};
```

#### Mock Event Handlers
```javascript
const mockEventHandlers = {
  onSignal: (signal) => {
    console.log('Mock signal handler:', signal);
    return Promise.resolve();
  },

  onPositionUpdate: (position) => {
    console.log('Mock position handler:', position);
    return Promise.resolve();
  },

  onError: (error) => {
    console.error('Mock error handler:', error);
    return Promise.resolve();
  }
};
```

---

*This API reference provides comprehensive documentation for developers integrating with or extending BitFlow. For additional examples and detailed implementation guides, please refer to the individual component documentation files and code comments.*
