#!/usr/bin/env node

const readline = require('readline');
const chalk = require('chalk');
const EnhancedMemorySystem = require('./core/enhancedMemorySystem');

class EnhancedSetup {
    constructor() {
        this.memorySystem = new EnhancedMemorySystem();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }

    async confirm(prompt) {
        const answer = await this.question(`${prompt} (y/n): `);
        return answer.toLowerCase().startsWith('y');
    }

    async selectFromOptions(prompt, options, defaultIndex = 0) {
        console.log(`\n${prompt}`);
        options.forEach((option, index) => {
            const marker = index === defaultIndex ? '→' : ' ';
            console.log(`  ${marker} ${index + 1}. ${option}`);
        });
        
        const answer = await this.question(`\nSelect option (1-${options.length}, default: ${defaultIndex + 1}): `);
        const selectedIndex = parseInt(answer) - 1;
        
        if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= options.length) {
            return defaultIndex;
        }
        
        return selectedIndex;
    }

    async setup() {
        console.log(chalk.blue.bold('\n🚀 BitFlow Enhanced Setup'));
        console.log(chalk.blue('=' .repeat(50)));
        
        // Display current system status
        this.memorySystem.displaySystemStatus();
        
        // Load current settings
        const currentSettings = this.memorySystem.loadAllSettings();
        
        console.log(chalk.yellow('\n📋 Current Settings:'));
        Object.entries(currentSettings).forEach(([key, value]) => {
            const status = this.memorySystem.validateSetting(key, value) ? '✅' : '❌';
            console.log(`  ${status} ${key}: ${value}`);
        });
        
        // Ask if user wants to use current settings
        const useCurrent = await this.confirm('\n❓ Use these current settings?');
        
        if (useCurrent) {
            console.log(chalk.green('✅ Using current settings. Setup complete!'));
            this.rl.close();
            return currentSettings;
        }
        
        console.log(chalk.blue('\n🔧 Configuring new settings...'));
        
        // Configure each setting
        const newSettings = {};
        
        // 1. Position Logging
        newSettings.enablePositionLogging = await this.confirm('📊 Enable position logging?');
        console.log(chalk.green(`✓ Position logging: ${newSettings.enablePositionLogging ? 'Enabled' : 'Disabled'}`));
        
        // 2. Take Profit
        const takeProfitOptions = ['auto', '0.5%', '1%', '1.5%', '2%', '2.5%', '3%', '5%'];
        const takeProfitIndex = await this.selectFromOptions('💰 Default take profit percentage:', takeProfitOptions, 1);
        newSettings.defaultTakeProfit = takeProfitOptions[takeProfitIndex];
        console.log(chalk.green(`✓ Take profit: ${newSettings.defaultTakeProfit}`));
        
        // 3. Stop Loss
        const stopLossOptions = ['auto', '0.5%', '1%', '1.5%', '2%', '2.5%', '3%', '5%'];
        const stopLossIndex = await this.selectFromOptions('🛡️ Default stop loss percentage:', stopLossOptions, 1);
        newSettings.defaultStopLoss = stopLossOptions[stopLossIndex];
        console.log(chalk.green(`✓ Stop loss: ${newSettings.defaultStopLoss}`));
        
        // 4. Timeframe
        const timeframeOptions = ['1Min', '5Min', '15Min', '1Hour', '1Day'];
        const timeframeIndex = await this.selectFromOptions('⏰ Default timeframe:', timeframeOptions, 1);
        newSettings.defaultTimeframe = timeframeOptions[timeframeIndex];
        console.log(chalk.green(`✓ Timeframe: ${newSettings.defaultTimeframe}`));
        
        // 5. Crossunder Signals
        newSettings.enableCrossunderSignals = await this.confirm('📈 Enable MA crossunder signals for selling?');
        console.log(chalk.green(`✓ Crossunder signals: ${newSettings.enableCrossunderSignals ? 'Enabled' : 'Disabled'}`));
        
        // 6. Performance Metrics
        newSettings.enablePerformanceMetrics = await this.confirm('📊 Enable performance metrics?');
        console.log(chalk.green(`✓ Performance metrics: ${newSettings.enablePerformanceMetrics ? 'Enabled' : 'Disabled'}`));
        
        // Validate all settings
        console.log(chalk.blue('\n🔍 Validating settings...'));
        let allValid = true;
        Object.entries(newSettings).forEach(([key, value]) => {
            if (this.memorySystem.validateSetting(key, value)) {
                console.log(chalk.green(`  ✓ ${key}: ${value}`));
            } else {
                console.log(chalk.red(`  ❌ ${key}: ${value} (INVALID)`));
                allValid = false;
            }
        });
        
        if (!allValid) {
            console.log(chalk.red('\n❌ Some settings are invalid. Please fix them.'));
            this.rl.close();
            return null;
        }
        
        // Save settings
        console.log(chalk.blue('\n💾 Saving settings...'));
        const saveSuccess = this.memorySystem.saveAllSettings(newSettings);
        
        if (saveSuccess) {
            console.log(chalk.green('✅ Settings saved successfully!'));
            
            // Display final settings
            console.log(chalk.blue('\n📋 Final Settings:'));
            Object.entries(newSettings).forEach(([key, value]) => {
                console.log(`  ✓ ${key}: ${value}`);
            });
            
            // Show system status
            this.memorySystem.displaySystemStatus();
            
        } else {
            console.log(chalk.red('❌ Failed to save settings. Please try again.'));
        }
        
        this.rl.close();
        return newSettings;
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    const setup = new EnhancedSetup();
    setup.setup().then(settings => {
        if (settings) {
            console.log(chalk.green.bold('\n🎉 Setup completed successfully!'));
            console.log(chalk.blue('You can now run your BitFlow trading bot with these settings.'));
        } else {
            console.log(chalk.red.bold('\n❌ Setup failed. Please try again.'));
            process.exit(1);
        }
    }).catch(error => {
        console.error(chalk.red('❌ Setup error:'), error.message);
        process.exit(1);
    });
}

module.exports = EnhancedSetup;
