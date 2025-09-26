const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Enhanced Memory System for BitFlow Trading Bot
 * 
 * This system provides:
 * - Reliable settings persistence
 * - Real-time settings validation
 * - Automatic backup and recovery
 * - Settings history tracking
 * - Cross-platform compatibility
 */
class EnhancedMemorySystem {
    constructor(settingsDir = 'user_settings') {
        this.settingsDir = path.join(__dirname, '..', settingsDir);
        this.backupDir = path.join(this.settingsDir, 'backups');
        this.historyFile = path.join(this.settingsDir, 'settings_history.json');
        this.lockFile = path.join(this.settingsDir, '.lock');
        
        this.ensureDirectories();
        this.defaultSettings = {
            defaultTimeframe: '5Min',
            defaultTakeProfit: 'auto',
            defaultStopLoss: 'auto',
            enableCrossunderSignals: true,
            enablePerformanceMetrics: true,
            enablePositionLogging: true
        };
        
        // Settings validation rules
        this.validationRules = {
            defaultTimeframe: (value) => ['1Min', '5Min', '15Min', '1Hour', '1Day'].includes(value),
            defaultTakeProfit: (value) => value === 'auto' || (typeof value === 'number' && value > 0 && value <= 10),
            defaultStopLoss: (value) => value === 'auto' || (typeof value === 'number' && value > 0 && value <= 10),
            enableCrossunderSignals: (value) => typeof value === 'boolean',
            enablePerformanceMetrics: (value) => typeof value === 'boolean',
            enablePositionLogging: (value) => typeof value === 'boolean'
        };
    }

    ensureDirectories() {
        [this.settingsDir, this.backupDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Get the file path for a setting
     */
    getSettingFilePath(key) {
        return path.join(this.settingsDir, `${key}.txt`);
    }

    /**
     * Get the backup file path for a setting
     */
    getBackupFilePath(key) {
        return path.join(this.backupDir, `${key}_${Date.now()}.txt`);
    }

    /**
     * Create a lock file to prevent concurrent access
     */
    createLock() {
        try {
            fs.writeFileSync(this.lockFile, process.pid.toString(), 'utf8');
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Remove the lock file
     */
    removeLock() {
        try {
            if (fs.existsSync(this.lockFile)) {
                fs.unlinkSync(this.lockFile);
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Parse value from string with proper type conversion
     */
    parseValue(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value;
        
        const trimmed = String(value).trim();
        
        if (trimmed === 'true') return true;
        if (trimmed === 'false') return false;
        if (trimmed === 'auto') return 'auto';
        if (!isNaN(trimmed) && trimmed !== '') return Number(trimmed);
        
        return trimmed;
    }

    /**
     * Validate a setting value
     */
    validateSetting(key, value) {
        const validator = this.validationRules[key];
        if (!validator) {
            console.warn(chalk.yellow(`⚠️ No validation rule for setting: ${key}`));
            return true;
        }
        
        const isValid = validator(value);
        if (!isValid) {
            console.error(chalk.red(`❌ Invalid value for ${key}: ${value}`));
        }
        
        return isValid;
    }

    /**
     * Create a backup of current settings
     */
    createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(this.backupDir, `settings_backup_${timestamp}.json`);
            
            const currentSettings = this.loadAllSettings();
            fs.writeFileSync(backupFile, JSON.stringify(currentSettings, null, 2), 'utf8');
            
            console.log(chalk.green(`✅ Settings backup created: ${path.basename(backupFile)}`));
            return true;
        } catch (error) {
            console.error(chalk.red(`❌ Failed to create backup: ${error.message}`));
            return false;
        }
    }

    /**
     * Add entry to settings history
     */
    addToHistory(key, oldValue, newValue) {
        try {
            let history = [];
            if (fs.existsSync(this.historyFile)) {
                const historyData = fs.readFileSync(this.historyFile, 'utf8');
                history = JSON.parse(historyData);
            }
            
            history.push({
                timestamp: new Date().toISOString(),
                key,
                oldValue,
                newValue,
                pid: process.pid
            });
            
            // Keep only last 100 entries
            if (history.length > 100) {
                history = history.slice(-100);
            }
            
            fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2), 'utf8');
        } catch (error) {
            console.warn(chalk.yellow(`⚠️ Could not update settings history: ${error.message}`));
        }
    }

    /**
     * Load a single setting with enhanced error handling
     */
    loadSetting(key, defaultValue = null) {
        const filePath = this.getSettingFilePath(key);
        
        if (!fs.existsSync(filePath)) {
            return defaultValue;
        }
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const value = this.parseValue(content);
            
            // Validate the loaded value
            if (!this.validateSetting(key, value)) {
                console.warn(chalk.yellow(`⚠️ Invalid value loaded for ${key}, using default`));
                return defaultValue;
            }
            
            return value;
        } catch (error) {
            console.error(chalk.red(`❌ Error reading setting ${key}: ${error.message}`));
            return defaultValue;
        }
    }

    /**
     * Save a single setting with enhanced error handling
     */
    saveSetting(key, value) {
        // Validate the value before saving
        if (!this.validateSetting(key, value)) {
            console.error(chalk.red(`❌ Cannot save invalid value for ${key}: ${value}`));
            return false;
        }
        
        const filePath = this.getSettingFilePath(key);
        
        try {
            // Create lock to prevent concurrent access
            if (!this.createLock()) {
                console.warn(chalk.yellow(`⚠️ Could not create lock file, proceeding anyway`));
            }
            
            // Get old value for history
            const oldValue = this.loadSetting(key, null);
            
            // Create backup before saving
            if (fs.existsSync(filePath)) {
                const backupPath = this.getBackupFilePath(key);
                fs.copyFileSync(filePath, backupPath);
            }
            
            // Save the new value
            fs.writeFileSync(filePath, String(value), 'utf8');
            
            // Add to history
            this.addToHistory(key, oldValue, value);
            
            // Remove lock
            this.removeLock();
            
            console.log(chalk.green(`✅ Setting saved: ${key} = ${value}`));
            return true;
            
        } catch (error) {
            console.error(chalk.red(`❌ Error saving setting ${key}: ${error.message}`));
            this.removeLock();
            return false;
        }
    }

    /**
     * Load all settings with comprehensive validation
     */
    loadAllSettings() {
        const settings = {};
        let hasErrors = false;
        
        console.log(chalk.blue('📋 Loading settings...'));
        
        Object.keys(this.defaultSettings).forEach(key => {
            const savedValue = this.loadSetting(key, null);
            
            if (savedValue !== null) {
                settings[key] = savedValue;
                console.log(chalk.green(`  ✓ ${key}: ${savedValue}`));
            } else {
                settings[key] = this.defaultSettings[key];
                console.log(chalk.yellow(`  ⚠ ${key}: ${this.defaultSettings[key]} (default)`));
            }
        });
        
        // Validate all settings
        Object.entries(settings).forEach(([key, value]) => {
            if (!this.validateSetting(key, value)) {
                console.error(chalk.red(`  ❌ ${key}: ${value} (INVALID)`));
                hasErrors = true;
            }
        });
        
        if (hasErrors) {
            console.warn(chalk.yellow('⚠️ Some settings have invalid values. Consider resetting to defaults.'));
        }
        
        console.log(chalk.blue('📋 Settings loaded successfully'));
        return settings;
    }

    /**
     * Save all settings with comprehensive validation
     */
    saveAllSettings(settings) {
        console.log(chalk.blue('💾 Saving settings...'));
        
        // Create backup before saving
        this.createBackup();
        
        let success = true;
        let savedCount = 0;
        
        Object.entries(settings).forEach(([key, value]) => {
            if (this.saveSetting(key, value)) {
                savedCount++;
            } else {
                success = false;
            }
        });
        
        console.log(chalk.blue(`💾 Saved ${savedCount}/${Object.keys(settings).length} settings`));
        
        if (success) {
            console.log(chalk.green('✅ All settings saved successfully'));
        } else {
            console.error(chalk.red('❌ Some settings failed to save'));
        }
        
        return success;
    }

    /**
     * Reset all settings to defaults
     */
    resetToDefaults() {
        console.log(chalk.blue('🔄 Resetting settings to defaults...'));
        
        // Create backup before reset
        this.createBackup();
        
        const success = this.saveAllSettings(this.defaultSettings);
        
        if (success) {
            console.log(chalk.green('✅ Settings reset to defaults successfully'));
        } else {
            console.error(chalk.red('❌ Failed to reset settings to defaults'));
        }
        
        return success;
    }

    /**
     * Get settings history
     */
    getSettingsHistory(limit = 10) {
        try {
            if (!fs.existsSync(this.historyFile)) {
                return [];
            }
            
            const historyData = fs.readFileSync(this.historyFile, 'utf8');
            const history = JSON.parse(historyData);
            
            return history.slice(-limit);
        } catch (error) {
            console.error(chalk.red(`❌ Error reading settings history: ${error.message}`));
            return [];
        }
    }

    /**
     * List all available settings
     */
    listSettings() {
        try {
            if (!fs.existsSync(this.settingsDir)) {
                return [];
            }
            
            return fs.readdirSync(this.settingsDir)
                .filter(file => file.endsWith('.txt') && !file.startsWith('.'))
                .map(file => file.replace('.txt', ''));
        } catch (error) {
            console.error(chalk.red(`❌ Error listing settings: ${error.message}`));
            return [];
        }
    }

    /**
     * Delete a specific setting
     */
    deleteSetting(key) {
        const filePath = this.getSettingFilePath(key);
        
        try {
            if (fs.existsSync(filePath)) {
                // Create backup before deletion
                const backupPath = this.getBackupFilePath(key);
                fs.copyFileSync(filePath, backupPath);
                
                // Get old value for history
                const oldValue = this.loadSetting(key, null);
                
                // Delete the file
                fs.unlinkSync(filePath);
                
                // Add to history
                this.addToHistory(key, oldValue, null);
                
                console.log(chalk.green(`✅ Setting deleted: ${key}`));
                return true;
            }
            
            console.log(chalk.yellow(`⚠️ Setting not found: ${key}`));
            return false;
        } catch (error) {
            console.error(chalk.red(`❌ Error deleting setting ${key}: ${error.message}`));
            return false;
        }
    }

    /**
     * Validate all current settings
     */
    validateAllSettings() {
        console.log(chalk.blue('🔍 Validating all settings...'));
        
        const settings = this.loadAllSettings();
        let isValid = true;
        
        Object.entries(settings).forEach(([key, value]) => {
            if (this.validateSetting(key, value)) {
                console.log(chalk.green(`  ✓ ${key}: ${value}`));
            } else {
                console.log(chalk.red(`  ❌ ${key}: ${value} (INVALID)`));
                isValid = false;
            }
        });
        
        if (isValid) {
            console.log(chalk.green('✅ All settings are valid'));
        } else {
            console.error(chalk.red('❌ Some settings are invalid'));
        }
        
        return isValid;
    }

    /**
     * Get system status
     */
    getSystemStatus() {
        const settings = this.loadAllSettings();
        const history = this.getSettingsHistory(5);
        const availableSettings = this.listSettings();
        
        return {
            settingsLoaded: Object.keys(settings).length,
            totalSettings: Object.keys(this.defaultSettings).length,
            recentChanges: history.length,
            availableSettings: availableSettings.length,
            isValid: this.validateAllSettings(),
            settingsDir: this.settingsDir,
            backupDir: this.backupDir
        };
    }

    /**
     * Display system status
     */
    displaySystemStatus() {
        const status = this.getSystemStatus();
        
        console.log(chalk.blue('\n📊 Enhanced Memory System Status'));
        console.log(chalk.blue('=' .repeat(40)));
        console.log(`Settings Directory: ${status.settingsDir}`);
        console.log(`Backup Directory: ${status.backupDir}`);
        console.log(`Settings Loaded: ${status.settingsLoaded}/${status.totalSettings}`);
        console.log(`Available Settings: ${status.availableSettings}`);
        console.log(`Recent Changes: ${status.recentChanges}`);
        console.log(`System Valid: ${status.isValid ? '✅ Yes' : '❌ No'}`);
        console.log(chalk.blue('=' .repeat(40)));
    }
}

module.exports = EnhancedMemorySystem;
