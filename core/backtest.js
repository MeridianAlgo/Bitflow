const fs = require('fs');
const { SMA, EMA } = require('technicalindicators');
const tf = require('@tensorflow/tfjs');
const fetch = require('node-fetch');
const yahooFinance = require('yahoo-finance2').default;
const axios = require('axios');

// --- Smart Model Manager for Local AI ---
const SmartModelManager = require('./smartModelManager');

// Initialize Smart Model Manager
const smartModelManager = new SmartModelManager();
function mapTimeframeToAlpaca(timeframe) {
    const tf = (timeframe || '').toString().trim();
    const table = {
        '1MIN': '1Min',
        '5MIN': '5Min',
        '15MIN': '15Min',
        '1HOUR': '1Hour',
        '1DAY': '1Day',
        '1 MINUTE': '1Min',
        '5 MINUTES': '5Min',
        '15 MINUTES': '15Min',
        '1 HOUR': '1Hour',
        '1 DAY': '1Day'
    };
    return table[tf.toUpperCase()] || '1Day';
}

async function loadFromAlpacaCrypto(symbol, timeframe, limit = 1000) {
    const keyId = process.env.ALPACA_API_KEY_ID;
    const secret = process.env.ALPACA_SECRET_KEY;
    if (!keyId || !secret) return [];
    try {
        const tf = mapTimeframeToAlpaca(timeframe);
        const url = 'https://data.alpaca.markets/v1beta3/crypto/us/bars';
        const params = {
            symbols: symbol,
            timeframe: tf,
            limit: Math.min(limit, 5000)
        };
        const resp = await axios.get(url, {
            params,
            headers: {
                'APCA-API-KEY-ID': keyId,
                'APCA-API-SECRET-KEY': secret
            },
            timeout: 15000
        });
        const data = resp.data || {};
        // Response shape: { bars: { 'BTC/USD': [ { c: close, ... }, ... ] } }
        const series = (data.bars && data.bars[symbol]) || [];
        const closes = series.map(b => b.c ?? b.close).filter(x => typeof x === 'number' && !isNaN(x));
        return closes.slice(-limit);
    } catch (e) {
        console.log('[Backtest] Alpaca historical fetch failed:', e.message);
        return [];
    }
}

async function getGeminiPositionSizing(entryPrice, balance, riskPct = 1.0) {
    try {
        // Use Smart Model Manager for position sizing (automatically uses optimal model)
        const advice = await smartModelManager.calculateOptimalPositionSize(balance, {
            price: entryPrice,
            volatility: 0.02, // Will be calculated from market data
            rsi: 50, // Will be calculated from market data
            trend: 'neutral' // Will be determined from market data
        }, 'medium');

        return Math.round(advice.positionSize / 100) * 100; // Round to nearest 100
    } catch (e) {
        console.log('Smart Model Manager position sizing failed:', e.message);
        return 100; // Default fallback
    }
}

// --- Smart Model Manager TP/SL Assignment ---
async function getGeminiTPSL(entryPrice, volatility) {
    try {
        // Use Smart Model Manager for TP/SL advice (automatically uses optimal model)
        const marketData = {
            price: entryPrice,
            volatility: volatility,
            rsi: 50, // Will be calculated properly
            trend: 'neutral' // Will be determined from market data
        };

        const tpSlAdvice = await smartModelManager.calculateOptimalTPSL(marketData, 'BUY');
        return { tp: tpSlAdvice.takeProfit, sl: tpSlAdvice.stopLoss };
    } catch (e) {
        console.log('Smart Model Manager TP/SL failed:', e.message);
        return { tp: 1, sl: 1 }; // Default fallback
    }
}

// --- TensorFlow.js Model for MA Length Prediction ---
// For demo: a simple model that takes last N closes and predicts fast/slow MA lengths
function createMALengthModel(inputSize = 20) {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [inputSize], units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 2, activation: 'linear' })); // [fast, slow]
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
    return model;
}

// Dummy training for demonstration (in practice, train on real data)
async function trainMAModel(model, closes) {
    // Generate dummy targets: fast = 10-20, slow = 20-40
    const xs = [];
    const ys = [];
    for (let i = 20; i < closes.length; i++) {
        xs.push(closes.slice(i-20, i));
        ys.push([10 + Math.random()*10, 20 + Math.random()*20]);
    }
    const xsTensor = tf.tensor2d(xs);
    const ysTensor = tf.tensor2d(ys);
    await model.fit(xsTensor, ysTensor, { epochs: 5, verbose: 0 });
    xsTensor.dispose();
    ysTensor.dispose();
}

// --- Helper: Load historical data from CSV (date,open,high,low,close,volume) ---
function loadCSV(filePath) {
    const data = fs.readFileSync(filePath, 'utf8').split('\n').slice(1);
    return data.map(line => {
        const parts = line.split(',');
        return parseFloat(parts[4]); // close price
    }).filter(x => !isNaN(x));
}

// --- Helper: Load historical data using Yahoo Finance (avoid circular deps) ---
function mapTimeframeToYahoo(timeframe) {
    // Accept both '1Min' and '1 Minute' styles
    const tf = (timeframe || '').toString().trim();
    const table = {
        '1MIN': { range: '1d', interval: '1m' },
        '5MIN': { range: '5d', interval: '5m' },
        '15MIN': { range: '1mo', interval: '15m' },
        '1HOUR': { range: '3mo', interval: '60m' },
        '1DAY': { range: '1y', interval: '1d' },
        '1 MINUTE': { range: '1d', interval: '1m' },
        '5 MINUTES': { range: '5d', interval: '5m' },
        '15 MINUTES': { range: '1mo', interval: '15m' },
        '1 HOUR': { range: '3mo', interval: '60m' },
        '1 DAY': { range: '1y', interval: '1d' }
    };
    return table[tf.toUpperCase()] || { range: '1mo', interval: '1d' };
}

async function loadHistoricalCloses(symbol, timeframe, limit = 1000) {
    try {
        const yahooSymbol = symbol.replace('/', '-');
        const { range, interval } = mapTimeframeToYahoo(timeframe);
        const queryOptions = {
            range,
            interval
        };
        const bars = await yahooFinance.historical(yahooSymbol, queryOptions);
        // Most recent last; ensure we take last N closes
        const closes = (bars || [])
            .map(b => b.close)
            .filter(x => typeof x === 'number' && !isNaN(x));
        return closes.slice(-limit);
    } catch (e) {
        console.log('[Backtest] Yahoo Finance historical fetch failed:', e.message);
        return [];
    }
}

// --- Helper: Log position to CSV ---
function isValidPosition(position) {
    // Check for missing fields
    const required = ['symbol','entry_idx','entry_price','exit_idx','exit_price','position_size','pnl','reason'];
    for (const key of required) {
        if (position[key] === undefined || position[key] === null || position[key] === '') return false;
    }
    // Check for NaN or absurd values
    const numFields = ['entry_idx','entry_price','exit_idx','exit_price','position_size','pnl'];
    for (const key of numFields) {
        const val = Number(position[key]);
        if (isNaN(val) || !isFinite(val)) return false;
        if (Math.abs(val) > 1e8) return false; // Arbitrary sanity limit
    }
    return true;
}

function logPositionToCSV(position, outPath = 'logs/backtest_results/positions_sold.csv') {
    if (!isValidPosition(position)) {
        console.log('[WARN] Skipping invalid position log:', position);
        return;
    }
    
    // Create directory if it doesn't exist
    const dirPath = outPath.split('/');
    dirPath.pop();
    const dir = dirPath.join('/');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    const header = 'symbol,entry_idx,entry_price,exit_idx,exit_price,position_size,pnl,reason\n';
    const line = `${position.symbol || ''},${position.entry_idx},${position.entry_price},${position.exit_idx},${position.exit_price},${position.position_size},${position.pnl},${position.reason}\n`;
    if (!fs.existsSync(outPath)) {
        fs.writeFileSync(outPath, header + line);
    } else {
        fs.appendFileSync(outPath, line);
    }
}

// --- Performance Metrics ---
function calcPerformance(trades, prices) {
    let pnl = 0, wins = 0, losses = 0, maxDrawdown = 0, peak = 0, equity = 0;
    let equityCurve = [];
    for (const t of trades) {
        pnl += t.pnl;
        if (t.pnl > 0) wins++; else losses++;
        equity += t.pnl;
        peak = Math.max(peak, equity);
        maxDrawdown = Math.max(maxDrawdown, peak - equity);
        equityCurve.push(equity);
    }
    // Sharpe ratio (assume 0.05% risk-free, daily returns)
    const returns = equityCurve.map((v, i, arr) => i === 0 ? 0 : (v - arr[i-1]) / arr[i-1]).filter(x => !isNaN(x));
    const mean = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
    const std = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length || 1));
    const sharpe = std ? (mean - 0.0005) / std * Math.sqrt(252) : 0;
    return { pnl, winRate: wins/(wins+losses||1), maxDrawdown, sharpe };
}

// --- Backtest Loop ---
async function backtest(prices, params, symbol, balance = 10000) {
    // Train the MA length model
    const maModel = createMALengthModel(20);
    await trainMAModel(maModel, prices);
    let position = null, entry = 0, trades = [];
    let position_size = null;
    let tp = 1, sl = 1;
    for (let i = 21; i < prices.length; i++) {
        // Use TensorFlow.js model to predict MA lengths
        const input = tf.tensor2d([prices.slice(i-20, i)]);
        const [fastLength, slowLength] = (await maModel.predict(input).array())[0].map(x => Math.round(x));
        input.dispose();
        // Calculate recent volatility (std dev of last 20 returns)
        const recent = prices.slice(i-20, i);
        const returns = recent.slice(1).map((p, idx) => (p - recent[idx]) / recent[idx]);
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const volatility = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length) * 100;
        // Momentum-based entry: Buy if current close > previous close
        if (!position && prices[i] > prices[i-1]) {
            position = { entry: prices[i], entry_idx: i };
            entry = prices[i];
            // Only call Smart Model Manager for buy signals
            try {
                position_size = await getGeminiPositionSizing(entry, balance);
            } catch (e) {
                console.log('[Smart Model] Error for position sizing. Using default value.');
                position_size = 100;
            }
            try {
                const tpsl = await getGeminiTPSL(entry, volatility);
                tp = tpsl.tp;
                sl = tpsl.sl;
            } catch (e) {
                console.log('[Smart Model] Error for TP/SL. Using default values.');
                tp = 1;
                sl = 1;
            }
            continue;
        }
        // Exit logic: Take profit, stop loss, or more sophisticated exit conditions
        if (position) {
            const exit = prices[i];
            let reason = null;
            const pnl_pct = ((exit - position.entry) / position.entry) * 100;
            const holdingPeriod = i - position.entry_idx;
            
            // Calculate some technical indicators for more diverse exit reasons
            const priceChange = prices[i] / prices[i-1] - 1;
            const shortTermTrend = prices[i] / prices[Math.max(0, i-3)] - 1;
            const volatilityNow = Math.abs(priceChange) * 100;
            
            if (pnl_pct >= tp) {
                reason = 'Take Profit Hit';
            } else if (pnl_pct <= -sl) {
                reason = 'Stop Loss Hit';
            } else if (prices[i] < prices[i-1] && holdingPeriod > 3) {
                // More diverse exit reasons based on market conditions
                if (volatilityNow > 1.5) {
                    reason = 'High Volatility Exit';
                } else if (shortTermTrend < -0.02) {
                    reason = 'Bearish Pattern Detected';
                } else if (holdingPeriod > 10) {
                    reason = 'Position Age Limit';
                } else {
                    reason = 'Momentum Loss';
                }
            }
            if (reason) {
                const trade = {
                    symbol,
                    entry_idx: position.entry_idx,
                    entry_price: position.entry,
                    exit_idx: i,
                    exit_price: exit,
                    position_size,
                    tp,
                    sl,
                    pnl: (exit - position.entry) * position_size,
                    reason
                };
                trades.push(trade);
                logPositionToCSV(trade);
                position = null;
                position_size = null;
                tp = 1;
                sl = 1;
            }
        }
    }
    return trades;
}

// --- Random Search Optimization ---
async function optimize(prices, n=30, symbol='BTC/USD') {
    let best = null, bestParams = null;
    for (let i = 0; i < n; i++) {
        const params = {
            baseLength: Math.floor(Math.random()*20)+10,
            evalPeriod: Math.floor(Math.random()*10)+10,
            volScale: Math.random()*10+5,
            rsiPeriod: 14,
            rsiBuyMin: 50+Math.random()*10,
            rsiBuyMax: 60+Math.random()*10,
            rsiSellMin: 30+Math.random()*10,
            rsiSellMax: 40+Math.random()*10
        };
        const perf = await backtest(prices, params, symbol);

        // Only log optimization trials if not in minimal UI mode
        if (process.env.BITFLOW_MIN_UI !== '1') {
            console.log(`Trial ${i+1}:`, params, perf);
        }

        if (!best || perf.sharpe > best.sharpe) {
            best = perf;
            bestParams = params;
        }
    }

    if (process.env.BITFLOW_MIN_UI !== '1') {
        console.log('Best Params:', bestParams, best);
    }
    return bestParams;
}

// --- Exported runBacktest function for integration with BitFlow.js ---
async function runBacktest(symbol = 'BTC/USD', timeframe = '5Min', limit = 1000) {
    // Only log if not in minimal UI mode
    const verbose = process.env.BITFLOW_MIN_UI !== '1';
    const MIN_CONSOLE_OUTPUT = process.env.MIN_CONSOLE_OUTPUT === '1';

    if (verbose && !MIN_CONSOLE_OUTPUT) {
        console.log(`[Backtest] Starting backtest for ${symbol} (${timeframe}, limit ${limit})`);
        console.log('[Backtest] Fetching historical data...');
    }

    let prices = await loadFromAlpacaCrypto(symbol, timeframe, limit);
    if (!prices.length) {
        if (verbose && !MIN_CONSOLE_OUTPUT) console.log('[Backtest] Alpaca returned no data. Falling back to Yahoo Finance...');
        prices = await loadHistoricalCloses(symbol, timeframe, limit);
    }
    if (!prices.length) {
        if (verbose && !MIN_CONSOLE_OUTPUT) console.log('[Backtest] No historical data available. Using default MA values.');
        return { baseLength: 20, evalPeriod: 20 };
    }

    if (verbose && !MIN_CONSOLE_OUTPUT) console.log(`[Backtest] Data fetch complete (${prices.length} bars). Optimizing MA parameters...`);
    const bestParams = await optimize(prices, 10, symbol);
    if (verbose && !MIN_CONSOLE_OUTPUT) console.log('[Backtest] Optimization complete.');

    // Return the best MA params
    return {
        baseLength: bestParams.baseLength,
        evalPeriod: bestParams.evalPeriod
    };
}

module.exports = {
    runBacktest,
    loadFromAlpacaCrypto,
    loadHistoricalCloses,
    // ... export other functions as needed ...
};

// --- Main Entrypoint ---
// (async () => {
//     // Usage: node core/backtest.js [csv_file] [symbol] [timeframe] [limit]
//     const file = process.argv[2];
//     let prices;
//     if (file && file.endsWith('.csv')) {
//         prices = loadCSV(file);
//     } else {
//         // Fetch from Alpaca
//         const symbol = process.argv[2] || 'BTC/USD';
//         const timeframe = process.argv[3] || '5Min';
//         const limit = parseInt(process.argv[4] || '1000', 10);
//         console.log(`Fetching historical data for ${symbol} (${timeframe}, limit ${limit}) from Alpaca...`);
//         prices = await loadFromAlpaca(symbol, timeframe, limit);
//         if (!prices.length) {
//             console.log('No historical data available from Alpaca.');
//             process.exit(1);
//         }
//     }
//     const bestParams = await optimize(prices, 30, symbol);
//     fs.writeFileSync('best_strategy_params.json', JSON.stringify(bestParams, null, 2));
//     console.log('Best parameters saved to best_strategy_params.json');
// })();