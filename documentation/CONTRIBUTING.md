# Contributing Guidelines 🤝

**How to Contribute to BitFlow Development**

This guide provides comprehensive information for developers who want to contribute to BitFlow, including code standards, development setup, testing procedures, and contribution workflow.

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
  - [Development Setup](#development-setup)
  - [Code Structure](#code-structure)
  - [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
  - [JavaScript Style Guide](#javascript-style-guide)
  - [Documentation Standards](#documentation-standards)
  - [Testing Standards](#testing-standards)
- [Contribution Process](#contribution-process)
  - [Feature Development](#feature-development)
  - [Bug Fixes](#bug-fixes)
  - [Documentation Updates](#documentation-updates)
- [Review Process](#review-process)
  - [Code Review](#code-review)
  - [Testing Requirements](#testing-requirements)
  - [Documentation Requirements](#documentation-requirements)
- [Community Guidelines](#community-guidelines)
  - [Communication](#communication)
  - [Issue Reporting](#issue-reporting)
  - [Feature Requests](#feature-requests)

---

## 🚀 Getting Started

### Development Setup

#### Prerequisites
```bash
# Node.js (LTS version recommended)
node --version  # Should be 16.x, 18.x, or 20.x

# Git
git --version   # Should be 2.20.0 or higher

# npm or yarn
npm --version   # Latest stable version
```

#### Repository Setup
```bash
# Clone the repository
git clone https://github.com/MeridianAlgo/Bitflow.git
cd Bitflow

# Install dependencies
npm install

# Set up development environment
npm run setup:dev

# Run tests to verify setup
npm test

# Start development server
npm run dev
```

#### Development Environment Configuration
```bash
# Create development environment file
cp .env.example .env.dev

# Edit .env.dev with development settings
# Use paper trading API keys for development
ALPACA_API_KEY_ID=your_paper_key_id
ALPACA_SECRET_KEY=your_paper_secret
POLYGON_API_KEY=your_polygon_key
FINNHUB_API_KEY=your_finnhub_key

# Development-specific settings
NODE_ENV=development
BITFLOW_DEBUG=1
BITFLOW_LOG_LEVEL=debug
```

### Code Structure

#### Directory Structure
```
BitFlow/
├── core/                    # Core business logic
│   ├── BitFlow.js          # Main trading engine
│   ├── smartModelManager.js # AI model management
│   ├── efficientTradingLLM.js # AI trading models
│   ├── advancedTradingStrategy.js # Trading strategy
│   ├── enhanced_backtest_engine.js # Backtesting engine
│   └── ui.js               # User interface
├── tests/                  # Test files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   ├── system/            # System tests
│   └── performance/       # Performance tests
├── docs/                  # Documentation
├── scripts/               # Utility scripts
├── user_settings/         # User configuration
├── logs/                  # Application logs
└── debug_tools/           # Development tools
```

#### File Naming Conventions
```bash
# Components: PascalCase
SmartModelManager.js
AdvancedTradingStrategy.js
EfficientTradingLLM.js

# Utilities: camelCase
tradeUtils.js
apiHelpers.js
mathUtils.js

# Tests: kebab-case with .test.js
smart-model-manager.test.js
trading-strategy.test.js
api-integration.test.js

# Configuration: kebab-case
user-settings.json
debug-config.json
```

### Development Workflow

#### Branch Strategy
```bash
# Feature branches
git checkout -b feature/new-trading-indicator
git checkout -b feature/enhanced-risk-management

# Bug fix branches
git checkout -b fix/memory-leak-in-model-loading
git checkout -b fix/api-rate-limit-handling

# Documentation branches
git checkout -b docs/update-api-reference
git checkout -b docs/add-performance-guide
```

#### Development Cycle
```bash
# 1. Create feature branch
git checkout -b feature/my-new-feature

# 2. Make changes
# Edit code, add tests, update documentation

# 3. Run tests
npm test

# 4. Commit changes
git add .
git commit -m "Add my new feature

- Implement feature functionality
- Add unit tests
- Update documentation"

# 5. Push branch
git push origin feature/my-new-feature

# 6. Create Pull Request
# Go to GitHub and create PR
```

#### Code Quality Checks
```bash
# Run linting
npm run lint

# Check code style
npm run format

# Run security checks
npm run security

# Check dependencies
npm run audit

# Run all quality checks
npm run quality
```

---

## 📝 Code Standards

### JavaScript Style Guide

#### General Rules
```javascript
// ✅ GOOD: Use const/let instead of var
const MAX_RETRIES = 3;
let retryCount = 0;

// ❌ AVOID: Don't use var
var maxRetries = 3;

// ✅ GOOD: Use arrow functions for simple functions
const calculateRSI = (prices) => {
  // Implementation
};

// ❌ AVOID: Don't use function expressions unnecessarily
const calculateRSI = function(prices) {
  // Implementation
};

// ✅ GOOD: Use template literals
const message = `Processing ${symbol} with price ${price}`;

// ❌ AVOID: String concatenation
const message = 'Processing ' + symbol + ' with price ' + price;
```

#### Naming Conventions
```javascript
// ✅ GOOD: Descriptive names
const calculateExponentialMovingAverage = (data, period) => {
  // Implementation
};

const fetchMarketDataFromAPI = async (symbol, timeframe) => {
  // Implementation
};

// ❌ AVOID: Abbreviations and unclear names
const calcEMA = (d, p) => {
  // Implementation
};

const getData = async (s, t) => {
  // Implementation
};

// ✅ GOOD: Consistent function naming
getMarketData()
calculateRSI()
generateTradingSignal()
executeTradeOrder()

// ❌ AVOID: Inconsistent naming
getMarketData()
calcRSI()
genSignal()
execOrder()
```

#### Error Handling
```javascript
// ✅ GOOD: Proper error handling
const fetchMarketData = async (symbol, timeframe) => {
  try {
    const response = await api.getMarketData(symbol, timeframe);

    if (!response) {
      throw new Error('No data received from API');
    }

    return response;
  } catch (error) {
    console.error(`Failed to fetch market data for ${symbol}:`, error);
    throw new Error(`Market data fetch failed: ${error.message}`);
  }
};

// ❌ AVOID: Silent failures
const fetchMarketData = async (symbol, timeframe) => {
  const response = await api.getMarketData(symbol, timeframe);
  return response; // No error handling
};
```

#### Async/Await Usage
```javascript
// ✅ GOOD: Proper async/await usage
const processTradingData = async (data) => {
  try {
    const marketData = await fetchMarketData(data.symbol);
    const signal = await generateTradingSignal(marketData);
    const riskAssessment = await assessRisk(signal);

    return { marketData, signal, riskAssessment };
  } catch (error) {
    console.error('Error processing trading data:', error);
    throw error;
  }
};

// ❌ AVOID: Mixing async patterns
const processTradingData = async (data) => {
  return new Promise((resolve, reject) => {
    fetchMarketData(data.symbol)
      .then(signal => generateTradingSignal(signal))
      .then(risk => resolve(risk))
      .catch(reject);
  });
};
```

### Documentation Standards

#### Code Comments
```javascript
/**
 * Calculates the Relative Strength Index (RSI) for given price data
 * @param {Array<number>} prices - Array of closing prices
 * @param {number} period - Period for RSI calculation (default: 14)
 * @returns {number} RSI value between 0 and 100
 * @throws {Error} If prices array is empty or period is invalid
 */
const calculateRSI = (prices, period = 14) => {
  // Validate inputs
  if (!Array.isArray(prices) || prices.length === 0) {
    throw new Error('Prices must be a non-empty array');
  }

  if (period <= 0 || period > prices.length) {
    throw new Error('Invalid period specified');
  }

  // Implementation details
  const gains = [];
  const losses = [];

  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // Calculate average gains and losses
  const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
  const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;

  // Calculate RSI
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};
```

#### README Documentation
```markdown
# Feature Name

## Overview
Brief description of what this feature does and why it's useful.

## Features
- Feature 1: Description
- Feature 2: Description
- Feature 3: Description

## Usage
\`\`\`javascript
// Example usage
const feature = new Feature();
await feature.initialize();
const result = await feature.process(data);
\`\`\`

## Configuration
\`\`\`javascript
const config = {
  option1: 'value1',
  option2: 'value2'
};
\`\`\`

## API Reference
### Methods
- \`method1(param1, param2)\` - Description
- \`method2(param1)\` - Description

## Testing
\`\`\`bash
npm run test:feature-name
\`\`\`
```

### Testing Standards

#### Test Structure
```javascript
describe('ComponentName', () => {
  let component;

  beforeEach(() => {
    component = new ComponentName();
  });

  afterEach(() => {
    // Cleanup
    component = null;
  });

  describe('MethodName', () => {
    test('should handle normal case', () => {
      const result = component.methodName(validInput);
      expect(result).toBe(expectedOutput);
    });

    test('should handle edge case', () => {
      const result = component.methodName(edgeInput);
      expect(result).toBe(expectedEdgeOutput);
    });

    test('should throw error for invalid input', () => {
      expect(() => {
        component.methodName(invalidInput);
      }).toThrow('Error message');
    });
  });
});
```

#### Test Coverage Requirements
```javascript
// Minimum test coverage requirements
const COVERAGE_REQUIREMENTS = {
  statements: 80,    // 80% statement coverage
  branches: 75,      // 75% branch coverage
  functions: 80,     // 80% function coverage
  lines: 80          // 80% line coverage
};

// Test utilities
class TestUtils {
  static createMockData() {
    return {
      symbol: 'BTC/USD',
      price: 50000,
      volume: 1000000,
      timestamp: Date.now()
    };
  }

  static createMockAPI() {
    return {
      getMarketData: jest.fn(),
      executeOrder: jest.fn(),
      getAccount: jest.fn()
    };
  }
}
```

#### Mock Standards
```javascript
// Mock external dependencies
jest.mock('../core/apiHelpers', () => ({
  AlpacaAPI: jest.fn().mockImplementation(() => ({
    getMarketData: jest.fn(),
    executeOrder: jest.fn(),
    getAccount: jest.fn()
  }))
}));

jest.mock('../core/smartModelManager', () => ({
  SmartModelManager: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    selectOptimalModel: jest.fn(),
    switchModel: jest.fn()
  }))
}));
```

---

## 🔧 Contribution Process

### Feature Development

#### Feature Planning
```markdown
# Feature Development Template

## Feature Overview
- **Name**: Feature name
- **Description**: Brief description
- **Motivation**: Why this feature is needed
- **Scope**: What will be implemented

## Technical Design
- **Architecture**: How it fits into existing system
- **Components**: New/modified components
- **Dependencies**: Required dependencies
- **API Changes**: Any API modifications

## Implementation Plan
- [ ] Task 1: Description
- [ ] Task 2: Description
- [ ] Task 3: Description

## Testing Plan
- [ ] Unit tests
- [ ] Integration tests
- [ ] System tests
- [ ] Performance tests

## Documentation
- [ ] API documentation
- [ ] User guide
- [ ] Code comments
```

#### Implementation Steps
```bash
# 1. Create feature branch
git checkout -b feature/feature-name

# 2. Implement core functionality
# Write code with proper error handling and logging

# 3. Add unit tests
npm run test:unit -- --coverage

# 4. Add integration tests
npm run test:integration

# 5. Update documentation
# Update README, API docs, etc.

# 6. Run full test suite
npm test

# 7. Commit and push
git add .
git commit -m "Implement feature-name

- Add core functionality
- Add comprehensive tests
- Update documentation"

git push origin feature/feature-name
```

### Bug Fixes

#### Bug Report Template
```markdown
# Bug Report Template

## Bug Description
- **Title**: Concise bug title
- **Description**: Detailed description of the bug
- **Steps to Reproduce**: Step-by-step reproduction
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens

## Environment
- **OS**: Windows 10, macOS 12.1, Ubuntu 20.04
- **Node.js Version**: 18.12.1
- **BitFlow Version**: 2.1.0
- **Browser**: Chrome 107.0 (if applicable)

## Additional Information
- **Error Logs**: Paste relevant error logs
- **Screenshots**: Add screenshots if helpful
- **Workaround**: Any temporary workarounds
```

#### Bug Fix Process
```bash
# 1. Investigate the bug
# Reproduce the issue
# Identify root cause

# 2. Create bug fix branch
git checkout -b fix/bug-description

# 3. Implement fix
# Make minimal changes to fix the issue
# Ensure no regression

# 4. Add regression tests
# Add test that would have caught this bug
# Verify test fails before fix, passes after fix

# 5. Test the fix
npm test
# Manual testing if needed

# 6. Update documentation
# Document any behavior changes

# 7. Commit and push
git add .
git commit -m "Fix bug-description

- Root cause: [brief explanation]
- Solution: [brief description]
- Tests: Added regression test
- Impact: [any breaking changes]"

git push origin fix/bug-description
```

### Documentation Updates

#### Documentation Process
```bash
# 1. Create documentation branch
git checkout -b docs/update-topic

# 2. Update documentation
# Update relevant documentation files
# Ensure consistency across all docs

# 3. Test documentation
# Verify code examples work
# Check links and references

# 4. Review changes
# Ensure clarity and completeness
# Check for typos and formatting

# 5. Commit and push
git add .
git commit -m "Update documentation for topic

- Updated API reference
- Added usage examples
- Fixed typos and formatting"

git push origin docs/update-topic
```

#### Documentation Standards
```markdown
# Clear headings
## Main Section
### Subsection
#### Sub-subsection

# Code examples with syntax highlighting
\`\`\`javascript
const example = 'code';
\`\`\`

# Lists for steps or options
1. First step
2. Second step
3. Third step

# Tables for comparisons
| Feature | Description |
|---------|-------------|
| Feature A | Description A |
| Feature B | Description B |

# Links to other sections
[Link Text](#section-name)

# Notes and warnings
> **Note**: Important information
> **Warning**: Critical warning
```

---

## 🔍 Review Process

### Code Review

#### Review Checklist
```markdown
# Code Review Checklist

## Code Quality
- [ ] Code follows style guidelines
- [ ] Proper error handling implemented
- [ ] No hardcoded values
- [ ] Consistent naming conventions
- [ ] Appropriate comments and documentation

## Functionality
- [ ] Feature works as expected
- [ ] Edge cases handled properly
- [ ] Error cases handled gracefully
- [ ] Performance is acceptable

## Testing
- [ ] Unit tests included
- [ ] Integration tests included
- [ ] Tests pass
- [ ] Test coverage adequate

## Documentation
- [ ] Code comments complete
- [ ] API documentation updated
- [ ] User documentation updated
- [ ] Examples provided

## Security
- [ ] No security vulnerabilities
- [ ] Input validation implemented
- [ ] Sensitive data protected
- [ ] API keys secured
```

#### Review Process
```bash
# 1. Create pull request
# Fill out PR template with details

# 2. Request review
# Assign appropriate reviewers
# Add relevant labels

# 3. Address feedback
# Respond to all comments
# Make requested changes
# Update PR description if needed

# 4. Final approval
# Get approval from all reviewers
# Ensure CI/CD passes

# 5. Merge
# Merge PR to main branch
# Delete feature branch
```

### Testing Requirements

#### Test Coverage
```javascript
// Minimum test coverage requirements
const MIN_COVERAGE = {
  statements: 80,
  branches: 75,
  functions: 80,
  lines: 80
};

// Test file structure
describe('ComponentName', () => {
  // Setup
  beforeAll(() => { /* Setup */ });
  beforeEach(() => { /* Setup */ });
  afterEach(() => { /* Cleanup */ });
  afterAll(() => { /* Cleanup */ });

  // Test cases
  describe('MethodName', () => {
    test('normal case', () => { /* Test */ });
    test('edge case', () => { /* Test */ });
    test('error case', () => { /* Test */ });
  });
});
```

#### Performance Testing
```javascript
// Performance test requirements
const PERFORMANCE_REQUIREMENTS = {
  apiResponseTime: '< 1000ms',
  memoryUsage: '< 512MB',
  cpuUsage: '< 70%',
  errorRate: '< 5%'
};

// Performance test example
test('API response time should be acceptable', async () => {
  const startTime = performance.now();

  await api.getMarketData('BTC/USD');

  const endTime = performance.now();
  const responseTime = endTime - startTime;

  expect(responseTime).toBeLessThan(1000);
});
```

### Documentation Requirements

#### Code Documentation
```javascript
/**
 * Comprehensive function documentation
 * @param {string} symbol - Trading pair symbol (e.g., 'BTC/USD')
 * @param {Object} options - Configuration options
 * @param {string} options.timeframe - Chart timeframe ('1min', '5min', etc.)
 * @param {number} options.limit - Maximum number of data points
 * @returns {Promise<Array>} Array of market data points
 * @throws {Error} If symbol is invalid or API fails
 * @example
 * const data = await getMarketData('BTC/USD', {
 *   timeframe: '5min',
 *   limit: 100
 * });
 */
const getMarketData = async (symbol, options = {}) => {
  // Implementation
};
```

#### API Documentation
```markdown
# API Documentation Template

## Method Name
Brief description of what the method does.

### Parameters
- `param1` (type): Description of parameter 1
- `param2` (type): Description of parameter 2

### Returns
- (type): Description of return value

### Throws
- (Error type): Description of when error is thrown

### Example
\`\`\`javascript
const result = methodName(param1, param2);
console.log(result);
\`\`\`
```

---

## 👥 Community Guidelines

### Communication

#### GitHub Issues
```markdown
# Issue Template

## Issue Type
- [ ] Bug Report
- [ ] Feature Request
- [ ] Documentation Issue
- [ ] Question

## Description
Detailed description of the issue or request.

## Environment
- OS: [e.g., Windows 10]
- Node.js Version: [e.g., 18.12.1]
- BitFlow Version: [e.g., 2.1.0]

## Steps to Reproduce (for bugs)
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Additional Information
Any additional context or information.
```

#### Pull Request Template
```markdown
# Pull Request Template

## Description
Brief description of changes made.

## Changes Made
- Change 1: Description
- Change 2: Description
- Change 3: Description

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] System tests added
- [ ] Manual testing completed

## Documentation
- [ ] Code comments updated
- [ ] API documentation updated
- [ ] User documentation updated

## Breaking Changes
- [ ] No breaking changes
- [ ] Breaking changes documented

## Related Issues
- Closes #123
- Related to #456
```

### Issue Reporting

#### Bug Reports
```markdown
# Bug Report Guidelines

## Required Information
- **Clear title**: Summarize the bug in one line
- **Detailed description**: Explain what happens and what should happen
- **Steps to reproduce**: Provide exact steps to reproduce the bug
- **Environment details**: OS, Node.js version, BitFlow version
- **Error logs**: Include relevant error messages or stack traces

## Good Bug Report
Title: "Memory leak in SmartModelManager during extended trading"

Description:
When running BitFlow for extended periods (> 24 hours), memory usage continuously increases until the process crashes with an out-of-memory error.

Steps to Reproduce:
1. Start BitFlow with BTC/USD trading
2. Let it run for 24+ hours
3. Monitor memory usage with `node debug_tools/monitor_memory.js`
4. Observe memory increase over time
5. Eventually crashes with "JavaScript heap out of memory"

Environment:
- OS: Ubuntu 20.04
- Node.js: 18.12.1
- BitFlow: 2.1.0

Error Logs:
```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```
```

#### Feature Requests
```markdown
# Feature Request Guidelines

## Required Information
- **Clear title**: Describe the desired feature
- **Use case**: Explain why this feature is needed
- **Proposed solution**: How the feature should work
- **Alternatives considered**: Other solutions you've considered
- **Additional context**: Any other relevant information

## Good Feature Request
Title: "Add support for custom trading indicators"

Description:
It would be useful to allow users to define custom trading indicators using JavaScript functions, similar to how TradingView allows custom Pine Script indicators.

Use Case:
Users could create specialized indicators for specific trading strategies or market conditions that aren't covered by the built-in indicators.

Proposed Solution:
1. Add a `customIndicators` directory
2. Allow users to define indicators in JavaScript files
3. Provide a simple API for indicator calculation
4. Integrate custom indicators into the signal generation system

Alternatives Considered:
- External indicator plugins (more complex for users)
- Configuration-based indicators (limited flexibility)
- Built-in indicator expansion (doesn't cover all use cases)

Additional Context:
This would make BitFlow more flexible for advanced users and allow for community-contributed indicators.
```

### Feature Requests

#### Request Process
```bash
# 1. Search existing requests
# Check GitHub issues for similar requests

# 2. Create detailed request
# Use the feature request template
# Provide clear use case and proposed solution

# 3. Discuss with community
# Get feedback from other users
# Refine the request based on feedback

# 4. Implementation
# If approved, implement the feature
# Follow the contribution process
```

#### Request Evaluation
```markdown
# Feature Request Evaluation Criteria

## Feasibility
- [ ] Technically feasible
- [ ] Within project scope
- [ ] Maintains code quality

## Impact
- [ ] Solves real user problem
- [ ] Benefits many users
- [ ] Improves core functionality

## Effort
- [ ] Reasonable implementation time
- [ ] Maintains existing functionality
- [ ] Minimal breaking changes

## Design
- [ ] Follows existing patterns
- [ ] Consistent with UI/UX
- [ ] Well documented

## Evaluation Result
- [ ] Approved for implementation
- [ ] Needs more discussion
- [ ] Not approved
```

---

*This contributing guide provides comprehensive information for developers who want to contribute to BitFlow. For questions or additional help, please refer to the GitHub repository or contact the development team.*
