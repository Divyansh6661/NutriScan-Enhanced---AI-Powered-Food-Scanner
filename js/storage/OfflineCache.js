class OfflineCache {
    constructor() {
        this.cacheName = 'nutriscan-offline-v1';
        this.maxCacheSize = 50; // Maximum products to cache
        this.isOnline = navigator.onLine;
        this.initializeOfflineSupport();
    }

    initializeOfflineSupport() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncCachedData();
            console.log('📶 Back online - syncing cached data');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📵 Offline mode activated');
        });
    }

    async cacheProductData(barcode, productData) {
        try {
            const cache = await this.getCache();
            cache[barcode] = {
                data: productData,
                timestamp: Date.now(),
                cached: true
            };

            // Limit cache size
            const barcodes = Object.keys(cache);
            if (barcodes.length > this.maxCacheSize) {
                // Remove oldest entries
                const sorted = barcodes.sort((a, b) => 
                    cache[a].timestamp - cache[b].timestamp
                );
                delete cache[sorted[0]];
            }

            await this.saveCache(cache);
            console.log(`✅ Cached product: ${barcode}`);
        } catch (error) {
            console.error('Failed to cache product:', error);
        }
    }

    async getCachedProduct(barcode) {
        try {
            const cache = await this.getCache();
            const cached = cache[barcode];

            if (cached) {
                // Check if cache is still fresh (7 days)
                const age = Date.now() - cached.timestamp;
                const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

                if (age < maxAge) {
                    console.log(`📦 Retrieved from cache: ${barcode}`);
                    return cached.data;
                } else {
                    console.log(`⏰ Cache expired for: ${barcode}`);
                    delete cache[barcode];
                    await this.saveCache(cache);
                }
            }

            return null;
        } catch (error) {
            console.error('Failed to retrieve cached product:', error);
            return null;
        }
    }

    async getCache() {
        try {
            const cached = localStorage.getItem(CONFIG.STORAGE_KEYS.OFFLINE_CACHE);
            return cached ? JSON.parse(cached) : {};
        } catch (error) {
            console.error('Failed to load cache:', error);
            return {};
        }
    }

    async saveCache(cache) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.OFFLINE_CACHE, JSON.stringify(cache));
        } catch (error) {
            console.error('Failed to save cache:', error);
            
            // If quota exceeded, clear oldest entries
            if (error.name === 'QuotaExceededError') {
                console.log('⚠️ Storage quota exceeded, clearing old cache entries');
                const entries = Object.entries(cache);
                const half = Math.floor(entries.length / 2);
                const newest = entries
                    .sort((a, b) => b[1].timestamp - a[1].timestamp)
                    .slice(0, half);
                
                const newCache = Object.fromEntries(newest);
                localStorage.setItem(CONFIG.STORAGE_KEYS.OFFLINE_CACHE, JSON.stringify(newCache));
            }
        }
    }

    async clearCache() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.OFFLINE_CACHE);
        console.log('🗑️ Cache cleared');
    }

    async syncCachedData() {
        // This would sync any pending data when back online
        // For now, just log the event
        console.log('🔄 Sync complete');
    }

    getCacheStats() {
        const cache = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.OFFLINE_CACHE) || '{}');
        const entries = Object.values(cache);
        
        return {
            totalProducts: entries.length,
            cacheSize: new Blob([JSON.stringify(cache)]).size,
            oldestEntry: entries.length > 0 
                ? new Date(Math.min(...entries.map(e => e.timestamp)))
                : null,
            newestEntry: entries.length > 0
                ? new Date(Math.max(...entries.map(e => e.timestamp)))
                : null
        };
    }
}