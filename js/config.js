
// Application Configuration
const CONFIG = {
    APP_NAME: 'NutriScan Enhanced',
    VERSION: '2.0.0',
    
    // API Configuration
    API: {
        OPEN_FOOD_FACTS: 'https://world.openfoodfacts.org/api/v0/product/',
        CORS_PROXY: 'https://api.allorigins.win/raw?url=',
        GEMINI_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000, // ms
        TIMEOUT: 10000 // ms
    },
    
    // Scanner Configuration
    SCANNER: {
        WIDTH: 640,
        HEIGHT: 480,
        FREQUENCY: 10,
        READERS: ['code_128_reader', 'ean_reader', 'ean_8_reader', 'code_39_reader']
    },
    
    // Storage Keys
    STORAGE_KEYS: {
        GEMINI_API_KEY: 'geminiApiKey',
        USER_PROFILE: 'userProfile',
        SCAN_HISTORY: 'scanHistory',
        DIETARY_GOALS: 'dietaryGoals',
        OFFLINE_CACHE: 'offlineCache'
    },
    
    // Health Score Thresholds
    HEALTH_SCORE: {
        EXCELLENT: 80,
        GOOD: 60,
        MODERATE: 40
    },
    
    // Dietary Profiles
    DIETARY_PROFILES: [
        'standard',
        'vegan',
        'vegetarian',
        'gluten-free',
        'dairy-free',
        'keto',
        'paleo',
        'halal',
        'kosher'
    ],
    
    // Common Allergens
    ALLERGENS: [
        'milk',
        'eggs',
        'fish',
        'shellfish',
        'tree nuts',
        'peanuts',
        'wheat',
        'soybeans',
        'sesame'
    ]
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
