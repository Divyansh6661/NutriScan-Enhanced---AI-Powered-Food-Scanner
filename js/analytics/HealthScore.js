class HealthScore {
    constructor() {
        this.baseScore = 50;
    }

    calculate(productData) {
        let score = this.baseScore;
        const factors = [];

        // Nutri-Score based scoring
        if (productData.nutriScore) {
            const nutriScorePoints = this.getNutriScorePoints(productData.nutriScore);
            score += nutriScorePoints;
            factors.push({
                name: 'Nutri-Score',
                impact: nutriScorePoints,
                value: productData.nutriScore
            });
        }

        // Nutritional balance
        if (productData.nutrition || productData.nutriments) {
            const nutrition = productData.nutrition || productData.nutriments;
            const nutritionScore = this.evaluateNutrition(nutrition);
            score += nutritionScore.points;
            factors.push(...nutritionScore.factors);
        }

        // Ingredient quality
        if (productData.ingredients && productData.ingredients.length > 0) {
            const ingredientScore = this.evaluateIngredients(productData.ingredients);
            score += ingredientScore.points;
            factors.push(ingredientScore.factor);
        }

        // Ensure score is within bounds
        score = Math.max(0, Math.min(100, score));

        return {
            score: Math.round(score),
            factors,
            description: this.getDescription(score),
            recommendation: this.getRecommendation(score)
        };
    }

    getNutriScorePoints(grade) {
        const points = {
            'A': 40,
            'B': 25,
            'C': 10,
            'D': -10,
            'E': -30
        };
        return points[grade.toUpperCase()] || 0;
    }

    evaluateNutrition(nutrition) {
        let points = 0;
        const factors = [];

        // Sugar evaluation
        const sugar = this.parseValue(nutrition.sugars);
        if (sugar !== null) {
            if (sugar < 5) {
                points += 10;
                factors.push({ name: 'Low Sugar', impact: 10, value: `${sugar}g` });
            } else if (sugar > 15) {
                points -= 15;
                factors.push({ name: 'High Sugar', impact: -15, value: `${sugar}g` });
            }
        }

        // Sodium evaluation
        const sodium = this.parseValue(nutrition.sodium) * 1000; // Convert to mg
        if (sodium !== null) {
            if (sodium < 300) {
                points += 10;
                factors.push({ name: 'Low Sodium', impact: 10, value: `${sodium}mg` });
            } else if (sodium > 800) {
                points -= 10;
                factors.push({ name: 'High Sodium', impact: -10, value: `${sodium}mg` });
            }
        }

        // Fat evaluation
        const fat = this.parseValue(nutrition.fat);
        if (fat !== null) {
            if (fat > 30) {
                points -= 10;
                factors.push({ name: 'High Fat', impact: -10, value: `${fat}g` });
            }
        }

        // Fiber (positive)
        const fiber = this.parseValue(nutrition.fiber);
        if (fiber !== null && fiber > 5) {
            points += 5;
            factors.push({ name: 'Good Fiber', impact: 5, value: `${fiber}g` });
        }

        // Protein (positive)
        const protein = this.parseValue(nutrition.proteins);
        if (protein !== null && protein > 10) {
            points += 5;
            factors.push({ name: 'High Protein', impact: 5, value: `${protein}g` });
        }

        return { points, factors };
    }

    evaluateIngredients(ingredients) {
        let points = 0;
        const goodCount = ingredients.filter(i => i.status === 'good').length;
        const badCount = ingredients.filter(i => i.status === 'bad').length;

        points += goodCount * 2;
        points -= badCount * 5;

        return {
            points,
            factor: {
                name: 'Ingredient Quality',
                impact: points,
                value: `${goodCount} good, ${badCount} concerning`
            }
        };
    }

    parseValue(value) {
        if (value === null || value === undefined) return null;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const parsed = parseFloat(value.replace(/[^\d.]/g, ''));
            return isNaN(parsed) ? null : parsed;
        }
        return null;
    }

    getDescription(score) {
        if (score >= 80) {
            return 'Excellent nutritional profile with beneficial ingredients and balanced nutrition.';
        } else if (score >= 60) {
            return 'Good nutritional profile suitable for regular consumption.';
        } else if (score >= 40) {
            return 'Moderate nutritional profile. Consider portion sizes and consumption frequency.';
        } else {
            return 'Lower nutritional profile. Best consumed occasionally as part of a balanced diet.';
        }
    }

    getRecommendation(score) {
        if (score >= 80) {
            return 'Great choice! This product aligns well with a healthy diet.';
        } else if (score >= 60) {
            return 'Good option. Enjoy in moderation as part of a balanced diet.';
        } else if (score >= 40) {
            return 'Moderate choice. Balance with healthier options throughout the day.';
        } else {
            return 'Consider healthier alternatives or limit consumption frequency.';
        }
    }
}