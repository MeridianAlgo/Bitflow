/**
 * MA Crossover Demo Script
 *
 * This script demonstrates the MA crossover functionality that has been added to BitFlow.
 * It shows how the system checks for MA crossovers every 5 minutes and only allows
 * buy signals when the price is above the MA crossover threshold.
 */

const { SMA, EMA } = require('technicalindicators');

// Simulate price data
const generatePriceData = (basePrice = 50000, periods = 100, trend = 'sideways') => {
    const prices = [];
    let currentPrice = basePrice;

    for (let i = 0; i < periods; i++) {
        let change = (Math.random() - 0.5) * 1000; // Random change between -500 and +500

        // Add trend component
        if (trend === 'bullish') {
            change += 100; // Upward bias
        } else if (trend === 'bearish') {
            change -= 100; // Downward bias
        }

        currentPrice += change;
        currentPrice = Math.max(currentPrice, basePrice * 0.5); // Prevent going too low
        prices.push(currentPrice);
    }

    return prices;
};

// Calculate MA crossover threshold
async function calculateMACrossoverThreshold(prices, baseLength = 20) {
    if (!prices || prices.length < 50) {
        console.log('❌ Insufficient price data for MA crossover calculation');
        return null;
    }

    // Calculate volatility for adaptive MA lengths
    const recentPrices = prices.slice(-100);
    const returns = recentPrices.slice(1).map((p, i) => Math.log(p / recentPrices[i]));
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / returns.length);

    // Adaptive MA lengths based on volatility
    const volScale = 10;
    const fastLength = Math.max(5, Math.round(baseLength - volScale * volatility));
    const slowLength = Math.max(fastLength + 5, Math.round(baseLength + volScale * volatility));

    // Calculate MAs
    const fastMA = SMA.calculate({ period: fastLength, values: prices });
    const slowMA = EMA.calculate({ period: slowLength, values: prices });

    if (fastMA.length === 0 || slowMA.length === 0) {
        console.log('❌ Insufficient MA data for crossover calculation');
        return null;
    }

    const currentFastMA = fastMA[fastMA.length - 1];
    const currentSlowMA = slowMA[slowMA.length - 1];

    // Check if fast MA is above slow MA (bullish crossover condition)
    const isBullishCrossover = currentFastMA > currentSlowMA;

    if (isBullishCrossover) {
        // Calculate the crossover threshold - price must be above this to buy
        const crossoverThreshold = Math.max(currentFastMA, currentSlowMA);
        return {
            threshold: crossoverThreshold,
            fastMA: currentFastMA,
            slowMA: currentSlowMA,
            fastLength: fastLength,
            slowLength: slowLength,
            isBullish: true,
            timestamp: new Date().toISOString()
        };
    } else {
        // Bearish - fast MA below slow MA, no buy signals allowed
        return {
            threshold: null, // No buy threshold when bearish
            fastMA: currentFastMA,
            slowMA: currentSlowMA,
            fastLength: fastLength,
            slowLength: slowLength,
            isBullish: false,
            timestamp: new Date().toISOString()
        };
    }
}

// Check if buy signal should be allowed based on MA crossover
async function shouldAllowBuySignal(prices, currentPrice, lastCheckTime, checkInterval = 5 * 60 * 1000) {
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTime;

    // Check every 5 minutes
    if (timeSinceLastCheck >= checkInterval) {
        const crossoverData = await calculateMACrossoverThreshold(prices);
        if (crossoverData) {
            // Display MA crossover status
            const isAboveThreshold = crossoverData.isBullish && currentPrice > crossoverData.threshold;

            console.log(`\n📊 MA Crossover Check (${new Date().toLocaleTimeString()}):`);
            console.log(`   Current Price: $${currentPrice.toFixed(2)}`);
            console.log(`   Fast MA (${crossoverData.fastLength}): $${crossoverData.fastMA.toFixed(2)}`);
            console.log(`   Slow MA (${crossoverData.slowLength}): $${crossoverData.slowMA.toFixed(2)}`);

            if (crossoverData.isBullish) {
                console.log(`   MA Crossover Price: $${crossoverData.threshold.toFixed(2)}`);
                console.log(`   Buy Signal Allowed: ${isAboveThreshold ? '✅ YES' : '❌ NO (price below threshold)'}`);
            } else {
                console.log(`   Status: Bearish (Fast MA < Slow MA) - No buy signals allowed`);
            }

            return {
                allowed: isAboveThreshold,
                crossoverData: crossoverData
            };
        }
    }

    // Return whether buy signals are currently allowed
    return { allowed: false, crossoverData: null };
}

// Demo function
async function runDemo() {
    console.log('🚀 MA Crossover Demo Starting...\n');

    // Generate sample price data
    console.log('📈 Generating sample price data...');
    const prices = generatePriceData(50000, 200, 'bullish');

    console.log(`✅ Generated ${prices.length} price points`);
    console.log(`   Price Range: $${Math.min(...prices).toFixed(2)} - $${Math.max(...prices).toFixed(2)}`);
    console.log(`   Latest Price: $${prices[prices.length - 1].toFixed(2)}\n`);

    // Simulate MA crossover checks every 5 minutes
    let lastCheckTime = 0;
    const checkInterval = 5 * 60 * 1000; // 5 minutes

    console.log('🔄 Simulating MA crossover checks every 5 minutes...\n');

    // Run 10 checks (simulating 50 minutes of trading)
    for (let i = 1; i <= 10; i++) {
        const currentPrice = prices[prices.length - (11 - i)]; // Use different prices for each check
        const checkResult = await shouldAllowBuySignal(prices.slice(0, 50 + i * 10), currentPrice, lastCheckTime, checkInterval);

        if (checkResult.allowed) {
            console.log(`✅ BUY SIGNAL APPROVED - Price $${currentPrice.toFixed(2)} > MA Crossover $${checkResult.crossoverData.threshold.toFixed(2)}\n`);
        } else {
            console.log(`❌ BUY SIGNAL BLOCKED - MA crossover condition not met\n`);
        }

        lastCheckTime += checkInterval;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between checks
    }

    console.log('🎯 Demo Complete!');
    console.log('\n📋 Summary:');
    console.log('   • MA crossover checks run every 5 minutes');
    console.log('   • Buy signals only allowed when price > MA crossover threshold');
    console.log('   • Fast MA must be above Slow MA for bullish conditions');
    console.log('   • System prevents buying in bearish market conditions');
}

// Run the demo
if (require.main === module) {
    runDemo().catch(console.error);
}

module.exports = {
    calculateMACrossoverThreshold,
    shouldAllowBuySignal,
    generatePriceData
};
