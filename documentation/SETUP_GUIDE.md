# BitFlow Setup Guide 📋

**Comprehensive Installation and Configuration Guide**

This guide provides detailed instructions for setting up BitFlow, including all prerequisites, installation methods, configuration options, and troubleshooting steps.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
  - [Automated Setup](#automated-setup)
  - [Manual Installation](#manual-installation)
  - [Docker Installation](#docker-installation)
- [Environment Configuration](#environment-configuration)
  - [Required API Keys](#required-api-keys)
  - [Optional API Keys](#optional-api-keys)
  - [System Environment Variables](#system-environment-variables)
- [Settings Configuration](#settings-configuration)
  - [Text-Based Settings System](#text-based-settings-system)
  - [Settings File Structure](#settings-file-structure)
  - [Settings Validation](#settings-validation)
- [System Requirements](#system-requirements)
  - [Hardware Requirements](#hardware-requirements)
  - [Software Requirements](#software-requirements)
  - [Network Requirements](#network-requirements)
- [Post-Installation](#post-installation)
  - [Verification Steps](#verification-steps)
  - [Testing Installation](#testing-installation)
  - [First Run](#first-run)
- [Advanced Setup](#advanced-setup)
  - [Local AI Models](#local-ai-models)
  - [Custom Data Sources](#custom-data-sources)
  - [Database Integration](#database-integration)
- [Troubleshooting Setup](#troubleshooting-setup)
  - [Common Installation Issues](#common-installation-issues)
  - [API Connection Problems](#api-connection-problems)
  - [Permission Issues](#permission-issues)
- [Migration Guides](#migration-guides)
  - [Upgrading from Previous Versions](#upgrading-from-previous-versions)
  - [Importing Existing Settings](#importing-existing-settings)

---

## 📋 Prerequisites

### Hardware Requirements

#### Minimum Requirements
- **CPU**: 2-core processor (Intel i3 or equivalent)
- **RAM**: 4GB system memory
- **Storage**: 2GB free disk space
- **Network**: Stable internet connection

#### Recommended Requirements
- **CPU**: 4-core processor (Intel i5/i7 or equivalent)
- **RAM**: 8GB+ system memory
- **Storage**: 10GB free disk space (for AI models)
- **Network**: High-speed broadband connection

#### Optimal Requirements
- **CPU**: 8-core processor (Intel i7/i9 or equivalent)
- **RAM**: 16GB+ system memory
- **Storage**: 20GB+ SSD storage
- **Network**: High-speed broadband with low latency

### Software Requirements

#### Operating Systems
- **Windows**: Windows 10/11 (64-bit)
- **macOS**: macOS 10.15+ (Catalina or newer)
- **Linux**: Ubuntu 18.04+, CentOS 7+, Debian 10+

#### Runtime Environment
- **Node.js**: Version 16.0.0 or higher (LTS recommended)
- **npm**: Latest stable version
- **Git**: Version 2.20.0 or higher

#### Optional Dependencies
- **Python**: 3.8+ (for advanced features)
- **Docker**: Latest stable version (for containerized deployment)
- **Redis**: Latest stable version (for caching)

### Network Requirements

#### API Access
- **Alpaca Markets**: https://alpaca.markets
- **Polygon.io**: https://polygon.io
- **Finnhub**: https://finnhub.io
- **Yahoo Finance**: https://finance.yahoo.com (fallback)
- **Hugging Face**: https://huggingface.co (model downloads)

#### Firewall Configuration
Ensure the following ports are open:
- **Port 80**: HTTP traffic
- **Port 443**: HTTPS traffic
- **Port 3000-3999**: Development servers (if needed)

---

## 🚀 Installation Methods

### Automated Setup

#### Method 1: Direct Clone and Setup
```bash
# Clone the repository
git clone https://github.com/MeridianAlgo/Bitflow.git
cd Bitflow

# Run automated setup
node setup.js
```

The setup script will:
1. Install all npm dependencies
2. Create necessary directories
3. Set up environment configuration
4. Download required AI models
5. Run initial tests
6. Provide setup summary

#### Method 2: Using Setup Script with Options
```bash
# Clone repository
git clone https://github.com/MeridianAlgo/Bitflow.git
cd Bitflow

# Run setup with custom options
node setup.js --skip-tests --no-models --verbose
```

Available options:
- `--skip-tests`: Skip running tests after installation
- `--no-models`: Skip downloading AI models
- `--verbose`: Show detailed installation progress
- `--help`: Display all available options

### Manual Installation

#### Step 1: Clone Repository
```bash
git clone https://github.com/MeridianAlgo/Bitflow.git
cd Bitflow
```

#### Step 2: Install Dependencies
```bash
# Install core dependencies
npm install

# Install optional Python dependencies (if using advanced features)
pip install llama-cpp-python huggingface_hub

# Install development dependencies
npm install --include=dev
```

#### Step 3: Verify Installation
```bash
# Check Node.js version
node --version

# Verify npm installation
npm --version

# Run basic functionality test
node debug_tools/quick_bitflow_test.js
```

### Docker Installation

#### Prerequisites
- Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- Docker Compose (for multi-container setup)

#### Method 1: Using Pre-built Image
```bash
# Pull the official BitFlow Docker image
docker pull meridianalgo/bitflow:latest

# Run BitFlow container
docker run -d \
  --name bitflow-trader \
  -e ALPACA_API_KEY_ID=your_key \
  -e ALPACA_SECRET_KEY=your_secret \
  -e POLYGON_API_KEY=your_key \
  -v /path/to/your/settings:/app/user_settings \
  meridianalgo/bitflow:latest
```

#### Method 2: Building from Source
```bash
# Clone repository
git clone https://github.com/MeridianAlgo/Bitflow.git
cd Bitflow

# Build Docker image
docker build -t bitflow-custom .

# Run custom container
docker run -d \
  --name bitflow-custom \
  -e BITFLOW_MIN_UI=1 \
  -v $(pwd)/user_settings:/app/user_settings \
  bitflow-custom
```

#### Docker Compose Setup
```yaml
# docker-compose.yml
version: '3.8'
services:
  bitflow:
    build: .
    container_name: bitflow-trader
    environment:
      - ALPACA_API_KEY_ID=${ALPACA_API_KEY_ID}
      - ALPACA_SECRET_KEY=${ALPACA_SECRET_KEY}
      - POLYGON_API_KEY=${POLYGON_API_KEY}
      - BITFLOW_MIN_UI=1
    volumes:
      - ./user_settings:/app/user_settings
      - ./logs:/app/logs
    restart: unless-stopped
```

---

## ⚙️ Environment Configuration

### Required API Keys

#### Alpaca Markets
1. Visit [Alpaca Markets](https://alpaca.markets)
2. Create a free account
3. Navigate to "Paper Trading" section
4. Copy your API Key ID and Secret Key

```env
ALPACA_API_KEY_ID=PKXXXXXXXXXXXXXXXXXXXX
ALPACA_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Polygon.io
1. Visit [Polygon.io](https://polygon.io)
2. Sign up for a free account
3. Go to "Dashboard" → "API Keys"
4. Create a new API key

```env
POLYGON_API_KEY=xxxxxxxxxxxxxxxxxxxx
```

#### Finnhub
1. Visit [Finnhub](https://finnhub.io)
2. Register for a free account
3. Access your API key from the dashboard

```env
FINNHUB_API_KEY=xxxxxxxxxxxxxxxxxxxx
```

### Optional API Keys

#### Google Gemini (for enhanced AI features)
```env
GEMINI_API_KEY=AIzaSyC_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Llama API (for position sizing)
```env
LLAMA_API_KEY=your_llama_api_key_here
```

#### OpenAI API (alternative AI provider)
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### System Environment Variables

#### Core Configuration
```env
# UI Control
BITFLOW_MIN_UI=1                    # 1=silent, 0=verbose

# Model Selection
BITFLOW_SKIP_PREFETCH=0             # 1=skip model prefetch, 0=allow

# Debug Options
DEBUG=bitflow:*                      # Enable debug logging
NODE_ENV=production                 # Set environment mode

# Performance
NODE_OPTIONS=--max-old-space-size=4096  # Set Node.js memory limit
UV_THREADPOOL_SIZE=4                # Set thread pool size
```

#### Advanced Configuration
```env
# Cache Settings
HF_HOME=/path/to/cache              # Hugging Face cache directory
TRANSFORMERS_CACHE=/path/to/cache   # Transformers cache
BITFLOW_CACHE_DIR=/path/to/cache    # BitFlow cache directory

# Network Settings
HTTP_PROXY=http://proxy:port        # HTTP proxy
HTTPS_PROXY=https://proxy:port      # HTTPS proxy
NO_PROXY=localhost,127.0.0.1        # No proxy list

# Logging
LOG_LEVEL=info                      # Set logging level
LOG_FILE=/path/to/bitflow.log       # Log file location
```

---

## 🔧 Settings Configuration

### Text-Based Settings System

BitFlow uses a simple text-based settings system for maximum flexibility and ease of use. Settings are stored in individual files in the `user_settings/` directory.

#### Settings File Structure
```
user_settings/
├── defaultTimeframe.txt           # Trading timeframe
├── defaultTakeProfit.txt          # Take profit percentage
├── defaultStopLoss.txt            # Stop loss percentage
├── enableCrossunderSignals.txt    # MA crossunder signals
├── enablePerformanceMetrics.txt   # Advanced metrics
├── enablePositionLogging.txt      # Position logging
├── riskTolerance.txt              # Risk tolerance level
└── maxPositionSize.txt            # Maximum position size
```

#### Creating Settings Files
```bash
# Navigate to settings directory
cd user_settings

# Create timeframe setting
echo "5Min" > defaultTimeframe.txt

# Create take profit setting
echo "2.0" > defaultTakeProfit.txt

# Create stop loss setting
echo "1.5" > defaultStopLoss.txt

# Enable crossunder signals
echo "true" > enableCrossunderSignals.txt

# Enable performance metrics
echo "true" > enablePerformanceMetrics.txt

# Enable position logging
echo "true" > enablePositionLogging.txt
```

### Settings Validation

#### Manual Validation
```bash
# Check settings syntax
node debug_tools/debug_settings.js

# Validate all settings files
node tests/test_settings_validation.js
```

#### Automatic Validation
BitFlow automatically validates settings on startup:
- Checks for valid values
- Ensures required files exist
- Provides warnings for invalid settings
- Falls back to defaults when necessary

---

## 🧪 Post-Installation

### Verification Steps

#### Step 1: Environment Check
```bash
# Verify Node.js installation
node --version
npm --version

# Check system resources
node -e "console.log('RAM:', Math.round(os.totalmem()/1024/1024/1024), 'GB')"

# Test internet connection
ping -c 3 google.com
```

#### Step 2: API Connectivity Test
```bash
# Test Alpaca connection
node tests/test_api_connections.js

# Test individual APIs
node tests/test_alpaca_connection.js
node tests/test_polygon_connection.js
node tests/test_finnhub_connection.js
```

#### Step 3: Model Availability Test
```bash
# Test model selection
node tests/test_fast_models.js

# Test AI model loading
node tests/test_model_performance.js
```

### Testing Installation

#### Quick Test
```bash
# Run quick functionality test
node debug_tools/quick_bitflow_test.js

# Expected output:
# ✅ BitFlow installation verified
# ✅ Dependencies loaded successfully
# ✅ Settings system operational
# ✅ API connections available
# ✅ AI models accessible
```

#### Comprehensive Test
```bash
# Run full test suite
npm test

# Test individual components
node tests/test_core_components.js
node tests/test_trading_mechanisms.js
node tests/test_data_sources.js
```

### First Run

#### Silent Mode (Recommended)
```bash
# Start BitFlow in silent mode
$env:BITFLOW_MIN_UI=1; node bitflow.js BTC/USD

# PowerShell (Windows)
$env:BITFLOW_MIN_UI=1; node bitflow.js BTC/USD

# Expected behavior:
# - No console output
# - System runs in background
# - Trading occurs silently
# - Logs written to files
```

#### Verbose Mode (For Monitoring)
```bash
# Start BitFlow in verbose mode
$env:BITFLOW_MIN_UI=0; node bitflow.js BTC/USD

# Expected behavior:
# - Detailed console output
# - System status displayed
# - Real-time monitoring
# - Progress indicators
```

---

## 🔧 Advanced Setup

### Local AI Models

#### Ollama Setup
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull Llama 3.2 1B model
ollama pull llama3.2:1b

# Test integration
node tests/test_local_llama.js
```

#### Local Llama Setup
```bash
# Install Python dependencies
pip install llama-cpp-python huggingface_hub

# Download model (automatic)
node tests/test_efficient_llm.js

# Test local model
node tests/test_local_llama_integration.js
```

### Custom Data Sources

#### Adding Custom Exchanges
1. Create new API helper in `core/apiHelpers.js`
2. Add exchange configuration in `config/exchanges.json`
3. Update data source selection logic

#### Custom Indicators
1. Add indicator to `core/enhanced_ml_engine.js`
2. Update feature extraction pipeline
3. Add to technical indicators list

### Database Integration

#### MongoDB Setup
```bash
# Install MongoDB
npm install mongodb

# Configure connection
# Add to .env:
MONGODB_URI=mongodb://localhost:27017/bitflow
MONGODB_DATABASE=bitflow_trading
```

#### PostgreSQL Setup
```bash
# Install PostgreSQL client
npm install pg

# Configure connection
# Add to .env:
DATABASE_URL=postgresql://user:password@localhost:5432/bitflow
```

---

## 🛠️ Troubleshooting Setup

### Common Installation Issues

#### Node.js Version Issues
**Problem**: Incompatible Node.js version
**Solution**:
```bash
# Check current version
node --version

# Install Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 18
nvm install 18
nvm use 18
```

#### Permission Issues
**Problem**: Permission denied errors
**Solution**:
```bash
# Fix file permissions
chmod -R 755 BitFlow/
chmod -R 644 BitFlow/user_settings/*

# On Windows, run as Administrator
# Right-click Command Prompt → Run as Administrator
```

#### API Connection Problems
**Problem**: Cannot connect to trading APIs
**Solution**:
```bash
# Test API keys
node tests/test_api_keys.js

# Check network connectivity
ping alpaca.markets
ping polygon.io
ping finnhub.io

# Verify API key format
node debug_tools/verify_api_keys.js
```

### Performance Optimization

#### Memory Optimization
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=8192" node bitflow.js BTC/USD

# Optimize garbage collection
NODE_OPTIONS="--optimize-for-size --max-semi-space-size=128" node bitflow.js BTC/USD
```

#### CPU Optimization
```bash
# Set CPU affinity (Linux)
taskset -c 0,1 node bitflow.js BTC/USD

# Set process priority (Windows)
wmic process where name="node.exe" CALL setpriority 128
```

### Debug Mode Setup

#### Enable Debug Logging
```bash
# Enable all debug logging
DEBUG=* node bitflow.js BTC/USD

# Enable specific component logging
DEBUG=bitflow:api,bitflow:ml node bitflow.js BTC/USD

# Log to file
DEBUG=* node bitflow.js BTC/USD > bitflow_debug.log 2>&1
```

#### Development Mode
```bash
# Set development environment
NODE_ENV=development node bitflow.js BTC/USD

# Enable source maps
NODE_OPTIONS="--enable-source-maps" node bitflow.js BTC/USD
```

---

## 📋 Migration Guides

### Upgrading from Previous Versions

#### From v1.x to v2.x
```bash
# Backup existing settings
cp -r user_settings user_settings_backup

# Pull latest changes
git pull origin main

# Update dependencies
npm update

# Run migration script
node scripts/migrate_v1_to_v2.js
```

#### From v2.x to v3.x
```bash
# Backup configuration
cp .env .env.backup
cp -r user_settings user_settings_backup

# Update codebase
git pull origin main
npm install

# Migrate settings
node scripts/migrate_v2_to_v3.js
```

### Importing Existing Settings

#### From JSON Format
```bash
# Convert JSON settings to text files
node scripts/convert_json_settings.js path/to/old_settings.json

# Validate converted settings
node debug_tools/debug_settings.js
```

#### From Other Trading Bots
```bash
# Create settings mapping
node scripts/import_settings.js --from=other_bot --settings=path/to/settings

# Review and adjust settings
node debug_tools/debug_settings.js
```

---

## 📞 Getting Help

### Support Channels
- **GitHub Issues**: [Create an issue](https://github.com/MeridianAlgo/Bitflow/issues)
- **Discussions**: [GitHub Discussions](https://github.com/MeridianAlgo/Bitflow/discussions)
- **Documentation**: This comprehensive setup guide
- **Community**: Open source community support

### Diagnostic Commands
```bash
# Run complete system diagnostic
node debug_tools/system_diagnostic.js

# Check all dependencies
npm ls --depth=0

# Verify API connections
node tests/test_all_apis.js

# Check system resources
node debug_tools/resource_monitor.js
```

### Common Solutions
- **Installation Issues**: Check Node.js version and permissions
- **API Problems**: Verify API keys and network connectivity
- **Performance Issues**: Monitor system resources and optimize settings
- **Settings Problems**: Validate settings files and restart application

---

*For additional help, please refer to the main README.md file or create an issue on GitHub.*
