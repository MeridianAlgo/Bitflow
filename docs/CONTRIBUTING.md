# Contributing to BitFlow

Thank you for your interest in contributing to BitFlow! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node version, etc.)
- Relevant logs or screenshots

### Suggesting Features

We love new ideas! Open an issue with:
- Clear description of the feature
- Use case and benefits
- Potential implementation approach (optional)

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes**:
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed
4. **Test thoroughly**:
   - Test in paper trading mode
   - Verify no breaking changes
   - Check for console errors
5. **Commit with clear messages**: `git commit -m "Add: feature description"`
6. **Push to your fork**: `git push origin feature/your-feature-name`
7. **Open a Pull Request**

### Code Style Guidelines

- Use meaningful variable names
- Add JSDoc comments for functions
- Keep functions focused and small
- Handle errors gracefully
- Use `const` and `let` (not `var`)
- Follow existing formatting

### Testing

- Always test in **paper trading mode** first
- Test with different timeframes (1m, 5m, 15m)
- Test with different symbols (BTC, ETH, etc.)
- Verify ML risk management works correctly
- Check position sizing calculations

### Areas We Need Help

- 📊 Additional technical indicators
- 🤖 ML model improvements
- 📈 Backtesting enhancements
- 📱 Web dashboard/UI
- 📝 Documentation improvements
- 🐛 Bug fixes
- ⚡ Performance optimizations

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Bitflow.git
cd Bitflow

# Install dependencies
npm install

# Copy environment template
cp .env.template .env

# Add your Alpaca API keys to .env

# Run the bot
node src/BitFlow.js
```

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers
- Focus on the code, not the person
- Help others learn and grow

## Questions?

- Open an issue for questions
- Check existing issues first
- Join discussions in GitHub Discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Made with ❤️ by MeridianAlgo and contributors**
