class HistoryManager {
    constructor() {
        this.maxHistory = 100;
        this.storageKey = 'scanHistory';
    }

    addToHistory(productData) {
        const history = this.getHistory();
        
        const entry = {
            barcode: productData.barcode,
            name: productData.name,
            brand: productData.brand,
            healthScore: productData.healthScore,
            timestamp: new Date().toISOString(),
            image: productData.image
        };

        // Check if already exists
        const existingIndex = history.findIndex(h => h.barcode === entry.barcode);
        if (existingIndex !== -1) {
            // Update existing entry
            history[existingIndex] = entry;
        } else {
            // Add new entry at the beginning
            history.unshift(entry);
        }

        // Limit history size
        if (history.length > this.maxHistory) {
            history.splice(this.maxHistory);
        }

        this.saveHistory(history);
    }

    getHistory() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load history:', error);
            return [];
        }
    }

    saveHistory(history) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(history));
        } catch (error) {
            console.error('Failed to save history:', error);
            
            // If quota exceeded, keep only recent 50
            if (error.name === 'QuotaExceededError') {
                const reduced = history.slice(0, 50);
                localStorage.setItem(this.storageKey, JSON.stringify(reduced));
            }
        }
    }

    getRecentScans(limit = 10) {
        const history = this.getHistory();
        return history.slice(0, limit);
    }

    searchHistory(query) {
        const history = this.getHistory();
        const lowerQuery = query.toLowerCase();
        
        return history.filter(entry => 
            entry.name.toLowerCase().includes(lowerQuery) ||
            entry.brand.toLowerCase().includes(lowerQuery) ||
            entry.barcode.includes(query)
        );
    }

    removeFromHistory(barcode) {
        const history = this.getHistory();
        const filtered = history.filter(h => h.barcode !== barcode);
        this.saveHistory(filtered);
    }

    clearHistory() {
        localStorage.removeItem(this.storageKey);
    }

    getStats() {
        const history = this.getHistory();
        
        if (history.length === 0) {
            return {
                totalScans: 0,
                avgHealthScore: 0,
                recentActivity: []
            };
        }

        const totalScans = history.length;
        const avgHealthScore = Math.round(
            history.reduce((sum, entry) => sum + (entry.healthScore || 0), 0) / totalScans
        );

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentActivity = history.filter(entry => 
            new Date(entry.timestamp) >= sevenDaysAgo
        );

        return {
            totalScans,
            avgHealthScore,
            recentActivity: recentActivity.length,
            recentScans: this.getRecentScans(5)
        };
    }

    exportHistory() {
        const history = this.getHistory();
        const dataStr = JSON.stringify(history, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nutriscan-history-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    importHistory(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            
            if (!Array.isArray(imported)) {
                throw new Error('Invalid history format');
            }

            // Merge with existing history
            const existing = this.getHistory();
            const merged = [...imported, ...existing];
            
            // Remove duplicates based on barcode
            const unique = merged.reduce((acc, entry) => {
                const exists = acc.find(e => e.barcode === entry.barcode);
                if (!exists) {
                    acc.push(entry);
                }
                return acc;
            }, []);

            // Sort by timestamp (newest first)
            unique.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Limit size
            const limited = unique.slice(0, this.maxHistory);
            
            this.saveHistory(limited);
            return {
                success: true,
                imported: imported.length,
                total: limited.length
            };
        } catch (error) {
            console.error('Failed to import history:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}