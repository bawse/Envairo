<div align="center">
  <img src="src/icons/logo.png" alt="Envairo Logo" width="120" />
  
  # Envairo - Sustainability Product Advisor
  
  **A Chrome extension for the Google Chrome Built-in AI Challenge 2025**
  
  🌱 **Automatically analyzes products for environmental impact** using on-device AI - no external APIs, complete privacy.
  
  ![Chrome Canary Required](https://img.shields.io/badge/Chrome-Canary%20128%2B-yellow)
  ![Gemini Nano](https://img.shields.io/badge/AI-Gemini%20Nano-blue)
  ![License](https://img.shields.io/badge/license-Open%20Source-green)
  
</div>

---

## Table of Contents

- [What is Envairo?](#what-is-envairo)
- [Features](#features)
- [How It Works](#how-it-works)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Sustainability Scoring](#sustainability-scoring)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Technical Architecture](#technical-architecture)
- [Design System](#design-system)
- [Version History](#version-history)
- [Contributing](#contributing)
- [License](#license)

---

## What is Envairo?

Envairo is a Chrome extension that helps consumers make informed, sustainable shopping decisions by analyzing product pages in real-time using Chrome's Built-in AI APIs (Gemini Nano). All analysis happens **100% on-device** with zero data sent to external servers.

### Why Envairo?

- **Combat greenwashing**: Get science-backed sustainability scores instead of marketing claims
- **Make informed choices**: Understand the environmental impact of your purchases
- **Privacy-first**: Your browsing data never leaves your device
- **Instant analysis**: Results in 5-10 seconds using on-device AI

### Built for Chrome Built-in AI Challenge 2025

This extension demonstrates the capabilities of Chrome's Prompt API and Summarizer API by combining AI-powered content extraction with research-backed environmental data to provide actionable sustainability insights.

---

## Features

### ✨ Core Features

- **📊 Sustainability Scoring**: Analyzes materials, certifications, and environmental impact with scores from 0-100
- **🧵 Material Analysis**: Identifies fabric composition, plastics, and recycled content with percentage breakdowns
- **🛡️ Certification Detection**: Recognizes GOTS, OEKO-TEX, Climate Pledge Friendly, GRS, and 20+ other certifications
- **💡 AI Recommendations**: Provides actionable, conversational sustainability advice
- **🎨 Beautiful UI**: iOS-inspired glass morphism design with smooth animations
- **🔒 100% Private**: All analysis happens on-device with Chrome's Built-in AI

### Currently Supported Sites

- **Amazon** (all domains: .com, .co.uk, .de, .fr, .ca, .in, .it, .es, .com.au, .co.jp)
- **Walmart** (walmart.com)
- Automatically detects product pages and hides overlay when navigating away

### Key Capabilities

- **Real-time Analysis**: Analyzes products as you browse (5-10 seconds)
- **Transparent Scoring**: See detailed breakdown of how scores are calculated
- **Material Database**: 200+ materials with research-backed environmental scores
- **Keyboard Shortcuts**: Quick toggle with `Cmd+Shift+Y` (Mac) or `Ctrl+Shift+Y` (Windows/Linux)
- **Product History**: Track and compare previously analyzed products
- **Draggable Overlay**: Position the results anywhere on the page

---

## How It Works

### 1. Detection & Extraction
When you visit a product page, Envairo:
- Detects if the page is a supported product
- Intelligently extracts relevant sections (materials, specs, certifications)
- Scores and prioritizes content based on sustainability relevance

### 2. AI Analysis (Chrome Prompt API)
The extracted content is analyzed using Chrome's Prompt API (Gemini Nano):
- Identifies materials and their percentages
- Detects environmental certifications
- Assesses durability features and packaging
- All processing happens on-device

### 3. Sustainability Scoring
A multi-factor score is calculated:
- **Material Score** (base): Weighted average using 200+ material GHG scores from ICE v3.0, PlasticsEurope, USLCI databases
- **Certification Bonus** (+5-15): GOTS (+10), OEKO-TEX (+8), GRS (+5), etc.
- **Durability Bonus** (+5-15): Warranty, rechargeable, reusable features
- **Packaging Bonus** (+2-8): Recycled, minimal, plastic-free packaging
- **Circularity Penalty** (-5 to -15): Non-recyclable materials, hazardous substances

### 4. Visual Display
Results appear in a beautiful glass morphism overlay showing:
- Overall score (0-100) with tier rating (A+, A, B, C, D)
- Material composition breakdown
- Certification badges
- Strengths and concerns
- AI-generated recommendations

---

## Quick Start

### Prerequisites

**Required:**
1. **Chrome Canary** (version 128.0.6545.0 or higher)
   - Download: https://www.google.com/chrome/canary/
2. **22 GB free storage** for Gemini Nano model download
3. **4GB+ GPU** recommended for optimal performance

### Setup (5 minutes)

#### Step 1: Enable Chrome AI Flags

```
1. Open chrome://flags/#prompt-api-for-gemini-nano
2. Set to "Enabled"
3. Open chrome://flags/#summarization-api-for-gemini-nano  
4. Set to "Enabled"
5. Relaunch Chrome Canary
```

#### Step 2: Download Gemini Nano Model

```
1. Open DevTools (F12)
2. Go to Console tab
3. Run: await ai.languageModel.create();
4. Navigate to chrome://components
5. Find "Optimization Guide On Device Model"
6. Click "Check for update" if not already downloading
7. Wait for download (10-30 minutes, ~22 GB)
8. Model status should show "Version: [number]" when complete
```

#### Step 3: Install Extension

```
1. Download or clone this repository
2. Open chrome://extensions/
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension folder (chrome-built-in)
```

#### Step 4: Verify Installation

Open DevTools console (F12) and run:
```javascript
await ai.languageModel.availability();  // Should return "readily"
```

If it returns `"readily"`, you're all set! 🎉

---

## Usage

### Automatic Analysis

1. Visit any supported product page (e.g., Amazon product)
2. Extension automatically analyzes in ~5-10 seconds
3. Sustainability overlay appears in bottom-right corner
4. Review score, materials, certifications, and recommendations

### Manual Toggle

- **Keyboard**: Press `Cmd+Shift+Y` (Mac) or `Ctrl+Shift+Y` (Windows/Linux)
- **Extension Icon**: Click the Envairo icon in the toolbar → "Toggle Overlay"

### Interacting with the Overlay

- **Drag**: Click and hold the grip icon (top-left) to reposition
- **Close**: Click the X button or press `Esc`
- **Scroll**: Use mouse wheel to scroll through content if needed

### Understanding the Results

**Score Ring**: Shows overall sustainability score (0-100) with color coding:
- 🟢 **90-100 (A+)**: Excellent - minimal environmental impact
- 🟢 **75-89 (A)**: Good - better than average
- 🟡 **60-74 (B)**: Fair - average impact
- 🟠 **40-59 (C)**: Concerning - significant impact
- 🔴 **0-39 (D)**: Poor - high environmental impact

**Breakdown Card**: Shows component scores:
- Material Score (base)
- Certification Bonus
- Durability Bonus
- Packaging Bonus
- Circularity Penalty

**Materials Card**: Lists detected materials with:
- Percentage composition
- Individual sustainability scores
- Recyclability status

**Certifications**: Environmental certifications detected (GOTS, OEKO-TEX, etc.)

**Insights**: Key strengths and concerns in badge format

**Recommendations**: AI-generated actionable advice tailored to the product

### Extension Popup

Click the Envairo icon to access:
- **Product History**: View previously analyzed products (up to 50)
- **Statistics**: Total products analyzed and average score
- **Quick Toggle**: Manual overlay toggle button
- **Settings**: Clear history

---

## Sustainability Scoring

### Scoring Methodology

Envairo uses a **hybrid AI + science approach** combining:
1. Research-backed material GHG scores from credible databases
2. AI-powered context analysis for certifications, durability, and packaging
3. Transparent calculation showing all components

### Scoring Formula

```
Final Score = Base Material Score + Bonuses - Penalties
(Capped at 0-100)
```

### Score Components

#### 1. Base Material Score (60-80% weight)

Calculated as weighted average of material composition:

```
Material Score = Σ (material_percentage × reference_score)
```

**Example:**
- Product: 92% Organic Cotton, 8% Elastane
- Calculation: (0.92 × 97.6) + (0.08 × 87.3) = 96.6

**Material Database**: 200+ materials with scores based on:
- **ICE v3.0**: Inventory of Carbon & Energy database
- **PlasticsEurope**: Eco-profiles for polymers
- **USLCI**: US Life Cycle Inventory database
- **OWID**: Our World in Data (food products, Poore & Nemecek 2018)

Each material score is calculated from cradle-to-gate GHG emissions (kgCO2e per kg).

#### 2. Certification Bonus (up to +15 points)

| Certification | Points | Description |
|--------------|--------|-------------|
| GOTS | +10 | Global Organic Textile Standard |
| Cradle to Cradle | +8 | Circular design principles |
| OEKO-TEX 100 | +8 | Harmful substance testing |
| Fair Trade | +7 | Worker welfare & sustainability |
| Climate Pledge Friendly | +5 | Carbon reduction commitment |
| GRS | +5 | Global Recycled Standard |
| Nordic Swan / EU Ecolabel | +5 | European eco-labels |
| FSC / PEFC | +5 | Sustainable forestry |
| Energy Star | +3 | Energy efficiency |

**Maximum**: +15 points total (even if more certifications exist)

#### 3. Durability Bonus (up to +10 points)

| Feature | Points | Rationale |
|---------|--------|-----------|
| Lifetime warranty | +10 | Manufacturer confidence |
| Warranty >5 years | +8 | Above-average durability |
| Rechargeable | +8 | Reduces battery waste |
| Reusable | +8 | Eliminates single-use waste |
| Refillable | +6 | Reduces packaging waste |
| Warranty 2-5 years | +5 | Standard durability |
| Replaceable parts | +4 | Extends product life |

**Maximum**: +10 points total

#### 4. Packaging Bonus (up to +5 points)

| Feature | Points |
|---------|--------|
| Plastic-free | +5 |
| Compostable | +4 |
| Recyclable cardboard | +3 |
| Minimal packaging | +2 |
| Ships in own container | +2 |

**Maximum**: +5 points total

#### 5. Circularity Penalty (up to -10 points)

| Issue | Penalty |
|-------|---------|
| Non-recyclable major material | -5 |
| Single-use product | -5 |
| Hazardous substances | -3 |
| Non-recyclable composite | -3 |

**Maximum**: -10 points total

### Scoring Examples

**Example 1: Organic Cotton T-Shirt**
- Materials: 95% organic cotton (97.6), 5% elastane (87.3)
- Base: 96.8
- Certifications: GOTS +10, OEKO-TEX +8 = +15 (capped)
- Durability: Machine washable +5
- Packaging: Recyclable +3
- Penalty: Elastane not recyclable -2
- **Final: 96.8 + 15 + 5 + 3 - 2 = 117.8 → capped at 100 (A+)**

**Example 2: Virgin Plastic Water Bottle**
- Materials: 100% PET virgin (96.1)
- Base: 96.1
- Certifications: None
- Durability: None
- Packaging: Plastic wrap -2
- Penalty: Single-use -5
- **Final: 96.1 - 7 = 89 (A)** *(good material, poor usage pattern)*

### Data Sources & Limitations

**What the scores represent:**
- Screening-level GHG estimates (not product-specific LCAs)
- Cradle-to-gate scope (excludes use-phase and disposal)
- Regional variance exists (electricity mix, processes)

**Use for:**
- ✅ Relative comparisons between similar products
- ✅ Understanding environmental trade-offs
- ✅ Identifying certified products

**Do not use for:**
- ❌ Absolute environmental claims
- ❌ Carbon footprint accounting
- ❌ Regulatory compliance

---

## Development

### Local Setup

**Clone Repository:**
```bash
git clone <repository-url>
cd chrome-built-in
```

**File Structure:**
```
src/
├── core/                  # Core logic modules
│   ├── AIAnalyzer.js              # Prompt API integration
│   ├── ConfigLoader.js            # Site configuration management
│   ├── ContentExtractor.js        # Content extraction engine
│   └── SustainabilityAdvisor.js   # Main orchestrator
├── config/                # Site configurations
│   ├── schema.json
│   └── sites/
│       └── amazon.json            # Amazon extraction rules
├── data/                  # Environmental data
│   └── sustainability_matrix.csv  # 200+ materials with scores
├── utils/                 # Utility modules
│   ├── csvLoader.js               # CSV parsing
│   ├── icons.js                   # SVG icon library
│   └── uiComponents.js            # UI component builders
├── overlay.js             # Content script entry point
├── overlay.css            # Glass morphism styles
├── bg.js                  # Background service worker
├── popup.html/js          # Extension popup
└── icons/                 # Extension icons
```

### Development Workflow

**1. Make Changes:**
```bash
# Edit files in src/
# Most common: src/config/sites/*.json, src/core/*.js
```

**2. Reload Extension:**
```
1. Go to chrome://extensions/
2. Click refresh icon on Envairo
```

**3. Test Changes:**
```
1. Visit a product page
2. Open DevTools (F12)
3. Check Console for logs
4. Verify overlay displays correctly
```

**Hot Reload Tips:**
- Content scripts: Reload extension + hard refresh page (`Cmd+Shift+R`)
- Background worker: Reload extension only
- Popup: Close and reopen
- CSS: Hard refresh page

### Adding a New Site

Thanks to the configuration-driven architecture, adding new sites takes ~20-30 minutes:

**1. Create Config File:**
```json
// src/config/sites/walmart.json
{
  "id": "walmart-us",
  "name": "Walmart",
  "version": "1.0.0",
  "enabled": true,
  "detection": {
    "urlPatterns": [{
      "pattern": "https://www.walmart.com/ip/.*/(\\d+)",
      "productIdGroup": 1
    }]
  },
  "extraction": {
    "selectors": {
      "alwaysInclude": [
        {
          "selector": "#product-title",
          "label": "Product Title",
          "baseScore": 0.90,
          "priority": "critical"
        }
      ]
    },
    "keywords": {
      "materials": ["cotton", "polyester", "recycled"],
      "sustainability": ["organic", "eco-friendly", "sustainable"]
    }
  }
}
```

**2. Register in ConfigLoader:**
```javascript
// src/core/ConfigLoader.js
const siteConfigs = [
  'amazon.json',
  'walmart.json'  // Add this line
];
```

**3. Test:**
1. Reload extension
2. Visit Walmart product page
3. Check console for detection logs

### Testing

**Manual Testing Checklist:**

Visual Tests:
- [ ] Overlay appears in correct position
- [ ] Loading states display (extracting → analyzing)
- [ ] Score ring renders with correct color
- [ ] All sections populate with data
- [ ] Can drag overlay to reposition
- [ ] Close button works
- [ ] Toggle with keyboard shortcut works

Data Tests:
- [ ] Materials extracted correctly
- [ ] Percentages sum to 100%
- [ ] Certifications detected
- [ ] Scores calculated properly
- [ ] Tier (A+, A, B, C, D) matches score
- [ ] Recommendations are helpful

Edge Cases:
- [ ] Non-product pages show appropriate message
- [ ] Products with no material info handled
- [ ] Products with no certifications handled
- [ ] Multiple tabs don't interfere

**Console Testing:**

Expected output on product pages:
```
[AI Glass Overlay] Content script loaded
[SustainabilityAdvisor] Initializing...
[ConfigLoader] Loaded 1 site configuration(s)
[SustainabilityAdvisor] ✅ Product detected: Amazon (Global)
[ContentExtractor] Extracted 12 unique sections
[AIAnalyzer] Prompt API ready
[AIAnalyzer] 🤖 Prompting model...
[AIAnalyzer] ✅ Response received in 8.42s
[SustainabilityAdvisor] 🌱 SUSTAINABILITY SCORE: 78/100 (B)
[SustainabilityAdvisor] 🎉 Complete! Total time: 8.50s
```

**Accessing Stored Data:**
```javascript
// In DevTools console:
window.__sustainabilityAdvisorData

// Returns complete analysis result with:
// - materials, certifications, strengths, concerns
// - score breakdown, timing data
```

### Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Content Extraction | < 100ms | DOM queries + scoring |
| AI Analysis | 5-15s | First run: 15-30s (model init) |
| UI Rendering | < 100ms | Hardware-accelerated |
| **Total Time** | **5-15s** | User-facing metric |

---

## Troubleshooting

### Setup Issues

#### "AI not available"

**Symptoms:**
- Console shows "LanguageModel API not available"
- `ai.languageModel.availability()` returns `"no"`

**Solutions:**
1. Verify flags are enabled at `chrome://flags`
2. **Relaunch Chrome** (critical - flags require restart)
3. Try manual session creation: `await ai.languageModel.create()`
4. Check `chrome://components` for model download status

#### "Model is downloading"

**Symptoms:**
- Availability returns `"after-download"`
- Extension shows "Gemini Nano is downloading" message

**Solutions:**
1. Go to `chrome://components`
2. Find "Optimization Guide On Device Model"
3. Check download progress and status
4. Wait for completion (10-30 minutes for ~22 GB)
5. **Relaunch Chrome** after download completes

#### "Overlay doesn't appear"

**Debug Steps:**
```javascript
// 1. Check content script loaded
console.log('Content script check');

// 2. Check product detection
window._isProductPage  // Should be true on product pages

// 3. Check overlay host exists
document.getElementById('sustainability-overlay-host')

// 4. Check for JavaScript errors (red text in console)
```

**Solutions:**
1. Ensure you're on a product page (not search/homepage)
2. Check console for errors (F12)
3. Reload extension at `chrome://extensions/`
4. Hard refresh page (`Cmd+Shift+R` / `Ctrl+Shift+R`)

### Runtime Issues

#### Slow Analysis (>30s)

**Common Causes:**
- First analysis after browser restart (model initialization)
- Hardware limitations (CPU/GPU)
- Very large product pages

**Expected Performance:**
- First run: 15-30 seconds (model warmup)
- Subsequent runs: 5-15 seconds (normal)

**Check timing breakdown:**
```javascript
const data = window.__sustainabilityAdvisorData;
console.log('Extraction:', data.extractionTime, 's');
console.log('Analysis:', data.analysisTime, 's');
console.log('Total:', data.totalTime, 's');
```

#### Incorrect Materials Extracted

**Status:** ✅ Fixed in v1.0.5

This was a critical bug where AI would hallucinate materials (e.g., showing "zipper" or "button" as materials). Fixed with:
- Enhanced AI prompt with strict extraction rules
- Auto-validation and percentage normalization
- Multiple examples showing correct behavior

**If still occurs:**
1. Check console for material validation warnings
2. Report issue with product URL
3. Include screenshot of results

#### Styling Issues

**Symptoms:**
- Overlay looks broken
- Colors incorrect
- Layout problems

**Solutions:**
1. Verify Shadow DOM is working:
   ```javascript
   const host = document.getElementById('sustainability-overlay-host');
   host.shadowRoot  // Should exist
   ```
2. Clear browser cache
3. Hard refresh page
4. Check for CSS conflicts in console

### Chrome Version Issues

**Minimum Version:** Chrome Canary 128.0.6545.0+

**Check version:**
```
chrome://version
```

**If below minimum:**
1. Download latest Chrome Canary: https://www.google.com/chrome/canary/
2. Update if already installed
3. Enable flags and download model again

### Getting Help

If you encounter issues not covered here:

1. **Check Console**: Open DevTools (F12) and look for errors
2. **Review Logs**: Look for `[SustainabilityAdvisor]` and `[AIAnalyzer]` logs
3. **Test Product**: Try a different product page to isolate the issue
4. **File Issue**: Report bugs with:
   - Product URL
   - Console logs (screenshot)
   - Chrome version
   - Steps to reproduce

---

## Technical Architecture

For detailed technical documentation, see **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

### High-Level Overview

Envairo uses a **configuration-driven, modular architecture**:

```
┌─────────────────────────────────────────┐
│         Entry Point (overlay.js)        │
│  - Initializes on page load             │
│  - Handles UI state management          │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│   Orchestrator (SustainabilityAdvisor)  │
│  - Coordinates entire pipeline          │
│  - Manages state and error handling     │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
┌───────▼──┐  ┌───▼────┐  ┌──▼────────┐
│ Config   │  │Content │  │ AI        │
│ Loader   │  │Extract │  │ Analyzer  │
└──────────┘  └────────┘  └───────────┘
```

### Key Design Principles

1. **Separation of Concerns**: Logic (core/) separated from configuration (config/) and UI (utils/)
2. **Extensibility**: Add new sites by creating JSON configs (~30 minutes vs 4-8 hours with hardcoded approach)
3. **Testability**: Modular design allows for easy mocking and unit testing
4. **Privacy**: All processing happens on-device; zero external API calls

### Technology Stack

- **Chrome Built-in AI APIs**:
  - Prompt API (Gemini Nano) - Structured data extraction and analysis
  - Summarizer API - Content analysis (alternative approach)
- **ES6 Modules**: Modern JavaScript architecture with dynamic imports
- **Shadow DOM**: CSS isolation for overlay (prevents conflicts with page styles)
- **Configuration-Driven**: JSON-based site configs for easy extension

### Data Flow

1. **Page Load** → Content script injection
2. **URL Detection** → Match against site configs
3. **Content Extraction** → Intelligent section selection (4-5KB from 50-200KB pages)
4. **AI Analysis** → Prompt API with scoring matrix (200+ materials)
5. **Score Calculation** → Multi-factor sustainability score
6. **UI Display** → Glass morphism overlay with results

### Performance Optimizations

- **Targeted Extraction**: Extract only 4-5KB of most relevant content (70% faster)
- **Single AI Call**: Unified extraction + scoring in one Prompt API call
- **Efficient Scoring**: Hash map lookups for material scores
- **Hardware-Accelerated UI**: CSS animations with `will-change` and `transform`
- **Lazy Loading**: Dynamic imports for code modules

---

## Design System

Envairo uses an **iOS-inspired glass morphism design** with neutral, premium aesthetics.

### Visual Identity

**Design Language:** Liquid Glass
- Translucent, blurred surfaces (frosted glass effect)
- Soft shadows and subtle gradients
- Smooth, hardware-accelerated animations
- Neutral color palette with accent colors for actions

### Color System

```css
/* Core Colors */
--glass-bg: rgba(255,255,255,0.18);
--glass-stroke: rgba(255,255,255,0.50);
--text-strong: #0b0f13;
--text-weak: rgba(11,15,19,0.64);

/* Accent Colors */
--accent-blue: rgba(60,130,255,0.55);    /* Primary actions */
--accent-green: rgba(46,184,76,0.50);    /* Success, confirmation */
--accent-red: rgba(255,59,48,0.5);       /* Errors, warnings */
```

### Glass Morphism Effect

```css
/* Core glass effect */
background: rgba(255,255,255,0.18);
backdrop-filter: blur(24px) saturate(180%);
-webkit-backdrop-filter: blur(24px) saturate(180%);
border: 1px solid rgba(255,255,255,0.5);
border-radius: 22px;
box-shadow: 0 22px 60px rgba(0,0,0,0.22);
```

### Typography

**Font Stack:**
```css
font-family: ui-sans-serif, system-ui, -apple-system, 
             Segoe UI, Roboto, "Helvetica Neue", Arial;
```

**Type Scale:**
- H1: 19px / 800 weight
- H2: 17px / 800 weight
- Body: 14px / 500 weight
- Small: 13px / 500 weight

### UI Components

**Score Ring**: Circular SVG progress indicator with gradient colors
- Green (90-100): Excellent
- Light green (75-89): Good
- Yellow (60-74): Fair
- Orange (40-59): Concerning
- Red (0-39): Poor

**Cards**: Glass panels with rounded corners (22px radius)
**Badges**: Compact pills with color-coded backgrounds
**Buttons**: Glass surface with hover lift effect
**Inputs**: Glass surface with focus glow

### Animations

- **Timing**: 0.25s ease for most transitions, 0.08s for transform
- **Loading**: Shimmer effect on skeleton screens
- **Entrance**: Staggered fade-in for overlay sections
- **Hover**: Subtle lift (translateY -1px)

### Accessibility

- **Keyboard Navigation**: Full support with visible focus indicators
- **Color Contrast**: Minimum 4.5:1 ratio for text
- **Reduced Motion**: Respects `prefers-reduced-motion` preference
- **Screen Readers**: Semantic HTML with ARIA labels where needed

---

## Version History

### v1.0.5 - Phase 5 (October 8, 2025) ✅ **Current**

**Added:**
- Complete sustainability overlay UI with glass morphism design
- Circular score ring with animated progress
- Score breakdown cards, material visualization, certification badges
- Insights section (strengths & concerns as badges)
- AI-generated recommendations
- Drag-and-drop overlay positioning
- Keyboard toggle (`Cmd+Shift+Y`)
- Icon library (15+ inline SVG icons, SF Symbols style)
- UI component system with loading states and error handling

**Fixed:**
- **Critical:** Material hallucination bug (AI inventing materials not mentioned)
- **Critical:** Percentage format issues ("10000%" → "100%")
- Overlay auto-display on non-product pages
- Toggle keyboard shortcut on non-product pages

**Performance:**
- Extraction: ~50-100ms
- AI Analysis: ~5-15s (first run: 15-30s)
- UI Rendering: <100ms

### v1.0.4 - Phase 4 (October 7, 2025)

**Added:**
- Sustainability scoring algorithm with 200+ material database
- Structured data extraction using Prompt API
- JSON response parsing with validation
- Material composition with percentages
- Certification detection (GOTS, OEKO-TEX, GRS, etc.)
- Strengths, concerns, and AI recommendations
- Multi-factor scoring (materials, certifications, durability, packaging, circularity)

### v1.0.3 - Phase 3 (October 6, 2025)

**Added:**
- Chrome Prompt API integration
- CSV loader for sustainability matrix
- Structured JSON output format
- Percentage normalization (0-1 vs 0-100 auto-detection)
- Material validation and consistency checks

### v1.0.2 - Phase 2.5 (October 5, 2025)

**Architecture Overhaul:**
- Configuration-driven system (logic separated from config)
- JSON-based site configs
- Core modules: ConfigLoader, ContentExtractor, AIAnalyzer, SustainabilityAdvisor
- Code reduction: overlay.js 1,188 → 427 lines (64% reduction)

**Benefits:**
- Add new sites in 20-30 minutes (vs 4-8 hours)
- Update selectors via JSON (no code changes)
- Community-friendly (non-coders can contribute configs)

### v1.0.1 - Phase 2 (October 4, 2025)

**Added:**
- Intelligent content extraction with two-tier approach
- Scoring system for section relevance
- Pattern matching for materials
- Deduplication algorithm
- Targeted extraction (4-5KB vs 50-200KB)

**Performance:**
- 70% faster execution (15-30s → 5-10s)

### v1.0.0 - Phase 1 (October 3, 2025)

**Initial Release:**
- Basic AI integration with Chrome Prompt API
- Full-page content extraction
- Manifest V3 extension structure
- Content script injection
- Background service worker
- Extension popup UI
- Glass morphism design system

---

## Contributing

### How to Contribute

1. **Report Bugs**: File issues with product URL, console logs, and reproduction steps
2. **Suggest Features**: Open discussions for new feature ideas
3. **Add Site Configs**: Contribute JSON configs for new e-commerce sites
4. **Improve Documentation**: Fix typos, add examples, clarify instructions
5. **Code Improvements**: Submit pull requests for bug fixes or enhancements

### Code Style

- Modern ES6+ JavaScript
- Async/await over promises
- Template literals for strings
- Destructuring for objects
- JSDoc comments for functions

### Pull Request Guidelines

**Format:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Performance improvement
- [ ] Documentation update

## Testing
- Tested on: [list products/pages]
- Edge cases considered: [list]
- Performance impact: [describe]
```

### Adding New Sites

See [Development → Adding a New Site](#adding-a-new-site) for detailed instructions.

**Estimated Time:** 20-30 minutes per site

---

## License

Open source for educational and hackathon purposes.

**Built for:** Google Chrome Built-in AI Challenge 2025

---

## Resources

### Official Documentation

- **Chrome AI Challenge**: https://googlechromeai2025.devpost.com/
- **Prompt API Docs**: https://developer.chrome.com/docs/ai/prompt-api
- **Summarizer API Docs**: https://developer.chrome.com/docs/ai/summarizer-api
- **Chrome AI Preview**: https://developer.chrome.com/docs/ai/built-in
- **Manifest V3**: https://developer.chrome.com/docs/extensions/mv3/

### Data Sources

- **ICE v3.0**: Inventory of Carbon & Energy database
- **PlasticsEurope**: Eco-profiles for polymers
- **USLCI**: US Life Cycle Inventory database
- **OWID**: Our World in Data (environmental impacts of food)

### Tools

- **Chrome DevTools**: F12 or Cmd+Option+I
- **Extension Management**: `chrome://extensions/`
- **Component Status**: `chrome://components/`
- **Flag Settings**: `chrome://flags/`

---

## Acknowledgments

**Chrome AI Team**: For building and documenting the Built-in AI APIs

**Environmental Data Sources**: ICE Database, PlasticsEurope, NREL (USLCI), Our World in Data

**Design Inspiration**: iOS design language and glass morphism aesthetics

---

**Last Updated**: October 13, 2025  
**Version**: 1.0.5  
**Status**: Production-Ready ✅

**Built with ❤️ for Chrome Built-in AI Challenge 2025**

*Envairo helps you make informed, sustainable shopping decisions.*
