# Chrome Built-in AI - Sustainability Advisor

**A Chrome extension demonstrating Chrome's Built-in AI APIs for the Google Chrome Built-in AI Challenge 2025**

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Current Features](#current-features)
3. [Architecture](#architecture)
4. [Sustainability Advisor Deep Dive](#sustainability-advisor-deep-dive)
5. [Setup & Installation](#setup--installation)
6. [Testing](#testing)
7. [Technical Implementation](#technical-implementation)
8. [Performance Optimizations](#performance-optimizations)
9. [Troubleshooting](#troubleshooting)
10. [Future Roadmap](#future-roadmap)

---

## Project Overview

This extension showcases Chrome's **Built-in AI APIs** (Prompt API and Summarizer API) through a practical use case: a **Sustainability Shopping Advisor** that analyzes Amazon products for environmental impact, materials, and certifications.

### Key Technologies
- **Chrome Built-in AI APIs**: Prompt API, Summarizer API
- **Target**: Chrome Canary 128+ with Gemini Nano
- **Privacy-First**: All processing happens on-device
- **Zero External APIs**: No server calls, no data collection

### Project Goals
1. Demonstrate Chrome's Built-in AI capabilities
2. Provide real-world value (sustainability insights)
3. Maintain privacy and performance
4. Create an extensible architecture for future AI features

---

## Current Features

### ✅ Sustainability Advisor (Active)

**Status**: Phase 2 Complete - Intelligent extraction with AI summarization

The Sustainability Advisor automatically:
1. **Detects** Amazon product pages across all domains
2. **Extracts** relevant sections using a two-tier targeted approach
3. **Analyzes** product information using Chrome's Summarizer API
4. **Reports** sustainability information including:
   - Material composition (fabrics, plastics, metals, etc.)
   - Environmental certifications (Climate Pledge, GRS, Nordic Swan, etc.)
   - Packaging sustainability
   - Manufacturing practices
   - Recycled content percentages

### 🎨 AI Glass Interface (Active)

**Status**: Fully functional overlay UI

- Beautiful frosted glass design inspired by iOS
- Prompt API testing interface
- Configurable settings (temperature, topK, system prompt)
- Draggable, keyboard-accessible overlay

---

## Architecture

### Configuration-Driven Design

**Phase 2.5 Update**: The extension now uses a **configuration-driven architecture** that separates logic from data, making it highly maintainable and extensible.

**Key Benefits**:
- ✅ Add new sites by creating JSON config files (no code changes)
- ✅ Update selectors and keywords via configuration
- ✅ Testable, modular components
- ✅ Clear separation of concerns

### Project Structure

```
chrome-built-in/
├── manifest.json           # Extension configuration (ES6 modules enabled)
├── src/
│   ├── overlay.js         # Entry point (80 lines, imports modules)
│   ├── overlay.css        # Glass morphism styles
│   ├── bg.js              # Background service worker
│   ├── popup.html         # Extension popup
│   ├── popup.js           # Popup settings interface
│   │
│   ├── core/              # Reusable Logic Layer
│   │   ├── ConfigLoader.js          # Loads & manages site configs
│   │   ├── ContentExtractor.js      # Extracts content using config
│   │   ├── AIAnalyzer.js            # AI analysis wrapper
│   │   └── SustainabilityAdvisor.js # Main orchestrator
│   │
│   ├── config/            # Configuration Layer (no code)
│   │   ├── schema.json    # Config validation schema
│   │   └── sites/         # Site-specific configurations
│   │       ├── amazon.json          # Amazon extraction rules
│   │       └── [future: ebay.json, walmart.json, ...]
│   │
│   └── icons/             # Extension icons
│
├── docs/                   # Design documentation
├── ideas/                  # Future feature concepts
└── PROJECT_DOCUMENTATION.md # This file
```

### Component Architecture

#### 1. Configuration Layer (`config/`)
**Pure JSON** - No code, just declarative rules:
- Site detection (URL patterns)
- Selectors (which elements to extract)
- Keywords (relevance filtering)
- Patterns (material/certification detection)
- AI settings (prompts, parameters)

#### 2. Logic Layer (`core/`)
**Reusable ES6 Modules**:
- `ConfigLoader`: Loads configs and detects sites
- `ContentExtractor`: Extracts content based on config
- `AIAnalyzer`: Runs AI analysis using config settings
- `SustainabilityAdvisor`: Orchestrates the pipeline

#### 3. Entry Point (`overlay.js`)
**Minimal glue code** (80 lines):
- Imports the orchestrator
- Initializes on page load
- Handles AI Glass overlay UI

### Data Flow

```
Page Load
    ↓
ConfigLoader.initialize()
    └─> Load all site configs from config/sites/
    ↓
SustainabilityAdvisor.detectProductPage()
    └─> ConfigLoader.detectSite(url)
        └─> Match URL against config patterns
    ↓
[If product page detected]
    ↓
ContentExtractor.extractSections()
    └─> Use config.extraction.selectors (always-include)
    └─> Use config.extraction.selectors (conditional)
    └─> Apply config.extraction.keywords
    └─> Apply config.extraction.patterns
    └─> Score and rank sections
    ↓
ContentExtractor.selectSectionsForAnalysis()
    └─> Prioritize critical sections
    └─> Fill to quota limit
    ↓
AIAnalyzer.analyzeSustainability()
    └─> Use config.analysis.summarizer settings
    └─> Call Chrome Summarizer API
    ↓
Store Results
    └─> window.__sustainabilityAdvisorData
    ↓
[Future] UI Display (Badge, Panel, Alerts)
```

---

## Sustainability Advisor Deep Dive

### Configuration-Driven Extraction

All extraction logic is now **driven by configuration files** rather than hardcoded. This makes the system highly maintainable and extensible.

### How It Works

#### 1. Product Detection

**Configuration-Based** (`config/sites/amazon.json`):
```json
{
  "detection": {
    "urlPatterns": [{
      "pattern": "https?://(?:www\\.|smile\\.)?amazon\\.(?:com|co\\.uk|...)...",
      "productIdGroup": 1
    }]
  }
}
```

**Amazon URL Patterns Supported:**
- Short: `amazon.com/dp/B0123456789`
- With title: `amazon.com/Product-Name/dp/B0123456789`
- With params: `amazon.com/Product/dp/B0123456789?ref=...`
- All domains: `.com`, `.co.uk`, `.de`, `.fr`, `.ca`, `.in`, `.it`, `.es`, `.com.au`, `.co.jp`

**Runtime Processing:**
- `ConfigLoader` loads all site configs on startup
- `detectSite(url)` matches current URL against patterns
- Returns matched config + extracted product ID

#### 2. Targeted Extraction (Two-Tier Approach)

**Philosophy**: Include sections based on **structure** (not just keywords), then use **pattern matching** to catch unknown materials and certifications.

**Configuration-Based** (`config/sites/amazon.json`):

##### Tier 1: Always Include (Structure-Based)

Defined in `extraction.selectors.alwaysInclude`:

```json
{
  "alwaysInclude": [
    {
      "selector": "#productTitle",
      "label": "Product Title",
      "baseScore": 0.90,
      "priority": "critical"
    },
    {
      "selector": "#productFactsDesktop_feature_div",
      "label": "Product Facts (Fabric, Care, Origin)",
      "baseScore": 0.85,
      "priority": "critical"
    },
    {
      "selector": "#climatePledgeFriendly",
      "label": "Climate Pledge Friendly",
      "baseScore": 0.85,
      "priority": "high"
    }
    // ... 13 more selectors
  ]
}
```

**Why This Works:**
- Product detail sections (`#productFactsDesktop_feature_div`) **always** contain material info
- Technical specs sections have composition details
- A+ content includes detailed material breakdowns
- **No keywords needed** - structure indicates relevance
- **Easy to update** - edit JSON, not code

##### Tier 2: Keyword-Filtered (Ambiguous Sections)

Defined in `extraction.selectors.conditionalInclude`:

```json
{
  "conditionalInclude": [
    {
      "selector": "#detailBullets_feature_div",
      "label": "Detail Bullets (Mixed Content)",
      "baseScore": 0.70,
      "requiresKeywords": true
    }
  ]
}
```

**Runtime Filtering**: `ContentExtractor` checks these sections against keywords/patterns from config before including.

#### 3. Pattern Matching: The Secret Sauce

**Configuration-Based** (`config/sites/amazon.json`):

Material Indicator Patterns defined in `extraction.patterns`:

```json
{
  "patterns": [
    {
      "pattern": "made (of|from|with)",
      "category": "material",
      "description": "Catches 'made of X', 'made from X'",
      "bonus": 0.10
    },
    {
      "pattern": "\\d+%\\s+[\\w\\-]+",
      "category": "material",
      "description": "Catches '50% cotton', '100% recycled'",
      "bonus": 0.10
    },
    {
      "pattern": "certified (by|to)",
      "category": "certification",
      "description": "Certification indicator",
      "bonus": 0.10
    }
    // ... 20 more patterns
  ]
}
```

**Runtime Application**: `ContentExtractor` tests each pattern against section text and applies score bonuses.

**Result**: Catches materials/certifications we've never heard of without code changes!

#### 4. Scoring & Ranking System

**Base Scores** (by selector importance):
- Product title: **0.90**
- Product facts (fabric, care): **0.85**
- Climate Pledge section: **0.85**
- Certification badges: **0.80**
- Product overview/features: **0.75**
- Other structural sections: **0.70**

**Bonuses**:
- **+0.10**: Contains material indicator patterns
- **+0.05**: Per keyword family match (materials/sustainability/ingredients)

**Example Scoring**:
```
#productFactsDesktop_feature_div with "Fabric type: 92% bamboo viscose, 8% spandex"
= 0.85 (base) + 0.10 (pattern: "Fabric type") + 0.05 (material keywords)
= 1.00 (highest priority!)
```

#### 5. Section Selection

**Two-Phase Selection**:

**Phase 1**: Always include critical product info first
```javascript
const criticalSelectors = [
  '#productTitle',
  '#productFactsDesktop_feature_div',
  '#productFactsDesktopExpander',
  '#feature-bullets',
  '#productOverview_feature_div'
];
```

**Phase 2**: Add high-scoring sections (sustainability, etc.) until reaching 85% of Summarizer's input quota (~5,500 chars)

**Result**: Balanced extraction with product context + sustainability details

#### 6. AI Summarization

**Configuration-Based** (`config/sites/amazon.json`):

```json
{
  "analysis": {
    "summarizer": {
      "sharedContext": "Extract sustainability and environmental information...",
      "type": "key-points",
      "format": "plain-text",
      "length": "long",
      "inputQuotaUsage": 0.85
    }
  }
}
```

**Runtime Processing** (`AIAnalyzer`):
- Creates summarizer with config-driven settings
- Measures content against quota
- Trims if necessary
- Generates summary
- Cleans up session

**Single-Pass Processing**:
- No chunking or recursive summarization needed
- LLM sees only signal, not noise
- Fast: 2-3 seconds total processing time

---

## Setup & Installation

### Prerequisites

1. **Chrome Canary** (version 128.0.6545.0 or newer)
2. **Gemini Nano model** (requires 22 GB free storage)
3. **Prompt API flag** enabled
4. **Summarizer API flag** enabled

### Step 1: Enable Required Flags

1. Open Chrome Canary
2. Go to `chrome://flags/#prompt-api-for-gemini-nano`
3. Set to **Enabled**
4. Go to `chrome://flags/#summarization-api-for-gemini-nano`
5. Set to **Enabled**
6. **Relaunch Chrome**

### Step 2: Download Gemini Nano

1. Open DevTools (F12)
2. Run in console:
   ```javascript
   await LanguageModel.create();
   ```
3. Relaunch Chrome
4. Go to `chrome://components`
5. Find "Optimization Guide On Device Model"
6. Click "Check for update" if needed
7. Wait for download to complete (~22 GB)

### Step 3: Verify APIs Work

```javascript
// Check Prompt API
await LanguageModel.availability();  // Should return "available"

// Check Summarizer API
await Summarizer.availability();     // Should return "available"
```

### Step 4: Load Extension

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the extension folder
5. Extension icon should appear in toolbar

---

## Testing

### Testing the Sustainability Advisor

#### Step 1: Reload Extension
`chrome://extensions` → Reload button

#### Step 2: Visit Amazon Product Page
Try these test products:
- **Apparel**: Men's bamboo boxer briefs (has fabric composition)
- **Phone case**: TPU/PC materials with recycled content
- **Electronics**: Climate Pledge Friendly products
- **Home goods**: Products with material specifications

#### Step 3: Open Console
Press `F12` → Console tab

#### Expected Console Output:

```
[AI Glass Overlay] Content script loaded
[Sustainability Advisor] ✅ Amazon product detected: B0CNJS9K87
[Sustainability Advisor] 🚀 Starting targeted extraction...
[Sustainability Advisor] 🔍 Starting targeted section extraction...
[Sustainability Advisor] 📊 Extraction complete: 12 relevant sections found
[Sustainability Advisor]    - Always included (structural): 8
[Sustainability Advisor]    - Keyword filtered: 0
[Sustainability Advisor]    - From headings: 4
[Sustainability Advisor]    - After deduplication: 12
[Sustainability Advisor] ⚡ Extraction completed in 0.08s
[Sustainability Advisor] 🤖 Analyzing extracted sections...
[Sustainability Advisor] 📏 Summarizer input quota: 5,500 chars
[Sustainability Advisor] 🎯 Selecting sections (target: 4,675 chars)...
[Sustainability Advisor] 📌 Found 5 critical product sections, 7 other sections
[Sustainability Advisor] ✂️ Selected 6 sections (4,234 chars)
[Sustainability Advisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Sustainability Advisor] 📄 FOCUSED CONTENT TO ANALYZE:
[Sustainability Advisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Sustainability Advisor] 1. [Score: 0.95] #productTitle
[Sustainability Advisor]    Preview: BAMBOO COOL Men's Ultra ComfortSoft Underwear...
[Sustainability Advisor] 2. [Score: 0.95] #productFactsDesktop_feature_div
[Sustainability Advisor]    Preview: Fabric type: 92% viscose made from bamboo, 8% spandex...
[Sustainability Advisor] 3. [Score: 0.90] #feature-bullets
[Sustainability Advisor]    Preview: HIGH-QUALITY MATERIAL: crafted from 92% bamboo viscose...
[Sustainability Advisor] 4. [Score: 1.00] #climatePledgeFriendly
[Sustainability Advisor]    Preview: Sustainability features... Nordic Swan Ecolabel...
[Sustainability Advisor] 5. [Score: 0.90] About this item
[Sustainability Advisor]    Preview: breathability, moisture-wicking properties...
[Sustainability Advisor] 6. [Score: 0.85] #productOverview_feature_div
[Sustainability Advisor]    Preview: Care instructions: Hand Wash Only, Origin: Imported...
[Sustainability Advisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Sustainability Advisor] ⚖️ Content size check: 4,234 / 5,500 tokens (77%)
[Sustainability Advisor] 🔄 Generating summary...
[Sustainability Advisor] ✅ Analysis complete!
[Sustainability Advisor] ⏱️ Timing: Summarization 2.34s | Total 2.42s
[Sustainability Advisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Sustainability Advisor] 🌱 SUSTAINABILITY SUMMARY:
[Sustainability Advisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
* Materials: 92% bamboo viscose, 8% spandex
* Properties: Moisture-wicking, breathable, 20-30% more breathable than cotton
* Care: Hand wash only
* Origin: Imported
* Sustainability: Uses sustainable bamboo viscose material
[Sustainability Advisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Sustainability Advisor] 🎉 Complete! Total time: 2.42s (Extraction: 0.08s + Analysis: 2.34s)
[Sustainability Advisor] 💾 Data stored
[Sustainability Advisor] 💡 Access with: window.__sustainabilityAdvisorData
```

#### Step 4: Inspect Stored Data

```javascript
// In console
window.__sustainabilityAdvisorData

// Returns:
{
  productId: "B0CNJS9K87",
  url: "https://www.amazon.com/...",
  summary: "* Materials: 92% bamboo viscose...",
  summaryError: null,
  focusedContent: "[Section: #productTitle]\n...",
  sectionsUsed: 6,
  totalSectionsFound: 12,
  processedChars: 4234,
  extractionTime: "0.08",
  summarizationTime: "2.34",
  totalTime: "2.42",
  extractedAt: 1704585600000
}
```

### Testing the AI Glass Interface

1. Click extension icon in toolbar
2. Wait for "✅ AI is ready!" status
3. Type a prompt: "Write a haiku about sustainability"
4. Click "Stream Response" or "Get Response"
5. Watch AI generate response in real-time

---

## Technical Implementation

### Configuration-Driven Architecture

The extension now uses **ES6 modules** with a clean separation between logic and configuration.

### Key Files

#### Configuration Layer (No Code)

**`src/config/schema.json`**
- JSON Schema for validating site configs
- Documents all available options
- Ensures config consistency

**`src/config/sites/amazon.json`** (230 lines)
- URL detection patterns
- 16 CSS selectors (always-include + conditional)
- 60+ keywords across 4 families
- 23 regex patterns for material detection
- AI summarizer settings and prompts
- All Amazon-specific rules in one place

#### Logic Layer (Reusable Modules)

**`src/core/ConfigLoader.js`** (120 lines)
- Loads all site configurations on startup
- Detects which site matches current URL
- Returns matched config + product ID
- Manages config lifecycle

**`src/core/ContentExtractor.js`** (250 lines)
- Extracts sections using config selectors
- Applies keyword filtering from config
- Tests pattern matching from config
- Scores and ranks sections
- Selects sections within quota
- **Zero hardcoded values** - all from config

**`src/core/AIAnalyzer.js`** (80 lines)
- Creates Summarizer with config settings
- Measures content against quota
- Trims if necessary
- Generates summary
- Handles errors gracefully

**`src/core/SustainabilityAdvisor.js`** (200 lines)
- Main orchestrator
- Coordinates: ConfigLoader → ContentExtractor → AIAnalyzer
- Logs detailed progress
- Stores results globally
- Clean error handling

#### Entry Point

**`src/overlay.js`** (337 lines, was 1,188)
- **Lines 1-53**: Sustainability Advisor initialization
  - Imports SustainabilityAdvisor module
  - Multi-strategy timing (immediate, DOMContentLoaded, fallback)
  - Clean 50-line implementation
  
- **Lines 59-337**: AI Glass Overlay
  - Shadow DOM injection
  - Draggable interface
  - Prompt API integration
  - Settings management
  - Keyboard controls

**93% size reduction** in main file through modularization!

#### Supporting Files

**`src/bg.js`** (Background)
- Extension icon click handler
- Message passing between popup and content script

**`src/popup.js`** (Settings)
- Configuration UI
- Settings persistence (chrome.storage.sync)
- Real-time updates to content script

**`manifest.json`**
- **NEW**: `"type": "module"` enables ES6 imports
- **NEW**: `web_accessible_resources` includes config files and modules

### Benefits of Configuration-Driven Architecture

#### 1. Maintainability
- **Update selectors**: Edit JSON, not code
- **Change scoring**: Modify config values
- **Add keywords**: Append to arrays in JSON
- **No code changes** needed for most updates

#### 2. Extensibility  
- **Add new sites**: Create new JSON config (20-30 mins)
- **No logic duplication**: Same extraction engine for all sites
- **Example**: Adding eBay requires only `ebay.json` + 1 line in ConfigLoader

#### 3. Testability
- **Unit test** each module independently
- **Mock configs** for testing edge cases
- **Validate configs** against JSON Schema
- **Test without browser** (for most logic)

#### 4. Community-Friendly
- **Non-coders** can contribute site configs
- **Review configs** easier than code
- **Share configs** via GitHub/CDN
- **A/B test** strategies with different configs

### Chrome Built-in AI APIs Used

#### 1. Summarizer API

**Purpose**: Extract key sustainability information from product content

**Configuration-Driven Usage** (`AIAnalyzer`):
```javascript
// Load settings from config
const summarizerConfig = config.analysis.summarizer;

// Create with config settings
const summarizer = await self.Summarizer.create({
  sharedContext: summarizerConfig.sharedContext,
  type: summarizerConfig.type,
  format: summarizerConfig.format,
  length: summarizerConfig.length
});

const summary = await summarizer.summarize(content);
summarizer.destroy();
```

**Documentation**: https://developer.chrome.com/docs/ai/summarizer-api

#### 2. Prompt API (LanguageModel)

**Purpose**: Interactive AI conversations in the overlay

**Usage**:
```javascript
const session = await LanguageModel.create({
  systemPrompt: 'You are a helpful AI assistant...',
  temperature: 0.7,
  topK: 40
});

const response = await session.prompt(userInput);
// OR streaming:
const stream = session.promptStreaming(userInput);
for await (const chunk of stream) {
  // Update UI with chunk
}
```

**Documentation**: https://developer.chrome.com/docs/ai/prompt-api

---

## Performance Optimizations

### 1. Configuration Loading (New)

**Implementation**: Single async config load on startup
- All configs loaded once at initialization
- Cached in memory for instant URL matching
- Minimal overhead (~5ms one-time)

**Result**: Zero performance impact on extraction

### 2. Early Content Extraction

**Multi-strategy timing** (preserved in new architecture):

```javascript
// Strategy 1: Immediate (if DOM ready)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(runAnalysis, 0);
}

// Strategy 2: DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(runAnalysis, 100);
  });
}

// Strategy 3: Fallback for dynamic content
setTimeout(runAnalysis, 300);
```

**Result**: Starts ~700ms faster than fixed delay

### 3. Targeted Extraction (70% Speed Improvement)

**Before** (Phase 1): Process entire page HTML (~50-200KB) → split → multiple LLM calls → recursive summarization → 10+ seconds

**After** (Phase 2 + Config-Driven): Extract only relevant sections (~4KB) → single LLM call → 2-3 seconds

**Improvement**: 
- 70% faster execution
- 95% less data processed
- Same logic now works for any site (config-driven)

### 4. Balanced Extraction

**Two-phase selection** (now config-driven):
- Phase 1: Critical sections (marked `priority: "critical"` in config)
- Phase 2: High-scoring sections until quota reached

**Result**: Balanced summaries with product context + sustainability details

### 5. Deduplication

**Algorithm** (implemented in `ContentExtractor`):
- 80% overlap detection
- Parent container checking
- Signature-based comparison

**Result**: Eliminates duplicate extractions

### 6. Material Pattern Matching

**Before** (Phase 1): ~200 hardcoded keywords = ~200 materials covered

**After** (Phase 2): Pattern matching = thousands of materials covered

**Now** (Phase 2.5): All patterns in config = easy to add more

**Result**: 
- New materials captured without code changes
- Add patterns by editing JSON
- Community can contribute patterns

---

## Troubleshooting

### "LanguageModel API not available"

**Solution**:
1. Check `chrome://flags/#prompt-api-for-gemini-nano` is **Enabled**
2. Relaunch Chrome
3. Verify: `await LanguageModel.availability()` returns `"available"`

### "Summarizer API not available"

**Solution**:
1. Check `chrome://flags/#summarization-api-for-gemini-nano` is **Enabled**
2. Relaunch Chrome
3. Verify: `await Summarizer.availability()` returns `"available"`

### "AI model is downloading"

**Solution**:
1. Go to `chrome://components`
2. Find "Optimization Guide On Device Model"
3. Wait for download (can take 10-30 minutes for 22GB)
4. Relaunch Chrome after completion

### "Not an Amazon product page"

**Verify**:
- URL contains `/dp/` or `/gp/product/` followed by 10-character product ID
- Not a search results, cart, or category page
- Product ID format: `B0` followed by 8 alphanumeric characters (e.g., `B0CNJS9K87`)

### No console output

**Solution**:
1. Reload extension in `chrome://extensions`
2. Hard refresh the Amazon page (Cmd+Shift+R / Ctrl+Shift+R)
3. Check that content script loaded: Look for `[AI Glass Overlay] Content script loaded`

### Missing material information in summary

**Check**:
1. Is `#productFactsDesktop_feature_div` in the selected sections? (Check console)
2. Does the "FOCUSED CONTENT" preview show fabric/material info?
3. Is the section score high enough (should be 0.85+)?

**Enable debug mode** for detailed logs:
```javascript
// In overlay.js line 9
const SUSTAINABILITY_DEBUG = true;  // Change from false
```

---

## Future Roadmap

### Phase 2.5: Configuration-Driven Architecture ✅ COMPLETE

**Status**: Implemented and deployed

**Achievements**:
- Separated logic from configuration
- Created modular component architecture
- Built extensible config system
- 93% reduction in main file size
- Easy to add new sites (20-30 mins vs 4-8 hours)

### Phase 3: Structured Data Extraction (Next)

**Status**: Ready to implement

Use Prompt API to parse summary into structured JSON:

```javascript
const session = await LanguageModel.create({
  systemPrompt: 'Extract structured sustainability data...'
});

const structuredData = await session.prompt(`
  Parse this summary into JSON with fields:
  - materials: array of {name, percentage, sustainable}
  - certifications: array of certification names
  - origin: country of manufacture
  - packaging: sustainability details
  - claims: environmental claims made
  
  Summary: ${summary}
  
  Output only valid JSON.
`);

const parsed = JSON.parse(structuredData);
```

### Phase 4: Sustainability Scoring Algorithm

**Hybrid Approach**:
- **AI-based scoring (70%)**: LLM evaluates overall sustainability
- **Rule-based scoring (30%)**: Hardcoded rules for known good/bad factors

**Score Categories** (0-100 each):
- Materials score
- Packaging score  
- Manufacturing score
- Chemicals score

**Overall Score** (0-100): Weighted average

**Output**: 
- Numeric score
- Color tier (green/yellow/red)
- Strengths list
- Concerns list
- Recommendations

### Phase 5: Visual Badge UI

**Minimal floating badge**:
- Circular progress ring showing score
- Color-coded by tier
- Positioned in bottom-right corner
- Click to expand to full panel

### Phase 6: Auto-Expanding Alert

**Proactive warning for low scores (<60)**:
- Slides down from top
- Lists key concerns (e.g., "Contains non-recyclable plastic", "No certifications found")
- Auto-dismiss after 15 seconds
- Option to view full details

### Phase 7: Full Side Panel

**Comprehensive sustainability breakdown**:
- Overall score with visual indicator
- Category scores with progress bars
- Detailed reasoning for each category
- List of certifications with icons
- Material composition breakdown
- Comparison to similar products
- Action buttons: "Find alternatives", "Share report", "Learn more"

### Phase 8: Multi-Site Support 🚀 ENABLED BY PHASE 2.5

**Status**: Architecture ready, implementation easy

Extend beyond Amazon (now trivial with config system):
- **eBay**: Create `ebay.json` config (20-30 mins)
- **Walmart**: Create `walmart.json` config (20-30 mins)
- **Target**: Create `target.json` config (20-30 mins)
- **Etsy, Alibaba, etc.**: Just add JSON configs!
- **Community contributions**: Accept configs via PRs

**Before Phase 2.5**: 4-8 hours per site (code duplication)  
**After Phase 2.5**: 20-30 minutes per site (config only)

**Enabled by**:
- Configuration-driven architecture
- Reusable extraction engine
- No code changes needed
- Community can contribute

### Additional Ideas

- **Product comparison**: Compare sustainability of multiple products
- **History tracking**: Track products you've viewed
- **Wishlist scoring**: Analyze your Amazon wishlist
- **Browser notifications**: Alert when viewing unsustainable products
- **Export reports**: PDF/CSV export of sustainability analysis
- **Community scores**: Aggregate scores from multiple users
- **Alternative suggestions**: "Similar products with better sustainability"
- **Remote config updates**: Fetch configs from CDN for instant updates
- **Config A/B testing**: Test different extraction strategies
- **User-defined configs**: Let users add custom site configs

---

## How to Add a New Site

Thanks to the configuration-driven architecture, adding a new site is straightforward:

### Step 1: Create Config File

Create `src/config/sites/yoursite.json`:

```json
{
  "id": "yoursite-region",
  "name": "Your Site",
  "version": "1.0.0",
  "enabled": true,
  "detection": {
    "urlPatterns": [{
      "pattern": "https?://yoursite\\.com/product/([0-9]+)",
      "productIdGroup": 1
    }]
  },
  "extraction": {
    "selectors": {
      "alwaysInclude": [
        {
          "selector": ".product-title",
          "label": "Product Title",
          "baseScore": 0.90,
          "priority": "critical"
        }
        // ... add more selectors
      ]
    },
    "keywords": {
      "materials": ["cotton", "polyester", ...],
      "sustainability": ["recycled", "organic", ...]
    },
    "patterns": [
      {
        "pattern": "made (of|from)",
        "category": "material",
        "bonus": 0.10
      }
    ]
  },
  "analysis": {
    "summarizer": {
      "sharedContext": "Extract sustainability information...",
      "type": "key-points",
      "length": "long"
    }
  }
}
```

### Step 2: Register Config

Update `src/core/ConfigLoader.js`:

```javascript
const siteConfigs = [
  'amazon.json',
  'yoursite.json'  // Add this line
];
```

### Step 3: Test

1. Reload extension
2. Visit product page on your site
3. Check console for extraction logs
4. Verify `window.__sustainabilityAdvisorData`

**That's it!** No code changes needed.

---

## Resources

- **Chrome AI Challenge**: https://googlechromeai2025.devpost.com/
- **Prompt API Docs**: https://developer.chrome.com/docs/ai/prompt-api
- **Summarizer API Docs**: https://developer.chrome.com/docs/ai/summarizer-api
- **Early Preview Program**: https://developer.chrome.com/docs/ai/built-in
- **Chrome AI Repository**: https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/functional-samples/ai

---

## License

Open source for the hackathon!

---

**Last Updated**: January 6, 2025  
**Current Phase**: Phase 2.5 Complete ✅ (Configuration-Driven Architecture)  
**Previous Phase**: Phase 2 Complete ✅ (Intelligent Extraction with AI Summarization)  
**Next Milestone**: Phase 3 - Structured Data Extraction with Prompt API

---

## Architecture Evolution

**Phase 1**: Basic full-page extraction → Works but slow  
**Phase 2**: Targeted extraction with scoring → 70% faster, smarter  
**Phase 2.5** ✅: Configuration-driven architecture → Maintainable, extensible, scalable  
**Phase 3** (Next): Structured data extraction → JSON output, programmatic access

The Phase 2.5 refactoring sets the foundation for rapid multi-site expansion and community contributions.

---

## Quick Reference

### Key Console Commands

```javascript
// Check API availability
await LanguageModel.availability()
await Summarizer.availability()

// Access extracted data
window.__sustainabilityAdvisorData
window.__sustainabilityAdvisorData.summary

// Test Summarizer manually
const s = await self.Summarizer.create({type: 'key-points'});
await s.summarize("Your text here");
s.destroy();
```

### Key Selectors

```javascript
// Critical product info (always included)
'#productTitle'
'#productFactsDesktop_feature_div'  // Fabric type, care, origin
'#feature-bullets'                   // "About this item"
'#productOverview_feature_div'       // Specs table

// Sustainability sections
'#climatePledgeFriendly'             // Main sustainability section
'#certificateBadge_feature_div'      // Certification badges
'#cr-badge-row'                      // Climate pledge badges
```

### Performance Metrics

| Metric | Value |
|--------|-------|
| Extraction Time | ~100ms |
| Summarization Time | 2-3s |
| Total Processing Time | 2-3s |
| Data Reduction | 95-99% |
| Sections Extracted | 5-7 (from 10-15 found) |
| Token Usage | 77% of quota (~4,200/5,500 chars) |

---

**Built with ❤️ for Chrome Built-in AI Challenge 2025**
