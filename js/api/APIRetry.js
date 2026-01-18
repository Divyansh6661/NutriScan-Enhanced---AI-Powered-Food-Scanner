class APIRetry {
    constructor(maxRetries = 2, retryDelay = CONFIG.API.RETRY_DELAY) {
        this.maxRetries = maxRetries; // Reduced to 2 retries
        this.retryDelay = retryDelay;
    }

    async executeWithRetry(apiCall, context = 'API call') {
        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`${context} - Attempt ${attempt}/${this.maxRetries}`);
                
                // No additional timeout wrapper - let the API handle it
                const result = await apiCall();
                
                if (attempt > 1) {
                    console.log(`${context} succeeded on attempt ${attempt}`);
                }
                
                return result;
                
            } catch (error) {
                lastError = error;
                console.warn(`${context} failed on attempt ${attempt}:`, error.message);
                
                if (attempt < this.maxRetries) {
                    const delay = this.retryDelay * attempt; // Linear backoff
                    console.log(`Retrying in ${delay}ms...`);
                    await this.sleep(delay);
                }
            }
        }
        
        throw new Error(`${context} failed after ${this.maxRetries} attempts. Last error: ${lastError.message}`);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    isNetworkError(error) {
        return error.message.includes('network') || 
               error.message.includes('timeout') ||
               error.message.includes('fetch') ||
               error.name === 'AbortError';
    }

    isServerError(error) {
        return error.message.includes('500') ||
               error.message.includes('502') ||
               error.message.includes('503');
    }

    shouldRetry(error) {
        return this.isNetworkError(error) || this.isServerError(error);
    }
}