# BitFlow Documentation

Welcome to the BitFlow Trading Bot documentation!

## 📚 Documentation Index

### Getting Started
- **[Quick Reference Guide](QUICK_REFERENCE.md)** - Fast reference for common tasks
- **[Setup Guide](SETUP_GUIDE.md)** - Complete installation and configuration
- **[Changelog](../CHANGELOG.md)** - Version history and updates (v3.1.1)

### Technical Documentation
- **[ML Risk Management](ML_RISK_IMPLEMENTATION.md)** - ML-based TP/SL calculator
- **[Bug Fixes v3.1.1](BUG_FIXES_v3.1.1.md)** - Detailed fix documentation
- **[Fee Integration](FEE_INTEGRATION_SUMMARY.md)** - Alpaca crypto fee calculations
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
- **[Final Implementation](FINAL_IMPLEMENTATION.md)** - Complete feature list

### Project Information
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute
- **[Security Policy](SECURITY.md)** - Security and vulnerability reporting
- **[License](../LICENSE.txt)** - MIT License terms

## 🚀 Quick Links

### For Users
- [Quick Start Guide](QUICK_REFERENCE.md#-quick-start)
- [Configuration Options](QUICK_REFERENCE.md#-configuration-options)
- [Troubleshooting](QUICK_REFERENCE.md#-common-issues)

### For Developers
- [Testing Guide](QUICK_REFERENCE.md#-testing)
- [ML Risk Implementation](ML_RISK_IMPLEMENTATION.md)
- [Contributing](CONTRIBUTING.md)

## 📖 What's New in v3.1.1

### 🐛 Bug Fixes
- ✅ Fixed "Assignment to constant variable" error
- ✅ Improved error handling and messages
- ✅ Added comprehensive test suite

### 📝 Documentation Updates
- ✅ Updated README with accurate information
- ✅ Created Quick Reference Guide
- ✅ Added Changelog
- ✅ Clarified crypto limitations (no bracket orders)

## 🎯 Key Features

### Trading Intelligence
- 7 MA types tested (SMA, EMA, WMA, DEMA, TEMA, HMA, VWAP)
- 182 combinations (7 types × 26 lengths)
- 60% win rate threshold
- Smart retry logic

### Risk Management
- ML-based TP/SL (ATR + volatility)
- Dynamic position sizing
- Fee-aware calculations
- Timeframe adjustments

### Safety
- Paper trading only
- ONE position at a time
- Manual TP/SL monitoring
- 5-minute initialization period
- Crossover confirmation

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Quick test
node test-buy-order.js

# Full test (recommended)
node test-bitflow-full.js
```

## 🐛 Known Issues

### Resolved
- ✅ "Assignment to constant variable" error (fixed in v3.1.1)

### Current Limitations
- ⚠️ Crypto doesn't support bracket orders (manual TP/SL monitoring instead)
- ⚠️ 5-minute initialization period required before first trade
- ⚠️ Paper trading only (by design)

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/MeridianAlgo/Bitflow/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/MeridianAlgo/Bitflow/discussions)
- 📖 **Documentation**: You're here!
- 🔒 **Security**: [Security Policy](SECURITY.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## ⚠️ Disclaimer

This bot is for educational purposes only. Cryptocurrency trading carries significant risk. Past performance does not guarantee future results. Always test thoroughly in paper trading before considering live trading.

**This software is provided "as is" without warranty of any kind. The developers are not responsible for any financial losses. Trade at your own risk.**

---

**Last Updated**: January 17, 2025 (v3.1.1)

**Made with ❤️ by [MeridianAlgo](https://github.com/MeridianAlgo)**
