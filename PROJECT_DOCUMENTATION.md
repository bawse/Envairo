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

### Project Structure

```
chrome-built-in/
├── manifest.json           # Extension configuration
├── src/
│   ├── bg.js              # Background service worker
│   ├── overlay.js         # Content script (main logic)
│   ├── overlay.css        # Glass morphism styles
│   ├── popup.html         # Extension popup
│   ├── popup.js           # Popup settings interface
│   └── icons/             # Extension icons
├── docs/                   # Design documentation
├── ideas/                  # Future feature concepts
└── PROJECT_DOCUMENTATION.md # This file
```

### Data Flow

```
Amazon Page Load
    ↓
Product Detection (Regex URL matching)
    ↓
Targeted Section Extraction (Two-tier approach)
    ↓
Section Ranking & Selection (Score-based)
    ↓
AI Summarization (Chrome Summarizer API)
    ↓
Results Storage (window.__sustainabilityAdvisorData)
    ↓
[Future] UI Display (Badge, Panel, Alerts)
```

---

## Sustainability Advisor Deep Dive

### How It Works

#### 1. Product Detection

**Amazon URL Patterns Supported:**
- Short: `amazon.com/dp/B0123456789`
- With title: `amazon.com/Product-Name/dp/B0123456789`
- With params: `amazon.com/Product/dp/B0123456789?ref=...`
- All domains: `.com`, `.co.uk`, `.de`, `.fr`, `.ca`, `.in`, `.it`, `.es`, `.com.au`, `.co.jp`

**Implementation:**
```javascript
// Flexible regex that handles various URL formats
const amazonProductRegex = /https?:\/\/(?:www\.|smile\.)?amazon\.(?:com|co\.uk|...)\/(?:.*\/)?(?:gp\/product|dp)\/([A-Z0-9]{10})/;
```

#### 2. Targeted Extraction (Two-Tier Approach)

**Philosophy**: Include sections based on **structure** (not just keywords), then use **pattern matching** to catch unknown materials and certifications.

##### Tier 1: Always Include (Structure-Based)

These sections are **always extracted** because their structure indicates relevance:

```javascript
const ALWAYS_INCLUDE_SELECTORS = [
  '#productTitle',                          // Product name
  '#feature-bullets',                       // Key features
  '#productFactsDesktop_feature_div',       // Product facts (CRITICAL)
  '#productFactsDesktopExpander',           // Fabric type, care, origin
  '#productOverview_feature_div',           // Specs table
  '#productDetails_techSpec_section_1',     // Technical specs
  '#productDetails_detailBullets_sections1',// Detail bullets
  '#prodDetails',                           // Legacy product details
  '.prodDetTable',                          // Product details table
  '#productDescription',                    // Description
  '#aplus',                                 // A+ content
  '#aplus_feature_div',                     // Manufacturer content
  '#climatePledgeFriendly',                 // Sustainability section
  '#certificateBadge_feature_div',          // Certification badges
  '#cr-badge-row',                          // Climate pledge badges
  '#badge-packaging'                        // Packaging badges
];
```

**Why This Works:**
- Product detail sections (`#productFactsDesktop_feature_div`) **always** contain material info
- Technical specs sections have composition details
- A+ content includes detailed material breakdowns
- **No keywords needed** - structure indicates relevance

##### Tier 2: Keyword-Filtered (Ambiguous Sections)

Only for sections that might contain irrelevant content:

```javascript
const KEYWORD_FILTERED_SELECTORS = [
  '#detailBullets_feature_div',  // Mixed content
  '#poExpander'                   // Mobile overview (may duplicate)
];
```

#### 3. Pattern Matching: The Secret Sauce

**Material Indicator Patterns** catch unknown materials by detecting the **structure** of material mentions:

```javascript
/made (of|from|with)/i        // "made of ECONYL"
/composed of/i                // "composed of Piñatex"
/crafted from/i               // "crafted from bamboo viscose"
/material:?\s*[\w\-]+/i       // "Material: Modal"
/fabric:?\s*[\w\-]+/i         // "Fabric: Tencel"
/fabric type/i                // "Fabric type" (structured data)
/\d+%\s+[\w\-]+/i             // "50% recycled Repreve"
/certified (by|to)/i          // "certified by Cradle to Cradle"
/upper:?\s*[\w\-]+/i          // "Upper: microsuede" (footwear)
/outsole:?\s*[\w\-]+/i        // "Outsole: Vibram"
/insole:?\s*[\w\-]+/i         // "Insole: foam"
/lining:?\s*[\w\-]+/i         // "Lining: bemberg"
/shell:?\s*[\w\-]+/i          // "Shell: Gore-Tex"
/viscose|bamboo|spandex/i     // Common sustainable materials
```

**Result**: Catches materials/certifications we've never heard of!

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

**Summarizer Configuration**:
```javascript
const summarizer = await self.Summarizer.create({
  sharedContext: 'Extract sustainability and environmental information from this product. Focus on: materials (including exact material names like TPU, plastic, metal, etc.), environmental certifications (GRS, Climate Pledge, etc.), recycled content percentage, packaging sustainability, manufacturing origin, worker welfare, and environmental impact. Include specific material composition details. Ignore pricing, shipping, and general product features.',
  type: 'key-points',
  format: 'plain-text',
  length: 'long'
});
```

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

### Key Files

#### `src/overlay.js` (Main Logic)

**Lines 1-847**: Sustainability Advisor
- Product detection
- Targeted extraction with two-tier approach
- Pattern matching for unknown materials
- Section scoring and ranking
- AI summarization integration
- Multi-strategy initialization

**Lines 853-1168**: AI Glass Overlay
- Shadow DOM injection
- Draggable interface
- Prompt API integration
- Settings management
- Keyboard controls

#### `src/bg.js` (Background)

- Extension icon click handler
- Message passing between popup and content script

#### `src/popup.js` (Settings)

- Configuration UI
- Settings persistence (chrome.storage.sync)
- Real-time updates to content script

### Chrome Built-in AI APIs Used

#### 1. Summarizer API

**Purpose**: Extract key sustainability information from product content

**Usage**:
```javascript
const summarizer = await self.Summarizer.create({
  sharedContext: 'Extract sustainability...',
  type: 'key-points',
  format: 'plain-text',
  length: 'long'
});

const summary = await summarizer.summarize(focusedContent);
summarizer.destroy(); // Clean up
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

### 1. Early Content Extraction

**Problem**: Fixed 1000ms delay before starting extraction

**Solution**: Multi-strategy approach that starts ASAP

```javascript
// Strategy 1: Immediate (if DOM ready)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(extractWhenReady, 0);
}

// Strategy 2: DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(extractWhenReady, 100);
  });
}

// Strategy 3: Fallback for dynamic content
setTimeout(extractWhenReady, 300);
```

**Result**: Starts ~700ms faster on average

### 2. Targeted Extraction (70% Speed Improvement)

**Before**: Process entire page HTML (~50-200KB) → split → multiple LLM calls → recursive summarization → 10+ seconds

**After**: Extract only relevant sections (~4KB) → single LLM call → 2-3 seconds

**Improvement**: 70% faster, 95% less data processed

### 3. Balanced Extraction

**Problem**: Sustainability sections overwhelming product info

**Solution**: Two-phase selection ensures critical product info always included first

**Result**: Balanced summaries with product context + sustainability details

### 4. Deduplication

**Problem**: Multiple headings within same container creating duplicates

**Solution**: 80% overlap detection + parent container check

```javascript
// Catches similar content even with different starting text
if (longer.includes(shorter.substring(0, Math.floor(shorter.length * 0.8)))) {
  isDuplicate = true;
}
```

### 5. Material Pattern Matching

**Before**: ~200 hardcoded keywords = ~200 materials covered

**After**: Pattern matching = thousands of materials covered

**Future-Proof**: New materials automatically captured without code changes

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

### Phase 3: Structured Data Extraction (Next)

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

### Phase 8: Multi-Site Support

Extend beyond Amazon:
- **eBay**: Product listings
- **Walmart**: Online products
- **Target**: Product pages
- **Generic e-commerce**: Open Graph / JSON-LD parsing

### Additional Ideas

- **Product comparison**: Compare sustainability of multiple products
- **History tracking**: Track products you've viewed
- **Wishlist scoring**: Analyze your Amazon wishlist
- **Browser notifications**: Alert when viewing unsustainable products
- **Export reports**: PDF/CSV export of sustainability analysis
- **Community scores**: Aggregate scores from multiple users
- **Alternative suggestions**: "Similar products with better sustainability"

---

## Debug Mode

For detailed logging during development:

```javascript
// src/overlay.js line 9
const SUSTAINABILITY_DEBUG = true;  // Set to true
```

**Additional logs include**:
- Detailed HTML cleaning statistics
- Individual chunk processing
- Token quota information
- Raw cleaned text preview
- Container selector details
- Data storage confirmations

**Production mode** (default: `false`) shows only:
- Product detection
- Processing status
- Final summary
- Errors/warnings

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
**Current Phase**: Phase 2 Complete ✅  
**Next Milestone**: Phase 3 - Structured Data Extraction with Prompt API

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
