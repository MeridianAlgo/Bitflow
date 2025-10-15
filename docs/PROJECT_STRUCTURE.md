# BitFlow v3.0 - Project Structure

## Directory Layout

```
Bitflow/
├── src/                          # Source Code
│   ├── BitFlow.js               # Main trading bot
│   ├── data.js                  # Market data management
│   ├── strategy.js              # MA optimization engine
│   ├── orders.js                # Order execution & account info
│   ├── data-persistence.js      # CSV storage (uses ../historical_data)
│   ├── ml-risk-manager.js       # ML-based TP/SL calculator
│   └── logger.js                # Logging system
│
├── tests/                        # Test Suite
│   ├── test-ml-risk-manager.js  # ML risk manager tests (30 tests)
│   ├── test-data-persistence.js # Data storage tests (27 tests)
│   ├── test-orders.js           # Order manager tests (6 tests)
│   ├── run-all-tests.js         # Master test runner
│   └── README.md                # Test documentation
│
├── docs/                         # Documentation
│   ├── SETUP_GUIDE.md           # Complete setup instructions
│   ├── ML_RISK_IMPLEMENTATION.md # ML implementation details
│   ├── CONTRIBUTING.md          # Contribution guidelines
│   ├── SECURITY.md              # Security policy
│   ├── IMPLEMENTATION_SUMMARY.md # Technical implementation
│   └── FINAL_IMPLEMENTATION.md  # Complete feature list
│
├── historical_data/              # CSV Data Storage (Main)
│   ├── BTC_USD_1m.csv           # 1-minute price data
│   ├── BTC_USD_5m.csv           # 5-minute price data
│   ├── BTC_USD_15m.csv          # 15-minute price data
│   └── ma_scores_latest.csv     # MA optimization scores
│
├── config/                       # Configuration (Future Use)
│
├── .env                          # Environment variables (gitignored)
├── .env.template                 # Environment template
├── .gitignore                    # Git ignore rules
├── LICENSE.txt                   # MIT License
├── package.json                  # Node.js dependencies
├── README.md                     # Main documentation
└── setup.js                      # Setup script
```

## Key Points

### Single historical_data Folder
- **Location**: `./historical_data/` (project root)
- **Used by**: `src/data-persistence.js` via `path.join(__dirname, '..', 'historical_data')`
- **Purpose**: Centralized CSV storage for all price data and MA scores
- **No duplicates**: The `src/historical_data/` folder has been removed

### Documentation Organization
- **All docs in `docs/` folder** except README.md and LICENSE.txt
- **README.md**: Main entry point with links to all documentation
- **LICENSE.txt**: Kept in root for GitHub visibility

### Source Code
- **All source in `src/` folder**
- **No data storage in src/** - uses parent `historical_data/` folder
- **Modular design**: Each file has a single responsibility

### Tests
- **All tests in `tests/` folder**
- **63 total tests**: 30 ML + 27 Data + 6 Orders
- **Master runner**: `run-all-tests.js` runs all suites
- **Test documentation**: `tests/README.md`

## File Paths

### Data Persistence
```javascript
// src/data-persistence.js
this.dataDir = path.join(__dirname, '..', 'historical_data');
// Resolves to: Bitflow/historical_data/
```

### Running the Bot
```bash
# From project root
node src/BitFlow.js
```

### Running Tests
```bash
# From project root
node tests/run-all-tests.js
node tests/test-ml-risk-manager.js
node tests/test-data-persistence.js
node tests/test-orders.js
```

## Documentation Links

From README.md:
- Setup Guide: `docs/SETUP_GUIDE.md`
- ML Implementation: `docs/ML_RISK_IMPLEMENTATION.md`
- Contributing: `docs/CONTRIBUTING.md`
- Security: `docs/SECURITY.md`
- Implementation Summary: `docs/IMPLEMENTATION_SUMMARY.md`
- Final Implementation: `docs/FINAL_IMPLEMENTATION.md`
- Test Docs: `tests/README.md`
- License: `LICENSE.txt`

## Data Flow

```
1. User runs: node src/BitFlow.js
2. BitFlow.js initializes DataPersistence
3. DataPersistence uses: ../historical_data/
4. Data saved to: historical_data/BTC_USD_5m.csv
5. MA scores saved to: historical_data/ma_scores_latest.csv
```

## Clean Structure Benefits

✅ **Single source of truth** for historical data  
✅ **No duplicate folders** or confusion  
✅ **All docs organized** in one place  
✅ **Clear separation** of concerns  
✅ **Easy to navigate** and maintain  
✅ **Professional structure** for open source  

---

**Made with ❤️ by MeridianAlgo**
