const Alpaca = require('@alpacahq/alpaca-trade-api');
const axios = require('axios');
require('dotenv').config();

// === CONFIG ===
const symbol = 'BTC/USD'; // Change as needed
const timeframe = '5Min'; // Change as needed
const limit = 50; // Number of bars to fetch

async function fetchAlpacaHistorical(symbol, timeframe = '5Min', limit = 1000) {
    const url = `https://data.alpaca.markets/v1beta3/crypto/us/bars?symbols=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=${limit}`;
    try {
        const resp = await axios.get(url, {
            headers: {
                'Apca-Api-Key-Id': process.env.ALPACA_API_KEY_ID,
                'Apca-Api-Secret-Key': process.env.ALPACA_SECRET_KEY,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        const bars = resp.data.bars && resp.data.bars[symbol];
        if (!bars || !Array.isArray(bars) || bars.length === 0) {
            throw new Error('No OHLCV data from Alpaca');
        }
        return bars;
    } catch (err) {
        console.error('Error fetching Alpaca OHLCV:', err.message);
        return [];
    }
}

(async () => {
    console.log(`Fetching ${limit} bars for ${symbol} (${timeframe}) from Alpaca...`);
    const bars = await fetchAlpacaHistorical(symbol, timeframe, limit);
    console.log(`Fetched ${bars.length} bars.`);
    if (bars.length > 0) {
        console.log('Sample bar:', bars[0]);
    }
})(); 