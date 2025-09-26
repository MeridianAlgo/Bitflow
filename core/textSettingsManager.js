const fs = require('fs');
const path = require('path');

class TextSettingsManager {
    constructor(settingsDir = 'user_settings') {
        this.settingsDir = path.join(__dirname, '..', settingsDir);
        this.ensureSettingsDirectory();
    }

    ensureSettingsDirectory() {
        if (!fs.existsSync(this.settingsDir)) {
            fs.mkdirSync(this.settingsDir, { recursive: true });
        }
    }

    getSettingFilePath(key) {
        return path.join(this.settingsDir, `${key}.txt`);
    }

    // Load a single setting from its text file
    loadSetting(key, defaultValue = null) {
        const filePath = this.getSettingFilePath(key);
        if (!fs.existsSync(filePath)) {
            return defaultValue;
        }
        try {
            const value = fs.readFileSync(filePath, 'utf8').trim();
            return this.parseValue(value);
        } catch (error) {
            console.warn(`Error reading setting ${key}:`, error.message);
            return defaultValue;
        }
    }

    // Save a single setting to its text file
    saveSetting(key, value) {
        const filePath = this.getSettingFilePath(key);
        try {
            fs.writeFileSync(filePath, String(value), 'utf8');
            return true;
        } catch (error) {
            console.error(`Error saving setting ${key}:`, error.message);
            return false;
        }
    }

    // Load all settings into an object
    loadAllSettings() {
        const settings = {};
        const defaultSettings = {
            defaultTimeframe: '5Min',
            defaultTakeProfit: 'auto',
            defaultStopLoss: 'auto',
            enableCrossunderSignals: true,
            enablePerformanceMetrics: true,
            enablePositionLogging: true,
            enableModelLocking: true
        };

        Object.keys(defaultSettings).forEach(key => {
            // Only use default if no saved setting exists
            const savedValue = this.loadSetting(key, null);
            if (savedValue !== null) {
                settings[key] = savedValue;
            } else {
                settings[key] = defaultSettings[key];
            }
        });

        return settings;
    }

    // Save all settings from an object
    saveAllSettings(settings) {
        let success = true;
        Object.entries(settings).forEach(([key, value]) => {
            if (!this.saveSetting(key, value)) {
                success = false;
            }
        });
        return success;
    }

    // Helper to parse different value types from text
    parseValue(value) {
        if (value === 'true' || value === '✓ ON' || value.includes('ON')) return true;
        if (value === 'false' || value === '✗ OFF' || value.includes('OFF')) return false;
        if (value === 'auto') return 'auto';
        if (!isNaN(value)) return Number(value);
        return value;
    }

    // List all available settings
    listSettings() {
        if (!fs.existsSync(this.settingsDir)) {
            return [];
        }
        return fs.readdirSync(this.settingsDir)
            .filter(file => file.endsWith('.txt'))
            .map(file => file.replace('.txt', ''));
    }

    // Delete a specific setting
    deleteSetting(key) {
        const filePath = this.getSettingFilePath(key);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    }

    // Reset all settings to defaults
    resetToDefaults() {
        const defaultSettings = {
            defaultTimeframe: '5Min',
            defaultTakeProfit: 'auto',
            defaultStopLoss: 'auto',
            enableCrossunderSignals: true,
            enablePerformanceMetrics: true,
            enablePositionLogging: true
        };

        return this.saveAllSettings(defaultSettings);
    }
}

module.exports = TextSettingsManager;
