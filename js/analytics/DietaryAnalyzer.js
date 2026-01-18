class DietaryAnalyzer {
    constructor() {
        this.userProfile = this.loadUserProfile();
        this.dietaryRules = this.loadDietaryRules();
    }

    loadUserProfile() {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_PROFILE);
        return stored ? JSON.parse(stored) : {
            dietaryProfile: 'standard',
            allergens: [],
            avoidIngredients: []
        };
    }

    saveUserProfile(profile) {
        this.userProfile = profile;
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    }

    loadDietaryRules() {
        return {
            vegan: {
                forbidden: [
                    'meat', 'beef', 'pork', 'chicken', 'fish', 'seafood',
                    'milk', 'dairy', 'cheese', 'butter', 'cream', 'yogurt',
                    'eggs', 'honey', 'gelatin', 'whey', 'casein', 'lactose'
                ],
                warning: ['may contain milk', 'may contain eggs']
            },
            vegetarian: {
                forbidden: [
                    'meat', 'beef', 'pork', 'chicken', 'fish', 'seafood',
                    'gelatin', 'rennet', 'lard', 'animal fat'
                ],
                warning: ['may contain fish']
            },
            'gluten-free': {
                forbidden: [
                    'wheat', 'barley', 'rye', 'malt', 'gluten',
                    'wheat flour', 'wheat starch', 'triticale'
                ],
                warning: ['may contain gluten', 'processed in facility that handles wheat']
            },
            'dairy-free': {
                forbidden: [
                    'milk', 'dairy', 'cheese', 'butter', 'cream',
                    'yogurt', 'whey', 'casein', 'lactose'
                ],
                warning: ['may contain milk']
            },
            keto: {
                highCarb: [
                    'sugar', 'flour', 'bread', 'rice', 'pasta',
                    'potato', 'corn', 'wheat', 'oats'
                ],
                warning: ['high in carbohydrates']
            },
            halal: {
                forbidden: [
                    'pork', 'lard', 'alcohol', 'wine', 'beer',
                    'gelatin (non-halal)', 'animal shortening'
                ],
                warning: ['verify halal certification']
            },
            kosher: {
                forbidden: [
                    'pork', 'shellfish', 'mixing meat and dairy'
                ],
                warning: ['verify kosher certification']
            }
        };
    }

    analyzeProduct(productData) {
        const profile = this.userProfile.dietaryProfile;
        const ingredientsText = productData.ingredients_text?.toLowerCase() || '';
        const ingredientsList = productData.ingredients?.map(i => i.name.toLowerCase()) || [];
        
        const violations = [];
        const warnings = [];
        const compatibilityScore = 100;

        if (profile !== 'standard' && this.dietaryRules[profile]) {
            const rules = this.dietaryRules[profile];

            // Check forbidden ingredients
            if (rules.forbidden) {
                rules.forbidden.forEach(forbidden => {
                    if (ingredientsText.includes(forbidden) || 
                        ingredientsList.some(ing => ing.includes(forbidden))) {
                        violations.push({
                            ingredient: forbidden,
                            reason: `Not suitable for ${profile} diet`,
                            severity: 'high'
                        });
                    }
                });
            }

            // Check warnings
            if (rules.warning) {
                rules.warning.forEach(warn => {
                    if (ingredientsText.includes(warn)) {
                        warnings.push({
                            message: warn,
                            reason: `May not be suitable for ${profile} diet`,
                            severity: 'medium'
                        });
                    }
                });
            }

            // Check high carb for keto
            if (rules.highCarb) {
                const carbViolations = rules.highCarb.filter(carb =>
                    ingredientsText.includes(carb) ||
                    ingredientsList.some(ing => ing.includes(carb))
                );

                if (carbViolations.length > 0) {
                    warnings.push({
                        message: 'High carbohydrate content',
                        ingredients: carbViolations,
                        severity: 'medium'
                    });
                }
            }
        }

        // Calculate compatibility score
        let finalScore = compatibilityScore;
        finalScore -= violations.length * 30;
        finalScore -= warnings.length * 10;
        finalScore = Math.max(0, Math.min(100, finalScore));

        return {
            compatible: violations.length === 0,
            score: finalScore,
            violations,
            warnings,
            dietaryProfile: profile,
            recommendation: this.generateRecommendation(violations, warnings, profile)
        };
    }

    generateRecommendation(violations, warnings, profile) {
        if (violations.length > 0) {
            return {
                suitable: false,
                message: `This product is NOT suitable for a ${profile} diet`,
                details: violations.map(v => v.reason).join('. ')
            };
        } else if (warnings.length > 0) {
            return {
                suitable: true,
                message: `This product may be suitable for a ${profile} diet with caution`,
                details: warnings.map(w => w.message).join('. ')
            };
        } else {
            return {
                suitable: true,
                message: `This product appears suitable for a ${profile} diet`,
                details: 'No dietary violations detected'
            };
        }
    }

    setDietaryProfile(profile) {
        if (CONFIG.DIETARY_PROFILES.includes(profile)) {
            this.userProfile.dietaryProfile = profile;
            this.saveUserProfile(this.userProfile);
            return true;
        }
        return false;
    }

    addAllergen(allergen) {
        if (!this.userProfile.allergens.includes(allergen)) {
            this.userProfile.allergens.push(allergen);
            this.saveUserProfile(this.userProfile);
        }
    }

    removeAllergen(allergen) {
        this.userProfile.allergens = this.userProfile.allergens.filter(a => a !== allergen);
        this.saveUserProfile(this.userProfile);
    }
}