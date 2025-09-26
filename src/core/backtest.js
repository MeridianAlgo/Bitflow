const fs = require('fs');
const path = require('path');
const BitFlow = require('./BitFlow');
const { SMA, EMA } = require('technicalindicators');
const tf = require('@tensorflow/tfjs');
const fetch = require('node-fetch');
const { printStatus, printSuccess, printWarning, printError, printBanner, printCard } = require('./ui');

const BACKTEST_OUTPUT_DIR = path.join(__dirname, '../../logs/backtests');

// --- Gemini AI Position Sizing ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// --- Gemini API Rate Limiter ---
let lastGeminiCall = 0;
async function rateLimitedGeminiCall(fn, ...args) {
    const now = Date.now();
    const minInterval = 7000; // 7 seconds between calls
    const wait = Math.max(0, lastGeminiCall + minInterval - now);
    if (wait > 0) {
        await new Promise(res => setTimeout(res, wait));
    }
    lastGeminiCall = Date.now();
    return await fn(...args);
}

async function getGeminiPositionSizing(entryPrice, balance, riskPct = 1.0) {
    const prompt = `Given an entry price of ${entryPrice} and an account balance of ${balance}, and a risk percentage of ${riskPct}%, calculate the optimal position size (number of units to buy), rounding to the nearest hundred. Only return the integer value.`;
    const headers = { 'Content-Type': 'application/json' };
    const params = new URLSearchParams({ key: GEMINI_API_KEY });
    const data = { contents: [{ parts: [{ text: prompt }] }] };
    const response = await fetch(`${GEMINI_API_URL}?${params.toString()}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });
    if (response.ok) {
        try {
            const result = await response.json();
            const text = result.candidates[0].content.parts[0].text;
            const value = parseInt(text.replace(/\D/g, ''));
            return Math.round(value / 100) * 100;
        } catch (e) {
            console.log('Gemini AI parse error:', e);
            return 100;
        }
    } else {
        console.log('Gemini AI API error:', response.status, await response.text());
        return 100;
    }
}

// --- Gemini AI TP/SL Assignment ---
async function getGeminiTPSL(entryPrice, volatility) {
    const prompt = `Given an entry price of ${entryPrice} and a recent volatility of ${volatility}, suggest a take profit (TP) and stop loss (SL) percentage for a crypto trade. TP and SL should be reasonable for the given volatility. Only return two numbers separated by a comma, e.g. '1.5,1.0' for 1.5% TP and 1.0% SL.`;
    const headers = { 'Content-Type': 'application/json' };
    const params = new URLSearchParams({ key: GEMINI_API_KEY });
    const data = { contents: [{ parts: [{ text: prompt }] }] };
    const response = await fetch(`${GEMINI_API_URL}?${params.toString()}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });
    if (response.ok) {
        try {
            const result = await response.json();
            const text = result.candidates[0].content.parts[0].text;
            const [tp, sl] = text.split(',').map(x => parseFloat(x));
            return { tp: tp || 1, sl: sl || 1 };
        } catch (e) {
            console.log('Gemini AI TP/SL parse error:', e);
            return { tp: 1, sl: 1 };
        }
    } else {
        console.log('Gemini AI API error (TP/SL):', response.status, await response.text());
        return { tp: 1, sl: 1 };
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

// --- Helper: Load historical data from Alpaca ---
async function loadFromAlpaca(symbol, timeframe, limit) {
    const strategy = new BitFlow(symbol, 20, 20, timeframe);
    const bars = await strategy.fetchAlpacaHistorical(symbol, timeframe, limit);
    return bars.map(b => b.close || b.c).filter(x => !isNaN(x));
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

function ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function toSafeName(value) {
    return String(value).replace(/[^a-z0-9_\-]/gi, '_');
}

function logPositionToCSV(position, { symbol, timeframe, outPath }) {
    if (!isValidPosition(position)) {
        console.log('[WARN] Skipping invalid position log:', position);
        return;
    }
    if (!symbol || !timeframe || !outPath) {
        console.log('[WARN] Missing logging metadata:', { symbol, timeframe, outPath });
        return;
    }

    const directory = path.dirname(outPath);
    ensureDirectory(directory);

    const header = 'symbol,timeframe,entry_idx,entry_price,exit_idx,exit_price,position_size,pnl,reason\n';
    const line = `${position.symbol || ''},${timeframe},${position.entry_idx},${position.entry_price},${position.exit_idx},${position.exit_price},${position.position_size},${position.pnl},${position.reason}\n`;
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
async function backtest(prices, params, symbol, timeframe, balance = 10000, options = {}) {
    const { logTrades = true } = options;
    let logMeta = null;
    if (logTrades) {
        ensureDirectory(BACKTEST_OUTPUT_DIR);
        const safeSymbol = toSafeName(symbol || 'unknown');
        const safeTimeframe = toSafeName(timeframe || 'unknown');
        const symbolDir = path.join(BACKTEST_OUTPUT_DIR, safeSymbol);
        ensureDirectory(symbolDir);
        logMeta = {
            symbol,
            timeframe,
            outPath: path.join(symbolDir, `${safeTimeframe}.csv`)
        };
    }
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
            // Only call Gemini for buy signals, with rate limiting
            try {
                position_size = await rateLimitedGeminiCall(getGeminiPositionSizing, entry, balance);
            } catch (e) {
                console.log('[Gemini] Error or rate limit hit for position sizing. Using default value.');
                position_size = 100;
            }
            try {
                const tpsl = await rateLimitedGeminiCall(getGeminiTPSL, entry, volatility);
                tp = tpsl.tp;
                sl = tpsl.sl;
            } catch (e) {
                console.log('[Gemini] Error or rate limit hit for TP/SL. Using default values.');
                tp = 1;
                sl = 1;
            }
            continue;
        }
        // Exit logic: Take profit, stop loss, or next down tick
        if (position) {
            const exit = prices[i];
            let reason = null;
            const pnl_pct = ((exit - position.entry) / position.entry) * 100;
            if (pnl_pct >= tp) {
                reason = 'Take Profit Hit';
            } else if (pnl_pct <= -sl) {
                reason = 'Stop Loss Hit';
            } else if (prices[i] < prices[i-1]) {
                reason = 'Momentum Loss (Down Tick)';
            }
            if (reason) {
                const trade = {
                    symbol,
                    timeframe,
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
                if (logMeta) {
                    logPositionToCSV(trade, logMeta);
                }
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
async function optimize(prices, n=30, symbol='BTC/USD', timeframe='5Min', balance = 10000) {
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
        const perf = await backtest(prices, params, symbol, timeframe, balance, { logTrades: false });
        if (!best || (perf && perf.sharpe > best.sharpe)) {
            best = perf;
            bestParams = params;
        }
        console.log(`Trial ${i+1}:`, params, perf);
    }
    console.log('Best Params:', bestParams, best);
    return bestParams;
}

// --- Exported runBacktest function for integration with BitFlow.js ---
async function runBacktest(symbol = 'BTC/USD', timeframe = '5Min', limit = 1000) {
    printBanner(`BitFlow Backtest - ${symbol} (${timeframe})`);
    printStatus(`Fetching historical data from Alpaca...`);
    const prices = await loadFromAlpaca(symbol, timeframe, limit);
    if (!prices.length) {
        printError('No historical data available from Alpaca.');
        return null;
    }
    printSuccess(`Loaded ${prices.length} price points.`);

    printStatus('Training MA model and optimizing parameters...');
    const bestParams = await optimize(prices, 10, symbol, timeframe);
    printSuccess('Optimization complete.');
    
    // Now run the backtest with best params to show results
    printStatus('Running backtest with optimized parameters...');
    const trades = await backtest(prices, bestParams, symbol, timeframe);
    const perf = calcPerformance(trades, prices);

    console.log('Backtest Results:');
    console.log(`Symbol: ${symbol}`);
    console.log(`Timeframe: ${timeframe}`);
    console.log(`Total Trades: ${trades.length}`);
    console.log(`Total P&L: $${perf.pnl.toFixed(2)}`);
    console.log(`Win Rate: ${(perf.winRate * 100).toFixed(1)}%`);
    console.log(`Max Drawdown: ${perf.maxDrawdown.toFixed(2)}`);
    console.log(`Sharpe Ratio: ${perf.sharpe.toFixed(2)}`);
    console.log(`Best Params: baseLength=${bestParams.baseLength}, evalPeriod=${bestParams.evalPeriod}`);

    return bestParams;
}
module.exports = { runBacktest };