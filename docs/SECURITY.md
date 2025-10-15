# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 3.0.x   | :white_check_mark: |
| < 3.0   | :x:                |

## Security Features

BitFlow includes several built-in security features:

### 1. Paper Trading Enforcement
- **Hardcoded paper trading mode** - Cannot accidentally trade real money
- All trades execute on Alpaca's paper trading environment
- No real funds at risk

### 2. API Key Protection
- API keys stored in `.env` file (never committed to git)
- `.env` file is gitignored by default
- Keys never logged or displayed in console

### 3. Position Limits
- **Maximum position size**: 15% of account equity
- **Maximum stop loss**: 5% per trade
- **Maximum take profit**: 10% per trade
- **Risk per trade**: Configurable (default 1%)

### 4. Rate Limiting
- Built-in delays between API calls
- Retry logic with exponential backoff
- Prevents API abuse and bans

### 5. Input Validation
- All user inputs validated
- Symbol whitelist (BTC/USD, ETH/USD, etc.)
- Numeric ranges enforced
- Prevents injection attacks

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

### DO:
1. **Email**: security@meridian-algo.com (or open a private security advisory on GitHub)
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. **Wait** for our response before public disclosure

### DON'T:
- ❌ Open a public issue for security vulnerabilities
- ❌ Share exploit code publicly
- ❌ Test vulnerabilities on production systems

## Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 1-7 days
  - High: 7-14 days
  - Medium: 14-30 days
  - Low: 30-90 days

## Security Best Practices

### For Users:

1. **Protect Your API Keys**
   - Never share your `.env` file
   - Never commit `.env` to git
   - Rotate keys regularly
   - Use paper trading keys only

2. **Keep Software Updated**
   - Update to latest version regularly
   - Check for security patches
   - Update dependencies: `npm update`

3. **Monitor Your Account**
   - Check Alpaca dashboard regularly
   - Review trade history
   - Monitor position sizes
   - Set up alerts

4. **Use Strong Credentials**
   - Strong Alpaca account password
   - Enable 2FA on Alpaca account
   - Secure your development machine

5. **Limit Exposure**
   - Start with small amounts
   - Test thoroughly in paper trading
   - Never risk more than you can afford to lose

### For Developers:

1. **Code Review**
   - Review all PRs for security issues
   - Check for hardcoded credentials
   - Validate input handling
   - Test error scenarios

2. **Dependency Management**
   - Keep dependencies updated
   - Audit with `npm audit`
   - Review dependency changes
   - Use lock files

3. **Secure Coding**
   - Validate all inputs
   - Handle errors gracefully
   - Never log sensitive data
   - Use parameterized queries

## Known Limitations

1. **Paper Trading Only**: This bot is designed for paper trading. Do not modify for live trading without extensive testing and risk management.

2. **API Dependencies**: Security depends on Alpaca's API security. Review their security practices.

3. **Local Storage**: Historical data and scores stored locally in CSV files. Protect your machine.

4. **No Encryption**: Local data is not encrypted. Don't store on shared systems.

## Compliance

- **GDPR**: No personal data collected or stored
- **Financial Regulations**: Paper trading only, not a financial service
- **Open Source**: MIT License, use at your own risk

## Disclaimer

This software is provided "as is" without warranty. Trading cryptocurrencies carries significant risk. The developers are not responsible for any financial losses. Always test thoroughly and never risk more than you can afford to lose.

## Contact

- **Security Issues**: security@meridian-algo.com
- **General Issues**: https://github.com/MeridianAlgo/Bitflow/issues
- **Discussions**: https://github.com/MeridianAlgo/Bitflow/discussions

---

**Last Updated**: December 2024  
**Version**: 3.0

**Made with ❤️ by MeridianAlgo**
