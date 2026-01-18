// ============================================================================
// js/app.js - Main Application Initialization
// ============================================================================

class NutriScanApp {
    constructor() {
        // Initialize all components
        this.apiRetry = new APIRetry();
        this.productAPI = new ProductAPI();
        this.geminiAPI = new GeminiAPI();
        this.cameraHandler = new CameraHandler();
        this.barcodeScanner = new BarcodeScanner();
        this.healthScore = new HealthScore();
        this.dietaryAnalyzer = new DietaryAnalyzer();
        this.allergyDetector = new AllergyDetector();
        this.goalTracker = new GoalTracker();
        this.offlineCache = new OfflineCache();
        this.historyManager = new HistoryManager();
        this.statsDisplay = new StatsDisplay();
        this.notifications = new Notifications();
        
        // Current product data
        this.currentProduct = null;
        
        // Initialize app
        this.init();
    }

    init() {
        console.log('🚀 NutriScan Enhanced starting...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load user settings
        this.loadUserSettings();
        
        // Check network status
        this.updateConnectionStatus();
        
        // Check for cached API key
        const geminiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.GEMINI_API_KEY);
        if (!geminiKey) {
            this.notifications.show('Please configure your Gemini API key in Settings', 'info', 5000);
        }
        
        console.log('✅ NutriScan Enhanced ready');
    }

    setupEventListeners() {
        // Scanner controls
        document.getElementById('start-scan-btn').addEventListener('click', () => this.startScanner());
        document.getElementById('stop-scan-btn').addEventListener('click', () => this.stopScanner());
        document.getElementById('lookup-btn').addEventListener('click', () => this.lookupManualBarcode());
        document.getElementById('manual-barcode').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.lookupManualBarcode();
        });

        // Navigation
        document.getElementById('nav-scanner').addEventListener('click', () => this.showView('scanner'));
        document.getElementById('nav-stats').addEventListener('click', () => this.showView('stats'));
        document.getElementById('nav-profile').addEventListener('click', () => this.showView('settings'));
        document.getElementById('back-to-scanner').addEventListener('click', () => this.showView('scanner'));

        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => this.toggleSettings());
        document.getElementById('close-settings').addEventListener('click', () => this.toggleSettings());
        document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
        document.getElementById('test-api').addEventListener('click', () => this.testAPIConnection());

        // Dietary profile change
        document.getElementById('dietary-profile').addEventListener('change', (e) => {
            this.dietaryAnalyzer.setDietaryProfile(e.target.value);
        });

        // Close settings panel when clicking outside
        document.getElementById('settings-panel').addEventListener('click', (e) => {
            if (e.target.id === 'settings-panel') {
                this.toggleSettings();
            }
        });
    }

    loadUserSettings() {
        // Load dietary profile
        const profile = this.dietaryAnalyzer.userProfile;
        document.getElementById('dietary-profile').value = profile.dietaryProfile;

        // Load allergen checkboxes
        const allergenContainer = document.getElementById('allergen-checkboxes');
        allergenContainer.innerHTML = '';
        
        CONFIG.ALLERGENS.forEach(allergen => {
            const div = document.createElement('div');
            div.className = 'flex items-center';
            div.innerHTML = `
                <input type="checkbox" id="allergen-${allergen}" 
                       ${profile.allergens.includes(allergen) ? 'checked' : ''}
                       class="w-4 h-4 text-green-500 rounded focus:ring-green-500">
                <label for="allergen-${allergen}" class="ml-2 text-sm text-gray-700 capitalize">${allergen}</label>
            `;
            allergenContainer.appendChild(div);
        });

        // Load goals
        const goals = this.goalTracker.goals;
        document.getElementById('goal-calories').value = goals.calories.target;
        document.getElementById('goal-sugar').value = goals.sugar.target;
        document.getElementById('goal-sodium').value = goals.sodium.target;
    }

    toggleSettings() {
        const panel = document.getElementById('settings-panel');
        panel.classList.toggle('hidden');
    }

async saveSettings() {
        console.log('💾 Saving settings...');
        
        // Save Gemini API key
        const geminiKeyInput = document.getElementById('gemini-api-key');
        const geminiKey = geminiKeyInput.value.trim();
        
        if (geminiKey) {
            console.log('🔑 API Key entered, saving...');
            this.geminiAPI.setApiKey(geminiKey);
            
            // CRITICAL FIX: Reload the API key into the instance
            this.geminiAPI.loadApiKey();
            
            console.log('✅ API key saved and loaded');
            console.log('Verification:', this.geminiAPI.apiKey ? `Has ${this.geminiAPI.apiKey.length} chars` : 'STILL EMPTY!');
            
            // Clear input
            geminiKeyInput.value = '';
        }

        // Save dietary profile
        const profile = document.getElementById('dietary-profile').value;
        this.dietaryAnalyzer.setDietaryProfile(profile);

        // Save allergens
        const selectedAllergens = [];
        CONFIG.ALLERGENS.forEach(allergen => {
            const checkbox = document.getElementById(`allergen-${allergen}`);
            if (checkbox && checkbox.checked) {
                selectedAllergens.push(allergen);
            }
        });
        
        this.allergyDetector.userAllergens = selectedAllergens;
        this.allergyDetector.saveUserAllergens();

        // Save goals
        const caloriesGoal = parseInt(document.getElementById('goal-calories').value);
        const sugarGoal = parseInt(document.getElementById('goal-sugar').value);
        const sodiumGoal = parseInt(document.getElementById('goal-sodium').value);
        
        this.goalTracker.setGoal('calories', caloriesGoal, caloriesGoal * 1.25);
        this.goalTracker.setGoal('sugar', sugarGoal, sugarGoal * 1.5);
        this.goalTracker.setGoal('sodium', sodiumGoal, sodiumGoal * 1.15);

        this.notifications.show('Settings saved successfully!', 'success');
        this.toggleSettings();
        
        console.log('✅ All settings saved');
    }

    async testAPIConnection() {
        const button = document.getElementById('test-api');
        const originalText = button.textContent;
        button.textContent = 'Testing...';
        button.disabled = true;

        try {
            // CRITICAL FIX: Always reload API key before testing
            console.log('🔄 Reloading API key from storage...');
            this.geminiAPI.loadApiKey();
            
            console.log('Current API key:', this.geminiAPI.apiKey ? `${this.geminiAPI.apiKey.length} chars` : 'EMPTY');
            
            if (!this.geminiAPI.apiKey) {
                throw new Error('Gemini API key not configured. Please enter your API key in Settings.');
            }
            
            await this.geminiAPI.testConnection();
            this.notifications.show('✅ Gemini API connection successful!', 'success');
        } catch (error) {
            console.error('❌ API test failed:', error);
            this.notifications.show(`❌ API test failed: ${error.message}`, 'error', 5000);
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

async startScanner() {
        const startBtn = document.getElementById('start-scan-btn');
        const stopBtn = document.getElementById('stop-scan-btn');
        const status = document.getElementById('scanner-status');

        startBtn.disabled = true;
        status.textContent = 'Starting camera...';
        status.className = 'scanner-status';

        try {
            // Start barcode scanner (QuaggaJS handles camera internally)
            const canvas = document.getElementById('scanner-canvas');
            
            console.log('🎥 Initializing scanner...');
            await this.barcodeScanner.startScanning(canvas, (barcode) => {
                this.handleBarcodeDetected(barcode);
            });

            console.log('✅ Scanner started successfully');
            
            startBtn.classList.add('hidden');
            stopBtn.classList.remove('hidden');
            status.textContent = '🔍 Scanning for barcodes...';
            status.className = 'scanner-status scanning';

        } catch (error) {
            console.error('❌ Scanner start failed:', error);
            
            // Show user-friendly error
            let errorMessage = 'Failed to start scanner';
            let suggestions = [];
            
            if (error.message.includes('Permission') || error.message.includes('denied')) {
                errorMessage = 'Camera permission denied';
                suggestions = [
                    'Click the camera icon in your browser address bar',
                    'Select "Allow" for camera permissions',
                    'Reload the page and try again'
                ];
            } else if (error.message.includes('NotFoundError')) {
                errorMessage = 'No camera found';
                suggestions = [
                    'Check if your device has a camera',
                    'Try using manual barcode entry instead'
                ];
            } else {
                errorMessage = error.message;
                suggestions = [
                    'Make sure no other app is using the camera',
                    'Try reloading the page',
                    'Use manual barcode entry as an alternative'
                ];
            }
            
            this.showCameraError({
                userMessage: errorMessage,
                technicalMessage: error.message,
                suggestions: suggestions
            });
            
            startBtn.disabled = false;
            status.textContent = 'Camera failed';
            status.className = 'scanner-status error';
        }
    }

    stopScanner() {
        console.log('🛑 Stopping scanner...');
        this.barcodeScanner.stopScanning();

        const startBtn = document.getElementById('start-scan-btn');
        const stopBtn = document.getElementById('stop-scan-btn');
        const status = document.getElementById('scanner-status');

        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        startBtn.disabled = false;
        status.textContent = 'Ready to scan';
        status.className = 'scanner-status';
    }

    showCameraError(error) {
        let message = `<div class="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <h4 class="font-semibold text-red-800 mb-2">${error.userMessage}</h4>
            <p class="text-sm text-red-700 mb-3">${error.technicalMessage}</p>
        `;

        if (error.suggestions && error.suggestions.length > 0) {
            message += '<p class="text-sm font-semibold text-red-800 mb-1">How to fix:</p><ul class="text-sm text-red-700 list-disc list-inside space-y-1">';
            error.suggestions.forEach(suggestion => {
                message += `<li>${suggestion}</li>`;
            });
            message += '</ul>';
        }

        message += '</div>';

        this.notifications.show(error.userMessage, 'error', 10000);
        
        // You could also show this in a modal or dedicated error area
        console.error('Camera Error Details:', error);
    }

    async lookupManualBarcode() {
        const input = document.getElementById('manual-barcode');
        const barcode = input.value.trim();

        if (!barcode) {
            this.notifications.show('Please enter a barcode', 'warning');
            return;
        }

        await this.handleBarcodeDetected(barcode);
        input.value = '';
    }

    async handleBarcodeDetected(barcode) {
        console.log('🔍 Barcode detected:', barcode);
        
        // Stop scanner
        this.stopScanner();
        
        // Show loading notification
        this.notifications.show(`Looking up barcode: ${barcode}`, 'info');

        try {
            // Try to get from cache first (offline support)
            let productData = await this.offlineCache.getCachedProduct(barcode);
            
            if (!productData) {
                // Fetch from API with retry logic
                productData = await this.apiRetry.executeWithRetry(
                    () => this.productAPI.lookupProduct(barcode),
                    'Product lookup'
                );
                
                // Cache the product data
                await this.offlineCache.cacheProductData(barcode, productData);
            } else {
                this.notifications.show('📦 Loaded from cache (offline mode)', 'info');
            }

            // Store current product
            this.currentProduct = productData;
            
            // Save to history
            this.historyManager.addToHistory(productData);
            
            // Display results
            this.displayProductResults(productData);
            
            // Switch to results view
            this.showView('results');

        } catch (error) {
            console.error('Product lookup failed:', error);
            this.notifications.show(`Failed to lookup product: ${error.message}`, 'error', 5000);
            
            // Reset scanner
            document.getElementById('start-scan-btn').disabled = false;
        }
    }

    displayProductResults(productData) {
        const resultsContent = document.getElementById('results-content');
        
        // Run all analyses
        const healthAnalysis = this.healthScore.calculate(productData);
        const dietaryAnalysis = this.dietaryAnalyzer.analyzeProduct(productData);
        const allergyAnalysis = this.allergyDetector.detectAllergens(productData);
        const goalAnalysis = this.goalTracker.analyzeProduct(productData);

        let html = '';

        // Product Header
        html += this.renderProductHeader(productData);

        // Allergy Warning (if applicable)
        if (allergyAnalysis.hasUserAllergens) {
            html += this.renderAllergyWarning(allergyAnalysis);
        }

        // Health Score
        html += this.renderHealthScore(healthAnalysis);

        // Dietary Compatibility
        if (dietaryAnalysis.dietaryProfile !== 'standard') {
            html += this.renderDietaryAnalysis(dietaryAnalysis);
        }

        // Goal Impact
        html += this.renderGoalImpact(goalAnalysis);

        // Tabs for detailed info
        html += this.renderDetailedAnalysisTabs(productData, allergyAnalysis);

        resultsContent.innerHTML = html;

        // Setup tab switching
        this.setupResultsTabs();
    }

    renderProductHeader(product) {
        return `
            <div class="card">
                <div class="flex items-start">
                    ${product.image ? `
                        <img src="${product.image}" alt="${product.name}" 
                             class="w-24 h-24 object-cover rounded-lg mr-4">
                    ` : `
                        <div class="w-24 h-24 bg-green-100 rounded-lg mr-4 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                    `}
                    <div class="flex-1">
                        <h2 class="text-2xl font-bold text-gray-800 mb-1">${product.name}</h2>
                        <p class="text-gray-600 mb-2">${product.brand}</p>
                        <div class="flex flex-wrap gap-2">
                            <span class="badge badge-info">${product.barcode}</span>
                            <span class="badge badge-success">${product.source}</span>
                            ${product.nutriScore && product.nutriScore !== '?' ? 
                                `<span class="badge" style="background-color: ${this.getNutriScoreColor(product.nutriScore)}; color: white;">Nutri-Score: ${product.nutriScore}</span>` 
                                : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAllergyWarning(analysis) {
        const warning = analysis.warning;
        return `
            <div class="card bg-red-50 border-l-4 border-red-500">
                <div class="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div class="flex-1">
                        <h3 class="font-bold text-red-800 text-lg mb-1">${warning.message}</h3>
                        <p class="text-red-700 font-semibold">${warning.action}</p>
                        ${warning.details && warning.details.length > 0 ? `
                            <ul class="mt-2 text-sm text-red-600 list-disc list-inside">
                                ${warning.details.map(d => `<li>${d}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderHealthScore(analysis) {
        const colorClass = analysis.score >= 70 ? 'success' : analysis.score >= 40 ? 'warning' : 'danger';
        return `
            <div class="card">
                <h3 class="card-header">Health Score</h3>
                <div class="flex items-center justify-between mb-4">
                    <div class="health-score-circle bg-white text-${colorClass}" style="--score-color-1: ${this.getScoreColor(analysis.score)}; --score-color-2: ${this.getScoreColor(analysis.score - 20)};">
                        <span class="text-${colorClass}">${analysis.score}</span>
                    </div>
                    <div class="flex-1 ml-6">
                        <div class="progress-bar mb-2">
                            <div class="progress-bar-fill ${colorClass}" style="width: ${analysis.score}%"></div>
                        </div>
                        <p class="text-gray-700">${analysis.description}</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderDietaryAnalysis(analysis) {
        return `
            <div class="card ${analysis.compatible ? 'bg-green-50' : 'bg-yellow-50'}">
                <h3 class="card-header">Dietary Compatibility: ${analysis.dietaryProfile}</h3>
                <div class="mb-3">
                    <div class="flex items-center mb-2">
                        ${analysis.compatible ? `
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ` : `
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        `}
                        <span class="font-semibold">${analysis.recommendation.message}</span>
                    </div>
                    <p class="text-sm text-gray-600 ml-8">${analysis.recommendation.details}</p>
                </div>
                ${analysis.violations.length > 0 ? `
                    <div class="mt-3">
                        <p class="font-semibold text-red-600 mb-2">Violations:</p>
                        <ul class="list-disc list-inside space-y-1 text-sm text-red-600">
                            ${analysis.violations.map(v => `<li>${v.reason}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${analysis.warnings.length > 0 ? `
                    <div class="mt-3">
                        <p class="font-semibold text-yellow-600 mb-2">Warnings:</p>
                        <ul class="list-disc list-inside space-y-1 text-sm text-yellow-600">
                            ${analysis.warnings.map(w => `<li>${w.message}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderGoalImpact(analysis) {
        return `
            <div class="card">
                <h3 class="card-header">Impact on Daily Goals</h3>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    ${Object.entries(analysis.impact).map(([nutrient, value]) => `
                        <div class="text-center p-3 bg-gray-50 rounded-lg">
                            <p class="text-xs text-gray-500 uppercase">${nutrient}</p>
                            <p class="text-lg font-bold text-gray-800">${Math.round(value)}${this.getNutrientUnit(nutrient)}</p>
                            ${analysis.percentOfGoal[nutrient] ? `
                                <p class="text-xs text-gray-600">${Math.round(analysis.percentOfGoal[nutrient])}% of goal</p>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                ${analysis.warnings.length > 0 ? `
                    <div class="mt-4 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                        <p class="text-sm font-semibold text-yellow-800 mb-1">⚠️ Goal Warnings:</p>
                        <ul class="text-sm text-yellow-700 list-disc list-inside">
                            ${analysis.warnings.map(w => `<li>${w.message}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderDetailedAnalysisTabs(product, allergyAnalysis) {
        return `
            <div class="card">
                <div class="tabs">
                    <div class="tab active" data-tab="ingredients">Ingredients</div>
                    <div class="tab" data-tab="nutrition">Nutrition Facts</div>
                    <div class="tab" data-tab="allergens">Allergens</div>
                    <div class="tab" data-tab="ai">AI Analysis</div>
                </div>

                <div id="tab-ingredients" class="tab-content">
                    ${this.renderIngredientsList(product.ingredients)}
                </div>

                <div id="tab-nutrition" class="tab-content hidden">
                    ${this.renderNutritionFacts(product.nutrition)}
                </div>

                <div id="tab-allergens" class="tab-content hidden">
                    ${this.renderAllergensList(allergyAnalysis)}
                </div>

                <div id="tab-ai" class="tab-content hidden">
                    <div id="ai-analysis-container">
                        <button id="load-ai-analysis" class="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition font-semibold">
                            Load Gemini AI Analysis
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderIngredientsList(ingredients) {
        if (!ingredients || ingredients.length === 0) {
            return '<p class="text-gray-500 text-center py-4">No ingredient information available</p>';
        }

        return `
            <div class="space-y-2">
                ${ingredients.map(ing => `
                    <div class="ingredient-item ingredient-${ing.status}">
                        <div class="ingredient-icon">
                            ${this.getIngredientIcon(ing.status)}
                        </div>
                        <div class="ingredient-content">
                            <h4>${ing.name}</h4>
                            <p>${ing.description}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderNutritionFacts(nutrition) {
        return `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                ${Object.entries(nutrition).map(([key, value]) => `
                    <div class="bg-gray-50 p-4 rounded-lg text-center">
                        <p class="text-xs text-gray-500 uppercase mb-1">${key.replace('_', ' ')}</p>
                        <p class="text-lg font-bold text-gray-800">${value}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderAllergensList(analysis) {
        if (!analysis.hasAllergens) {
            return '<p class="text-green-600 text-center py-4">✓ No common allergens detected</p>';
        }

        return `
            <div class="space-y-3">
                ${analysis.allAllergens.map(allergen => `
                    <div class="p-3 rounded-lg ${allergen.isUserAllergen ? 'bg-red-50 border-l-4 border-red-500' : 'bg-gray-50'}">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-semibold capitalize ${allergen.isUserAllergen ? 'text-red-800' : 'text-gray-800'}">${allergen.name}</p>
                                <p class="text-sm ${allergen.isUserAllergen ? 'text-red-600' : 'text-gray-600'}">${allergen.description}</p>
                            </div>
                            <span class="badge ${allergen.isUserAllergen ? 'badge-danger' : allergen.severity === 'high' ? 'badge-warning' : 'badge-info'}">
                                ${allergen.severity}
                            </span>
                        </div>
                        ${allergen.matchedKeywords && allergen.matchedKeywords.length > 0 ? `
                            <p class="text-xs text-gray-500 mt-2">Found: ${allergen.matchedKeywords.join(', ')}</p>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    setupResultsTabs() {
        const tabs = document.querySelectorAll('.tab[data-tab]');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Update tab styles
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show/hide content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.add('hidden');
                });
                document.getElementById(`tab-${tabName}`).classList.remove('hidden');
            });
        });

        // Setup AI analysis button
        const aiButton = document.getElementById('load-ai-analysis');
        if (aiButton) {
            aiButton.addEventListener('click', () => this.loadAIAnalysis());
        }
    }

    async loadAIAnalysis() {
        const container = document.getElementById('ai-analysis-container');
        
        container.innerHTML = `
            <div class="ai-loading">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
                <span class="ml-3 text-purple-600 font-medium">Analyzing with Gemini AI...</span>
            </div>
        `;

        try {
            const analysis = await this.geminiAPI.analyzeProduct(this.currentProduct);
            
            container.innerHTML = `
                <div class="ai-analysis">
                    <div class="ai-header">
                        <div class="ai-logo">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" fill="#8b5cf6" opacity="0.2"/>
                                <path d="M12 6v12M6 12h12" stroke="#6d28d9" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <span class="ai-title">Gemini AI Analysis</span>
                    </div>
                    <div class="ai-content">${analysis.analysis}</div>
                </div>
                <div class="ai-analysis">
                    <div class="ai-header">
                        <div class="ai-logo">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" fill="#8b5cf6" opacity="0.2"/>
                                <path d="M9 12l2 2 4-4" stroke="#6d28d9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <span class="ai-title">Recommendations</span>
                    </div>
                    <div class="ai-content">${analysis.recommendations}</div>
                </div>
            `;
        } catch (error) {
            container.innerHTML = `
                <div class="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                    <p class="font-semibold text-red-800 mb-1">AI Analysis Error</p>
                    <p class="text-sm text-red-700">${error.message}</p>
                    <p class="text-xs text-red-600 mt-2">Please check your Gemini API key configuration in Settings.</p>
                </div>
            `;
        }
    }

    showView(viewName) {
        document.getElementById('scanner-view').classList.add('hidden');
        document.getElementById('results-view').classList.add('hidden');
        document.getElementById('stats-view').classList.add('hidden');

        if (viewName === 'scanner') {
            document.getElementById('scanner-view').classList.remove('hidden');
        } else if (viewName === 'results') {
            document.getElementById('results-view').classList.remove('hidden');
        } else if (viewName === 'stats') {
            document.getElementById('stats-view').classList.remove('hidden');
            this.loadStatistics();
        } else if (viewName === 'settings') {
            this.toggleSettings();
        }
    }

    loadStatistics() {
        const statsContent = document.getElementById('stats-content');
        const dailyProgress = this.statsDisplay.renderDailyProgress();
        const weeklyStats = this.statsDisplay.renderWeeklyStats();

        statsContent.innerHTML = `
            <div class="grid md:grid-cols-2 gap-6">
                <div>${dailyProgress}</div>
                <div>${weeklyStats}</div>
            </div>
        `;
    }

    updateConnectionStatus() {
        const statusDiv = document.getElementById('connection-status');
        
        if (!navigator.onLine) {
            statusDiv.classList.remove('hidden');
            statusDiv.className = 'offline-indicator mb-4';
            statusDiv.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                </svg>
                Offline Mode - Using cached data
            `;
        } else {
            statusDiv.classList.add('hidden');
        }

        // Update status on network change
        window.addEventListener('online', () => this.updateConnectionStatus());
        window.addEventListener('offline', () => this.updateConnectionStatus());
    }

    // Helper methods for rendering
    getNutriScoreColor(score) {
        const colors = {
            'A': '#038C3E',
            'B': '#85BB2F',
            'C': '#F9AE00',
            'D': '#EE8100',
            'E': '#E63E11'
        };
        return colors[score] || '#9ca3af';
    }

    getScoreColor(score) {
        if (score >= 70) return '#22c55e';
        if (score >= 40) return '#f59e0b';
        return '#ef4444';
    }

    getNutrientUnit(nutrient) {
        const units = {
            calories: 'kcal',
            sugar: 'g',
            sodium: 'mg',
            protein: 'g',
            fiber: 'g',
            fat: 'g'
        };
        return units[nutrient] || '';
    }

    getIngredientIcon(status) {
        if (status === 'good') {
            return `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>`;
        } else if (status === 'bad') {
            return `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>`;
        } else {
            return `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
            </svg>`;
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.nutriScanApp = new NutriScanApp();
});

// Service Worker Registration (for future PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment when you create a service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then(reg => console.log('Service Worker registered'))
        //     .catch(err => console.log('Service Worker registration failed'));
    });
}