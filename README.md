# Envairo - Sustainability Product Advisor

**A Chrome extension demonstrating Chrome's Built-in AI APIs for the Google Chrome Built-in AI Challenge 2025**

🌱 **Automatically analyzes products for environmental impact** using on-device AI - no external APIs, complete privacy.

![Chrome Canary Required](https://img.shields.io/badge/Chrome-Canary%20128%2B-yellow)
![Gemini Nano](https://img.shields.io/badge/AI-Gemini%20Nano-blue)
![License](https://img.shields.io/badge/license-Open%20Source-green)

---

## ✨ Features

- 📊 **Sustainability Scoring**: Analyzes materials, certifications, and environmental impact
- 🧵 **Material Analysis**: Identifies fabric composition, plastics, and recycled content
- 🛡️ **Certification Detection**: Recognizes GRS, OEKO-TEX, Climate Pledge, and more
- 💡 **AI Recommendations**: Provides actionable sustainability advice
- 🎨 **Beautiful UI**: iOS-inspired glass morphism design
- 🔒 **100% Private**: All analysis happens on-device with Chrome's Built-in AI

### Currently Supported

- **Amazon** (all domains: .com, .co.uk, .de, .fr, .ca, .in, .it, .es, .com.au, .co.jp)
- Automatically detects product pages and analyzes sustainability

---

## 🚀 Quick Start

### Prerequisites

1. **Chrome Canary** (version 128.0.6545.0+)
   - Download: https://www.google.com/chrome/canary/
2. **22 GB free storage** (for Gemini Nano model)
3. **Enable AI flags**

### Setup (5 minutes)

#### 1. Enable Chrome AI APIs

```
1. Open chrome://flags/#prompt-api-for-gemini-nano
2. Set to "Enabled"
3. Open chrome://flags/#summarization-api-for-gemini-nano  
4. Set to "Enabled"
5. Relaunch Chrome
```

#### 2. Download Gemini Nano

```
1. Open DevTools (F12)
2. Run: await ai.languageModel.create();
3. Go to chrome://components
4. Find "Optimization Guide On Device Model"
5. Wait for download (10-30 minutes, ~22 GB)
```

#### 3. Install Extension

```
1. Download or clone this repository
2. Open chrome://extensions/
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the extension folder
```

### Verify Setup

Open DevTools console and run:
```javascript
await ai.languageModel.availability();  // Should return "readily"
```

---

## 📖 Usage

### Automatic Analysis

1. Visit any supported product page (e.g., Amazon product)
2. Extension automatically analyzes in ~5-10 seconds
3. Sustainability overlay appears in bottom-right corner
4. View score, materials, certifications, and recommendations

### Manual Toggle

- Press `Cmd+Shift+Y` (Mac) or `Ctrl+Shift+Y` (Windows/Linux) to toggle overlay
- Drag overlay to reposition
- Click X to close

### Features

- **Score Ring**: Overall sustainability score (0-100) with letter grade
- **Breakdown**: Component scores for materials, certifications, durability, etc.
- **Materials**: Composition breakdown with sustainability ratings
- **Certifications**: Detected environmental certifications
- **Insights**: Key strengths and concerns
- **Recommendations**: AI-generated actionable advice

---

## 🏗️ Architecture

### Configuration-Driven Design

The extension uses a **modular, configuration-driven architecture** that separates logic from data:

```
chrome-built-in/
├── manifest.json               # Extension configuration
├── src/
│   ├── core/                   # Reusable logic modules
│   │   ├── AIAnalyzer.js       # AI analysis with Prompt API
│   │   ├── ConfigLoader.js     # Site configuration management
│   │   ├── ContentExtractor.js # Intelligent content extraction
│   │   └── SustainabilityAdvisor.js # Main orchestrator
│   ├── config/                 # Site configurations (JSON)
│   │   └── sites/
│   │       └── amazon.json     # Amazon extraction rules
│   ├── data/                   # Sustainability scoring matrix
│   │   └── sustainability_matrix.csv
│   ├── utils/                  # UI components and helpers
│   │   ├── icons.js
│   │   ├── uiComponents.js
│   │   └── csvLoader.js
│   ├── overlay.js              # Content script entry point
│   ├── overlay.css             # Glass morphism styles
│   ├── bg.js                   # Background service worker
│   ├── popup.html/js           # Extension settings
│   └── icons/                  # Extension assets
├── docs/                       # Documentation
└── ideas/                      # Future feature concepts
```

### How It Works

1. **Detection**: Matches URL against site configs
2. **Extraction**: Intelligently extracts relevant product sections
3. **Analysis**: Chrome's Prompt API analyzes for sustainability
4. **Scoring**: Calculates scores using research-based matrix
5. **Display**: Beautiful iOS-inspired overlay shows results

**See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical details.**

---

## 🛠️ Development

### Adding a New Site

Thanks to the configuration-driven architecture, adding new sites is easy:

1. Create `src/config/sites/yoursite.json`
2. Define URL patterns, selectors, keywords
3. Register in `ConfigLoader.js`
4. Test!

**Time required**: ~20-30 minutes (vs 4-8 hours with hardcoded approach)

### Testing

```bash
# Reload extension
chrome://extensions/ → Click refresh

# Test on product pages
# Check console for detailed logs
```

**See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for full guide.**

---

## 📊 Technology Stack

- **Chrome Built-in AI APIs**:
  - Prompt API (Gemini Nano) - Structured data extraction
  - Summarizer API - Content analysis
- **ES6 Modules**: Modern JavaScript architecture
- **Shadow DOM**: CSS isolation
- **Configuration-Driven**: JSON-based site configs

### AI Usage

- **100% On-Device**: No data sent to servers
- **Privacy-First**: Your browsing stays private
- **Fast**: 5-10 second analysis
- **Offline-Capable**: Works without internet (after model download)

---

## 📚 Documentation

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Technical architecture and data flow
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Development guide and testing
- **[docs/CHANGELOG.md](docs/CHANGELOG.md)** - Bug fixes and enhancements
- **[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** - UI design system
- **[docs/SCORING.md](docs/SCORING.md)** - Sustainability scoring methodology

---

## 🐛 Troubleshooting

### "AI not available"
1. Check flags are enabled at `chrome://flags`
2. Verify model downloaded at `chrome://components`
3. Relaunch Chrome after enabling flags

### "Overlay doesn't appear"
1. Make sure you're on a product page (not search/homepage)
2. Check console for errors (F12)
3. Reload extension at `chrome://extensions/`

### "Slow analysis"
- First analysis: 15-30 seconds (model initialization)
- Subsequent: 5-10 seconds (normal)
- Gemini Nano runs on-device, speed varies by hardware

**See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#troubleshooting) for more help.**

---

## 🎯 Roadmap

- [x] Phase 1: Basic AI integration
- [x] Phase 2: Intelligent extraction
- [x] Phase 2.5: Configuration-driven architecture
- [x] Phase 3: Structured data extraction
- [x] Phase 4: Sustainability scoring
- [x] Phase 5: Visual overlay UI
- [ ] Phase 6: Multi-site support (eBay, Walmart, Target)
- [ ] Phase 7: Browser extension store release

**See [ideas/](ideas/) for future feature concepts.**

---

## 🤝 Contributing

This project is open source for the Chrome Built-in AI Challenge 2025!

- **Add new sites**: Create site configs in `src/config/sites/`
- **Improve scoring**: Update `src/data/sustainability_matrix.csv`
- **Report bugs**: Open an issue with details

---

## 📜 License

Open source for educational and hackathon purposes.

---

## 🔗 Resources

- **Chrome AI Challenge**: https://googlechromeai2025.devpost.com/
- **Prompt API Docs**: https://developer.chrome.com/docs/ai/prompt-api
- **Summarizer API Docs**: https://developer.chrome.com/docs/ai/summarizer-api
- **Chrome AI Preview**: https://developer.chrome.com/docs/ai/built-in

---

**Built with ❤️ for Chrome Built-in AI Challenge 2025**

*Envairo helps you make informed, sustainable shopping decisions.*
