#!/usr/bin/env node

const path = require('path');
const chalk = require('chalk');
const EfficientTradingLLM = require('../core/efficientTradingLLM');

(async () => {
    try {
        const llm = new EfficientTradingLLM();
        const models = [
            'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
            'Xenova/distilgpt2',
            'Xenova/bert-base-uncased'
        ];

        console.log(chalk.blue('\n📥 Prefetching and caching models locally...'));
        for (const id of models) {
            try {
                await llm.initializeModel(id);
            } catch (e) {
                console.log(chalk.yellow(`⚠️ Skipped ${id}: ${e.message}`));
            }
        }
        const cacheDir = path.join(__dirname, '..', 'models_cache');
        console.log(chalk.green(`\n✅ Models cached under: ${cacheDir}`));
        process.exit(0);
    } catch (e) {
        console.error(chalk.red('❌ Prefetch failed:'), e.message);
        process.exit(1);
    }
})();


