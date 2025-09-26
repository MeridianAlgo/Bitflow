# Configuration Options ⚙️

**Complete Configuration Guide for BitFlow**

This guide provides comprehensive information about all configuration options available in BitFlow, including environment variables, settings files, and runtime parameters.

---

## 📋 Table of Contents

- [Environment Variables](#environment-variables)
  - [Required Variables](#required-variables)
  - [Optional Variables](#optional-variables)
  - [Advanced Variables](#advanced-variables)
- [Settings Files](#settings-files)
  - [Core Settings](#core-settings)
  - [Advanced Settings](#advanced-settings)
  - [Custom Settings](#custom-settings)
- [Runtime Configuration](#runtime-configuration)
  - [Command-Line Options](#command-line-options)
  - [Dynamic Configuration](#dynamic-configuration)
  - [Configuration Validation](#configuration-validation)
- [API Configuration](#api-configuration)
  - [Alpaca Settings](#alpaca-settings)
  - [Polygon Settings](#polygon-settings)
  - [Yahoo Finance Settings](#yahoo-finance-settings)
- [Model Configuration](#model-configuration)
  - [AI Model Settings](#ai-model-settings)
  - [Performance Tuning](#performance-tuning)
  - [Memory Management](#memory-management)

---

## ⚙️ Environment Variables

### Required Variables

#### Core API Keys
```env
# Alpaca Trading API (Required)
ALPACA_API_KEY_ID=PKXXXXXXXXXXXXXXXXXXXX
ALPACA_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Market Data APIs (Required)
POLYGON_API_KEY=xxxxxxxxxxxxxxxxxxxx
FINNHUB_API_KEY=xxxxxxxxxxxxxxxxxxxx
```

#### Trading Configuration
```env
# Trading Parameters
BITFLOW_SYMBOL=BTC/USD              # Default trading symbol
BITFLOW_TIMEFRAME=5min              # Default timeframe
BITFLOW_INITIAL_BALANCE=10000       # Initial account balance
BITFLOW_RISK_TOLERANCE=medium       # Risk tolerance level
```

### Optional Variables

#### UI Control
```env
# User Interface
BITFLOW_MIN_UI=1                    # 1=silent, 0=verbose
BITFLOW_DEBUG_MODE=0                # 1=debug mode, 0=normal
BITFLOW_LOG_LEVEL=info             # Log level (debug, info, warn, error)
BITFLOW_COLOR_OUTPUT=1              # 1=colorized output, 0=plain text
```

#### Model Selection
```env
# AI Model Configuration
BITFLOW_MODEL_TYPE=balanced         # lightweight, balanced, high-performance
BITFLOW_DEFAULT_MODEL=Xenova/distilbert-base-uncased-finetuned-sst-2-english
BITFLOW_SKIP_PREFETCH=0             # 1=skip model prefetch, 0=allow
BITFLOW_MODEL_TIMEOUT=30000         # Model loading timeout (ms)
```

#### Performance Optimization
```env
# Performance Settings
BITFLOW_MAX_MEMORY=4096             # Max memory usage (MB)
BITFLOW_CPU_CORES=4                 # CPU cores to use
BITFLOW_BATCH_SIZE=10               # Processing batch size
BITFLOW_CACHE_ENABLED=1             # Enable caching
BITFLOW_CACHE_SIZE=2048             # Cache size (MB)
```

### Advanced Variables

#### System Configuration
```env
# System Settings
NODE_ENV=production                 # Environment (development, production)
NODE_OPTIONS=--max-old-space-size=4096
UV_THREADPOOL_SIZE=4                # Thread pool size
BITFLOW_WORKERS=2                   # Number of worker processes
```

#### Network Configuration
```env
# Network Settings
HTTP_PROXY=http://proxy:8080        # HTTP proxy
HTTPS_PROXY=https://proxy:8080      # HTTPS proxy
NO_PROXY=localhost,127.0.0.1        # No proxy list
BITFLOW_TIMEOUT=30000               # Request timeout (ms)
BITFLOW_RETRIES=3                   # Retry attempts
```

#### Security Configuration
```env
# Security Settings
BITFLOW_ENCRYPTION=1                # Enable data encryption
BITFLOW_SSL_VERIFY=1                # Verify SSL certificates
BITFLOW_API_RATE_LIMIT=100          # API rate limit per minute
BITFLOW_IP_WHITELIST=192.168.1.0/24 # Allowed IP addresses
```

---

## 📁 Settings Files

### Core Settings

#### Trading Settings (`user_settings/`)
```bash
# Timeframe Configuration
echo "5min" > user_settings/defaultTimeframe.txt

# Risk Management
echo "2.0" > user_settings/defaultTakeProfit.txt
echo "1.5" > user_settings/defaultStopLoss.txt

# Feature Flags
echo "true" > user_settings/enableCrossunderSignals.txt
echo "true" > user_settings/enablePerformanceMetrics.txt
echo "true" > user_settings/enablePositionLogging.txt
```

#### Advanced Settings
```bash
# Risk Tolerance
echo "medium" > user_settings/riskTolerance.txt

# Position Limits
echo "1000" > user_settings/maxPositionSize.txt
echo "0.02" > user_settings/maxRiskPerTrade.txt

# Signal Configuration
echo "0.7" > user_settings/minConfidence.txt
echo "0.5" > user_settings/minSignalStrength.txt

# Rebalancing
echo "86400000" > user_settings/rebalanceInterval.txt
echo "0.05" > user_settings/rebalanceThreshold.txt
```

### Custom Settings

#### Custom Indicators
```javascript
// user_settings/customIndicators.json
{
  "customOscillator": {
    "formula": "(rsi + stochK) / 2",
    "parameters": {
      "rsiPeriod": 14,
      "stochKPeriod": 14
    }
  },
  "marketPressure": {
    "formula": "volume * priceChange / averageVolume",
    "parameters": {
      "lookbackPeriod": 20
    }
  }
}
```

#### Strategy Parameters
```javascript
// user_settings/strategyParameters.json
{
  "momentumStrategy": {
    "rsiOversold": 30,
    "rsiOverbought": 70,
    "macdSignalThreshold": 0.5,
    "positionSizeMultiplier": 1.2
  },
  "meanReversionStrategy": {
    "bollingerDeviation": 2.0,
    "lookbackPeriod": 20,
    "entryThreshold": 1.5
  }
}
```

---

## 🔧 Runtime Configuration

### Command-Line Options

#### Basic Options
```bash
# Silent mode
node bitflow.js BTC/USD --silent

# Verbose mode
node bitflow.js BTC/USD --verbose

# Custom timeframe
node bitflow.js BTC/USD --timeframe 1hour

# Paper trading
node bitflow.js BTC/USD --paper-trading
```

#### Advanced Options
```bash
# Custom configuration file
node bitflow.js BTC/USD --config custom-config.json

# Debug mode
node bitflow.js BTC/USD --debug

# Performance profiling
node bitflow.js BTC/USD --profile

# Custom strategy
node bitflow.js BTC/USD --strategy custom-strategy.js
```

### Dynamic Configuration

#### Configuration API
```javascript
class ConfigurationManager {
  async updateConfig(updates) {
    // Update runtime configuration
    for (const [key, value] of Object.entries(updates)) {
      await this.setConfigValue(key, value);
    }

    // Notify components of changes
    this.notifyConfigChange(updates);
  }

  async setConfigValue(key, value) {
    // Set configuration value
    this.config[key] = value;

    // Persist to file if needed
    if (this.shouldPersist(key)) {
      await this.saveToFile(key, value);
    }
  }

  notifyConfigChange(changes) {
    // Notify all components
    this.eventBus.emit('configChanged', changes);
  }
}
```

#### Hot Configuration Reload
```javascript
class HotConfigReloader {
  watchConfigFiles() {
    // Watch settings files for changes
    const settingsDir = './user_settings';

    fs.watch(settingsDir, (eventType, filename) => {
      if (eventType === 'change') {
        this.reloadConfig(filename);
      }
    });
  }

  async reloadConfig(filename) {
    const filePath = `./user_settings/${filename}`;
    const newValue = await this.readConfigFile(filePath);

    // Update configuration
    this.configManager.updateConfig({
      [filename.replace('.txt', '')]: newValue
    });

    console.log(`Reloaded configuration: ${filename}`);
  }
}
```

### Configuration Validation

#### Validation Rules
```javascript
class ConfigurationValidator {
  validateConfig(config) {
    const errors = [];

    // Validate required fields
    if (!config.ALPACA_API_KEY_ID) {
      errors.push('ALPACA_API_KEY_ID is required');
    }

    // Validate numeric values
    if (config.maxPositionSize && config.maxPositionSize < 0) {
      errors.push('maxPositionSize must be positive');
    }

    // Validate enum values
    if (config.timeframe && !['1min', '5min', '15min', '1hour', '1day'].includes(config.timeframe)) {
      errors.push('Invalid timeframe value');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  validateSettingsFiles() {
    const settingsDir = './user_settings';
    const files = fs.readdirSync(settingsDir);

    const validationResults = {};

    for (const file of files) {
      if (file.endsWith('.txt')) {
        const result = this.validateSettingsFile(file);
        validationResults[file] = result;
      }
    }

    return validationResults;
  }
}
```

---

## 🔌 API Configuration

### Alpaca Settings

#### Account Configuration
```javascript
const alpacaConfig = {
  // API Credentials
  keyId: process.env.ALPACA_API_KEY_ID,
  secretKey: process.env.ALPACA_SECRET_KEY,

  // Trading Mode
  paper: true,                        // Paper trading mode
  live: false,                        // Live trading mode

  // Rate Limits
  rateLimit: 200,                     // Requests per minute
  retryAttempts: 3,                   // Retry attempts
  retryDelay: 1000,                   // Retry delay (ms)

  // Order Configuration
  orderTimeout: 30000,                // Order timeout (ms)
  maxOrderRetries: 5,                 // Maximum order retries
  cancelOnTimeout: true               // Cancel orders on timeout
};
```

#### Market Data Configuration
```javascript
const marketDataConfig = {
  // Data Sources
  primarySource: 'iex',               // IEX, SIP, or OTC
  fallbackSource: 'yahoo',            // Fallback data source

  // Historical Data
  maxHistoricalDays: 365,             // Maximum historical data days
  dataGranularity: 'minute',          // minute, daily, weekly

  // Real-time Data
  realtimeEnabled: true,              // Enable real-time data
  realtimeInterval: 1000,             // Real-time update interval (ms)
  bufferSize: 1000,                   // Data buffer size
};
```

### Polygon Settings

#### API Configuration
```javascript
const polygonConfig = {
  // API Credentials
  apiKey: process.env.POLYGON_API_KEY,

  // Rate Limits
  rateLimit: 5,                       // Requests per second
  burstLimit: 10,                     // Burst requests

  // Data Types
  aggregates: true,                   // Aggregates data
  quotes: true,                       // Quotes data
  trades: true,                       // Trades data

  // Historical Data
  maxHistoricalDays: 730,             // Maximum historical data days
  adjustment: 'split',                // Adjustment type
};
```

#### News Configuration
```javascript
const newsConfig = {
  // News Sources
  sources: ['news', 'social', 'press-release'],

  // Filtering
  sentimentFilter: true,              // Filter by sentiment
  relevanceFilter: true,              // Filter by relevance
  dateFilter: true,                   // Filter by date

  // Processing
  maxArticles: 100,                   // Maximum articles to process
  summaryLength: 200,                 // Summary length (characters)
  language: 'en'                      // Language filter
};
```

### Yahoo Finance Settings

#### Data Configuration
```javascript
const yahooConfig = {
  // Data Retrieval
  timeout: 10000,                     // Request timeout (ms)
  retries: 3,                         // Retry attempts
  userAgent: 'BitFlow/1.0',           // User agent string

  // Historical Data
  period: '2y',                       // Historical period
  interval: '1d',                     // Data interval

  // Rate Limiting
  delayBetweenRequests: 100,          // Delay between requests (ms)
  maxConcurrentRequests: 3,           // Maximum concurrent requests
};
```

#### Fallback Configuration
```javascript
const fallbackConfig = {
  // Fallback Priority
  fallbackOrder: ['alpaca', 'polygon', 'yahoo', 'local'],

  // Fallback Conditions
  maxRetries: 3,                      // Maximum fallback attempts
  retryDelay: 1000,                   // Delay between retries (ms)

  // Data Quality
  minDataQuality: 0.8,                // Minimum data quality threshold
  maxDataAge: 300000,                 // Maximum data age (ms)
};
```

---

## 🤖 Model Configuration

### AI Model Settings

#### Model Selection
```javascript
const modelConfig = {
  // Model Preferences
  preferredModels: {
    sentiment: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
    reasoning: 'Xenova/distilgpt2',
    analysis: 'Xenova/bert-base-uncased'
  },

  // Model Constraints
  maxModelSize: 500,                  // Maximum model size (MB)
  minAccuracy: 0.7,                   // Minimum accuracy threshold
  maxInferenceTime: 100,              // Maximum inference time (ms)

  // Model Loading
  loadTimeout: 30000,                 // Model loading timeout (ms)
  retryAttempts: 3,                   // Retry attempts
  fallbackEnabled: true               // Enable fallback models
};
```

#### Performance Tuning
```javascript
const performanceConfig = {
  // Inference Optimization
  batchSize: 1,                       // Batch size for inference
  maxSequenceLength: 512,             // Maximum sequence length
  precision: 'float32',               // Precision (float16, float32)

  // Memory Management
  memoryLimit: 2048,                  // Memory limit per model (MB)
  cacheEnabled: true,                 // Enable model caching
  cacheSize: 4096,                    // Cache size (MB)

  // CPU Optimization
  threadPoolSize: 4,                  // Thread pool size
  cpuAffinity: 'auto',                // CPU affinity setting
};
```

### Memory Management

#### Memory Configuration
```javascript
const memoryConfig = {
  // Memory Limits
  maxHeapSize: 4096,                  // Maximum heap size (MB)
  maxModelMemory: 2048,               // Maximum model memory (MB)
  maxCacheMemory: 1024,               // Maximum cache memory (MB)

  // Garbage Collection
  gcInterval: 30000,                  // GC interval (ms)
  gcThreshold: 0.8,                   // GC threshold (80% memory usage)
  forceGCOnError: true,               // Force GC on memory errors

  // Memory Monitoring
  monitoringEnabled: true,            // Enable memory monitoring
  alertThreshold: 0.9,                // Alert threshold (90% usage)
  logMemoryUsage: true                // Log memory usage
};
```

#### Caching Configuration
```javascript
const cacheConfig = {
  // Cache Settings
  cacheEnabled: true,                 // Enable caching
  maxCacheSize: 4096,                 // Maximum cache size (MB)
  cacheTTL: 3600000,                  // Cache TTL (1 hour)

  // Cache Types
  modelCache: true,                   // Model caching
  dataCache: true,                    // Data caching
  resultCache: true,                  // Result caching

  // Cache Strategy
  strategy: 'LRU',                    // LRU, LFU, FIFO
  compression: true,                  // Enable compression
  encryption: false                   // Enable encryption
};
```

---

*This configuration guide provides comprehensive information about all BitFlow configuration options. For detailed implementation examples, please refer to the source code and individual component documentation.*
