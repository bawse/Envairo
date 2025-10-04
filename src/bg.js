// Background service worker - handles keyboard command
chrome.commands.onCommand.addListener(async (command) => {
  console.log('Command received:', command);
  
  if (command !== "toggle-glass") return;
  
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    console.log('Active tab:', tab?.id);
    
    if (!tab?.id) {
      console.error('No active tab found');
      return;
    }
    
    // Check if we can access this tab (can't inject on chrome:// pages)
    if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
      console.error('Cannot inject on chrome:// or extension pages');
      return;
    }
    
    try {
      // Try to send message first
      await chrome.tabs.sendMessage(tab.id, {type: "TOGGLE_GLASS"});
      console.log('Message sent to tab:', tab.id);
    } catch (error) {
      // If content script not loaded, inject it
      console.log('Content script not found, injecting...');
      
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
        
        console.log('Content script injected, waiting a moment...');
        
        // Wait a bit for script to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Now send the message
        await chrome.tabs.sendMessage(tab.id, {type: "TOGGLE_GLASS"});
        console.log('Message sent after injection');
      } catch (injectError) {
        console.error('Failed to inject content script:', injectError);
      }
    }
  } catch (error) {
    console.error('Error toggling overlay:', error);
  }
});

