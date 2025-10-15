/**
 * Comprehensive Logging System for BitFlow Trading Bot
 * Handles structured logging with different levels and categories
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class Logger {
    constructor() {
        this.logDir = './logs';
        this.levels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        this.currentLevel = this.levels.INFO;
        this.categories = {
            STRATEGY: 'strategy',
            ORDERS: 'orders',
            DATA: 'data',
            SYSTEM: 'system',
            TRADES: 'trades'
        };
        
        this.ensureLogDirectory();
    }

    /**
     * Ensure log directory exists
     */
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
        
        // Create category subdirectories
        Object.values(this.categories).forEach(category => {
            const categoryDir = path.join(this.logDir, category);
            if (!fs.existsSync(categoryDir)) {
                fs.mkdirSync(categoryDir, { recursive: true });
            }
        });
    }

    /**
     * Get log file path for category and date
     */
    getLogFilePath(category, date = new Date()) {
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        return path.join(this.logDir, category, `${category}_${dateStr}.log`);
    }

    /**
     * Format log entry
     */
    formatLogEntry(level, category, message, data = null) {
        const timestamp = new Date().toISOString();
        const entry = {
            timestamp,
            level,
            category,
            message,
            data: data || undefined
        };
        
        return JSON.stringify(entry);
    }

    /**
     * Write log entry to file
     */
    writeToFile(category, logEntry) {
        try {
            const filePath = this.getLogFilePath(category);
            fs.appendFileSync(filePath, logEntry + '\n', 'utf8');
        } catch (error) {
            console.error('Failed to write log:', error.message);
        }
    }

    /**
     * Log with specified level and category
     */
    log(level, category, message, data = null) {
        if (this.levels[level] > this.currentLevel) {
            return; // Skip if below current log level
        }

        const logEntry = this.formatLogEntry(level, category, message, data);
        this.writeToFile(category, logEntry);

        // Also log to console with colors
        this.logToConsole(level, category, message, data);
    }

    /**
     * Log to console with colors
     */
    logToConsole(level, category, message, data) {
        const timestamp = new Date().toLocaleTimeString();
        let coloredLevel;
        
        switch (level) {
            case 'ERROR':
                coloredLevel = chalk.red.bold(level);
                break;
            case 'WARN':
                coloredLevel = chalk.yellow.bold(level);
                break;
            case 'INFO':
                coloredLevel = chalk.blue.bold(level);
                break;
            case 'DEBUG':
                coloredLevel = chalk.gray.bold(level);
                break;
            default:
                coloredLevel = level;
        }

        const categoryColor = chalk.cyan(`[${category.toUpperCase()}]`);
        console.log(`${chalk.gray(timestamp)} ${coloredLevel} ${categoryColor} ${message}`);
        
        if (data) {
            console.log(chalk.gray('  Data:'), data);
        }
    }

    // Convenience methods for different levels
    error(category, message, data) {
        this.log('ERROR', category, message, data);
    }

    warn(category, message, data) {
        this.log('WARN', category, message, data);
    }

    info(category, message, data) {
        this.log('INFO', category, message, data);
    }

    debug(category, message, data) {
        this.log('DEBUG', category, message, data);
    }

    // Category-specific logging methods
    logStrategy(level, message, data) {
        this.log(level, this.categories.STRATEGY, message, data);
    }

    logOrder(level, message, data) {
        this.log(level, this.categories.ORDERS, message, data);
    }

    logData(level, message, data) {
        this.log(level, this.categories.DATA, message, data);
    }

    logSystem(level, message, data) {
        this.log(level, this.categories.SYSTEM, message, data);
    }

    logTrade(level, message, data) {
        this.log(level, this.categories.TRADES, message, data);
    }

    /**
     * Log trade execution with full audit trail
     */
    logTradeExecution(tradeData) {
        const auditEntry = {
            timestamp: new Date().toISOString(),
            type: 'TRADE_EXECUTION',
            symbol: tradeData.symbol,
            action: tradeData.action,
            quantity: tradeData.quantity,
            price: tradeData.price,
            orderId: tradeData.orderId,
            strategy: tradeData.strategy,
            signal: tradeData.signal,
            pnl: tradeData.pnl || null,
            fees: tradeData.fees || null
        };

        // Write to trades log
        const filePath = this.getLogFilePath('trades');
        fs.appendFileSync(filePath, JSON.stringify(auditEntry) + '\n', 'utf8');

        // Also log to console
        this.info('TRADES', `${tradeData.action} ${tradeData.symbol}`, auditEntry);
    }

    /**
     * Log strategy optimization results
     */
    logOptimization(optimizationData) {
        const entry = {
            timestamp: new Date().toISOString(),
            type: 'STRATEGY_OPTIMIZATION',
            symbol: optimizationData.symbol,
            timeframe: optimizationData.timeframe,
            bestStrategy: optimizationData.bestStrategy,
            totalTested: optimizationData.totalTested,
            duration: optimizationData.duration
        };

        this.logStrategy('INFO', 'Strategy optimization completed', entry);
    }

    /**
     * Log system performance metrics
     */
    logPerformance(metrics) {
        const entry = {
            timestamp: new Date().toISOString(),
            type: 'PERFORMANCE_METRICS',
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            ...metrics
        };

        this.logSystem('INFO', 'Performance metrics', entry);
    }

    /**
     * Set log level
     */
    setLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.currentLevel = this.levels[level];
            this.info('SYSTEM', `Log level set to ${level}`);
        }
    }

    /**
     * Get log statistics
     */
    getLogStats() {
        const stats = {};
        
        Object.values(this.categories).forEach(category => {
            const categoryDir = path.join(this.logDir, category);
            if (fs.existsSync(categoryDir)) {
                const files = fs.readdirSync(categoryDir);
                stats[category] = {
                    fileCount: files.length,
                    files: files
                };
            }
        });

        return stats;
    }

    /**
     * Clean old log files (older than specified days)
     */
    cleanOldLogs(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        Object.values(this.categories).forEach(category => {
            const categoryDir = path.join(this.logDir, category);
            if (fs.existsSync(categoryDir)) {
                const files = fs.readdirSync(categoryDir);
                
                files.forEach(file => {
                    const filePath = path.join(categoryDir, file);
                    const stats = fs.statSync(filePath);
                    
                    if (stats.mtime < cutoffDate) {
                        fs.unlinkSync(filePath);
                        this.info('SYSTEM', `Cleaned old log file: ${file}`);
                    }
                });
            }
        });
    }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;