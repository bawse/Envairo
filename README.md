# Chrome Built-in AI - Sustainability Advisor

A modern Chrome extension demonstrating Chrome's Built-in AI APIs (Prompt API & Summarizer API) through a **Sustainability Shopping Advisor** for the Google Chrome Built-in AI Challenge 2025.

## 🌱 Sustainability Shopping Advisor

**Current Status**: Phase 2 Complete ✅

The extension automatically analyzes Amazon products for:
- 📦 Material composition (fabrics, plastics, metals, etc.)
- 🌿 Environmental certifications (Climate Pledge, GRS, Nordic Swan, etc.)
- ♻️ Recycled content percentages
- 🏭 Manufacturing practices
- 📋 Care instructions and origin

**See [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) for complete documentation.**

## 📁 Project Structure

```
chrome-built-in/
├── manifest.json                # Extension configuration
├── PROJECT_DOCUMENTATION.md     # Complete technical documentation
├── src/                         # Source code
│   ├── bg.js                   # Background service worker
│   ├── overlay.js              # Content script (main logic)
│   ├── overlay.css             # Overlay styles
│   ├── popup.html              # Extension popup UI
│   ├── popup.js                # Popup logic
│   └── icons/                  # Extension icons
├── docs/                        # Design documentation
├── ideas/                       # Future project ideas
└── README.md                    # This file
```

## 🎨 Design Features

Based on the iOS glass mode aesthetic:
- **Frosted glass effect** with backdrop blur and semi-transparency
- **Modern gradient background** (purple gradient)
- **Smooth transitions** and hover effects
- **Professional spacing** and typography
- **Custom styled scrollbars**
- **Glass-morphism buttons** with subtle shadows

## Prerequisites

1. **Chrome Canary** (version 128.0.6545.0 or newer)
2. **Gemini Nano model** downloaded (at least 22 GB free storage)
3. **Prompt API flag** enabled

## Setup Instructions

### 1. Enable the Prompt API

1. Open Chrome Canary
2. Go to `chrome://flags/#prompt-api-for-gemini-nano`
3. Set to **Enabled**
4. Relaunch Chrome

### 2. Download Gemini Nano

1. Open DevTools (F12)
2. Run in console: `await LanguageModel.create();`
3. Relaunch Chrome
4. Go to `chrome://components`
5. Find "Optimization Guide On Device Model"
6. Click "Check for update" if needed
7. Wait for download to complete

### 3. Verify It Works

1. Open DevTools console
2. Run: `await LanguageModel.availability();`
3. Should return `"available"`

### 4. Load This Extension

1. Open Chrome Canary
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the folder containing this extension
6. Click the extension icon in the toolbar

## Quick Start

### Test the Sustainability Advisor

1. Visit any Amazon product page (e.g., clothing, phone cases, electronics)
2. Open DevTools Console (F12)
3. See sustainability analysis automatically generated
4. Check `window.__sustainabilityAdvisorData` for extracted info

### Test the AI Glass Interface

1. Click the extension icon in toolbar
2. Wait for "✅ AI is ready!" status
3. Type a prompt (e.g., "Write a haiku about sustainability")
4. Click "Stream Response" or "Get Response"
5. Watch the AI generate a response!

## Troubleshooting

- **"LanguageModel API not available"**: Make sure the flag is enabled and Chrome is relaunched
- **"AI model is downloading"**: Wait for download to complete at `chrome://components`
- **Error messages**: Check the console (F12) for detailed error information

## Documentation & Resources

- **[PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)** - Complete technical documentation
- [Prompt API Documentation](https://developer.chrome.com/docs/ai/prompt-api)
- [Summarizer API Documentation](https://developer.chrome.com/docs/ai/summarizer-api)
- [Chrome AI Challenge](https://googlechromeai2025.devpost.com/)

## License

Open source for the hackathon!

