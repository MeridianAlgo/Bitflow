// Direct file reading monitor display
const fs = require('fs');
const path = require('path');

class DirectFileMonitor {

    constructor(settingsDir = 'user_settings') {
        this.settingsDir = settingsDir;
    }

    // Utility: strip ANSI color codes
    stripAnsi(input) {
        if (typeof input !== 'string') return input;
        // Regex to strip ANSI escape codes
        return input.replace(/[\u001B\u009B][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    }

    // Parse boolean-like values from strings (supports emojis and words)
    parseBooleanish(value) {
        if (typeof value !== 'string') return value;
        const clean = this.stripAnsi(value).trim().toLowerCase();
        if (clean === 'true' || clean === 'on' || clean === 'enabled' || clean === '✅ on') return true;
        if (clean === 'false' || clean === 'off' || clean === 'disabled' || clean === '✗ off' || clean === 'x off') return false;
        // Look for keywords within the string
        if (clean.includes('on') || clean.includes('enabled') || clean.includes('✅')) return true;
        if (clean.includes('off') || clean.includes('disabled') || clean.includes('✗')) return false;
        return value; // return original string if not determinable
    }

    // Read directly from file, no caching
    readSettingFile(filename) {
        const filePath = path.join(this.settingsDir, `${filename}.txt`);
        try {
            if (fs.existsSync(filePath)) {
                const raw = fs.readFileSync(filePath, 'utf8');
                const content = raw.trim();
                // Parse boolean values robustly
                if (content === 'true' || content === 'false') {
                    return content === 'true';
                }
                const boolish = this.parseBooleanish(content);
                return boolish;
            }
            return null;
        } catch (error) {
            console.warn(`Error reading ${filename}:`, error.message);
            return null;
        }
    }

    // Get all settings directly from files
    getCurrentSettings() {
        return {
            defaultTimeframe: this.readSettingFile('defaultTimeframe') || '5Min',
            defaultTakeProfit: this.readSettingFile('defaultTakeProfit') || 'auto',
            defaultStopLoss: this.readSettingFile('defaultStopLoss') || 'auto',
            enableCrossunderSignals: this.readSettingFile('enableCrossunderSignals') ?? true,
            enablePerformanceMetrics: this.readSettingFile('enablePerformanceMetrics') ?? false,
            enablePositionLogging: this.readSettingFile('enablePositionLogging') ?? true
        };
    }

    // Display monitor card reading directly from files
    displayMonitorCard(symbol) {
        // Read fresh from files every time
        const settings = this.getCurrentSettings();
        
        console.log('┌────────────────────────────────────┐');
        console.log(`│ ${symbol} Monitor`.padEnd(36) + '│');
        console.log(`│ Symbol: ${symbol}    Timeframe: ${settings.defaultTimeframe}`.padEnd(36) + '│');
        console.log(`│ Crossunder: ● ${settings.enableCrossunderSignals === true ? 'Enabled' : 'Disabled'}`.padEnd(36) + '│');
        console.log(`│ Metrics: ● ${settings.enablePerformanceMetrics === true ? 'Enabled' : 'Disabled'}`.padEnd(36) + '│');
        console.log(`│ Logging: ● ${settings.enablePositionLogging === true ? 'Enabled' : 'Disabled'}`.padEnd(36) + '│');
        console.log('│                                    │');
        console.log('└────────────────────────────────────┘');
        
        return settings;
    }

    // Watch files for changes and update display
    watchFiles(symbol, callback) {
        const filesToWatch = [
            'defaultTimeframe.txt',
            'enableCrossunderSignals.txt', 
            'enablePerformanceMetrics.txt',
            'enablePositionLogging.txt'
        ];

        const watchers = [];
        
        filesToWatch.forEach(filename => {
            const filePath = path.join(this.settingsDir, filename);
            if (fs.existsSync(filePath)) {
                const watcher = fs.watchFile(filePath, { interval: 500 }, () => {
                    console.log(`\n🔄 Settings file changed: ${filename}`);
                    const newSettings = this.displayMonitorCard(symbol);
                    if (callback) callback(newSettings);
                });
                watchers.push(() => fs.unwatchFile(filePath));
            }
        });

        return () => watchers.forEach(unwatch => unwatch());
    }
}

module.exports = DirectFileMonitor;