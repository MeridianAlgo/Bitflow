const { printCard, printTableCard } = require('./core/ui');

// Test glowing printCard
printCard('Previous Preferences', [
  'Position Logging: Enabled',
  'Take Profit: auto',
  'Stop Loss: auto',
  'Timeframe: 1Min',
  'Crossunder Signals: Disabled',
  'Performance Metrics: Disabled',
  'Clamp Take Profit: Yes',
  'Clamp Stop Loss: Yes'
]);

// Test glowing printTableCard
printTableCard('System Status', [
  ['Alpaca', '● Connected'],
  ['Polygon', '● Connected'],
  ['Finnhub', '● Connected'],
  ['Llama', '● Connected'],
  ['Polygon News', '● Connected'],
  ['Gemini', '● Connected']
]); 