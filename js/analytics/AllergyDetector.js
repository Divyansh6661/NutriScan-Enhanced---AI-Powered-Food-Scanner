class AllergyDetector {
    constructor() {
        this.allergenDatabase = this.loadAllergenDatabase();
        this.userAllergens = this.loadUserAllergens();
    }

    loadAllergenDatabase() {
        // Comprehensive allergen matching database
        return {
            'milk': {
                keywords: ['milk', 'dairy', 'lactose', 'whey', 'casein', 'cream', 'butter', 'cheese', 'yogurt'],
                severity: 'high',
                description: 'Contains milk or dairy products'
            },
            'eggs': {
                keywords: ['egg', 'albumin', 'mayonnaise', 'meringue', 'lecithin'],
                severity: 'high',
                description: 'Contains eggs or egg products'
            },
            'fish': {
                keywords: ['fish', 'anchovy', 'bass', 'catfish', 'cod', 'flounder', 'grouper', 'haddock', 'hake', 'halibut', 'herring', 'mahi mahi', 'perch', 'pike', 'pollock', 'salmon', 'sardine', 'sole', 'snapper', 'swordfish', 'tilapia', 'trout', 'tuna'],
                severity: 'high',
                description: 'Contains fish'
            },
            'shellfish': {
                keywords: ['shellfish', 'crab', 'lobster', 'shrimp', 'prawn', 'crawfish', 'crayfish'],
                severity: 'high',
                description: 'Contains shellfish'
            },
            'tree nuts': {
                keywords: ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'macadamia', 'hazelnut', 'brazil nut', 'pine nut'],
                severity: 'high',
                description: 'Contains tree nuts'
            },
            'peanuts': {
                keywords: ['peanut', 'groundnut', 'peanut butter', 'peanut oil'],
                severity: 'high',
                description: 'Contains peanuts'
            },
            'wheat': {
                keywords: ['wheat', 'wheat flour', 'wheat starch', 'wheat gluten', 'bulgur', 'durum', 'semolina', 'spelt'],
                severity: 'high',
                description: 'Contains wheat'
            },
            'soybeans': {
                keywords: ['soy', 'soybean', 'tofu', 'edamame', 'miso', 'tempeh', 'soy sauce', 'soy protein'],
                severity: 'high',
                description: 'Contains soy'
            },
            'sesame': {
                keywords: ['sesame', 'tahini', 'sesame oil', 'sesame seed'],
                severity: 'medium',
                description: 'Contains sesame'
            }
        };
    }

    loadUserAllergens() {
        const profile = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_PROFILE);
        if (profile) {
            const parsed = JSON.parse(profile);
            return parsed.allergens || [];
        }
        return [];
    }

    detectAllergens(productData) {
        const ingredientsText = (productData.ingredients_text || '').toLowerCase();
        const allergensList = productData.allergens?.split(',').map(a => a.trim().toLowerCase()) || [];
        
        const detected = [];
        const userAllergenMatches = [];

        // Check each allergen in database
        for (const [allergen, data] of Object.entries(this.allergenDatabase)) {
            let found = false;
            let matchedKeywords = [];

            // Check in ingredients text
            for (const keyword of data.keywords) {
                if (ingredientsText.includes(keyword.toLowerCase())) {
                    found = true;
                    matchedKeywords.push(keyword);
                }
            }

            // Check in allergens list from API
            if (allergensList.some(a => a.includes(allergen))) {
                found = true;
            }

            if (found) {
                const allergenInfo = {
                    name: allergen,
                    severity: data.severity,
                    description: data.description,
                    matchedKeywords,
                    isUserAllergen: this.userAllergens.includes(allergen)
                };

                detected.push(allergenInfo);

                if (allergenInfo.isUserAllergen) {
                    userAllergenMatches.push(allergenInfo);
                }
            }
        }

        return {
            hasAllergens: detected.length > 0,
            hasUserAllergens: userAllergenMatches.length > 0,
            allAllergens: detected,
            userAllergens: userAllergenMatches,
            safetyScore: this.calculateSafetyScore(userAllergenMatches),
            warning: this.generateWarning(userAllergenMatches)
        };
    }

    calculateSafetyScore(userMatches) {
        if (userMatches.length === 0) return 100;
        
        const highSeverity = userMatches.filter(a => a.severity === 'high').length;
        const mediumSeverity = userMatches.filter(a => a.severity === 'medium').length;
        
        let score = 100;
        score -= highSeverity * 40;
        score -= mediumSeverity * 20;
        
        return Math.max(0, score);
    }

    generateWarning(userMatches) {
        if (userMatches.length === 0) {
            return {
                level: 'safe',
                message: 'No known allergens detected for your profile',
                action: 'Safe to consume based on allergen profile'
            };
        }

        const allergenNames = userMatches.map(a => a.name).join(', ');
        const hasHighSeverity = userMatches.some(a => a.severity === 'high');

        return {
            level: hasHighSeverity ? 'danger' : 'warning',
            message: `⚠️ ALLERGEN ALERT: Contains ${allergenNames}`,
            action: 'DO NOT CONSUME - This product contains allergens you have marked',
            details: userMatches.map(a => a.description)
        };
    }

    addUserAllergen(allergen) {
        if (!this.userAllergens.includes(allergen)) {
            this.userAllergens.push(allergen);
            this.saveUserAllergens();
        }
    }

    removeUserAllergen(allergen) {
        this.userAllergens = this.userAllergens.filter(a => a !== allergen);
        this.saveUserAllergens();
    }

    saveUserAllergens() {
        const profile = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER_PROFILE) || '{}');
        profile.allergens = this.userAllergens;
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    }
}