class LocalStorage {
    constructor() {
        this.available = this.checkAvailability();
    }

    checkAvailability() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('LocalStorage not available:', e);
            return false;
        }
    }

    get(key, defaultValue = null) {
        if (!this.available) return defaultValue;

        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading ${key} from localStorage:`, error);
            return defaultValue;
        }
    }

    set(key, value) {
        if (!this.available) return false;

        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing ${key} to localStorage:`, error);
            
            // Handle quota exceeded
            if (error.name === 'QuotaExceededError') {
                console.warn('LocalStorage quota exceeded, clearing old data...');
                this.clearOldData();
                
                // Try again
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (retryError) {
                    console.error('Still failed after clearing:', retryError);
                    return false;
                }
            }
            return false;
        }
    }

    remove(key) {
        if (!this.available) return false;

        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing ${key} from localStorage:`, error);
            return false;
        }
    }

    clear() {
        if (!this.available) return false;

        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    clearOldData() {
        // Clear cache and old history entries
        const historyKey = 'scanHistory';
        const history = this.get(historyKey, []);
        
        if (history.length > 50) {
            // Keep only recent 50 entries
            const recent = history.slice(0, 50);
            this.set(historyKey, recent);
        }

        // Clear offline cache if it exists
        this.remove(CONFIG.STORAGE_KEYS.OFFLINE_CACHE);
    }

    getUsage() {
        if (!this.available) {
            return { used: 0, total: 0, percentage: 0 };
        }

        let totalSize = 0;
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length + key.length;
            }
        }

        // Approximate quota (usually 5-10MB, we use 5MB)
        const quota = 5 * 1024 * 1024;
        const percentage = (totalSize / quota) * 100;

        return {
            used: totalSize,
            total: quota,
            percentage: Math.round(percentage)
        };
    }

    exportAllData() {
        if (!this.available) return null;

        const data = {};
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                try {
                    data[key] = JSON.parse(localStorage[key]);
                } catch (e) {
                    data[key] = localStorage[key];
                }
            }
        }
        return data;
    }
}