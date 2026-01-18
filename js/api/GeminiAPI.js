class GeminiAPI {
    constructor() {
        this.apiKey = '';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
        this.loadApiKey();
    }

    loadApiKey() {
        try {
            // Try multiple storage methods for better compatibility
            this.apiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.GEMINI_API_KEY) || 
                         sessionStorage.getItem(CONFIG.STORAGE_KEYS.GEMINI_API_KEY) || 
                         '';
            
            if (this.apiKey) {
                console.log('✅ API key loaded from storage');
            } else {
                console.log('⚠️ No API key found in storage');
            }
        } catch (error) {
            console.error('Failed to load API key:', error);
            this.apiKey = '';
        }
    }

    setApiKey(key) {
        try {
            // CRITICAL: Set instance variable FIRST
            this.apiKey = key;
            
            // Then save to storage
            localStorage.setItem(CONFIG.STORAGE_KEYS.GEMINI_API_KEY, key);
            sessionStorage.setItem(CONFIG.STORAGE_KEYS.GEMINI_API_KEY, key);
            
            console.log('✅ API key saved to storage');
            console.log('Instance variable set:', this.apiKey ? `${this.apiKey.length} chars` : 'EMPTY');
        } catch (error) {
            console.error('Failed to save API key:', error);
            // Still keep it in memory even if storage fails
            this.apiKey = key;
        }
    }

    async testConnection() {
        if (!this.apiKey || this.apiKey.trim() === '') {
            throw new Error('Gemini API key not configured. Please enter your API key in Settings.');
        }

        console.log('🔑 Testing Gemini API connection...');
        console.log('API Key length:', this.apiKey.length);
        console.log('Base URL:', this.baseUrl);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: 'Respond with "OK" if you can read this message.'
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 10
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log('Response status:', response.status);
            console.log('Response OK:', response.ok);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                
                try {
                    const errorData = await response.json();
                    console.error('Error response:', errorData);
                    
                    if (response.status === 400) {
                        errorMessage = 'Invalid API key format. Please check your Gemini API key.';
                    } else if (response.status === 403) {
                        errorMessage = 'API key authentication failed. Make sure:\n1. Your API key is correct\n2. Gemini API is enabled in Google Cloud Console\n3. There are no billing issues';
                    } else if (response.status === 429) {
                        errorMessage = 'API rate limit exceeded. Please wait a moment and try again.';
                    } else {
                        errorMessage = errorData.error?.message || errorMessage;
                    }
                } catch (e) {
                    console.error('Failed to parse error response:', e);
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('✅ Connection test successful:', data);
            
            // Check if we got a valid response (candidates array exists)
            if (data.candidates && data.candidates.length > 0) {
                console.log('✅ Valid response received from Gemini API');
                return 'Connection successful! Gemini API is working.';
            }
            
            throw new Error('Unexpected response format from Gemini API');

        } catch (error) {
            console.error('❌ Gemini API test failed:', error);
            
            if (error.name === 'AbortError') {
                throw new Error('Connection timeout. Please check your internet connection and try again.');
            }
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('Network error. Please check:\n1. Your internet connection\n2. If you\'re behind a firewall/VPN\n3. If CORS is blocking the request (try in incognito mode)');
            }
            
            throw error;
        }
    }

    async analyzeProduct(productData) {
        if (!this.apiKey || this.apiKey.trim() === '') {
            throw new Error('Gemini API key not configured. Please set up your API key in Settings.');
        }

        const ingredientsList = productData.ingredients
            ?.map(ing => ing.name)
            .join(', ') || 'Not available';
        
        const nutritionText = Object.entries(productData.nutrition || {})
            .filter(([key, value]) => value !== 'N/A')
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ') || 'Not available';

        const prompt = `As a nutrition expert, analyze this food product:

Product: ${productData.name}
Brand: ${productData.brand}
Ingredients: ${ingredientsList}
Nutrition (per 100g): ${nutritionText}
Nutri-Score: ${productData.nutriScore}

Provide a comprehensive analysis in TWO sections with clear headers:

## 1. ANALYSIS
Evaluate:
- Nutritional quality and calorie density
- Key beneficial and concerning ingredients
- Nutritional balance (protein/carbs/fats)
- Processing level
- Overall health implications

## 2. RECOMMENDATIONS
Provide:
- Portion size guidance
- Consumption frequency advice
- Who should avoid this product
- Healthier alternatives
- Best consumption timing

Use bullet points and be concise. IMPORTANT: Complete both sections fully.`;

        try {
            console.log('🤖 Calling Gemini API for product analysis...');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                        stopSequences: []
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_NONE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_NONE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_NONE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_NONE"
                        }
                    ]
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                let errorMessage = `API error: ${response.status}`;
                
                try {
                    const errorData = await response.json();
                    console.error('Gemini API error response:', errorData);
                    
                    if (response.status === 400) {
                        errorMessage = 'Invalid request. Please check your API key configuration.';
                    } else if (response.status === 403) {
                        errorMessage = 'API access denied. Verify your API key is correct and active.';
                    } else if (response.status === 429) {
                        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
                    } else {
                        errorMessage = errorData.error?.message || errorMessage;
                    }
                } catch (e) {
                    console.error('Failed to parse error:', e);
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('Full Gemini response:', data);
            
            // Check for finish reason
            const candidate = data.candidates?.[0];
            if (!candidate) {
                throw new Error('No response received from Gemini API');
            }

            const finishReason = candidate.finishReason;
            if (finishReason === 'MAX_TOKENS') {
                console.warn('⚠️ Response truncated due to max tokens');
            } else if (finishReason === 'SAFETY') {
                throw new Error('Response blocked by safety filters. Try a different product.');
            } else if (finishReason === 'RECITATION') {
                console.warn('⚠️ Response may contain recited content');
            }

            const text = candidate.content?.parts?.[0]?.text;
            
            if (!text || text.trim() === '') {
                throw new Error('Empty response from Gemini API');
            }

            console.log('✅ Analysis received, parsing...');
            return this.parseGeminiResponse(text);

        } catch (error) {
            console.error('❌ Gemini API analysis failed:', error);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. The analysis took too long. Please try again.');
            }
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('Network error. Check your internet connection and try again.');
            }
            
            throw error;
        }
    }

    parseGeminiResponse(text) {
        console.log('📝 Parsing response...');
        
        let analysis = '';
        let recommendations = '';

        // Strategy 1: Look for numbered sections (1. ANALYSIS, 2. RECOMMENDATIONS)
        const section1Match = text.match(/##?\s*1\.\s*ANALYSIS:?\s*([\s\S]*?)(?=##?\s*2\.\s*RECOMMENDATIONS?:|$)/i);
        const section2Match = text.match(/##?\s*2\.\s*RECOMMENDATIONS?:?\s*([\s\S]*?)$/i);

        if (section1Match && section1Match[1]) {
            analysis = section1Match[1].trim();
            console.log('✅ Found analysis section (strategy 1)');
        }
        if (section2Match && section2Match[1]) {
            recommendations = section2Match[1].trim();
            console.log('✅ Found recommendations section (strategy 1)');
        }

        // Strategy 2: Look for markdown headers
        if (!analysis || !recommendations) {
            const parts = text.split(/##\s+/);
            parts.forEach(part => {
                if (part.toLowerCase().includes('analysis')) {
                    analysis = part.replace(/1?\.\s*analysis:?/i, '').trim();
                    console.log('✅ Found analysis section (strategy 2)');
                } else if (part.toLowerCase().includes('recommendation')) {
                    recommendations = part.replace(/2?\.\s*recommendations?:?/i, '').trim();
                    console.log('✅ Found recommendations section (strategy 2)');
                }
            });
        }

        // Strategy 3: Split on "RECOMMENDATIONS" keyword
        if (!analysis || !recommendations) {
            const splitPoint = text.search(/RECOMMENDATIONS?:/i);
            if (splitPoint > 50) {
                analysis = text.substring(0, splitPoint).replace(/##?\s*1?\.\s*ANALYSIS:?/i, '').trim();
                recommendations = text.substring(splitPoint).replace(/##?\s*2?\.\s*RECOMMENDATIONS?:/i, '').trim();
                console.log('✅ Split on RECOMMENDATIONS keyword (strategy 3)');
            }
        }

        // Fallback: Use whole text as analysis
        if (!analysis) {
            analysis = text.trim();
            recommendations = 'Please review the analysis above for detailed recommendations.';
            console.log('⚠️ Using fallback parsing');
        }

        // Format as HTML
        analysis = this.formatTextToHTML(analysis);
        recommendations = this.formatTextToHTML(recommendations);

        console.log('✅ Parsing complete');
        
        return {
            analysis: analysis || '<p>Analysis not available.</p>',
            recommendations: recommendations || '<p>No specific recommendations provided.</p>'
        };
    }

    formatTextToHTML(text) {
        if (!text || text.trim() === '') return '<p>No content available.</p>';

        text = text.trim();

        // Remove incomplete sentences at the end
        if (!text.match(/[.!?]$/)) {
            const lastPeriod = Math.max(
                text.lastIndexOf('.'),
                text.lastIndexOf('!'),
                text.lastIndexOf('?')
            );
            
            if (lastPeriod > text.length * 0.5) {
                text = text.substring(0, lastPeriod + 1);
            }
        }

        // Split into paragraphs
        const paragraphs = text.split('\n\n').filter(p => p.trim());

        return paragraphs
            .map(p => {
                p = p.trim();
                
                // Convert bullet points to HTML list
                if (/^[-•*]\s/.test(p) || p.split('\n').some(l => /^[-•*]\s/.test(l))) {
                    const items = p.split('\n')
                        .filter(l => l.trim())
                        .map(l => l.replace(/^[-•*]\s*/, '').trim())
                        .filter(item => item.length > 0);
                    
                    if (items.length > 0) {
                        return '<ul class="list-disc pl-5 space-y-1 mb-3">' + 
                            items.map(item => `<li>${this.escapeHtml(item)}</li>`).join('') + 
                            '</ul>';
                    }
                }
                
                // Format bold text
                p = p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                p = p.replace(/__(.*?)__/g, '<strong>$1</strong>');
                
                return `<p class="mb-3">${this.escapeHtml(p)}</p>`;
            })
            .join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}