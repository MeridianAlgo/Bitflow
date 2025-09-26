#!/usr/bin/env node

console.log('🧪 Testing Screen Clearing Behavior...\n');

async function testScreenClearing() {
    try {
        const { prompt } = require('enquirer');
        
        console.log('1️⃣ This is line 1 - should stay visible');
        console.log('2️⃣ This is line 2 - should stay visible');
        console.log('3️⃣ This is line 3 - should stay visible');
        console.log('4️⃣ This is line 4 - should stay visible');
        console.log('5️⃣ This is line 5 - should stay visible');
        
        console.log('\n📋 Current Settings:');
        console.log('─'.repeat(50));
        console.log('   ⚙️ Default Timeframe: 1Min');
        console.log('   ⚙️ Default Take Profit: auto');
        console.log('   ❌ Enable Crossunder Signals: false');
        console.log('─'.repeat(50));
        
        console.log('\n🔍 About to show prompt - watch if screen clears...');
        
        // Test the prompt that might be clearing
        const { usePrev } = await prompt({
            type: 'confirm',
            name: 'usePrev',
            message: 'Use these settings?',
            initial: true
        });
        
        console.log('\n✅ Prompt completed');
        console.log(`User choice: ${usePrev}`);
        
        console.log('\n📊 Final check - can you still see lines 1-5 above?');
        console.log('If not, the prompt is clearing the screen');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testScreenClearing();