#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Checking All Files for Syntax Errors...\n');

function checkSyntax(filePath) {
    try {
        execSync(`node -c "${filePath}"`, { stdio: 'pipe' });
        return { valid: true, error: null };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

function checkAllFiles() {
    const filesToCheck = [
        'BitFlow.js',
        'core/BitFlow.js',
        'core/tradeUtils.js',
        'core/textSettingsManager.js',
        'core/enhanced_ml_engine.js',
        'core/enhanced_backtest_engine.js',
        'core/advanced_trading_strategy.js',
        'core/ui.js',
        'core/errorHandler.js',
        'core/fastLocalTradingAI.js'
    ];

    let allValid = true;
    let checkedCount = 0;
    let errorCount = 0;

    console.log('📋 Syntax Check Results:');
    console.log('─'.repeat(60));

    for (const file of filesToCheck) {
        if (fs.existsSync(file)) {
            const result = checkSyntax(file);
            checkedCount++;
            
            if (result.valid) {
                console.log(`✅ ${file.padEnd(35)} - Valid`);
            } else {
                console.log(`❌ ${file.padEnd(35)} - ERROR`);
                console.log(`   ${result.error}`);
                allValid = false;
                errorCount++;
            }
        } else {
            console.log(`⚠️ ${file.padEnd(35)} - Not Found`);
        }
    }

    console.log('─'.repeat(60));
    console.log(`📊 Summary: ${checkedCount} files checked, ${errorCount} errors found`);

    if (allValid) {
        console.log('\n🎉 All files have valid syntax!');
        console.log('🚀 BitFlow is ready to run!');
    } else {
        console.log('\n❌ Syntax errors found - fix before running BitFlow');
    }

    return allValid;
}

checkAllFiles();