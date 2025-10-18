# Troubleshooting Guide

Quick solutions to common BitFlow Trading Bot issues.

## 🐛 "Assignment to constant variable" Error

### Status: ✅ FIXED in v3.1.1

### If you still see this error:

```bash
# Update to latest version
git pull origin main
npm install

# Verify the fix
node test-bitflow-full.js
```

### What was fixed:
- Changed `const stopLoss` to `let stopLoss` in ml-risk-manager.js
- Fixed parameter reassignments in orders.js
- All tests now pass successfully

---

## 🔌 Connection Errors

### Error: "Failed to connect to Alpaca API"

**Causes:**
- Invalid API keys
- Missing .env file
- Network issues

**Solutions:**
1. Check your `.env` file exists and has valid keys:
   ```bash
   ALPACA_API_KEY_ID=your_key_here
   ALPACA_SECRET_KEY=your_secret_here
   ALPACA_PAPER=true
   ```

2. Verify your API keys at [Alpaca Dashboard](https://app.alpaca.markets/paper/dashboard/overview)

3. Test your connection:
   ```bash
   node test-buy-order.js
   ```

---

## 📊 Bot Not Trading

### Issue: Bot starts but doesn't place trades

**Cause:** 5-minute initialization period

**Explanation:** The bot waits 10 checks (5 minutes) after startup to establish a baseline before allowing trades. This prevents false signals.

**What you'll see:**
```
[10:00:00] Price 106700.00 | MA 106650.00 | BUY | ABOVE MA (+0.05%) | NO POSITION
INITIALIZING (1/10 checks)
```

**Solution:** Wait 5 minutes. You'll see this when ready:
```
[READY] 5-min wait complete. Price is above MA. Waiting for below→above crossover...
```

---

## 📉 Low Win Rate

### Issue: "Win rate below 60%, fetching more data..."

**Cause:** Insufficient historical data for optimization

**What the bot does:**
1. Starts with 500 bars
2. If win rate < 60%, fetches 1500 bars
3. If still < 60%, fetches 3500 bars
4. Proceeds with best available strategy

**Solution:** Let the bot fetch more data. This is automatic.

**Example:**
```
Fetching 500 bars [██████████] 100% ✓
Best: TEMA(5) | Win Rate: 45.0%

⚠️ Win rate below 60%, waiting 5 seconds before fetching more data...

Fetching 1500 bars [██████████] 100% ✓
Best: HMA(6) | Win Rate: 62.5%

✓ Optimization Complete | Final Score: 75.5%
```

---

## 💰 Position Not Closing

### Issue: Position stuck, TP/SL not triggering

**Causes:**
- Price hasn't reached TP or SL yet
- Network issues
- Bot crashed

**Solutions:**

1. **Check current position:**
   ```
   ↗ Entry 100000.00 | Now 100300.00 | P&L +0.30% | TP 100500.00 (+0.20%) | SL 99500.00 (-0.50%)
   ```
   Position will close when price reaches TP (100500) or SL (99500)

2. **Manual close:**
   - Press `Ctrl+C` to exit
   - Bot will automatically close position on next startup

3. **Force close via Alpaca:**
   - Log into [Alpaca Dashboard](https://app.alpaca.markets/paper/dashboard/overview)
   - Go to Positions
   - Close manually

---

## 🧪 Tests Failing

### Error: Tests fail with API errors

**Cause:** Missing or invalid API keys

**Solution:**
```bash
# 1. Check .env file exists
ls -la .env

# 2. Verify contents
cat .env

# 3. Should contain:
ALPACA_API_KEY_ID=your_key_here
ALPACA_SECRET_KEY=your_secret_here
ALPACA_PAPER=true

# 4. Run tests again
node tests/test-bitflow-full.js
```

### Error: "Insufficient funds"

**Cause:** Paper trading account has low balance

**Solution:**
1. Log into [Alpaca Dashboard](https://app.alpaca.markets/paper/dashboard/overview)
2. Reset paper trading account (this gives you $100,000)
3. Run tests again

---

## 📈 Stale Prices

### Issue: Prices don't update or seem old

**Causes:**
- Low market liquidity
- Weekend/off-hours
- Network issues

**Solutions:**

1. **Check market hours:**
   - Crypto trades 24/7, but liquidity varies
   - Best liquidity: US market hours (9:30 AM - 4:00 PM ET)

2. **Check symbol:**
   - BTC/USD and ETH/USD have best liquidity
   - Other symbols may have slower updates

3. **Verify connection:**
   ```bash
   node tests/test-buy-order.js
   ```

---

## 🔧 Installation Issues

### Error: "Cannot find module"

**Cause:** Missing dependencies

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Error: "Permission denied"

**Cause:** File permissions

**Solution:**
```bash
# On Linux/Mac
chmod +x src/BitFlow.js
chmod +x test-*.js

# Or run with node explicitly
node src/BitFlow.js
```

---

## 🎯 Strategy Issues

### Issue: Bot keeps selecting same MA

**Cause:** That MA has the best performance

**Explanation:** The bot tests 182 combinations and selects the best one. If it keeps selecting the same MA, that's because it has the highest score.

**What you can do:**
- Try different timeframes (1m, 5m, 15m)
- Try different symbols (BTC, ETH, etc.)
- Wait for market conditions to change

### Issue: No buy signals

**Cause:** Price hasn't crossed from below to above MA

**Explanation:** The bot requires a confirmed crossover:
1. Price must be BELOW MA
2. Then price must cross ABOVE MA
3. Only then will it buy

**What you'll see:**
```
[10:00:00] Price 106700.00 | MA 106750.00 | HOLD | BELOW MA (-0.05%) | NO POSITION
[10:00:30] Price 106800.00 | MA 106750.00 | BUY | ABOVE MA (+0.05%) | NO POSITION
WAITING FOR CROSSOVER (need below→above)
```

The bot is waiting for price to go below MA first, then cross above.

---

## 🚨 Critical Errors

### Error: "Critical error - exiting bot"

**Causes:**
- API connection lost
- Invalid data received
- Network failure

**Solutions:**

1. **Check internet connection**

2. **Verify API status:**
   - Visit [Alpaca Status](https://status.alpaca.markets/)

3. **Enable debug mode:**
   ```bash
   DEBUG=true node src/BitFlow.js
   ```

4. **Check logs for details**

5. **Restart bot:**
   ```bash
   node src/BitFlow.js
   ```

---

## 📞 Getting Help

### Before asking for help:

1. **Run the test suite:**
   ```bash
   node tests/test-bitflow-full.js
   ```

2. **Enable debug mode:**
   ```bash
   DEBUG=true node src/BitFlow.js
   ```

3. **Check the logs** for specific error messages

4. **Review this troubleshooting guide**

### Where to get help:

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/MeridianAlgo/Bitflow/issues)
- 💬 **Questions**: [GitHub Discussions](https://github.com/MeridianAlgo/Bitflow/discussions)
- 📖 **Documentation**: [docs/](docs/)
- 🔒 **Security Issues**: See [SECURITY.md](docs/SECURITY.md)

### When reporting issues, include:

1. **Error message** (full text)
2. **Steps to reproduce**
3. **Test results** (from `node test-bitflow-full.js`)
4. **Debug logs** (if applicable)
5. **Your configuration** (timeframe, symbol, mode)
6. **Bot version** (check CHANGELOG.md)

---

## ✅ Verification Checklist

Before running the bot, verify:

- [ ] Node.js 14+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file exists with valid API keys
- [ ] Tests pass (`node test-bitflow-full.js`)
- [ ] Alpaca paper trading account active
- [ ] Internet connection stable

---

**Last Updated**: January 17, 2025 (v3.1.1)

**Need more help?** Check the [Quick Reference Guide](docs/QUICK_REFERENCE.md) or [Full Documentation](docs/README.md)
