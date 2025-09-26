class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 1000;
        this.errorCounts = new Map();
        this.criticalErrors = [];
    }

    // Log an error with context
    logError(error, context = '', severity = 'error') {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            error: error.message || error,
            stack: error.stack,
            context: context,
            severity: severity
        };

        this.errorLog.push(errorEntry);

        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize);
        }

        // Track error frequency
        const errorKey = `${error.message || error}_${context}`;
        this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

        // Log to console based on severity
        switch (severity) {
            case 'critical':
                console.error(`🚨 CRITICAL ERROR [${context}]:`, error);
                this.criticalErrors.push(errorEntry);
                break;
            case 'warning':
                console.warn(`⚠️ WARNING [${context}]:`, error);
                break;
            default:
                console.error(`❌ ERROR [${context}]:`, error);
        }

        return errorEntry;
    }

    // Handle async errors with retry logic
    async handleAsyncError(operation, context = '', maxRetries = 3, delayMs = 1000) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                this.logError(error, `${context}_attempt_${attempt}`, attempt === maxRetries ? 'critical' : 'warning');

                if (attempt < maxRetries) {
                    console.log(`🔄 Retrying ${context} (attempt ${attempt + 1}/${maxRetries})...`);
                    await this.sleep(delayMs * attempt); // Exponential backoff
                }
            }
        }

        throw lastError;
    }

    // Handle API errors with specific handling
    handleAPIError(error, apiName, operation = '') {
        const context = `${apiName}_API_${operation}`;

        if (error.response) {
            // HTTP error response
            const status = error.response.status;
            switch (status) {
                case 401:
                    this.logError(error, context, 'critical');
                    throw new Error(`${apiName} API authentication failed. Please check your API key.`);
                case 403:
                    this.logError(error, context, 'critical');
                    throw new Error(`${apiName} API access forbidden. Please check your permissions.`);
                case 429:
                    this.logError(error, context, 'warning');
                    throw new Error(`${apiName} API rate limit exceeded. Please wait before retrying.`);
                case 500:
                case 502:
                case 503:
                case 504:
                    this.logError(error, context, 'warning');
                    throw new Error(`${apiName} API server error (${status}). Please try again later.`);
                default:
                    this.logError(error, context, 'error');
                    throw new Error(`${apiName} API error (${status}): ${error.response.data?.message || error.message}`);
            }
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            this.logError(error, context, 'warning');
            throw new Error(`${apiName} API connection failed. Please check your internet connection.`);
        } else {
            this.logError(error, context, 'error');
            throw error;
        }
    }

    // Handle WebSocket errors
    handleWebSocketError(error, wsName, context = '') {
        this.logError(error, `${wsName}_websocket_${context}`, 'warning');

        switch (error.code) {
            case 'ECONNREFUSED':
                throw new Error(`${wsName} WebSocket connection refused. Service may be down.`);
            case 'ETIMEDOUT':
                throw new Error(`${wsName} WebSocket connection timed out.`);
            case 'EHOSTUNREACH':
                throw new Error(`${wsName} WebSocket host unreachable.`);
            default:
                throw new Error(`${wsName} WebSocket error: ${error.message}`);
        }
    }

    // Handle trading errors
    handleTradingError(error, operation, symbol = '') {
        const context = `trading_${operation}_${symbol}`;
        this.logError(error, context, 'critical');

        switch (operation) {
            case 'buy':
                throw new Error(`Failed to execute BUY order for ${symbol}: ${error.message}`);
            case 'sell':
                throw new Error(`Failed to execute SELL order for ${symbol}: ${error.message}`);
            case 'position_check':
                console.warn(`⚠️ Could not check position for ${symbol}: ${error.message}`);
                return null;
            default:
                throw new Error(`Trading operation failed: ${error.message}`);
        }
    }

    // Validate data integrity
    validateData(data, dataType, context = '') {
        try {
            switch (dataType) {
                case 'price':
                    if (typeof data !== 'number' || isNaN(data) || data <= 0) {
                        throw new Error(`Invalid price data: ${data}`);
                    }
                    break;
                case 'array':
                    if (!Array.isArray(data) || data.length === 0) {
                        throw new Error(`Invalid array data: ${data}`);
                    }
                    break;
                case 'object':
                    if (typeof data !== 'object' || data === null) {
                        throw new Error(`Invalid object data: ${data}`);
                    }
                    break;
            }
            return true;
        } catch (error) {
            this.logError(error, `${context}_validation`, 'warning');
            return false;
        }
    }

    // Get error statistics
    getErrorStats() {
        return {
            totalErrors: this.errorLog.length,
            criticalErrors: this.criticalErrors.length,
            errorCounts: Object.fromEntries(this.errorCounts),
            recentErrors: this.errorLog.slice(-10),
            topErrors: Array.from(this.errorCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
        };
    }

    // Clear error logs
    clearErrorLogs() {
        this.errorLog = [];
        this.errorCounts.clear();
        this.criticalErrors = [];
    }

    // Sleep utility
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Check if too many errors occurred recently
    hasTooManyErrors(maxErrors = 10, timeWindowMs = 60000) {
        const recentErrors = this.errorLog.filter(
            error => Date.now() - new Date(error.timestamp).getTime() < timeWindowMs
        );
        return recentErrors.length >= maxErrors;
    }
}

module.exports = ErrorHandler;
