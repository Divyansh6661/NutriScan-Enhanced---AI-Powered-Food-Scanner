class GoalTracker {
    constructor() {
        this.goals = this.loadGoals();
        this.dailyIntake = this.loadDailyIntake();
    }

    loadGoals() {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.DIETARY_GOALS);
        return stored ? JSON.parse(stored) : {
            calories: { target: 2000, max: 2500 },
            sugar: { target: 50, max: 75 },
            sodium: { target: 2000, max: 2300 },
            protein: { target: 50, min: 40 },
            fiber: { target: 25, min: 20 },
            fat: { target: 65, max: 80 }
        };
    }

    loadDailyIntake() {
        const today = new Date().toDateString();
        const stored = localStorage.getItem('dailyIntake_' + today);
        return stored ? JSON.parse(stored) : {
            date: today,
            calories: 0,
            sugar: 0,
            sodium: 0,
            protein: 0,
            fiber: 0,
            fat: 0,
            scannedProducts: []
        };
    }

    saveDailyIntake() {
        const today = new Date().toDateString();
        localStorage.setItem('dailyIntake_' + today, JSON.stringify(this.dailyIntake));
    }

    saveGoals() {
        localStorage.setItem(CONFIG.STORAGE_KEYS.DIETARY_GOALS, JSON.stringify(this.goals));
    }

    analyzeProduct(productData, servingSize = 100) {
        const nutrition = productData.nutrition || productData.nutriments || {};
        
        // Calculate nutritional impact
        const impact = {
            calories: this.parseNutritionValue(nutrition['energy-kcal'] || nutrition.energy) * (servingSize / 100),
            sugar: this.parseNutritionValue(nutrition.sugars) * (servingSize / 100),
            sodium: this.parseNutritionValue(nutrition.sodium) * (servingSize / 100),
            protein: this.parseNutritionValue(nutrition.proteins) * (servingSize / 100),
            fiber: this.parseNutritionValue(nutrition.fiber) * (servingSize / 100),
            fat: this.parseNutritionValue(nutrition.fat) * (servingSize / 100)
        };

        // Check against goals
        const analysis = {
            impact,
            remaining: {},
            percentOfGoal: {},
            warnings: [],
            recommendations: []
        };

        for (const [nutrient, value] of Object.entries(impact)) {
            if (this.goals[nutrient]) {
                const current = this.dailyIntake[nutrient] || 0;
                const goal = this.goals[nutrient];
                
                analysis.remaining[nutrient] = {
                    current: current + value,
                    target: goal.target,
                    max: goal.max,
                    remaining: goal.max ? (goal.max - current - value) : null
                };

                analysis.percentOfGoal[nutrient] = ((current + value) / goal.target) * 100;

                // Generate warnings
                if (goal.max && (current + value) > goal.max) {
                    analysis.warnings.push({
                        nutrient,
                        message: `This will exceed your daily ${nutrient} limit`,
                        severity: 'high'
                    });
                } else if (goal.max && (current + value) > goal.target) {
                    analysis.warnings.push({
                        nutrient,
                        message: `This will push you over your ${nutrient} target`,
                        severity: 'medium'
                    });
                }
            }
        }

        // Generate recommendations
        if (analysis.warnings.length === 0) {
            analysis.recommendations.push('This product fits within your daily goals');
        } else {
            analysis.recommendations.push('Consider portion size to stay within goals');
            if (impact.sugar > 10) {
                analysis.recommendations.push('High sugar content - consume in moderation');
            }
            if (impact.sodium > 500) {
                analysis.recommendations.push('High sodium - balance with low-sodium meals');
            }
        }

        return analysis;
    }

    trackProduct(productData, servingSize = 100) {
        const nutrition = productData.nutrition || productData.nutriments || {};
        
        // Add to daily intake
        this.dailyIntake.calories += this.parseNutritionValue(nutrition['energy-kcal'] || nutrition.energy) * (servingSize / 100);
        this.dailyIntake.sugar += this.parseNutritionValue(nutrition.sugars) * (servingSize / 100);
        this.dailyIntake.sodium += this.parseNutritionValue(nutrition.sodium) * (servingSize / 100);
        this.dailyIntake.protein += this.parseNutritionValue(nutrition.proteins) * (servingSize / 100);
        this.dailyIntake.fiber += this.parseNutritionValue(nutrition.fiber) * (servingSize / 100);
        this.dailyIntake.fat += this.parseNutritionValue(nutrition.fat) * (servingSize / 100);

        this.dailyIntake.scannedProducts.push({
            name: productData.name || productData.product_name,
            barcode: productData.barcode,
            servingSize,
            timestamp: new Date().toISOString()
        });

        this.saveDailyIntake();
    }

    parseNutritionValue(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const parsed = parseFloat(value.replace(/[^\d.]/g, ''));
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }

    getDailyProgress() {
        const progress = {};
        
        for (const [nutrient, goal] of Object.entries(this.goals)) {
            const current = this.dailyIntake[nutrient] || 0;
            progress[nutrient] = {
                current: Math.round(current),
                target: goal.target,
                max: goal.max,
                percentage: Math.round((current / goal.target) * 100),
                remaining: goal.max ? Math.round(goal.max - current) : null,
                status: this.getGoalStatus(current, goal)
            };
        }

        return progress;
    }

    getGoalStatus(current, goal) {
        if (goal.max && current > goal.max) return 'exceeded';
        if (current > goal.target) return 'over-target';
        if (goal.min && current < goal.min) return 'under-target';
        return 'on-track';
    }

    getWeeklyStats() {
        const stats = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toDateString();
            
            const dailyData = localStorage.getItem('dailyIntake_' + dateString);
            
            if (dailyData) {
                const parsed = JSON.parse(dailyData);
                stats.push({
                    date: dateString,
                    calories: parsed.calories || 0,
                    sugar: parsed.sugar || 0,
                    sodium: parsed.sodium || 0,
                    scannedCount: parsed.scannedProducts?.length || 0
                });
            } else {
                stats.push({
                    date: dateString,
                    calories: 0,
                    sugar: 0,
                    sodium: 0,
                    scannedCount: 0
                });
            }
        }

        return stats;
    }

    setGoal(nutrient, target, max = null) {
        if (this.goals[nutrient]) {
            this.goals[nutrient].target = target;
            if (max !== null) {
                this.goals[nutrient].max = max;
            }
            this.saveGoals();
        }
    }
}