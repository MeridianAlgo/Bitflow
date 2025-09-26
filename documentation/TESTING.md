# Testing Procedures 🧪

**Comprehensive Testing Guide for BitFlow**

This guide provides detailed information about testing procedures, test categories, debugging tools, and quality assurance processes for BitFlow.

---

## 📋 Table of Contents

- [Testing Strategy](#testing-strategy)
  - [Test Categories](#test-categories)
  - [Test Environment](#test-environment)
  - [Test Data](#test-data)
- [Unit Testing](#unit-testing)
  - [Component Testing](#component-testing)
  - [Function Testing](#function-testing)
  - [Mock Testing](#mock-testing)
- [Integration Testing](#integration-testing)
  - [API Integration](#api-integration)
  - [Database Integration](#database-integration)
  - [External Service Integration](#external-service-integration)
- [System Testing](#system-testing)
  - [End-to-End Testing](#end-to-end-testing)
  - [Performance Testing](#performance-testing)
  - [Load Testing](#load-testing)
- [Test Automation](#test-automation)
  - [Test Scripts](#test-scripts)
  - [CI/CD Integration](#cicd-integration)
  - [Automated Reporting](#automated-reporting)
- [Debugging Tools](#debugging-tools)
  - [Debug Console](#debug-console)
  - [Performance Profiler](#performance-profiler)
  - [Memory Analyzer](#memory-analyzer)

---

## 🎯 Testing Strategy

### Test Categories

#### Unit Tests
```javascript
// Test individual components in isolation
describe('BitFlow Engine', () => {
  let engine;

  beforeEach(() => {
    engine = new BitFlowEngine({
      symbol: 'BTC/USD',
      timeframe: '5min'
    });
  });

  test('should initialize correctly', () => {
    expect(engine.symbol).toBe('BTC/USD');
    expect(engine.timeframe).toBe('5min');
    expect(engine.state).toBe('initialized');
  });

  test('should calculate position size correctly', () => {
    const positionSize = engine.calculatePositionSize(10000, 0.02, 50000);
    expect(positionSize).toBe(4); // 10000 * 0.02 / 50000
  });
});
```

#### Integration Tests
```javascript
// Test component interactions
describe('Trading System Integration', () => {
  let bitflow, modelManager, strategyEngine;

  beforeAll(async () => {
    bitflow = new BitFlow('BTC/USD');
    modelManager = new SmartModelManager();
    strategyEngine = new AdvancedTradingStrategy();

    await bitflow.initialize();
    await modelManager.initialize();
    await strategyEngine.initialize();
  });

  test('should process market data through pipeline', async () => {
    const marketData = {
      symbol: 'BTC/USD',
      price: 50000,
      volume: 1000000,
      timestamp: Date.now()
    };

    const signal = await strategyEngine.generateSignal(marketData);
    expect(signal).toHaveProperty('type');
    expect(signal).toHaveProperty('confidence');
  });
});
```

#### System Tests
```javascript
// Test complete system workflows
describe('Complete Trading Workflow', () => {
  let system;

  beforeAll(async () => {
    system = new TradingSystem();
    await system.initialize();
  });

  test('should execute complete trading cycle', async () => {
    // 1. Receive market data
    const marketData = await system.dataManager.getMarketData('BTC/USD');

    // 2. Generate signal
    const signal = await system.strategyEngine.generateSignal(marketData);

    // 3. Execute trade
    const execution = await system.executionEngine.executeTrade(signal);

    // 4. Verify position
    const position = await system.positionManager.getCurrentPosition();

    expect(execution).toHaveProperty('success', true);
    expect(position).toBeDefined();
  });
});
```

### Test Environment

#### Development Environment
```javascript
// Development testing setup
class TestEnvironment {
  constructor() {
    this.mode = 'development';
    this.debug = true;
    this.mockExternalServices = true;
  }

  async setup() {
    // Set up test database
    await this.setupTestDatabase();

    // Mock external APIs
    await this.mockExternalAPIs();

    // Initialize test data
    await this.initializeTestData();
  }

  async setupTestDatabase() {
    // Use in-memory database for tests
    this.database = new MemoryDatabase();
    await this.database.initialize();

    // Load test fixtures
    await this.loadTestFixtures();
  }

  async mockExternalAPIs() {
    // Mock Alpaca API
    this.alpacaMock = new APIResponseMock(alpacaResponses);

    // Mock Polygon API
    this.polygonMock = new APIResponseMock(polygonResponses);

    // Mock Yahoo Finance
    this.yahooMock = new APIResponseMock(yahooResponses);
  }
}
```

#### Production Environment
```javascript
// Production testing setup
class ProductionTestEnvironment {
  constructor() {
    this.mode = 'production';
    this.debug = false;
    this.mockExternalServices = false;
  }

  async setup() {
    // Use production database
    await this.setupProductionDatabase();

    // Use real API connections
    await this.setupRealAPIs();

    // Initialize with real data
    await this.initializeProductionData();
  }

  async setupProductionDatabase() {
    // Connect to production database
    this.database = new ProductionDatabase({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    await this.database.connect();
  }
}
```

### Test Data

#### Test Data Generation
```javascript
class TestDataGenerator {
  generateMarketData(count = 1000) {
    const data = [];

    for (let i = 0; i < count; i++) {
      data.push({
        symbol: 'BTC/USD',
        price: 50000 + (Math.random() - 0.5) * 10000,
        volume: 1000000 + Math.random() * 1000000,
        timestamp: Date.now() - (count - i) * 60000, // 1 minute intervals
        rsi: 30 + Math.random() * 40, // RSI between 30-70
        macd: (Math.random() - 0.5) * 1000,
        trend: Math.random() > 0.5 ? 'bullish' : 'bearish'
      });
    }

    return data;
  }

  generateOrderData(count = 100) {
    const orders = [];
    const types = ['BUY', 'SELL'];
    const statuses = ['filled', 'pending', 'cancelled'];

    for (let i = 0; i < count; i++) {
      orders.push({
        id: `order_${i}`,
        symbol: 'BTC/USD',
        type: types[Math.floor(Math.random() * types.length)],
        quantity: Math.random() * 10,
        price: 50000 + (Math.random() - 0.5) * 10000,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        timestamp: Date.now() - Math.random() * 86400000 // Last 24 hours
      });
    }

    return orders;
  }

  generatePerformanceData() {
    return {
      totalReturn: 0.25,
      winRate: 0.68,
      sharpeRatio: 1.45,
      maxDrawdown: -0.12,
      totalTrades: 150,
      averageWin: 0.02,
      averageLoss: -0.015
    };
  }
}
```

#### Test Fixtures
```javascript
// Test fixtures for consistent testing
const testFixtures = {
  marketData: {
    bullish: require('./fixtures/bullish_market.json'),
    bearish: require('./fixtures/bearish_market.json'),
    sideways: require('./fixtures/sideways_market.json'),
    volatile: require('./fixtures/volatile_market.json')
  },

  tradingSignals: {
    strongBuy: { type: 'BUY', confidence: 0.9, strength: 0.8 },
    weakBuy: { type: 'BUY', confidence: 0.6, strength: 0.4 },
    strongSell: { type: 'SELL', confidence: 0.9, strength: 0.8 },
    weakSell: { type: 'SELL', confidence: 0.6, strength: 0.4 }
  },

  apiResponses: {
    alpaca: require('./fixtures/alpaca_responses.json'),
    polygon: require('./fixtures/polygon_responses.json'),
    yahoo: require('./fixtures/yahoo_responses.json')
  }
};
```

---

## 🧪 Unit Testing

### Component Testing

#### Core Components
```javascript
describe('BitFlow Core Components', () => {
  describe('MarketDataManager', () => {
    let dataManager;

    beforeEach(() => {
      dataManager = new MarketDataManager();
    });

    test('should fetch market data', async () => {
      const data = await dataManager.getMarketData('BTC/USD', '5min');
      expect(data).toHaveProperty('symbol', 'BTC/USD');
      expect(data).toHaveProperty('price');
      expect(data).toHaveProperty('timestamp');
    });

    test('should cache market data', async () => {
      const data1 = await dataManager.getMarketData('BTC/USD', '5min');
      const data2 = await dataManager.getMarketData('BTC/USD', '5min');

      expect(data1).toEqual(data2);
      expect(dataManager.cacheSize()).toBeGreaterThan(0);
    });
  });

  describe('SignalGenerator', () => {
    let signalGenerator;

    beforeEach(() => {
      signalGenerator = new SignalGenerator();
    });

    test('should generate buy signal for bullish conditions', async () => {
      const marketData = {
        rsi: 25, // Oversold
        macd: 100, // Bullish
        trend: 'bullish'
      };

      const signal = await signalGenerator.generateSignal(marketData);
      expect(signal.type).toBe('BUY');
      expect(signal.confidence).toBeGreaterThan(0.7);
    });

    test('should generate sell signal for bearish conditions', async () => {
      const marketData = {
        rsi: 75, // Overbought
        macd: -100, // Bearish
        trend: 'bearish'
      };

      const signal = await signalGenerator.generateSignal(marketData);
      expect(signal.type).toBe('SELL');
      expect(signal.confidence).toBeGreaterThan(0.7);
    });
  });
});
```

#### AI Components
```javascript
describe('AI Components', () => {
  describe('SmartModelManager', () => {
    let modelManager;

    beforeEach(() => {
      modelManager = new SmartModelManager();
    });

    test('should select appropriate model for system specs', async () => {
      const systemSpecs = {
        cpuCores: 4,
        totalMemory: 8 * 1024 * 1024 * 1024, // 8GB
        platform: 'linux'
      };

      const selectedModel = await modelManager.selectOptimalModel(systemSpecs);
      expect(selectedModel).toBe('Xenova/distilbert-base-uncased-finetuned-sst-2-english');
    });

    test('should initialize model successfully', async () => {
      const initialized = await modelManager.initialize();
      expect(initialized).toBe(true);
      expect(modelManager.currentModel).toBeDefined();
    });
  });

  describe('EfficientTradingLLM', () => {
    let llm;

    beforeEach(() => {
      llm = new EfficientTradingLLM();
    });

    test('should analyze sentiment correctly', async () => {
      const text = 'Market is showing strong bullish momentum';
      const sentiment = await llm.analyzeSentiment(text);

      expect(sentiment).toHaveProperty('label');
      expect(sentiment).toHaveProperty('confidence');
      expect(sentiment).toHaveProperty('score');
    });

    test('should generate trading reasoning', async () => {
      const marketData = {
        price: 50000,
        rsi: 65,
        trend: 'bullish'
      };

      const reasoning = await llm.generateTradingReasoning(marketData, 'BUY');
      expect(reasoning).toContain('BUY');
      expect(reasoning.length).toBeGreaterThan(50);
    });
  });
});
```

### Function Testing

#### Utility Functions
```javascript
describe('Utility Functions', () => {
  describe('MathUtils', () => {
    test('should calculate RSI correctly', () => {
      const prices = [50, 51, 52, 51, 50, 49, 48, 49, 50, 51, 52, 53, 54, 53];
      const rsi = MathUtils.calculateRSI(prices, 14);

      expect(rsi).toBeGreaterThan(0);
      expect(rsi).toBeLessThan(100);
    });

    test('should calculate moving average correctly', () => {
      const prices = [50, 51, 52, 51, 50];
      const ma = MathUtils.calculateSMA(prices, 3);

      expect(ma).toBe(51); // (50 + 51 + 52) / 3
    });
  });

  describe('DataUtils', () => {
    test('should clean market data', () => {
      const dirtyData = {
        price: '50000',
        volume: '1000000',
        timestamp: '1640995200000'
      };

      const cleanData = DataUtils.cleanMarketData(dirtyData);

      expect(cleanData.price).toBe(50000);
      expect(cleanData.volume).toBe(1000000);
      expect(cleanData.timestamp).toBe(1640995200000);
    });

    test('should validate market data', () => {
      const validData = {
        symbol: 'BTC/USD',
        price: 50000,
        volume: 1000000,
        timestamp: Date.now()
      };

      const invalidData = {
        symbol: 'BTC/USD',
        price: -100,
        volume: -50000
      };

      expect(DataUtils.validateMarketData(validData)).toBe(true);
      expect(DataUtils.validateMarketData(invalidData)).toBe(false);
    });
  });
});
```

#### API Functions
```javascript
describe('API Functions', () => {
  describe('AlpacaAPI', () => {
    let alpaca;

    beforeEach(() => {
      alpaca = new AlpacaAPI({
        keyId: process.env.ALPACA_API_KEY_ID,
        secretKey: process.env.ALPACA_SECRET_KEY,
        paper: true
      });
    });

    test('should get account information', async () => {
      const account = await alpaca.getAccount();
      expect(account).toHaveProperty('id');
      expect(account).toHaveProperty('balance');
      expect(account).toHaveProperty('currency');
    });

    test('should get historical data', async () => {
      const data = await alpaca.getHistoricalData('BTC/USD', {
        start: '2023-01-01',
        end: '2023-01-02',
        timeframe: '1Min'
      });

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('PolygonAPI', () => {
    let polygon;

    beforeEach(() => {
      polygon = new PolygonAPI({
        apiKey: process.env.POLYGON_API_KEY
      });
    });

    test('should get aggregates data', async () => {
      const data = await polygon.getAggregates('BTC/USD', {
        from: '2023-01-01',
        to: '2023-01-02',
        timespan: 'minute'
      });

      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);
    });
  });
});
```

### Mock Testing

#### Mock Setup
```javascript
class MockManager {
  createAPIMock(apiName, responses) {
    const mock = new APIResponseMock();
    mock.setResponses(responses);
    return mock;
  }

  createModelMock(modelType) {
    return {
      initialize: jest.fn().mockResolvedValue(true),
      analyzeSentiment: jest.fn().mockResolvedValue({
        label: 'neutral',
        confidence: 0.5,
        score: 0
      }),
      generateTradingReasoning: jest.fn().mockResolvedValue('Mock reasoning')
    };
  }

  createDatabaseMock() {
    return {
      connect: jest.fn().mockResolvedValue(true),
      query: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockResolvedValue({ id: 'mock-id' }),
      update: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true)
    };
  }
}
```

#### Mock Usage
```javascript
describe('BitFlow with Mocks', () => {
  let bitflow;
  let mockManager;

  beforeEach(() => {
    mockManager = new MockManager();

    // Mock external dependencies
    jest.mock('../core/apiHelpers', () => ({
      AlpacaAPI: mockManager.createAPIMock('alpaca', alpacaResponses),
      PolygonAPI: mockManager.createAPIMock('polygon', polygonResponses)
    }));

    jest.mock('../core/smartModelManager', () => ({
      SmartModelManager: jest.fn().mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(true),
        selectOptimalModel: jest.fn().mockReturnValue('mock-model')
      }))
    }));

    bitflow = new BitFlow('BTC/USD');
  });

  test('should initialize with mocked dependencies', async () => {
    const initialized = await bitflow.initialize();
    expect(initialized).toBe(true);
  });

  test('should handle API failures gracefully', async () => {
    // Mock API failure
    mockManager.alpacaMock.setFailureMode(true);

    const result = await bitflow.getMarketData('BTC/USD');
    expect(result).toBeDefined(); // Should handle failure gracefully
  });
});
```

---

## 🔗 Integration Testing

### API Integration

#### External API Testing
```javascript
describe('External API Integration', () => {
  describe('Alpaca Integration', () => {
    let alpaca;

    beforeAll(() => {
      alpaca = new AlpacaAPI({
        keyId: process.env.ALPACA_API_KEY_ID,
        secretKey: process.env.ALPACA_SECRET_KEY,
        paper: true
      });
    });

    test('should connect to Alpaca API', async () => {
      const account = await alpaca.getAccount();
      expect(account.id).toBeDefined();
      expect(account.status).toBe('ACTIVE');
    });

    test('should fetch real market data', async () => {
      const data = await alpaca.getHistoricalData('BTC/USD', {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        timeframe: '1Min'
      });

      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('symbol', 'BTC/USD');
      expect(data[0]).toHaveProperty('price');
    });

    test('should execute paper trade', async () => {
      const order = await alpaca.createOrder({
        symbol: 'BTC/USD',
        qty: 0.001,
        side: 'buy',
        type: 'market',
        time_in_force: 'gtc'
      });

      expect(order.id).toBeDefined();
      expect(order.symbol).toBe('BTC/USD');
    });
  });

  describe('Polygon Integration', () => {
    let polygon;

    beforeAll(() => {
      polygon = new PolygonAPI({
        apiKey: process.env.POLYGON_API_KEY
      });
    });

    test('should fetch Polygon data', async () => {
      const data = await polygon.getAggregates('BTC/USD', {
        from: new Date(Date.now() - 24 * 60 * 60 * 1000),
        to: new Date(),
        timespan: 'minute'
      });

      expect(data.results).toBeDefined();
      expect(data.results.length).toBeGreaterThan(0);
    });
  });
});
```

#### Database Integration
```javascript
describe('Database Integration', () => {
  let database;

  beforeAll(async () => {
    database = new DatabaseManager({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    await database.connect();
  });

  test('should connect to database', async () => {
    const connected = await database.isConnected();
    expect(connected).toBe(true);
  });

  test('should store market data', async () => {
    const marketData = {
      symbol: 'BTC/USD',
      price: 50000,
      volume: 1000000,
      timestamp: Date.now()
    };

    const result = await database.insertMarketData(marketData);
    expect(result.id).toBeDefined();
  });

  test('should retrieve market data', async () => {
    const data = await database.getMarketData('BTC/USD', {
      limit: 10,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(10);
  });

  test('should handle concurrent connections', async () => {
    const promises = [];

    for (let i = 0; i < 10; i++) {
      promises.push(database.insertMarketData({
        symbol: `TEST${i}/USD`,
        price: 100 + i,
        volume: 100000 + i * 1000,
        timestamp: Date.now()
      }));
    }

    const results = await Promise.all(promises);
    expect(results).toHaveLength(10);
  });
});
```

### External Service Integration

#### File System Integration
```javascript
describe('File System Integration', () => {
  const testDir = './test_data';

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  test('should save configuration to file', async () => {
    const config = {
      symbol: 'BTC/USD',
      timeframe: '5min',
      riskTolerance: 'medium'
    };

    const filePath = `${testDir}/config.json`;
    await fs.promises.writeFile(filePath, JSON.stringify(config));

    const savedConfig = JSON.parse(
      await fs.promises.readFile(filePath, 'utf8')
    );

    expect(savedConfig).toEqual(config);
  });

  test('should handle file locking', async () => {
    const filePath = `${testDir}/locked_file.txt`;

    // Create file lock
    const lock = new FileLock(filePath);

    await lock.acquire();
    expect(lock.isLocked()).toBe(true);

    // Try to acquire again (should wait or fail)
    const lock2 = new FileLock(filePath);
    const acquired = await lock2.acquire({ timeout: 100 });

    expect(acquired).toBe(false); // Should not acquire

    await lock.release();
    expect(lock.isLocked()).toBe(false);
  });
});
```

#### Cache Integration
```javascript
describe('Cache Integration', () => {
  let cache;

  beforeAll(async () => {
    cache = new RedisCache({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });

    await cache.connect();
  });

  test('should cache market data', async () => {
    const key = 'market_data:BTC/USD:5min';
    const data = {
      symbol: 'BTC/USD',
      price: 50000,
      timestamp: Date.now()
    };

    await cache.set(key, data, 300); // 5 minute TTL
    const cachedData = await cache.get(key);

    expect(cachedData).toEqual(data);
  });

  test('should handle cache expiration', async () => {
    const key = 'expiring_data';
    const data = { test: 'value' };

    await cache.set(key, data, 1); // 1 second TTL
    await new Promise(resolve => setTimeout(resolve, 1100)); // Wait 1.1 seconds

    const expiredData = await cache.get(key);
    expect(expiredData).toBeNull();
  });

  test('should implement cache patterns', async () => {
    // Cache-Aside pattern
    const key = 'pattern_test';
    let data = await cache.get(key);

    if (!data) {
      data = await this.fetchExpensiveData();
      await cache.set(key, data, 300);
    }

    expect(data).toBeDefined();

    // Cache invalidation
    await cache.delete(key);
    const invalidatedData = await cache.get(key);
    expect(invalidatedData).toBeNull();
  });
});
```

---

## 🏗️ System Testing

### End-to-End Testing

#### Complete Trading Workflow
```javascript
describe('End-to-End Trading Workflow', () => {
  let system;

  beforeAll(async () => {
    system = new TradingSystem({
      mode: 'paper',
      symbol: 'BTC/USD',
      initialBalance: 10000
    });

    await system.initialize();
  });

  test('should execute complete trading cycle', async () => {
    // 1. Market data ingestion
    const marketData = await system.ingestMarketData('BTC/USD');
    expect(marketData).toBeDefined();

    // 2. Signal generation
    const signal = await system.generateTradingSignal(marketData);
    expect(signal).toHaveProperty('type');
    expect(signal).toHaveProperty('confidence');

    // 3. Risk assessment
    const riskAssessment = await system.assessRisk(signal, marketData);
    expect(riskAssessment).toHaveProperty('approved');
    expect(riskAssessment).toHaveProperty('riskLevel');

    // 4. Order execution
    if (riskAssessment.approved) {
      const order = await system.executeOrder(signal);
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('status');
    }

    // 5. Position management
    const positions = await system.getPositions();
    expect(Array.isArray(positions)).toBe(true);

    // 6. Performance tracking
    const performance = await system.getPerformanceMetrics();
    expect(performance).toHaveProperty('totalReturn');
    expect(performance).toHaveProperty('winRate');
  });

  test('should handle error scenarios', async () => {
    // Test API failure handling
    system.mockAPI('alpaca', 'fail');

    const marketData = await system.ingestMarketData('BTC/USD');
    expect(marketData).toBeDefined(); // Should use fallback

    // Test invalid signal handling
    const invalidSignal = { type: 'INVALID', confidence: -1 };
    const riskAssessment = await system.assessRisk(invalidSignal, {});
    expect(riskAssessment.approved).toBe(false);
  });
});
```

#### Multi-Symbol Trading
```javascript
describe('Multi-Symbol Trading', () => {
  let portfolioManager;

  beforeAll(async () => {
    portfolioManager = new PortfolioManager({
      symbols: ['BTC/USD', 'ETH/USD', 'XRP/USD'],
      initialBalance: 10000
    });

    await portfolioManager.initialize();
  });

  test('should manage multiple symbols', async () => {
    const symbols = ['BTC/USD', 'ETH/USD', 'XRP/USD'];

    for (const symbol of symbols) {
      const marketData = await portfolioManager.getMarketData(symbol);
      expect(marketData.symbol).toBe(symbol);

      const signal = await portfolioManager.generateSignal(symbol, marketData);
      expect(signal).toBeDefined();
    }
  });

  test('should balance portfolio', async () => {
    const rebalancing = await portfolioManager.rebalancePortfolio();

    expect(rebalancing).toHaveProperty('orders');
    expect(rebalancing).toHaveProperty('targetAllocations');

    // Verify allocations sum to 1
    const totalAllocation = Object.values(rebalancing.targetAllocations)
      .reduce((sum, allocation) => sum + allocation, 0);

    expect(Math.abs(totalAllocation - 1.0)).toBeLessThan(0.01);
  });

  test('should handle correlation', async () => {
    const correlations = await portfolioManager.calculateCorrelations();

    expect(correlations).toHaveProperty('BTC/USD');
    expect(correlations).toHaveProperty('ETH/USD');

    // Check correlation values are between -1 and 1
    for (const [symbol, correlation] of Object.entries(correlations)) {
      expect(correlation).toBeGreaterThanOrEqual(-1);
      expect(correlation).toBeLessThanOrEqual(1);
    }
  });
});
```

### Performance Testing

#### Load Testing
```javascript
describe('Load Testing', () => {
  let loadTester;

  beforeAll(() => {
    loadTester = new LoadTestingFramework({
      maxConcurrentUsers: 100,
      testDuration: 300000, // 5 minutes
      rampUpTime: 60000    // 1 minute
    });
  });

  test('should handle high signal generation load', async () => {
    const results = await loadTester.runLoadTest({
      testType: 'signal_generation',
      requestsPerSecond: 50,
      duration: 60000
    });

    expect(results.averageResponseTime).toBeLessThan(1000); // < 1 second
    expect(results.errorRate).toBeLessThan(0.05); // < 5% error rate
    expect(results.throughput).toBeGreaterThan(40); // > 40 requests/sec
  });

  test('should handle high trading load', async () => {
    const results = await loadTester.runLoadTest({
      testType: 'order_execution',
      requestsPerSecond: 10,
      duration: 60000
    });

    expect(results.averageResponseTime).toBeLessThan(2000); // < 2 seconds
    expect(results.errorRate).toBeLessThan(0.1); // < 10% error rate
  });

  test('should handle concurrent users', async () => {
    const results = await loadTester.runLoadTest({
      testType: 'concurrent_users',
      concurrentUsers: 50,
      duration: 60000
    });

    expect(results.activeUsers).toBe(50);
    expect(results.responseTimeP95).toBeLessThan(3000); // 95th percentile < 3 seconds
  });
});
```

#### Stress Testing
```javascript
describe('Stress Testing', () => {
  let stressTester;

  beforeAll(() => {
    stressTester = new StressTestingFramework({
      maxLoad: 1000,
      increment: 100,
      durationPerTest: 60000
    });
  });

  test('should find system breaking point', async () => {
    const results = await stressTester.findBreakingPoint({
      testType: 'api_calls',
      startingLoad: 100,
      maxLoad: 1000
    });

    expect(results.breakingPoint).toBeGreaterThan(100);
    expect(results.breakingPointLoad).toBeDefined();
    expect(results.failureMode).toBeDefined();
  });

  test('should test system recovery', async () => {
    // Apply extreme load
    await stressTester.applyLoad(800); // 800 concurrent requests

    // Wait for system to stabilize
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Check system health
    const health = await stressTester.checkSystemHealth();

    expect(health.status).toBe('degraded'); // May be degraded but not failed

    // Reduce load
    await stressTester.applyLoad(100);

    // Check recovery
    const recoveryHealth = await stressTester.checkSystemHealth();
    expect(recoveryHealth.status).toBe('healthy');
  });

  test('should test memory stress', async () => {
    const memoryStress = await stressTester.testMemoryStress({
      allocationSize: 100 * 1024 * 1024, // 100MB
      allocationsPerSecond: 10,
      duration: 60000
    });

    expect(memoryStress.maxMemoryUsage).toBeLessThan(2048 * 1024 * 1024); // < 2GB
    expect(memoryStress.memoryLeak).toBe(false);
  });
});
```

---

## 🤖 Test Automation

### Test Scripts

#### Automated Test Runner
```javascript
class AutomatedTestRunner {
  async runAllTests() {
    const results = {
      unit: await this.runUnitTests(),
      integration: await this.runIntegrationTests(),
      system: await this.runSystemTests(),
      performance: await this.runPerformanceTests()
    };

    const summary = this.generateTestSummary(results);

    await this.generateTestReport(summary);
    await this.sendTestNotifications(summary);

    return summary;
  }

  async runUnitTests() {
    const testFiles = await this.discoverTestFiles('unit');
    const results = [];

    for (const file of testFiles) {
      const result = await this.runTestFile(file);
      results.push(result);
    }

    return this.aggregateResults(results);
  }

  async runIntegrationTests() {
    const testFiles = await this.discoverTestFiles('integration');
    const results = [];

    // Set up test environment
    await this.setupIntegrationTestEnvironment();

    for (const file of testFiles) {
      const result = await this.runTestFile(file);
      results.push(result);
    }

    // Clean up
    await this.teardownIntegrationTestEnvironment();

    return this.aggregateResults(results);
  }

  async runSystemTests() {
    // Run end-to-end tests
    const systemTests = await this.discoverSystemTests();
    const results = [];

    for (const test of systemTests) {
      const result = await this.runSystemTest(test);
      results.push(result);
    }

    return this.aggregateResults(results);
  }

  async runPerformanceTests() {
    const performanceTests = [
      { name: 'api_response_time', target: 1000 },
      { name: 'memory_usage', target: 512 * 1024 * 1024 }, // 512MB
      { name: 'cpu_usage', target: 70 }
    ];

    const results = [];

    for (const test of performanceTests) {
      const result = await this.runPerformanceTest(test);
      results.push(result);
    }

    return this.aggregateResults(results);
  }
}
```

#### Test Discovery
```javascript
class TestDiscovery {
  async discoverTestFiles(type) {
    const testDir = `./tests/${type}`;
    const files = await fs.promises.readdir(testDir);

    return files
      .filter(file => file.endsWith('.test.js') || file.endsWith('.spec.js'))
      .map(file => `${testDir}/${file}`);
  }

  async discoverSystemTests() {
    const systemTestDir = './tests/system';
    const files = await fs.promises.readdir(systemTestDir);

    const systemTests = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const testConfig = JSON.parse(
          await fs.promises.readFile(`${systemTestDir}/${file}`, 'utf8')
        );

        systemTests.push({
          name: file.replace('.json', ''),
          config: testConfig
        });
      }
    }

    return systemTests;
  }

  async discoverPerformanceTests() {
    const perfTestDir = './tests/performance';
    const files = await fs.promises.readdir(perfTestDir);

    return files
      .filter(file => file.endsWith('.perf.js'))
      .map(file => `${perfTestDir}/${file}`);
  }
}
```

### CI/CD Integration

#### GitHub Actions
```yaml
# .github/workflows/test.yml
name: BitFlow Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run unit tests
      run: npm run test:unit

    - name: Run integration tests
      run: npm run test:integration
      env:
        ALPACA_API_KEY_ID: ${{ secrets.ALPACA_API_KEY_ID }}
        ALPACA_SECRET_KEY: ${{ secrets.ALPACA_SECRET_KEY }}
        POLYGON_API_KEY: ${{ secrets.POLYGON_API_KEY }}

    - name: Run system tests
      run: npm run test:system

    - name: Upload test results
      uses: actions/upload-artifact@v3
      with:
        name: test-results
        path: test-results/
```

#### Jenkins Pipeline
```groovy
// Jenkinsfile
pipeline {
    agent any

    stages {
        stage('Setup') {
            steps {
                sh 'npm install'
                sh 'npm run setup:test'
            }
        }

        stage('Unit Tests') {
            steps {
                sh 'npm run test:unit'
            }
            post {
                always {
                    junit 'test-results/unit/*.xml'
                }
            }
        }

        stage('Integration Tests') {
            steps {
                sh 'npm run test:integration'
            }
            post {
                always {
                    junit 'test-results/integration/*.xml'
                }
            }
        }

        stage('System Tests') {
            steps {
                sh 'npm run test:system'
            }
            post {
                always {
                    junit 'test-results/system/*.xml'
                }
            }
        }

        stage('Performance Tests') {
            steps {
                sh 'npm run test:performance'
            }
            post {
                always {
                    perfReport 'test-results/performance/*.jtl'
                }
            }
        }
    }

    post {
        always {
            publishTestResults testResultsPattern: 'test-results/**/*.xml'
            archiveArtifacts artifacts: 'test-results/**'
        }
    }
}
```

### Automated Reporting

#### Test Report Generation
```javascript
class TestReportGenerator {
  async generateReport(testResults) {
    const report = {
      summary: this.generateSummary(testResults),
      details: this.generateDetails(testResults),
      metrics: this.generateMetrics(testResults),
      recommendations: this.generateRecommendations(testResults)
    };

    // Generate HTML report
    await this.generateHTMLReport(report);

    // Generate JSON report
    await this.generateJSONReport(report);

    // Generate coverage report
    await this.generateCoverageReport();

    return report;
  }

  generateSummary(testResults) {
    const totalTests = testResults.reduce((sum, r) => sum + r.tests, 0);
    const totalPassed = testResults.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = testResults.reduce((sum, r) => sum + r.failed, 0);
    const totalErrors = testResults.reduce((sum, r) => sum + r.errors, 0);

    return {
      totalTests,
      totalPassed,
      totalFailed,
      totalErrors,
      successRate: (totalPassed / totalTests) * 100,
      executionTime: testResults.reduce((sum, r) => sum + r.executionTime, 0)
    };
  }

  generateDetails(testResults) {
    return testResults.map(result => ({
      name: result.name,
      tests: result.tests,
      passed: result.passed,
      failed: result.failed,
      errors: result.errors,
      executionTime: result.executionTime,
      testCases: result.testCases
    }));
  }

  generateMetrics(testResults) {
    return {
      performance: this.calculatePerformanceMetrics(testResults),
      coverage: this.calculateCoverageMetrics(),
      quality: this.calculateQualityMetrics(testResults)
    };
  }

  async generateHTMLReport(report) {
    const template = await fs.promises.readFile('./templates/test-report.html', 'utf8');
    const html = this.populateTemplate(template, report);

    await fs.promises.writeFile('./test-results/report.html', html);
  }

  async generateJSONReport(report) {
    await fs.promises.writeFile('./test-results/report.json', JSON.stringify(report, null, 2));
  }
}
```

#### Coverage Reporting
```javascript
class CoverageReporter {
  async generateCoverageReport() {
    // Run tests with coverage
    const coverage = await this.runWithCoverage();

    // Generate coverage report
    const report = {
      summary: this.generateCoverageSummary(coverage),
      files: this.generateFileCoverage(coverage),
      functions: this.generateFunctionCoverage(coverage),
      branches: this.generateBranchCoverage(coverage),
      lines: this.generateLineCoverage(coverage)
    };

    // Generate LCOV format
    await this.generateLCOVReport(report);

    // Generate HTML coverage report
    await this.generateHTMLCoverageReport(report);

    return report;
  }

  generateCoverageSummary(coverage) {
    return {
      lines: coverage.lines.covered / coverage.lines.total,
      functions: coverage.functions.covered / coverage.functions.total,
      branches: coverage.branches.covered / coverage.branches.total,
      statements: coverage.statements.covered / coverage.statements.total
    };
  }

  async generateLCOVReport(report) {
    let lcov = 'TN:\n'; // Test Name

    for (const file of report.files) {
      lcov += `SF:${file.path}\n`; // Source File

      for (const function of file.functions) {
        lcov += `FN:${function.line},${function.name}\n`; // Function
        lcov += `FNDA:${function.hit},${function.name}\n`; // Function Data
      }

      lcov += 'FNF:' + file.functions.length + '\n'; // Functions Found
      lcov += 'FNH:' + file.functions.filter(f => f.hit > 0).length + '\n'; // Functions Hit

      for (const line of file.lines) {
        lcov += `DA:${line.line},${line.hit}\n`; // Line Data
      }

      lcov += 'LF:' + file.lines.length + '\n'; // Lines Found
      lcov += 'LH:' + file.lines.filter(l => l.hit > 0).length + '\n'; // Lines Hit
      lcov += 'end_of_record\n';
    }

    await fs.promises.writeFile('./coverage/lcov.info', lcov);
  }
}
```

---

## 🛠️ Debugging Tools

### Debug Console

#### Interactive Debug Console
```javascript
class DebugConsole {
  constructor() {
    this.commands = new Map();
    this.history = [];
    this.setupCommands();
  }

  setupCommands() {
    this.commands.set('help', this.showHelp.bind(this));
    this.commands.set('status', this.showSystemStatus.bind(this));
    this.commands.set('metrics', this.showMetrics.bind(this));
    this.commands.set('memory', this.showMemoryUsage.bind(this));
    this.commands.set('test', this.runTest.bind(this));
    this.commands.set('profile', this.runProfiler.bind(this));
    this.commands.set('clear', this.clearConsole.bind(this));
  }

  async start() {
    console.log('BitFlow Debug Console');
    console.log('Type "help" for available commands');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'debug> '
    });

    rl.prompt();

    rl.on('line', async (line) => {
      const input = line.trim();
      this.history.push(input);

      if (input) {
        await this.executeCommand(input);
      }

      rl.prompt();
    });

    rl.on('close', () => {
      console.log('Debug console closed');
      process.exit(0);
    });
  }

  async executeCommand(input) {
    const [command, ...args] = input.split(' ');

    if (this.commands.has(command)) {
      try {
        await this.commands.get(command)(args);
      } catch (error) {
        console.error(`Command error: ${error.message}`);
      }
    } else {
      console.log(`Unknown command: ${command}`);
      console.log('Type "help" for available commands');
    }
  }

  async showHelp(args) {
    console.log('Available commands:');
    console.log('  help                    - Show this help');
    console.log('  status                  - Show system status');
    console.log('  metrics                 - Show performance metrics');
    console.log('  memory                  - Show memory usage');
    console.log('  test <test-name>        - Run specific test');
    console.log('  profile <function>      - Profile function');
    console.log('  clear                   - Clear console');
  }

  async showSystemStatus(args) {
    const status = await this.getSystemStatus();
    console.log('System Status:', JSON.stringify(status, null, 2));
  }

  async showMetrics(args) {
    const metrics = await this.getPerformanceMetrics();
    console.log('Performance Metrics:', JSON.stringify(metrics, null, 2));
  }

  async showMemoryUsage(args) {
    const memory = process.memoryUsage();
    console.log('Memory Usage:', {
      rss: (memory.rss / 1024 / 1024).toFixed(1) + 'MB',
      heapUsed: (memory.heapUsed / 1024 / 1024).toFixed(1) + 'MB',
      heapTotal: (memory.heapTotal / 1024 / 1024).toFixed(1) + 'MB',
      external: (memory.external / 1024 / 1024).toFixed(1) + 'MB'
    });
  }

  async runTest(args) {
    const testName = args[0];
    if (!testName) {
      console.log('Please specify test name');
      return;
    }

    console.log(`Running test: ${testName}`);
    // Run test logic here
  }

  async runProfiler(args) {
    const functionName = args[0];
    if (!functionName) {
      console.log('Please specify function name');
      return;
    }

    console.log(`Profiling function: ${functionName}`);
    // Profiling logic here
  }

  clearConsole(args) {
    console.clear();
  }
}
```

### Performance Profiler

#### Function Profiler
```javascript
class FunctionProfiler {
  async profileFunction(func, ...args) {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    let result;
    try {
      result = await func(...args);
    } catch (error) {
      console.error('Function execution failed:', error);
      return { error: error.message };
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    return {
      executionTime: endTime - startTime,
      memoryIncrease: endMemory - startMemory,
      result: result,
      success: true
    };
  }

  async profileMultipleRuns(func, args, runs = 100) {
    const results = [];

    for (let i = 0; i < runs; i++) {
      const result = await this.profileFunction(func, ...args);
      results.push(result);
    }

    return this.analyzeResults(results);
  }

  analyzeResults(results) {
    const executionTimes = results.map(r => r.executionTime);
    const memoryIncreases = results.map(r => r.memoryIncrease);

    return {
      count: results.length,
      averageTime: this.calculateAverage(executionTimes),
      medianTime: this.calculateMedian(executionTimes),
      minTime: Math.min(...executionTimes),
      maxTime: Math.max(...executionTimes),
      averageMemory: this.calculateAverage(memoryIncreases),
      medianMemory: this.calculateMedian(memoryIncreases),
      minMemory: Math.min(...memoryIncreases),
      maxMemory: Math.max(...memoryIncreases),
      errors: results.filter(r => !r.success).length
    };
  }

  calculateAverage(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}
```

#### Memory Analyzer
```javascript
class MemoryAnalyzer {
  async analyzeMemoryUsage() {
    const snapshots = await this.takeMemorySnapshots(10, 1000); // 10 snapshots, 1 second apart
    const analysis = this.analyzeSnapshots(snapshots);

    return {
      snapshots,
      analysis,
      recommendations: this.generateRecommendations(analysis)
    };
  }

  async takeMemorySnapshots(count, interval) {
    const snapshots = [];

    for (let i = 0; i < count; i++) {
      snapshots.push({
        timestamp: Date.now(),
        memory: process.memoryUsage(),
        gc: this.getGarbageCollectionInfo()
      });

      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    return snapshots;
  }

  getGarbageCollectionInfo() {
    if (!global.gc) return null;

    // Force GC to get accurate stats
    const beforeGC = process.memoryUsage();
    global.gc();
    const afterGC = process.memoryUsage();

    return {
      before: beforeGC,
      after: afterGC,
      freed: beforeGC.heapUsed - afterGC.heapUsed
    };
  }

  analyzeSnapshots(snapshots) {
    const heapUsed = snapshots.map(s => s.memory.heapUsed);
    const external = snapshots.map(s => s.memory.external);
    const rss = snapshots.map(s => s.memory.rss);

    return {
      heapTrend: this.calculateTrend(heapUsed),
      externalTrend: this.calculateTrend(external),
      rssTrend: this.calculateTrend(rss),
      averageHeap: this.calculateAverage(heapUsed),
      averageExternal: this.calculateAverage(external),
      averageRSS: this.calculateAverage(rss),
      maxHeap: Math.max(...heapUsed),
      minHeap: Math.min(...heapUsed),
      memoryLeak: this.detectMemoryLeak(snapshots)
    };
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;

    const first = values[0];
    const last = values[values.length - 1];

    return (last - first) / values.length;
  }

  detectMemoryLeak(snapshots) {
    const heapUsed = snapshots.map(s => s.memory.heapUsed);
    const trend = this.calculateTrend(heapUsed);

    // If memory is consistently increasing, likely a leak
    return trend > 1024 * 1024; // More than 1MB increase per snapshot
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.memoryLeak) {
      recommendations.push('Memory leak detected - investigate object references');
    }

    if (analysis.averageHeap > 500 * 1024 * 1024) { // 500MB
      recommendations.push('High memory usage - consider optimization');
    }

    if (analysis.maxHeap - analysis.minHeap > 100 * 1024 * 1024) { // 100MB variance
      recommendations.push('Memory usage varies significantly - check for spikes');
    }

    return recommendations;
  }
}
```

---

*This comprehensive testing guide provides detailed procedures for testing BitFlow across all levels. For additional testing tools and utilities, please refer to the source code and individual component documentation.*
