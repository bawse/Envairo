# Architecture Documentation

**Version**: 3.0  
**Last Updated**: October 8, 2025  
**Current Phase**: Phase 5 Complete ✅

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Configuration-Driven Architecture](#configuration-driven-architecture)
3. [Core Modules](#core-modules)
4. [Data Flow](#data-flow)
5. [Product Detection](#product-detection)
6. [Content Extraction](#content-extraction)
7. [AI Analysis](#ai-analysis)
8. [Sustainability Scoring](#sustainability-scoring)
9. [UI Components](#ui-components)
10. [Performance Optimizations](#performance-optimizations)

---

## System Overview

### Design Philosophy

Envairo uses a **configuration-driven, modular architecture** that separates logic from data. This enables:

- ✅ **Extensibility**: Add new sites by creating JSON configs (20-30 min vs 4-8 hours)
- ✅ **Maintainability**: Update selectors/keywords without touching code
- ✅ **Testability**: Mock configs for unit testing
- ✅ **Community-Friendly**: Non-coders can contribute site configs

### Key Technologies

- **Chrome Built-in AI APIs**: Prompt API & Summarizer API (Gemini Nano)
- **ES6 Modules**: Modern JavaScript with dynamic imports
- **Shadow DOM**: CSS isolation for overlay
- **Chrome Extension Manifest V3**: Latest extension platform

### Architecture Layers

```
┌─────────────────────────────────────────────┐
│         Entry Point (overlay.js)            │
│  - Initializes on page load                 │
│  - Handles UI state management              │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│      Orchestrator (SustainabilityAdvisor)   │
│  - Coordinates the entire pipeline          │
│  - Manages state and error handling         │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
┌───────▼──┐  ┌───▼────┐  ┌──▼────────┐
│ Config   │  │Content │  │ AI        │
│ Loader   │  │Extract │  │ Analyzer  │
└──────────┘  └────────┘  └───────────┘
     │             │             │
┌────▼─────┐ ┌────▼───┐    ┌───▼────┐
│Site      │ │Scoring │    │Prompt  │
│Configs   │ │Matrix  │    │API     │
└──────────┘ └────────┘    └────────┘
```

---

## Configuration-Driven Architecture

### Separation of Concerns

The system splits into three distinct layers:

#### 1. Configuration Layer (`src/config/`)
**Pure JSON** - No code, just declarations:
- Site detection rules (URL patterns)
- Content selectors (CSS selectors)
- Keywords and patterns
- AI prompt templates
- Scoring parameters

#### 2. Logic Layer (`src/core/`)
**Reusable ES6 Modules**:
- Configuration loading and validation
- Content extraction engine
- AI analysis wrapper
- Orchestration logic

#### 3. UI Layer (`src/utils/`, `src/overlay.js`)
**Presentation logic**:
- Icon library
- Component builders
- Overlay state management
- Event handling

### Benefits

**Before (Hardcoded)**:
- 1,188 lines in overlay.js
- 4-8 hours to add new site
- Code changes for every update
- Difficult to test

**After (Config-Driven)**:
- 427 lines in overlay.js (64% reduction)
- 20-30 minutes to add new site
- No code changes for site updates
- Easy to mock and test

---

## Core Modules

### ConfigLoader (`src/core/ConfigLoader.js`)

**Purpose**: Loads and manages site-specific extraction rules

**Responsibilities**:
- Load all JSON configs from `src/config/sites/`
- Match current URL against configured patterns
- Return matched config with extracted product ID
- Validate config structure

**Key Methods**:
```javascript
async initialize()              // Load all site configs
detectSite(url)                 // Match URL to site config
getConfig(siteId)              // Get specific config
```

**Example Config** (`src/config/sites/amazon.json`):
```json
{
  "id": "amazon-global",
  "detection": {
    "urlPatterns": [{
      "pattern": "https?://.*amazon\\..*/(dp|gp/product)/([A-Z0-9]{10})",
      "productIdGroup": 2
    }]
  },
  "extraction": {
    "selectors": {...},
    "keywords": {...},
    "patterns": [...]
  },
  "analysis": {...}
}
```

---

### ContentExtractor (`src/core/ContentExtractor.js`)

**Purpose**: Intelligently extracts relevant product information from pages

**Extraction Strategy**:

#### Two-Tier Approach

**Tier 1: Always Include (Structure-Based)**
- Product title
- Product facts (fabric, care instructions)
- Technical specifications
- Climate Pledge sections
- Certification badges

**Tier 2: Conditional Include (Keyword-Filtered)**
- Detail bullets (mixed content)
- Product descriptions
- A+ content sections

#### Scoring System

**Base Scores** (by importance):
```javascript
{
  "#productTitle": 0.90,              // Critical
  "#productFactsDesktop": 0.85,       // Critical
  "#climatePledgeFriendly": 0.85,     // High
  "#feature-bullets": 0.75,           // Medium
  "#productDescription": 0.70         // Low
}
```

**Bonuses**:
- +0.10: Material indicator patterns (`made of`, `% cotton`)
- +0.05: Keyword family matches

**Pattern Matching** (the secret sauce):
```javascript
patterns: [
  { pattern: "made (of|from|with)", bonus: 0.10 },
  { pattern: "\\d+%\\s+[\\w\\-]+", bonus: 0.10 },  // "50% cotton"
  { pattern: "certified (by|to)", bonus: 0.10 }
]
```

#### Section Selection

1. **Phase 1**: Always include critical product info
2. **Phase 2**: Add high-scoring sections until 85% of AI input quota

**Result**: Balanced extraction with context + sustainability details

---

### AIAnalyzer (`src/core/AIAnalyzer.js`)

**Purpose**: Analyzes extracted content using Chrome's Prompt API

**Workflow**:
```
1. Check API availability
2. Load sustainability scoring matrix (CSV)
3. Create AI session with structured prompt
4. Extract structured data (JSON)
5. Calculate sustainability scores
6. Return comprehensive analysis
```

**Structured Output Format**:
```json
{
  "overall_score": 78,
  "tier": "B",
  "breakdown": {
    "material_score": 72,
    "certifications_bonus": 8,
    "durability_bonus": 10,
    "packaging_bonus": 3,
    "circularity_penalty": -5
  },
  "materials": [
    {
      "name": "Cotton",
      "percentage": 0.65,
      "reference_score": 95.9,
      "recyclable": "yes"
    }
  ],
  "certifications": ["GOTS", "OEKO-TEX"],
  "strengths": ["Organic cotton", "GOTS certified"],
  "concerns": ["Synthetic blend"],
  "recommendation": "Solid choice! The GOTS certification..."
}
```

**Prompt Engineering**:
- Strict JSON output requirements
- Material extraction rules
- Percentage format specification
- Style guide for recommendations
- Multiple examples (correct & incorrect)

---

### SustainabilityAdvisor (`src/core/SustainabilityAdvisor.js`)

**Purpose**: Main orchestrator coordinating the entire pipeline

**Pipeline**:
```javascript
1. Initialize ConfigLoader
2. Detect if current page is a product page
3. If detected:
   a. Extract content using ContentExtractor
   b. Select optimal sections for AI analysis
   c. Analyze using AIAnalyzer
   d. Store results globally
   e. Trigger UI display
4. If not detected:
   a. Set flag for manual toggle handling
```

**State Management**:
- `hasRun`: Prevents duplicate analyses
- `isRunning`: Prevents race conditions
- `currentSite`: Stores detection result

**Error Handling**:
- Graceful degradation
- Detailed logging
- User-friendly error messages

---

## Data Flow

### Complete Pipeline

```
Page Load
    ↓
[Entry Point: overlay.js]
    ↓
Initialize SustainabilityAdvisor
    ↓
ConfigLoader.initialize()
    └─> Load all configs from /config/sites/
    ↓
Detect Product Page
    ↓
ConfigLoader.detectSite(window.location.href)
    └─> Match URL against patterns
    └─> Extract product ID
    ↓
[If product detected]
    ↓
ContentExtractor.extractSections()
    ├─> Apply "always include" selectors
    ├─> Apply conditional selectors with keywords
    ├─> Pattern matching for materials
    ├─> Score and rank sections
    └─> Deduplicate overlapping content
    ↓
ContentExtractor.selectSectionsForAnalysis()
    ├─> Prioritize critical sections
    ├─> Fill to ~85% of AI input quota
    └─> Return focused content (~4-5KB)
    ↓
AIAnalyzer.initialize()
    └─> Load sustainability_matrix.csv
    ↓
AIAnalyzer.analyzeSustainability()
    ├─> Create Prompt API session
    ├─> Send structured prompt
    ├─> Parse JSON response
    ├─> Calculate scores
    └─> Validate and normalize data
    ↓
Store Results
    └─> window.__sustainabilityAdvisorData
    ↓
Display UI
    └─> Build overlay with uiComponents.js
```

### Timing

| Phase | Duration | Details |
|-------|----------|---------|
| Config Loading | ~5ms | One-time on init |
| Product Detection | ~1ms | URL pattern match |
| Content Extraction | ~50-100ms | DOM queries + scoring |
| AI Analysis | ~5-15s | Gemini Nano inference |
| UI Rendering | ~50ms | Shadow DOM + animations |
| **Total** | **5-15s** | **Most time in AI** |

---

## Product Detection

### URL Pattern Matching

**Amazon Example**:
```json
{
  "urlPatterns": [{
    "pattern": "https?://(?:www\\.|smile\\.)?amazon\\.(?:com|co\\.uk|de|fr|ca|in|it|es|com\\.au|co\\.jp)/(?:.*/)?(gp/product|dp)/([A-Z0-9]{10})",
    "productIdGroup": 2
  }]
}
```

**Supported URL Formats**:
- Short: `amazon.com/dp/B0123456789`
- With title: `amazon.com/Product-Name/dp/B0123456789`
- With params: `amazon.com/Product/dp/B0123456789?ref=...`
- All domains: `.com`, `.co.uk`, `.de`, `.fr`, `.ca`, `.in`, etc.

### DOM Signals

**Fallback verification**:
```json
{
  "domSignals": [
    "#productTitle",
    "#feature-bullets"
  ]
}
```

If URL matches but DOM signals missing, detection fails gracefully.

---

## Content Extraction

### Intelligent Selection

**Problem**: Amazon product pages contain 50-200KB of HTML, but AI models have limited input quotas.

**Solution**: Extract only the most relevant sections using scoring + pattern matching.

### Configuration Example

```json
{
  "selectors": {
    "alwaysInclude": [
      {
        "selector": "#productTitle",
        "label": "Product Title",
        "baseScore": 0.90,
        "priority": "critical"
      },
      {
        "selector": "#productFactsDesktop_feature_div",
        "label": "Product Facts",
        "baseScore": 0.85,
        "priority": "critical"
      }
    ],
    "conditionalInclude": [
      {
        "selector": "#detailBullets_feature_div",
        "label": "Detail Bullets",
        "baseScore": 0.70,
        "requiresKeywords": true
      }
    ]
  }
}
```

### Deduplication

**Algorithm**:
1. Calculate content signatures (first 100 chars)
2. Check for 80% text overlap
3. Verify parent-child relationships
4. Remove duplicates, keep highest-scored version

---

## AI Analysis

### Prompt API Integration

**Session Creation**:
```javascript
const session = await ai.languageModel.create({
  temperature: 0.1,        // Low for consistency
  topK: 3                  // Focused output
});
```

### Structured Prompting

**Prompt Structure**:
1. **Role**: "You are a sustainability analyst..."
2. **Task**: "Extract structured data from product content..."
3. **Input**: Focused content (~4KB)
4. **Scoring Matrix**: CSV data for material scoring
5. **Output Format**: Strict JSON schema
6. **Instructions**: Critical rules and examples
7. **Style Guide**: Conversational, specific, actionable

**Key Innovations**:
- **Material validation**: Auto-detect and normalize percentages
- **Hallucination prevention**: Strict "only extract mentioned materials" rules
- **Format enforcement**: Multiple examples showing correct output
- **Error recovery**: Fallback values for incomplete responses

### Response Parsing

```javascript
// Extract JSON from markdown code blocks
const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
const parsed = JSON.parse(jsonMatch[1]);

// Validate and normalize
validateMaterials(parsed.materials);
validateScores(parsed.breakdown);
```

---

## Sustainability Scoring

### Scoring Matrix

**Source**: `src/data/sustainability_matrix.csv`

**200+ materials** with research-backed scores including:
- Global Warming Potential (GWP)
- Water usage
- Recyclability
- Biodegradability
- Overall sustainability score (0-100)

**Example entries**:
```csv
Material,GWP_kg_CO2e,Recyclable,Biodegradable,Score
Cotton (Organic),1.8,Partial,Yes,95.9
Polyester (Virgin),7.1,Yes,No,42.3
PVC,2.5,Limited,No,28.7
```

### Score Calculation

**Overall Score** = Base Material Score + Bonuses - Penalties

**Components**:
- **Material Score** (60-80% weight): Weighted average based on composition
- **Certification Bonus** (+5-15): GOTS, OEKO-TEX, GRS, etc.
- **Durability Bonus** (+5-15): Warranty, construction quality
- **Packaging Bonus** (+2-8): Recycled, minimal, reusable
- **Circularity Penalty** (-5 to -15): Difficult to recycle/repair

**Tier System**:
- A+ (90-100): Exceptional
- A (80-89): Excellent
- B (70-79): Good
- C (60-69): Fair
- D (0-59): Poor

---

## UI Components

### Component Library (`src/utils/uiComponents.js`)

**Built-in Components**:
- `createLoadingState()` - Shimmer animation
- `createScoreRing()` - Circular progress (SVG)
- `createBreakdownCard()` - Score breakdown
- `createMaterialsCard()` - Material composition
- `createCertificationsCard()` - Badge grid
- `createInsightsCard()` - Strengths & concerns
- `createRecommendationCard()` - AI advice
- `createErrorState()` - Error handling

### Icon System (`src/utils/icons.js`)

**15+ inline SVG icons**:
- Core: leaf, check, alert, sparkles, target
- Data: barChart, trophy, clock, box, recycle
- UI: lightbulb, fabric, shield, close, spinner

**SF Symbols style** - No external dependencies

### Shadow DOM Isolation

```javascript
const host = document.createElement('div');
host.id = 'sustainability-overlay-host';
const shadow = host.attachShadow({mode: 'open'});

// Isolated CSS
const link = document.createElement('link');
link.href = chrome.runtime.getURL('src/overlay.css');
shadow.appendChild(link);
```

**Benefits**:
- No CSS conflicts with host page
- Clean separation of concerns
- Secure encapsulation

---

## Performance Optimizations

### 1. Early Extraction Timing

**Multi-strategy initialization**:
```javascript
// Strategy 1: Immediate if DOM ready
if (document.readyState === 'complete') {
  setTimeout(runAnalysis, 0);
}

// Strategy 2: DOMContentLoaded
document.addEventListener('DOMContentLoaded', runAnalysis);

// Strategy 3: Fallback for dynamic content
setTimeout(runAnalysis, 300);
```

**Result**: ~700ms faster than fixed delay

### 2. Targeted Extraction

**Before**: Process 50-200KB → Multiple LLM calls → 15-30s

**After**: Extract 4-5KB → Single LLM call → 5-15s

**Improvement**: 70% faster

### 3. Efficient Scoring

**Batch operations**:
- Single CSV load on init (cached)
- Hash map lookups for material scores
- Vectorized calculations

### 4. Lazy Loading

**Dynamic imports**:
```javascript
const {sustainabilityAdvisor} = await import(
  chrome.runtime.getURL('src/core/SustainabilityAdvisor.js')
);
```

**Benefits**:
- Faster initial load
- Load only what's needed
- Better memory usage

### 5. Deduplication

**Algorithm efficiency**:
- O(n) content signature generation
- O(n²) overlap checking (optimized with early exits)
- 95% reduction in duplicate processing

---

## Adding New Sites

### Step-by-Step Guide

**1. Create Config File**

`src/config/sites/ebay.json`:
```json
{
  "id": "ebay-global",
  "name": "eBay",
  "version": "1.0.0",
  "enabled": true,
  "detection": {
    "urlPatterns": [{
      "pattern": "https?://www\\.ebay\\..*/itm/([0-9]+)",
      "productIdGroup": 1
    }]
  },
  "extraction": {
    "selectors": {
      "alwaysInclude": [
        {
          "selector": ".x-item-title",
          "label": "Product Title",
          "baseScore": 0.90,
          "priority": "critical"
        }
      ]
    },
    "keywords": {
      "materials": ["cotton", "polyester", ...],
      "sustainability": ["recycled", "organic", ...]
    }
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

**2. Register Config**

`src/core/ConfigLoader.js`:
```javascript
const siteConfigs = [
  'amazon.json',
  'walmart.json',
  'ebay.json'  // Add this
];
```

**3. Test**

```
1. Reload extension
2. Visit product page
3. Check console logs
4. Verify extraction and analysis
```

**Time Required**: 20-30 minutes (with real HTML analysis)

### Walmart Implementation

Walmart was added using actual HTML analysis from a product page. Key findings:
- Uses `[itemprop="name"]` for product title (Schema.org)
- Material info appears in `#product-description-atf` (About this item)
- Specifications section `[data-testid="specifications"]` has "Fabric Content" field
- Content wrapped in `.dangerous-html` class contains structured material bullets

Example selectors working on Walmart:
- `[itemprop="name"]` - Product title
- `#product-description-atf` - Material bullets
- `[data-testid="specifications"]` - Specifications
- `#item-product-details` - Detailed product info

---

## URL Navigation Handling

### Single-Page Application Support

Amazon and Walmart use client-side routing, so the page doesn't reload when navigating. The extension monitors URL changes using:

1. **`popstate` event** - Back/forward buttons
2. **`pushState`/`replaceState` interception** - Link clicks
3. **Polling (2s interval)** - Fallback

**Behavior**:
- Product page → Non-product: Hides overlay/button
- Product A → Product B: Resets and analyzes new product
- Non-product → Product: Shows overlay and starts analysis
- Same product: Keeps existing analysis

This ensures the floating button only appears on actual product pages.

---

## Future Architecture Improvements

### Planned Enhancements

1. **Config Validation**: JSON Schema validation on load
2. **Remote Configs**: Fetch configs from CDN for instant updates
3. **A/B Testing**: Test different extraction strategies
4. **User Configs**: Allow users to add custom site configs
5. **Multi-pass Analysis**: Fallback strategies if first attempt fails

### Scalability Considerations

- **Memory**: Keep configs cached in memory (low overhead)
- **Performance**: Lazy load configs only when needed
- **Extensibility**: Plugin architecture for custom analyzers
- **Community**: Config contribution system via GitHub

---

## Technical Debt

### Known Issues

1. **CSV Parsing**: Currently synchronous, could block on very large files
2. **Error Handling**: Could be more granular with specific error types
3. **Config Versioning**: No migration system for config schema changes
4. **Testing**: Need comprehensive unit tests for each module

### Mitigation Plans

- Async CSV parsing with Web Workers
- Custom error classes with recovery strategies
- Semantic versioning for configs
- Jest test suite setup

---

## References

- **Chrome Prompt API**: https://developer.chrome.com/docs/ai/prompt-api
- **Chrome Summarizer API**: https://developer.chrome.com/docs/ai/summarizer-api
- **Manifest V3**: https://developer.chrome.com/docs/extensions/mv3/
- **Shadow DOM**: https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM

---

**Last Updated**: October 8, 2025  
**Architecture Version**: 3.0 (Configuration-Driven)  
**Status**: Production-Ready ✅

