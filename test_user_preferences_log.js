const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, 'logs', 'bitflow_log.json');

function printUserPreferences() {
    if (!fs.existsSync(LOG_PATH)) {
        console.error('Log file not found:', LOG_PATH);
        process.exit(1);
    }
    const log = JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
    const prefs = log.userPreferences;
    if (typeof prefs !== 'object' || prefs === null || Array.isArray(prefs)) {
        console.error('userPreferences is not an object! Raw value:', prefs);
        process.exit(2);
    }
    console.log('User Preferences from bitflow_log.json:');
    for (const [key, value] of Object.entries(prefs)) {
        console.log(`  ${key}: ${value}`);
    }
}

printUserPreferences(); 