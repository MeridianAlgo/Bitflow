// core/ui.js
const { prompt, Select, Confirm, Input } = require('enquirer');
let chalk;
try {
    chalk = require('chalk');
    if (typeof chalk.cyan !== 'function') {
        // Chalk v5+ ESM loaded in CJS, fallback to no color
        chalk = new Proxy({}, { get: () => (x) => x });
    }
} catch (e) {
    // Fallback: no color
    chalk = new Proxy({}, { get: () => (x) => x });
}

// Modern CLI loader with animation
let loaderInterval = null;
function startLoader(message = 'Loading') {
    const frames = ['-', '\\', '|', '/'];
    let i = 0;
    process.stdout.write(chalk.cyan(message + ' '));
    loaderInterval = setInterval(() => {
        process.stdout.write('\r' + chalk.cyan(message + ' ' + frames[i = ++i % frames.length]));
    }, 100);
}
function stopLoader() {
    if (loaderInterval) {
        clearInterval(loaderInterval);
        loaderInterval = null;
        process.stdout.write('\r' + ' '.repeat(40) + '\r');
    }
}

// --- PROMPTS ---
async function promptTimeframe(validTimeframes) {
    const choices = Object.entries(validTimeframes).map(([key, value]) => ({ name: key, message: value }));
    const { timeframe } = await prompt({
        type: 'select',
        name: 'timeframe',
        message: 'Select timeframe:',
        choices
    });
    return timeframe;
}

async function promptTakeProfit() {
    // Auto take profit with improved UI
    await prompt({
        type: 'input',
        name: 'tp',
        message: 'Take profit % (auto):',
        initial: 'auto',
        validate: () => true
    });
    return 'auto';
}

async function promptStopLoss() {
    await prompt({
        type: 'input',
        name: 'sl',
        message: 'Stop loss % (auto):',
        initial: 'auto',
        validate: () => true
    });
    return 'auto';
}

async function promptModelLocking() {
    const { enableModelLocking } = await prompt({
        type: 'select',
        name: 'enableModelLocking',
        message: 'Enable model locking? (locks selected model for entire session)',
        choices: [
            { name: true, message: 'Yes - Use same model for entire session' },
            { name: false, message: 'No - Allow auto-switching based on market conditions' }
        ],
        initial: 0
    });
    return enableModelLocking;
}

module.exports = {
    startLoader,
    stopLoader,
    promptTimeframe,
    promptTakeProfit,
    promptStopLoss,
    promptModelLocking
};