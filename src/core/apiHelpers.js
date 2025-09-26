// API helper functions for BitFlow
const https = require('https');
const SmartModelManager = require('./smartModelManager');

console.log('✅ Using FastLocalTradingAI - No external API dependencies needed');

async function fetchGoogleNewsHeadlines(symbol) {
    return new Promise((resolve) => {
        const query = encodeURIComponent(symbol.replace('/', ' '));
        const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
        let data = '';

        https.get(url, (res) => {
            res.on('data', chunk => data += chunk);
            res.on('end', async () => {
                try {
                    const { parseStringPromise } = require('xml2js');
                    const parsed = await parseStringPromise(data);
                    const items = parsed?.rss?.channel?.[0]?.item || [];
                    const articles = items.slice(0, 5).map(item => ({
                        title: item.title?.[0] || '',
                        description: item.description?.[0] || '',
                        publishedAt: item.pubDate?.[0] || ''
                    })).filter(article => article.title || article.description);
                    resolve(articles);
                } catch (err) {
                    console.warn('Error parsing Google News RSS:', err.message);
                    resolve([]);
                }
            });
        }).on('error', () => resolve([]));
    });
}

async function analyzeSentiment(symbol) {
    try {
        const articles = await fetchGoogleNewsHeadlines(symbol);
        if (!articles.length) {
            return { sentiment: 'neutral', score: 0, confidence: 0, articlesAnalyzed: 0 };
        }

        const smartModelManager = new SmartModelManager();
        const articlesText = articles.map(article =>
            `Title: ${article.title}\nDescription: ${article.description}`
        ).join('\n\n');

        const sentiment = await smartModelManager.analyzeSentiment(articlesText);
        return {
            sentiment: sentiment.label,
            score: sentiment.score,
            confidence: sentiment.confidence,
            articlesAnalyzed: articles.length
        };
    } catch (error) {
        console.warn('Error analyzing sentiment:', error.message);
        return { sentiment: 'neutral', score: 0, confidence: 0, articlesAnalyzed: 0 };
    }
}

function isCryptoTicker(ticker) {
    return ticker.includes('/') || [
        'BTC','ETH','LTC','XRP','DOGE','BNB','SOL','ADA','USDT','USDC','DOT','TRX','SHIB','AVAX','MATIC','WBTC','LINK','UNI','BCH','XLM','FIL','ETC','ICP','LDO','APT','CRO','ARB','QNT','VET','NEAR','OP','GRT','AAVE','MKR','ALGO','EGLD','XTZ','SAND','AXS','THETA','EOS','KAVA','MANA','SNX','RPL','FTM','XMR','FLOW','CHZ','CAKE','CRV','ENJ','ZEC','BAT','DASH','ZIL','COMP','1INCH','KSM','YFI','REN','BNT','BAL','SRM','LRC','OMG','NMR','OCEAN','BAND','STORJ','CVC','SUSHI','ANKR','SKL','GNO','GLM','REP','PAXG','CEL','RSR','REN','LPT','RUNE','SXP','HNT','DGB','KNC','CKB','ZEN','XEM','SC','LSK','STEEM','ARDR','STRAX','SYS','NXT','FCT','GAS','NAV','VTC','GAME','DCR','PIVX','XVG','BTG','BTM','QASH','WAVES','ICX','ONT','ZRX','QKC','WAN','LOOM','CENNZ','BTS','GNT','FUN','POWR','MITH','ELF','STORM','POLY','CMT','MANA','WTC','LRC','RCN','RDN','APPC','ENG','VIB','OST','LEND','TNT','FUEL','ARN','GVT','CDT','AMB','BCPT','GTO','QSP','SNM','BQX','TRIG','EVX','REQ','VIBE','WINGS','BRD','POE','TNB'
    ].includes(ticker.toUpperCase());
}

module.exports = {
    isCryptoTicker,
    analyzeSentiment,
    fetchGoogleNewsHeadlines
};