/**
 * Model Performance Benchmark Test
 *
 * This script benchmarks the speed and performance of the 3 cached models:
 * 1. Xenova/distilbert-base-uncased-finetuned-sst-2-english (Sentiment Analysis)
 * 2. Xenova/distilgpt2 (Text Generation)
 * 3. Xenova/bert-base-uncased (General Purpose)
 *
 * Usage: node benchmark_models.js
 */

const SmartModelManager = require('./core/smartModelManager');

async function benchmarkModels() {
    console.log('🚀 Starting Model Performance Benchmark...\n');

    const smartModelManager = new SmartModelManager();
    const models = [
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        'Xenova/distilgpt2',
        'Xenova/bert-base-uncased'
    ];

    const testTasks = [
        {
            name: 'TP/SL Optimization',
            description: 'AI calculates optimal take profit and stop loss levels',
            input: {
                signal: 'BUY',
                price: 50000,
                rsi: 45,
                volatility: 0.02,
                trend: 'bullish'
            },
            expectedOutput: 'tp/sl optimization result'
        },
        {
            name: 'Position Sizing',
            description: 'AI determines optimal position size based on risk management',
            input: {
                availableCapital: 10000,
                price: 50000,
                volatility: 0.02,
                riskTolerance: 'medium'
            },
            expectedOutput: 'position sizing advice'
        },
        {
            name: 'Risk Assessment',
            description: 'AI evaluates overall market risk level',
            input: {
                price: 50000,
                rsi: 60,
                volatility: 0.03,
                volume: 1500000,
                trend: 'neutral'
            },
            newsInput: 'Bitcoin shows moderate volatility as institutional investors increase their positions. Market sentiment remains cautiously optimistic.',
            expectedOutput: 'risk assessment result'
        }
    ];

    const results = [];

    for (const modelId of models) {
        console.log(`\n📊 Testing Model: ${modelId}`);
        console.log('─'.repeat(50));

        const modelResults = {
            modelId,
            tasks: []
        };

        // Initialize the model
        const initStart = Date.now();
        const initSuccess = await smartModelManager.llm.initializeModel(modelId);
        const initTime = Date.now() - initStart;

        if (!initSuccess) {
            console.log(`❌ Failed to initialize ${modelId}`);
            continue;
        }

        console.log(`✅ Model initialized in ${initTime}ms`);

        for (const task of testTasks) {
            const taskStart = Date.now();
            let result = null;
            let error = null;

            try {
                switch (task.name) {
                    case 'TP/SL Optimization':
                        result = await smartModelManager.calculateOptimalTPSL(task.input);
                        break;
                    case 'Position Sizing':
                        result = await smartModelManager.calculateOptimalPositionSize(
                            task.input.availableCapital,
                            task.input
                        );
                        break;
                    case 'Risk Assessment':
                        result = await smartModelManager.assessMarketRisk(task.input, task.newsInput);
                        break;
                }
            } catch (err) {
                error = err.message;
            }

            const taskTime = Date.now() - taskStart;

            modelResults.tasks.push({
                task: task.name,
                time: taskTime,
                success: !error,
                error: error,
                result: result ? 'Generated successfully' : 'Failed'
            });

            console.log(`  ${task.name}: ${taskTime}ms ${error ? '❌' : '✅'}`);
            if (error) {
                console.log(`    Error: ${error}`);
            } else if (result) {
                // Show specific results for each AI task
                if (result.takeProfit !== undefined) {
                    console.log(`    TP: ${result.takeProfit}%, SL: ${result.stopLoss}%`);
                    console.log(`    Reasoning: ${result.reasoning}`);
                } else if (result.positionSize !== undefined) {
                    console.log(`    Position Size: ${result.positionSize} shares`);
                    console.log(`    Risk Amount: $${result.riskAmount.toLocaleString()}`);
                    console.log(`    Confidence: ${(result.confidence * 100).toFixed(1)}%`);
                } else if (result.riskLevel !== undefined) {
                    console.log(`    Risk Level: ${result.riskLevel.toUpperCase()}`);
                    console.log(`    Confidence: ${(result.confidence * 100).toFixed(1)}%`);
                    console.log(`    Factors: ${result.factors.join(', ')}`);
                }
            }
        }

        // Calculate average time for this model
        const avgTime = modelResults.tasks.reduce((sum, task) => sum + task.time, 0) / modelResults.tasks.length;
        modelResults.averageTime = Math.round(avgTime);
        modelResults.successRate = modelResults.tasks.filter(t => t.success).length / modelResults.tasks.length;

        console.log(`📈 Average Time: ${modelResults.averageTime}ms`);
        console.log(`📊 Success Rate: ${(modelResults.successRate * 100).toFixed(1)}%`);

        results.push(modelResults);
    }

    // Display summary
    console.log('\n🎯 BENCHMARK SUMMARY');
    console.log('─'.repeat(60));

    const sortedResults = results.sort((a, b) => a.averageTime - b.averageTime);

    sortedResults.forEach((result, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        console.log(`${medal} ${result.modelId}`);
        console.log(`   Average Time: ${result.averageTime}ms`);
        console.log(`   Success Rate: ${(result.successRate * 100).toFixed(1)}%`);
        console.log(`   Tasks: ${result.tasks.map(t => `${t.task}(${t.time}ms)`).join(', ')}`);
        console.log('');
    });

    // Recommendations
    console.log('💡 RECOMMENDATIONS');
    console.log('─'.repeat(60));

    const fastest = sortedResults[0];
    const mostReliable = sortedResults.find(r => r.successRate === 1) || sortedResults[0];

    console.log(`🚀 Fastest Model: ${fastest.modelId} (${fastest.averageTime}ms average)`);
    console.log(`🛡️ Most Reliable: ${mostReliable.modelId} (${(mostReliable.successRate * 100).toFixed(1)}% success rate)`);

    // Use case recommendations
    console.log('\n📋 MODEL USE CASE RECOMMENDATIONS:');
    console.log(`   • Sentiment Analysis: ${fastest.modelId} (fastest)`);
    console.log(`   • Position Sizing: ${mostReliable.modelId} (most reliable)`);
    console.log(`   • Trading Decisions: ${mostReliable.modelId} (most reliable)`);

    console.log('\n✅ Benchmark complete!');
}

// Run benchmark if this file is executed directly
if (require.main === module) {
    benchmarkModels().catch(console.error);
}

module.exports = { benchmarkModels };
