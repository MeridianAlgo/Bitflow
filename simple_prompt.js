// Simple prompt that doesn't clear screen
const readline = require('readline');

function createSimplePrompt() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return {
        confirm: (message, defaultValue = true) => {
            return new Promise((resolve) => {
                const defaultText = defaultValue ? '(Y/n)' : '(y/N)';
                rl.question(`? ${message} ${defaultText} › `, (answer) => {
                    const normalized = answer.toLowerCase().trim();
                    let result;
                    
                    if (normalized === '') {
                        result = defaultValue;
                    } else if (normalized === 'y' || normalized === 'yes') {
                        result = true;
                    } else if (normalized === 'n' || normalized === 'no') {
                        result = false;
                    } else {
                        result = defaultValue;
                    }
                    
                    resolve(result);
                });
            });
        },
        
        close: () => {
            rl.close();
        }
    };
}

module.exports = { createSimplePrompt };