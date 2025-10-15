# Source Code Directory

This folder contains all the source code for BitFlow Trading Bot v3.0.

## Files

### Core Bot
- **`BitFlow.js`** - Main trading bot orchestrator
  - Initializes all modules
  - Manages trading loop
  - Handles user configuration
  - Coordinates ML risk management
  - Entry point: `node src/BitFlow.js`

### Data Management
- **`data.js`** - Market data management
  - Fetches historical data from Alpaca
  - Manages real-time price feeds
  - Handles WebSocket connections
  - Provides quote-based pricing

- **`data-persistence.js`** - CSV storage manager
  - Saves/loads price data to `../historical_data/`
  - Manages MA optimization scores
  - Handles data integrity
  - Provides data statistics

### Trading Logic
- **`strategy.js`** - MA optimization engine
  - Tests 208 MA combinations
  - Calculates 8 MA types (SMA, EMA, WMA, HMA, VWMA, ALMA, RMA, LINREG)
  - Performs backtesting
  - Generates trading signals
  - Scores strategies

- **`ml-risk-manager.js`** - ML-based risk calculator
  - ATR-based stop loss calculation
  - Dynamic TP/SL based on volatility
  - Trend detection
  - Confidence scoring
  - Smart position sizing
  - Safety caps enforcement

### Order Execution
- **`orders.js`** - Order manager
  - Executes buy/sell orders via Alpaca
  - Fetches real-time account info
  - Manages positions
  - Handles order validation
  - Paper trading enforcement

### Utilities
- **`logger.js`** - Logging system
  - Structured logging
  - Error tracking
  - Trade audit trail

## Module Dependencies

```
BitFlow.js
├── data.js (market data)
├── strategy.js (MA optimization)
├── orders.js (order execution)
├── data-persistence.js (CSV storage)
└── ml-risk-manager.js (risk management)
```

## Data Flow

```
1. BitFlow.js starts
2. Loads configuration
3. Fetches account info (orders.js)
4. Gets historical data (data.js)
5. Saves to CSV (data-persistence.js)
6. Optimizes MA strategy (strategy.js)
7. Starts trading loop
8. On signal:
   - Calculate TP/SL (ml-risk-manager.js)
   - Execute order (orders.js)
   - Monitor position
```

## Key Paths

- Historical data: `../historical_data/` (parent directory)
- Environment: `../.env` (parent directory)
- Tests: `../tests/` (parent directory)

## Running

```bash
# From project root
node src/BitFlow.js

# Or from src folder
cd src
node BitFlow.js
```

## Development

When modifying source code:
1. Update relevant file
2. Run tests: `node ../tests/run-all-tests.js`
3. Test manually with paper trading
4. Update documentation if needed

## Architecture

- **Modular design**: Each file has single responsibility
- **Loose coupling**: Modules communicate via clean interfaces
- **Testable**: Each module can be tested independently
- **Extensible**: Easy to add new features

---

**Made with ❤️ by MeridianAlgo**
