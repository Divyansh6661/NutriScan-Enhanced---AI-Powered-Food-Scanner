# 🥗 NutriScan Enhanced - AI-Powered Food Scanner

A comprehensive web application for real-time barcode scanning and AI-powered nutritional analysis with personalized health insights, dietary compatibility checking, and goal tracking.[View Live Application](https://health-nutriscan.netlify.app/)

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🌟 Features

### Core Functionality
- **📱 Real-Time Barcode Scanning** - Camera-based scanning using QuaggaJS
- **🤖 AI-Powered Analysis** - Gemini AI integration for detailed nutritional insights
- **📊 Health Score Calculation** - Multi-factor scoring algorithm
- **🥑 Dietary Profile Support** - Vegan, vegetarian, gluten-free, keto, paleo, halal, kosher
- **⚠️ Allergy Detection** - 9 major allergen categories with severity levels
- **🎯 Goal Tracking** - Daily/weekly tracking for calories, sugar, sodium
- **📦 Offline Mode** - Caches up to 50 products for offline access
- **📈 Statistics Dashboard** - Weekly/monthly analytics and insights

### Technical Features
- **🔄 API Retry Logic** - Exponential backoff for failed requests
- **🎥 Smart Camera Handling** - Comprehensive permission and error management
- **💾 Local Storage Management** - Efficient caching with quota handling
- **🎨 Modern UI** - Responsive design with Tailwind CSS
- **⚡ Modular Architecture** - 20+ separated JavaScript modules

## 📁 Project Structure

```
nutriscan-enhanced/
│
├── index.html                 # Main HTML file
├── README.md                  # This file
│
├── css/
│   ├── main.css              # Main styles
│   ├── scanner.css           # Scanner-specific styles
│   └── components.css        # Reusable component styles
│
├── js/
│   ├── app.js                # Main application logic
│   ├── config.js             # Configuration constants
│   │
│   ├── api/
│   │   ├── ProductAPI.js     # OpenFoodFacts API handler
│   │   ├── GeminiAPI.js      # Gemini AI API handler
│   │   └── APIRetry.js       # Retry logic for API calls
│   │
│   ├── scanner/
│   │   ├── BarcodeScanner.js # QuaggaJS barcode scanner
│   │   └── CameraHandler.js  # Camera permissions & errors
│   │
│   ├── analytics/
│   │   ├── HealthScore.js    # Health score calculator
│   │   ├── DietaryAnalyzer.js # Dietary restrictions checker
│   │   ├── AllergyDetector.js # Allergy warning system
│   │   └── GoalTracker.js    # Dietary goal tracking
│   │
│   ├── storage/
│   │   ├── LocalStorage.js   # localStorage wrapper
│   │   ├── HistoryManager.js # Scan history management
│   │   └── OfflineCache.js   # Offline data caching
│   │
│   └── ui/
│       ├── UIManager.js      # UI state management
│       ├── TabManager.js     # Tab switching logic
│       ├── StatsDisplay.js   # Statistics visualization
│       └── Notifications.js  # Toast/alert notifications
│
├── data/
│   ├── allergens.json        # Common allergens database
│   ├── dietary-restrictions.json # Dietary profiles
│   └── ingredient-db.json    # Ingredient categorization
│
└── assets/
    ├── icons/                # App icons
    └── images/               # UI images
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Gemini API key (free from [Google AI Studio](https://makersuite.google.com/app/apikey))
- Camera access for barcode scanning (optional)

### Installation

1. **Clone or Download** the project files
```bash
git clone https://github.com/yourusername/nutriscan-enhanced.git
cd nutriscan-enhanced
```

2. **Open `index.html`** in your browser
```bash
# Using Python HTTP server
python -m http.server 8000

# Using Node.js http-server
npx http-server

# Or simply open index.html in your browser
```

3. **Configure API Keys**
   - Click the Settings icon (⚙️) in the top right
   - Enter your Gemini API key
   - Click "Test API Connection" to verify
   - Click "Save Settings"

4. **Set Up Your Profile**
   - Select your dietary profile (vegan, keto, etc.)
   - Check any allergens you have
   - Set your daily nutritional goals
   - Save settings

### Getting API Keys

#### Gemini AI API (Required for AI Analysis)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in NutriScan settings

#### OpenFoodFacts API (Optional)
- No API key required for basic usage
- Rate limited to reasonable usage
- Data is pulled from the free OpenFoodFacts database

## 📖 Usage Guide

### Scanning a Product

**Method 1: Camera Scanning**
1. Click "Start Camera"
2. Allow camera access when prompted
3. Point camera at barcode
4. Product automatically detected and analyzed

**Method 2: Manual Entry**
1. Enter barcode in the text field
2. Click "Lookup Product"
3. Results displayed immediately

### Understanding Results

#### Health Score (0-100)
- **80-100**: Excellent - Great nutritional profile
- **60-79**: Good - Suitable for regular consumption
- **40-59**: Moderate - Consume with consideration
- **0-39**: Lower - Limit consumption frequency

#### Allergen Warnings
- 🔴 **Red Alert**: Contains allergens you've marked
- 🟡 **Yellow**: Contains common allergens
- 🟢 **Green**: No detected allergens

#### Dietary Compatibility
- ✅ **Compatible**: Fits your dietary profile
- ⚠️ **Warning**: May have concerning ingredients
- ❌ **Not Compatible**: Contains forbidden ingredients

#### Goal Impact
Shows how the product affects your daily goals:
- Calories, Sugar, Sodium progress
- Warnings when approaching limits
- Recommendations for balanced nutrition

### Viewing Statistics

1. Click "Statistics" in the navigation
2. View daily progress toward goals
3. See weekly scanning activity
4. Track average health scores

### Managing History

- Automatically saves all scanned products
- Search history by name, brand, or barcode
- Export history as JSON
- Import previous backups

## 🛠️ Configuration

### `js/config.js` Options

```javascript
const CONFIG = {
    API: {
        RETRY_ATTEMPTS: 3,        // Number of retry attempts
        RETRY_DELAY: 1000,        // Initial delay (ms)
        TIMEOUT: 10000            // Request timeout (ms)
    },
    
    HEALTH_SCORE: {
        EXCELLENT: 80,
        GOOD: 60,
        MODERATE: 40
    }
    
    // ... more options
};
```

### Supported Dietary Profiles
- Standard
- Vegan
- Vegetarian
- Gluten-Free
- Dairy-Free
- Keto
- Paleo
- Halal
- Kosher

### Tracked Allergens
- Milk
- Eggs
- Fish
- Shellfish
- Tree Nuts
- Peanuts
- Wheat
- Soybeans
- Sesame

## 🎨 Customization

### Styling
Edit CSS files in the `css/` directory:
- `main.css` - General application styles
- `scanner.css` - Scanner-specific styles
- `components.css` - Reusable UI components

### Adding Dietary Profiles
Edit `js/analytics/DietaryAnalyzer.js`:
```javascript
loadDietaryRules() {
    return {
        'your-profile': {
            forbidden: ['ingredient1', 'ingredient2'],
            warning: ['may contain x']
        }
    };
}
```

### Customizing Health Score
Edit `js/analytics/HealthScore.js` to adjust scoring factors.

## 🔧 Troubleshooting

### Camera Not Working
**Problem**: "Camera access denied" or black screen

**Solutions**:
- Check browser permissions (usually in address bar)
- Try HTTPS (camera requires secure context)
- Test in different browser
- Use manual barcode entry instead

### API Errors
**Problem**: "API test failed" or "Product lookup failed"

**Solutions**:
- Verify API key is correct
- Check internet connection
- Try again (automatic retry enabled)
- Check browser console for details

### Offline Mode Issues
**Problem**: Products not loading offline

**Solutions**:
- Scan products while online first (auto-cached)
- Clear cache if corrupted: Settings → Clear Data
- Check storage quota in browser settings

### Storage Full
**Problem**: "QuotaExceededError" in console

**Solutions**:
- App automatically clears old data
- Manually clear history: Settings → Clear History
- Export important data before clearing

## 📱 Browser Compatibility

| Browser | Version | Camera | Offline | Notes |
|---------|---------|--------|---------|-------|
| Chrome | 90+ | ✅ | ✅ | Recommended |
| Firefox | 88+ | ✅ | ✅ | Full support |
| Safari | 14+ | ✅ | ✅ | iOS 14+ |
| Edge | 90+ | ✅ | ✅ | Chromium-based |

## 🔒 Privacy & Security

- **Local Storage Only**: All data stored on your device
- **No Server Uploads**: Product data fetched from public APIs
- **API Keys Secured**: Stored locally, never transmitted
- **No Tracking**: No analytics or user tracking
- **Open Source**: Fully auditable code

## 🚧 Roadmap

### Planned Features
- [ ] PWA support with offline-first architecture
- [ ] Barcode generation for custom products
- [ ] Recipe analysis (multiple products)
- [ ] Shopping list integration
- [ ] Product comparison tool
- [ ] Export reports as PDF
- [ ] Voice command scanning
- [ ] Multi-language support

### Known Limitations
- Camera only works on HTTPS (security requirement)
- OpenFoodFacts database coverage varies by region
- Gemini AI requires API key (free tier available)
- LocalStorage limited to ~5-10MB per domain

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional dietary profiles
- Enhanced ingredient analysis
- UI/UX improvements
- Mobile optimization
- Performance enhancements

## 📄 License

MIT License - feel free to use in your projects!

## 🙏 Acknowledgments

- **OpenFoodFacts** - Free food products database
- **Google Gemini AI** - AI-powered analysis
- **QuaggaJS** - Barcode scanning library
- **Tailwind CSS** - Utility-first CSS framework

## 📞 Support

Having issues? 
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review browser console for errors
3. Try manual barcode entry as fallback
4. Open an issue on GitHub

## 📊 Resume Highlight

**Perfect for showcasing:**
- Modern JavaScript architecture (ES6+)
- API integration and error handling
- Real-time data processing
- User-centric design
- Offline-first development
- AI/ML integration

---

**Built with ❤️ for healthier food choices**

*Last updated: January 2025*
