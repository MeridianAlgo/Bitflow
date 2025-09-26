/**
 * BitFlow Logger System
 * 
 * A centralized logging system that controls console output based on environment settings.
 * This helps reduce console clutter while still providing necessary information.
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class Logger {
    constructor(options = {}) {
        this.options = {
            logLevel: process.env.BITFLOW_LOG_LEVEL || 'info',
            minUI: process.env.BITFLOW_MIN_UI === '1',
            logToFile: process.env.BITFLOW_LOG_TO_FILE === '1',
            logFilePath: process.env.LOG_FILE || path.join(process.cwd(), 'bitflow.log'),
            ...options
        };
        
        // Log levels: debug < info < warn < error < none
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
            none: 4
        };
        
        // Create log directory if logging to file
        if (this.options.logToFile) {
            const logDir = path.dirname(this.options.logFilePath);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
        }
    }
    
    shouldLog(level) {
        return this.levels[level] >= this.levels[this.options.logLevel];
    }
    
    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    }
    
    logToConsole(level, message, color) {
        if (this.options.minUI && level !== 'error') return;
        
        const formattedMsg = this.formatMessage(level, message);
        console[level](color(formattedMsg));
    }
    
    writeToFile(level, message) {
        if (!this.options.logToFile) return;
        
        const formattedMsg = this.formatMessage(level, message);
        fs.appendFileSync(this.options.logFilePath, formattedMsg + '\n');
    }
    
    debug(message) {
        if (!this.shouldLog('debug')) return;
        this.logToConsole('debug', message, chalk.blue);
        this.writeToFile('debug', message);
    }
    
    info(message) {
        if (!this.shouldLog('info')) return;
        this.logToConsole('log', message, chalk.white);
        this.writeToFile('info', message);
    }
    
    warn(message) {
        if (!this.shouldLog('warn')) return;
        this.logToConsole('warn', message, chalk.yellow);
        this.writeToFile('warn', message);
    }
    
    error(message) {
        if (!this.shouldLog('error')) return;
        this.logToConsole('error', message, chalk.red);
        this.writeToFile('error', message);
    }
    
    // Special methods for BitFlow-specific logging
    market(symbol, price, info = '') {
        if (this.options.minUI) return;
        const message = `${symbol}: $${price}${info ? ' | ' + info : ''}`;
        console.log(chalk.green(`[${new Date().toLocaleTimeString()}] 📊 ${message}`));
    }
    
    signal(symbol, type, price, info = '') {
        const emoji = type === 'BUY' ? '🔼' : '🔽';
        const color = type === 'BUY' ? chalk.green : chalk.red;
        const message = `${symbol} ${type} SIGNAL at $${price}${info ? ' | ' + info : ''}`;
        console.log(color(`[${new Date().toLocaleTimeString()}] ${emoji} ${message} ${emoji}`));
        this.writeToFile('signal', message);
    }
    
    heartbeat(symbol) {
        if (this.options.minUI) return;
        const now = new Date().toLocaleString();
        console.log(chalk.blue(`[${now}] 💓 Still monitoring ${symbol}`));
    }
    
    backtest(message) {
        // Only show backtest messages if not in minimal output mode
        if (process.env.MIN_CONSOLE_OUTPUT === '1') return;
        console.log(chalk.cyan(`[BACKTEST] ${message}`));
    }
}

// Create and export a singleton instance
const logger = new Logger();

module.exports = logger;