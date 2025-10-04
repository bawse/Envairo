# Chrome Built-in AI Test Extension

A modern, glass-morphism styled Chrome extension to test the Chrome Built-in AI Prompt API for the Google Chrome Built-in AI Challenge 2025.

## 📁 Project Structure

```
chrome-built-in/
├── manifest.json          # Extension configuration
├── src/                   # Source code
│   ├── bg.js             # Background service worker
│   ├── overlay.js        # Content script
│   ├── overlay.css       # Overlay styles
│   ├── popup.html        # Extension popup UI
│   ├── popup.js          # Popup logic
│   └── icons/            # Extension icons
├── docs/                  # Documentation
├── ideas/                 # Future project ideas
└── README.md              # This file
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

## Usage

1. Click the extension icon
2. Wait for "✅ AI is ready!" status
3. Type a prompt (e.g., "Write a haiku about coding")
4. Click "Send Prompt"
5. Watch the AI generate a response!

## Troubleshooting

- **"LanguageModel API not available"**: Make sure the flag is enabled and Chrome is relaunched
- **"AI model is downloading"**: Wait for download to complete at `chrome://components`
- **Error messages**: Check the console (F12) for detailed error information

## Resources

- [Prompt API Documentation](https://developer.chrome.com/docs/ai/prompt-api)
- [Chrome AI Challenge](https://googlechromeai2025.devpost.com/)
- [Early Preview Program Docs](docs.md)

## License

Open source for the hackathon!

