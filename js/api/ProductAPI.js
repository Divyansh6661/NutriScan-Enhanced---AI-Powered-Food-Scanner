// ============================================================================
// js/api/ProductAPI.js - FIXED with proper error handling
// ============================================================================

class ProductAPI {
    constructor() {
        this.baseUrl = 'https://world.openfoodfacts.org/api/v0/product/';
        // Simpler proxy setup
        this.corsProxies = [
            'https://corsproxy.io/?',
            '' // Direct attempt
        ];
    }

    async lookupProduct(barcode) {
        let lastError = null;

        // Try each proxy
        for (let i = 0; i < this.corsProxies.length; i++) {
            try {
                const proxy = this.corsProxies[i];
                const url = `${this.baseUrl}${barcode}.json`;
                const fullUrl = proxy ? `${proxy}${encodeURIComponent(url)}` : url;
                
                console.log(`Trying proxy ${i + 1}/${this.corsProxies.length}: ${proxy || 'direct'}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
                
                const response = await fetch(fullUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.status === 1 && data.product) {
                    console.log('✅ Product found successfully');
                    return this.parseProductData(data.product, barcode);
                } else if (data.status === 0) {
                    throw new Error('Product not found in OpenFoodFacts database');
                } else {
                    throw new Error('Invalid response from API');
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.warn(`Proxy ${i + 1} timed out`);
                    lastError = new Error('Request timeout');
                } else {
                    console.warn(`Proxy ${i + 1} failed:`, error.message);
                    lastError = error;
                }
                // Continue to next proxy
            }
        }
        
        // All proxies failed
        throw new Error(`Failed to lookup product: ${lastError?.message || 'All API attempts failed'}`);
    }

    parseProductData(product, barcode) {
        // Calculate health score based on Nutri-Score
        let healthScore = 50;
        const nutriScore = product.nutriscore_grade?.toUpperCase();
        
        if (nutriScore) {
            const scoreMap = { 'A': 90, 'B': 75, 'C': 60, 'D': 40, 'E': 20 };
            healthScore = scoreMap[nutriScore] || 50;
        }

        // Parse ingredients
        const ingredients = this.parseIngredients(
            product.ingredients_text || '',
            product.ingredients || []
        );

        // Parse nutrition
        const nutrition = this.parseNutrition(product.nutriments || {});

        return {
            barcode: barcode,
            name: product.product_name || product.product_name_en || 'Unknown Product',
            brand: product.brands || 'Unknown Brand',
            healthScore: healthScore,
            nutriScore: nutriScore || '?',
            healthText: this.generateHealthText(healthScore, nutriScore),
            ingredients: ingredients,
            ingredients_text: product.ingredients_text || '',
            nutrition: nutrition,
            nutriments: product.nutriments || {},
            image: product.image_url || product.image_front_url || null,
            categories: product.categories || '',
            allergens: product.allergens || '',
            labels: product.labels || '',
            source: 'OpenFoodFacts'
        };
    }

    parseIngredients(ingredientsText, ingredientsArray) {
        if (!ingredientsText && ingredientsArray.length === 0) {
            return [];
        }

        let ingredientsList = [];

        // Try to use structured ingredients first
        if (ingredientsArray && ingredientsArray.length > 0) {
            ingredientsList = ingredientsArray
                .map(ing => ing.text || ing.id || '')
                .filter(ing => ing.length > 0)
                .slice(0, 15);
        } else {
            // Fall back to parsing text
            ingredientsList = ingredientsText
                .split(/[,;]/)
                .map(ing => ing.trim())
                .filter(ing => ing.length > 0)
                .slice(0, 15);
        }

        return ingredientsList.map(ingredient => {
            const clean = ingredient.replace(/[()%\d\s]+$/, '').trim();
            return {
                name: clean,
                status: this.categorizeIngredient(clean.toLowerCase()),
                description: this.getIngredientDescription(clean.toLowerCase())
            };
        });
    }

    categorizeIngredient(ingredient) {
        const goodIngredients = [
            'water', 'salt', 'sugar', 'flour', 'milk', 'eggs', 'butter', 
            'oil', 'olive oil', 'vinegar', 'lemon', 'tomato', 'onion', 
            'garlic', 'herbs', 'spices', 'vanilla', 'cocoa', 'chocolate',
            'fruit', 'vegetable', 'whole grain', 'oat', 'rice', 'wheat', 
            'corn', 'honey', 'yeast', 'baking powder', 'baking soda'
        ];

        const badIngredients = [
            'artificial', 'preservative', 'coloring', 'flavoring', 
            'monosodium glutamate', 'msg', 'high fructose corn syrup',
            'hfcs', 'trans fat', 'hydrogenated', 'partially hydrogenated',
            'nitrate', 'nitrite', 'aspartame', 'sucralose', 'acesulfame',
            'benzoate', 'sulfate', 'phosphate', 'tbhq', 'bha', 'bht',
            'red 40', 'yellow 5', 'blue 1', 'caramel color'
        ];

        if (badIngredients.some(bad => ingredient.includes(bad))) {
            return 'bad';
        }
        
        if (goodIngredients.some(good => ingredient.includes(good))) {
            return 'good';
        }
        
        return 'neutral';
    }

    getIngredientDescription(ingredient) {
        const descriptions = {
            'water': 'Essential hydration base',
            'sugar': 'Provides sweetness and quick energy',
            'salt': 'Enhances flavor and acts as preservative',
            'flour': 'Carbohydrate base providing structure',
            'milk': 'Good source of protein and calcium',
            'eggs': 'High-quality protein and nutrients',
            'butter': 'Natural fat source, adds richness',
            'oil': 'Source of fats and flavor carrier',
            'olive oil': 'Heart-healthy monounsaturated fat',
            'vinegar': 'Adds acidity and preserves food',
            'cocoa': 'Rich in antioxidants and minerals',
            'vanilla': 'Natural flavoring agent',
            'whole grain': 'High in fiber and nutrients',
            'honey': 'Natural sweetener with antioxidants',
            'artificial': 'Synthetic additive - check necessity',
            'preservative': 'Extends shelf life artificially',
            'high fructose corn syrup': 'Processed sweetener - limit intake',
            'hydrogenated': 'Contains trans fats - avoid',
            'monosodium glutamate': 'Flavor enhancer - some sensitivity',
            'aspartame': 'Artificial sweetener',
            'nitrate': 'Preservative - potential health concerns',
            'coloring': 'Artificial color additive'
        };

        for (const [key, desc] of Object.entries(descriptions)) {
            if (ingredient.includes(key)) {
                return desc;
            }
        }

        return 'Common food ingredient';
    }

    parseNutrition(nutriments) {
        return {
            energy: nutriments['energy-kcal'] 
                ? `${Math.round(nutriments['energy-kcal'])} kcal` 
                : (nutriments['energy-kj'] ? `${Math.round(nutriments['energy-kj'])} kJ` : 'N/A'),
            proteins: nutriments.proteins ? `${nutriments.proteins} g` : 'N/A',
            carbohydrates: nutriments.carbohydrates ? `${nutriments.carbohydrates} g` : 'N/A',
            fat: nutriments.fat ? `${nutriments.fat} g` : 'N/A',
            sugars: nutriments.sugars ? `${nutriments.sugars} g` : 'N/A',
            salt: nutriments.salt ? `${nutriments.salt} g` : 'N/A',
            fiber: nutriments.fiber ? `${nutriments.fiber} g` : 'N/A',
            sodium: nutriments.sodium ? `${Math.round(nutriments.sodium * 1000)} mg` : 'N/A',
            saturated_fat: nutriments['saturated-fat'] ? `${nutriments['saturated-fat']} g` : 'N/A'
        };
    }

    generateHealthText(score, nutriScore) {
        if (score >= 80) {
            return `Excellent nutritional profile${nutriScore ? ` (Nutri-Score: ${nutriScore})` : ''}. This product has beneficial ingredients and good nutritional balance.`;
        } else if (score >= 60) {
            return `Good nutritional profile${nutriScore ? ` (Nutri-Score: ${nutriScore})` : ''}. This product is suitable for regular consumption with some considerations.`;
        } else if (score >= 40) {
            return `Moderate nutritional profile${nutriScore ? ` (Nutri-Score: ${nutriScore})` : ''}. Consider consumption frequency and portion sizes.`;
        } else {
            return `Lower nutritional profile${nutriScore ? ` (Nutri-Score: ${nutriScore})` : ''}. Best consumed occasionally as part of a balanced diet.`;
        }
    }
}