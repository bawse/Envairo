// Background service worker - handles keyboard command
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-glass") return;
  
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    if (!tab?.id) {
      return;
    }
    
    // Check if we can access this tab (can't inject on chrome:// pages)
    if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
      return;
    }
    
    try {
      // Try to send message first
      await chrome.tabs.sendMessage(tab.id, {type: "TOGGLE_GLASS"});
    } catch (error) {
      // If content script not loaded, inject it
      try {
        // Inject CSS
        await chrome.scripting.insertCSS({
          target: {tabId: tab.id},
          files: ['src/overlay.css']
        });
        
        // Inject JS
        await chrome.scripting.executeScript({
          target: {tabId: tab.id},
          files: ['src/overlay.js']
        });
        
        // Wait a bit for script to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Now send the message
        await chrome.tabs.sendMessage(tab.id, {type: "TOGGLE_GLASS"});
      } catch (injectError) {
        console.error('[Envairo] Failed to inject content script:', injectError);
      }
    }
  } catch (error) {
    console.error('[Envairo] Error toggling overlay:', error);
  }
});

