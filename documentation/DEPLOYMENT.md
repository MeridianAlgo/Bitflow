# Deployment Guide 🚀

**Complete Deployment Guide for BitFlow**

This comprehensive guide provides detailed instructions for deploying BitFlow in various environments, including development, staging, and production setups.

---

## 📋 Table of Contents

- [Deployment Overview](#deployment-overview)
  - [Deployment Types](#deployment-types)
  - [Environment Requirements](#environment-requirements)
  - [Security Considerations](#security-considerations)
- [Local Development](#local-development)
  - [Development Setup](#development-setup)
  - [Debug Configuration](#debug-configuration)
  - [Testing Deployment](#testing-deployment)
- [Server Deployment](#server-deployment)
  - [Linux Server](#linux-server)
  - [Windows Server](#windows-server)
  - [macOS Server](#macos-server)
- [Cloud Deployment](#cloud-deployment)
  - [AWS Deployment](#aws-deployment)
  - [Google Cloud](#google-cloud)
  - [Microsoft Azure](#microsoft-azure)
  - [DigitalOcean](#digitalocean)
- [Container Deployment](#container-deployment)
  - [Docker Setup](#docker-setup)
  - [Docker Compose](#docker-compose)
  - [Kubernetes](#kubernetes)
- [Monitoring & Maintenance](#monitoring--maintenance)
  - [Health Checks](#health-checks)
  - [Log Management](#log-management)
  - [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [Performance Issues](#performance-issues)
  - [Security Issues](#security-issues)

---

## 📖 Deployment Overview

### Deployment Types

#### Development Deployment
```bash
# Development environment
NODE_ENV=development
BITFLOW_DEBUG=1
BITFLOW_LOG_LEVEL=debug
BITFLOW_MIN_UI=0  # Verbose output
```

#### Staging Deployment
```bash
# Staging environment
NODE_ENV=staging
BITFLOW_DEBUG=0
BITFLOW_LOG_LEVEL=info
BITFLOW_MIN_UI=1  # Silent mode
```

#### Production Deployment
```bash
# Production environment
NODE_ENV=production
BITFLOW_DEBUG=0
BITFLOW_LOG_LEVEL=warn
BITFLOW_MIN_UI=1  # Silent mode
```

### Environment Requirements

#### System Requirements
```bash
# Minimum requirements
OS: Linux, Windows 10+, macOS 10.15+
CPU: 2 cores minimum, 4+ cores recommended
RAM: 4GB minimum, 8GB+ recommended
Storage: 10GB minimum, 20GB+ recommended
Network: Stable internet connection

# Recommended specifications
CPU: 8+ cores
RAM: 16GB+
Storage: 50GB+ SSD
Network: High-speed broadband
```

#### Software Dependencies
```bash
# Node.js
node --version  # 16.x, 18.x, or 20.x LTS

# Package manager
npm --version   # Latest stable

# Git
git --version   # 2.20.0+

# Optional: Redis (for caching)
redis-server --version  # 6.0+

# Optional: MongoDB (for data storage)
mongod --version  # 5.0+
```

### Security Considerations

#### API Key Security
```bash
# Store API keys securely
# ✅ GOOD: Use environment variables
ALPACA_API_KEY_ID=your_key_here
ALPACA_SECRET_KEY=your_secret_here

# ❌ AVOID: Hardcoded in code
const alpacaKey = 'your_key_here';  // Never do this!

# ✅ GOOD: Use secret management
# AWS Secrets Manager, Azure Key Vault, etc.
```

#### Network Security
```bash
# Firewall configuration
# Allow only necessary ports
ufw allow 22     # SSH
ufw allow 80     # HTTP (if using web interface)
ufw allow 443    # HTTPS (if using web interface)
ufw allow 3000   # BitFlow API (if needed)
ufw default deny # Deny all other traffic

# SSL/TLS configuration
# Use HTTPS for all web interfaces
# Enable HSTS headers
# Use secure cookies
```

#### Access Control
```bash
# User permissions
# ✅ GOOD: Restrict file permissions
chmod 600 .env              # Owner read/write only
chmod 644 user_settings/*   # Owner read/write, group/others read
chmod 755 scripts/*         # Owner execute, others read/execute

# ❌ AVOID: Overly permissive permissions
chmod 777 .env              # Never do this!
```

---

## 💻 Local Development

### Development Setup

#### Initial Setup
```bash
# Clone repository
git clone https://github.com/MeridianAlgo/Bitflow.git
cd Bitflow

# Install dependencies
npm install

# Set up development environment
cp .env.example .env.dev

# Configure for development
# Edit .env.dev with development settings
# Use paper trading API keys
```

#### Development Configuration
```bash
# .env.dev
NODE_ENV=development
BITFLOW_DEBUG=1
BITFLOW_LOG_LEVEL=debug
BITFLOW_MIN_UI=0

# Development API keys (paper trading)
ALPACA_API_KEY_ID=PKXXXXXXXXXXXXXXXXXXXX
ALPACA_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
POLYGON_API_KEY=xxxxxxxxxxxxxxxxxxxx
FINNHUB_API_KEY=xxxxxxxxxxxxxxxxxxxx

# Development settings
BITFLOW_MODEL_TYPE=balanced
BITFLOW_CACHE_ENABLED=1
BITFLOW_LOG_TO_FILE=1
```

#### Running in Development Mode
```bash
# Start development server
npm run dev

# With specific configuration
NODE_ENV=development BITFLOW_MIN_UI=0 node BitFlow.js BTC/USD

# With debug logging
DEBUG=bitflow:* node BitFlow.js BTC/USD

# With performance monitoring
node --prof BitFlow.js BTC/USD
```

### Debug Configuration

#### Debug Environment
```bash
# Enable all debug logging
DEBUG=*
BITFLOW_DEBUG=1
BITFLOW_LOG_LEVEL=debug

# Enable source maps
NODE_OPTIONS="--enable-source-maps"

# Enable inspector
NODE_OPTIONS="--inspect"

# Memory debugging
NODE_OPTIONS="--expose-gc --max-old-space-size=4096"
```

#### Debug Tools
```bash
# Monitor memory usage
node debug_tools/monitor_memory.js

# Profile performance
node debug_tools/performance_monitor.js

# Check system status
node debug_tools/system_diagnostic.js

# Test API connections
node tests/test_api_connections.js
```

### Testing Deployment

#### Pre-Deployment Testing
```bash
# Run full test suite
npm test

# Test with development configuration
NODE_ENV=development npm run test:all

# Test performance
npm run test:performance

# Test security
npm run test:security
```

#### Deployment Validation
```bash
# Validate configuration
node scripts/validate_config.js

# Check dependencies
npm run check-deps

# Verify file permissions
node scripts/check_permissions.js

# Test API connections
node scripts/test_apis.js
```

---

## 🖥️ Server Deployment

### Linux Server

#### Ubuntu/Debian Setup
```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install additional dependencies
sudo apt-get install -y git curl wget htop nano

# Install PM2 for process management
sudo npm install -g pm2

# Create bitflow user
sudo useradd -m -s /bin/bash bitflow
sudo usermod -aG sudo bitflow

# Set up directory structure
sudo mkdir -p /opt/bitflow
sudo chown bitflow:bitflow /opt/bitflow
```

#### Configuration and Deployment
```bash
# Switch to bitflow user
sudo su - bitflow
cd /opt/bitflow

# Clone repository
git clone https://github.com/MeridianAlgo/Bitflow.git .
npm install --production

# Set up environment
cp .env.example .env.production

# Edit production configuration
nano .env.production
# Add production API keys and settings

# Set up PM2
pm2 start BitFlow.js --name "bitflow" --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Service Management
```bash
# PM2 commands
pm2 start BitFlow.js --name "bitflow"
pm2 stop bitflow
pm2 restart bitflow
pm2 reload bitflow
pm2 delete bitflow

# Monitoring
pm2 monit
pm2 logs bitflow

# Process management
pm2 list
pm2 show bitflow
```

### Windows Server

#### Windows Setup
```powershell
# Install Node.js (using Node.js installer)
# Download from https://nodejs.org/

# Install Git
# Download from https://git-scm.com/

# Install NSSM (Non-Sucking Service Manager)
# Download from https://nssm.cc/

# Create bitflow directory
New-Item -ItemType Directory -Path "C:\Program Files\BitFlow"
cd "C:\Program Files\BitFlow"

# Clone repository
git clone https://github.com/MeridianAlgo/Bitflow.git .
npm install --production

# Create environment file
Copy-Item .env.example .env.production

# Edit production configuration
notepad .env.production
# Add production API keys and settings
```

#### Windows Service Setup
```powershell
# Install BitFlow as Windows service using NSSM
nssm install BitFlow "C:\Program Files\NodeJS\node.exe" "C:\Program Files\BitFlow\BitFlow.js"
nssm set BitFlow AppDirectory "C:\Program Files\BitFlow"
nssm set BitFlow AppEnvironmentExtra NODE_ENV=production
nssm set BitFlow DisplayName "BitFlow Trading Bot"
nssm set BitFlow Description "Advanced cryptocurrency trading bot"
nssm set BitFlow Start SERVICE_AUTO_START

# Start the service
nssm start BitFlow

# Service management
nssm status BitFlow
nssm stop BitFlow
nssm restart BitFlow
nssm remove BitFlow confirm
```

### macOS Server

#### macOS Setup
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@18

# Install additional tools
brew install git wget curl htop

# Install PM2
npm install -g pm2

# Create bitflow user
sudo dscl . -create /Users/bitflow
sudo dscl . -create /Users/bitflow UserShell /bin/bash
sudo dscl . -create /Users/bitflow RealName "BitFlow User"
sudo dscl . -create /Users/bitflow UniqueID 503
sudo dscl . -create /Users/bitflow PrimaryGroupID 20
sudo dscl . -create /Users/bitflow NFSHomeDirectory /Users/bitflow

# Create directories
sudo mkdir -p /Applications/BitFlow
sudo chown bitflow:staff /Applications/BitFlow
```

#### Deployment Process
```bash
# Switch to bitflow user
sudo su - bitflow
cd /Applications/BitFlow

# Clone repository
git clone https://github.com/MeridianAlgo/Bitflow.git .
npm install --production

# Configure environment
cp .env.example .env.production
nano .env.production
# Add production configuration

# Set up launchd service
# Create plist file
nano ~/Library/LaunchAgents/com.bitflow.trader.plist

# PM2 setup
pm2 start BitFlow.js --name "bitflow" --env production
pm2 save
pm2 startup launchd
```

#### Launchd Configuration
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.bitflow.trader</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Applications/BitFlow/BitFlow.js</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Applications/BitFlow/logs/out.log</string>
    <key>StandardErrorPath</key>
    <string>/Applications/BitFlow/logs/err.log</string>
    <key>WorkingDirectory</key>
    <string>/Applications/BitFlow</string>
</dict>
</plist>
```

---

## ☁️ Cloud Deployment

### AWS Deployment

#### EC2 Deployment
```bash
# Launch EC2 instance
# Ubuntu 20.04 LTS, t3.medium or larger

# Connect to instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Set up application
sudo mkdir -p /opt/bitflow
sudo chown ubuntu:ubuntu /opt/bitflow
cd /opt/bitflow

# Clone and configure
git clone https://github.com/MeridianAlgo/Bitflow.git .
npm install --production
cp .env.example .env.production

# Configure security groups
# Allow SSH (22), HTTP (80), HTTPS (443) as needed
```

#### AWS Configuration
```bash
# Set up IAM roles
# Create IAM role with EC2 permissions
# Attach role to EC2 instance

# Set up security
# Configure security groups
# Set up SSL certificates with ACM
# Configure Route 53 for domain

# Set up monitoring
# CloudWatch logs
# CloudWatch metrics
# CloudWatch alarms
```

#### RDS Database Setup
```bash
# Launch RDS instance
# MySQL or PostgreSQL, t3.micro or larger

# Configure database
# Create database user
# Set up security groups
# Configure backup settings

# Update BitFlow configuration
# Add database connection string to .env.production
```

### Google Cloud

#### Compute Engine Deployment
```bash
# Create Compute Engine instance
# Ubuntu 20.04, e2-medium or larger

# Install dependencies
sudo apt update
sudo apt install -y nodejs npm git

# Install PM2
sudo npm install -g pm2

# Set up application
sudo mkdir -p /opt/bitflow
sudo chown $USER:$USER /opt/bitflow
cd /opt/bitflow

# Clone and configure
git clone https://github.com/MeridianAlgo/Bitflow.git .
npm install --production
cp .env.example .env.production
```

#### Google Cloud Configuration
```bash
# Set up firewall rules
# Allow HTTP/HTTPS traffic
# Configure health checks

# Set up load balancer
# Create load balancer
# Configure backend service
# Set up SSL certificates

# Set up monitoring
# Cloud Monitoring
# Cloud Logging
# Error reporting
```

### Microsoft Azure

#### Virtual Machine Deployment
```bash
# Create Azure VM
# Ubuntu 20.04, B2s or larger

# Connect to VM
ssh azureuser@your-vm-ip

# Install dependencies
sudo apt update
sudo apt install -y nodejs npm git

# Install PM2
sudo npm install -g pm2

# Set up application
sudo mkdir -p /opt/bitflow
sudo chown azureuser:azureuser /opt/bitflow
cd /opt/bitflow

# Clone and configure
git clone https://github.com/MeridianAlgo/Bitflow.git .
npm install --production
cp .env.example .env.production
```

#### Azure Configuration
```bash
# Set up network security
# Configure NSG rules
# Set up load balancer

# Set up database
# Azure Database for MySQL/PostgreSQL
# Configure connection strings

# Set up monitoring
# Azure Monitor
# Application Insights
# Log Analytics
```

### DigitalOcean

#### Droplet Deployment
```bash
# Create Droplet
# Ubuntu 20.04, 2GB RAM or larger

# Connect to Droplet
ssh root@your-droplet-ip

# Install dependencies
apt update
apt install -y nodejs npm git

# Install PM2
npm install -g pm2

# Set up application
mkdir -p /opt/bitflow
cd /opt/bitflow

# Clone and configure
git clone https://github.com/MeridianAlgo/Bitflow.git .
npm install --production
cp .env.example .env.production
```

#### DigitalOcean Configuration
```bash
# Set up firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

# Set up managed database
# Create MySQL/PostgreSQL database
# Configure connection

# Set up load balancer
# Create load balancer
# Configure SSL
```

---

## 🐳 Container Deployment

### Docker Setup

#### Dockerfile
```dockerfile
# Use Node.js 18 LTS
FROM node:18-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m bitflow && chown -R bitflow:bitflow /app
USER bitflow

# Expose port (if needed)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Start application
CMD ["node", "BitFlow.js"]
```

#### Docker Build and Run
```bash
# Build Docker image
docker build -t bitflow:latest .

# Run container
docker run -d \
  --name bitflow-trader \
  -e NODE_ENV=production \
  -e ALPACA_API_KEY_ID=your_key \
  -e ALPACA_SECRET_KEY=your_secret \
  -v /opt/bitflow/logs:/app/logs \
  bitflow:latest

# View logs
docker logs bitflow-trader

# Monitor container
docker stats bitflow-trader
```

### Docker Compose

#### docker-compose.yml
```yaml
version: '3.8'

services:
  bitflow:
    build: .
    container_name: bitflow-trader
    environment:
      - NODE_ENV=production
      - ALPACA_API_KEY_ID=${ALPACA_API_KEY_ID}
      - ALPACA_SECRET_KEY=${ALPACA_SECRET_KEY}
      - POLYGON_API_KEY=${POLYGON_API_KEY}
      - BITFLOW_MIN_UI=1
    volumes:
      - ./logs:/app/logs
      - ./user_settings:/app/user_settings
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    image: redis:7-alpine
    container_name: bitflow-redis
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

  database:
    image: postgres:15-alpine
    container_name: bitflow-db
    environment:
      - POSTGRES_DB=bitflow
      - POSTGRES_USER=bitflow
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  redis_data:
  postgres_data:
```

#### Docker Compose Commands
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f bitflow

# Scale services
docker-compose up -d --scale bitflow=3

# Update services
docker-compose down
docker-compose pull
docker-compose up -d

# Stop services
docker-compose down
```

### Kubernetes

#### Kubernetes Deployment
```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bitflow-deployment
  labels:
    app: bitflow
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bitflow
  template:
    metadata:
      labels:
        app: bitflow
    spec:
      containers:
      - name: bitflow
        image: bitflow:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: ALPACA_API_KEY_ID
          valueFrom:
            secretKeyRef:
              name: bitflow-secrets
              key: alpaca-api-key-id
        - name: ALPACA_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: bitflow-secrets
              key: alpaca-secret-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### Kubernetes Service
```yaml
# k8s/service.yml
apiVersion: v1
kind: Service
metadata:
  name: bitflow-service
spec:
  selector:
    app: bitflow
  ports:
  - name: http
    port: 80
    targetPort: 3000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: bitflow-ingress
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - bitflow.yourdomain.com
    secretName: bitflow-tls
  rules:
  - host: bitflow.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: bitflow-service
            port:
              number: 80
```

#### Kubernetes Deployment Commands
```bash
# Deploy to Kubernetes
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
kubectl get ingress

# View logs
kubectl logs -f deployment/bitflow-deployment

# Scale deployment
kubectl scale deployment bitflow-deployment --replicas=5

# Update deployment
kubectl set image deployment/bitflow-deployment bitflow=bitflow:v2.0
kubectl rollout status deployment/bitflow-deployment
```

---

## 📊 Monitoring & Maintenance

### Health Checks

#### Application Health Checks
```javascript
// healthcheck.js
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    // Check application health
    const isHealthy = checkApplicationHealth();

    if (isHealthy) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }));
    } else {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        issues: getHealthIssues()
      }));
    }
  } else if (req.url === '/ready') {
    // Check if application is ready
    const isReady = checkApplicationReadiness();

    if (isReady) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ready' }));
    } else {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'not ready' }));
    }
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(3000);

function checkApplicationHealth() {
  // Check critical components
  return (
    checkDatabaseConnection() &&
    checkAPIConnections() &&
    checkModelLoading() &&
    checkMemoryUsage()
  );
}

function checkApplicationReadiness() {
  // Check if all components are initialized
  return (
    checkInitializationComplete() &&
    checkConfigurationLoaded() &&
    checkDependenciesReady()
  );
}
```

#### System Health Monitoring
```bash
# Monitor system resources
htop  # CPU, memory, processes

# Monitor disk usage
df -h  # Disk space
du -sh /opt/bitflow/*  # Directory sizes

# Monitor network
iftop  # Network traffic
netstat -tlnp  # Network connections

# Monitor logs
tail -f /opt/bitflow/logs/bitflow.log
journalctl -u bitflow -f  # If using systemd
```

### Log Management

#### Log Configuration
```bash
# Log rotation
logrotate /etc/logrotate.d/bitflow

# /etc/logrotate.d/bitflow
/opt/bitflow/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 bitflow bitflow
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### Centralized Logging
```yaml
# Fluentd configuration for log aggregation
<source>
  @type tail
  path /opt/bitflow/logs/*.log
  pos_file /var/log/fluentd/bitflow.pos
  tag bitflow
  format json
</source>

<filter bitflow>
  @type record_transformer
  enable_ruby
  <record>
    hostname ${hostname}
    service bitflow
  </record>
</filter>

<match bitflow>
  @type elasticsearch
  host elasticsearch
  port 9200
  index_name bitflow-${Time.at(time).strftime('%Y.%m.%d')}
</match>
```

### Backup & Recovery

#### Automated Backups
```bash
# Backup script
#!/bin/bash
BACKUP_DIR="/opt/bitflow/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup configuration
cp /opt/bitflow/.env.production $BACKUP_DIR/bitflow_config_$TIMESTAMP.env

# Backup user settings
cp -r /opt/bitflow/user_settings $BACKUP_DIR/user_settings_$TIMESTAMP

# Backup logs (last 7 days)
find /opt/bitflow/logs -name "*.log" -mtime -7 -exec cp {} $BACKUP_DIR/ \;

# Backup database (if using file-based)
cp /opt/bitflow/data/*.db $BACKUP_DIR/ 2>/dev/null || true

# Create archive
tar -czf $BACKUP_DIR/bitflow_backup_$TIMESTAMP.tar.gz -C $BACKUP_DIR .
rm -rf $BACKUP_DIR/bitflow_config_$TIMESTAMP.env $BACKUP_DIR/user_settings_$TIMESTAMP $BACKUP_DIR/*.log $BACKUP_DIR/*.db

# Keep only last 10 backups
ls -t $BACKUP_DIR/*.tar.gz | tail -n +11 | xargs rm -f

echo "Backup completed: $BACKUP_DIR/bitflow_backup_$TIMESTAMP.tar.gz"
```

#### Recovery Procedures
```bash
# Recovery script
#!/bin/bash
if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

BACKUP_FILE=$1
RECOVERY_DIR="/tmp/bitflow_recovery"

# Extract backup
mkdir -p $RECOVERY_DIR
tar -xzf $BACKUP_FILE -C $RECOVERY_DIR

# Stop BitFlow
pm2 stop bitflow

# Restore configuration
cp $RECOVERY_DIR/*config*.env /opt/bitflow/.env.production

# Restore user settings
cp -r $RECOVERY_DIR/*user_settings* /opt/bitflow/user_settings

# Restore logs (if needed)
# cp -r $RECOVERY_DIR/*.log /opt/bitflow/logs/

# Restore database (if needed)
# cp $RECOVERY_DIR/*.db /opt/bitflow/data/

# Start BitFlow
pm2 start bitflow

# Cleanup
rm -rf $RECOVERY_DIR

echo "Recovery completed from $BACKUP_FILE"
```

---

## 🛠️ Troubleshooting

### Common Issues

#### Deployment Failures
```bash
# Check system requirements
node --version  # Should be 16.x, 18.x, or 20.x
npm --version   # Should be latest

# Check disk space
df -h

# Check memory
free -h

# Check network connectivity
ping google.com
ping alpaca.markets

# Check file permissions
ls -la /opt/bitflow/
```

#### API Connection Issues
```bash
# Test API connections
node scripts/test_apis.js

# Check API keys
echo $ALPACA_API_KEY_ID | grep -E '^[A-Z0-9]{20,}$'
echo $ALPACA_SECRET_KEY | grep -E '^[a-zA-Z0-9+/=]{40,}$'

# Test with curl
curl -H "APCA-API-KEY-ID: $ALPACA_API_KEY_ID" \
     -H "APCA-API-SECRET-KEY: $ALPACA_SECRET_KEY" \
     https://api.alpaca.markets/v2/account
```

#### Performance Issues
```bash
# Monitor system performance
htop  # CPU and memory usage
iotop  # Disk I/O
iftop  # Network I/O

# Check BitFlow performance
pm2 monit
pm2 logs bitflow --lines 100

# Profile Node.js performance
NODE_ENV=production node --prof BitFlow.js BTC/USD
node --prof-process isolate-*.log > processed.txt
```

### Security Issues

#### Security Audit
```bash
# Check file permissions
find /opt/bitflow -type f -exec ls -la {} \;

# Check for sensitive data in logs
grep -r "API_KEY\|SECRET\|PASSWORD" /opt/bitflow/logs/

# Check open ports
netstat -tlnp | grep node

# Run security scan
npm audit
npm audit fix
```

#### Firewall Configuration
```bash
# Check firewall status
ufw status

# Allow only necessary ports
ufw allow 22     # SSH
ufw allow 80     # HTTP (if needed)
ufw allow 443    # HTTPS (if needed)
ufw default deny # Deny all other traffic

# Check listening services
ss -tlnp
```

#### SSL/TLS Setup
```bash
# Install certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Configure SSL in Nginx
sudo nano /etc/nginx/sites-available/bitflow

# Test SSL configuration
curl -I https://yourdomain.com
```

---

*This comprehensive deployment guide provides detailed instructions for deploying BitFlow in various environments. For additional support, please refer to the documentation files or contact the development team.*
