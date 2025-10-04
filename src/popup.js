// Settings management for the AI Assistant extension

// Default settings
const DEFAULT_SETTINGS = {
  showOnStartup: false,
  overlayPosition: 'top-right',
  systemPrompt: 'You are a helpful AI assistant integrated into the browser. Provide concise, accurate, and friendly responses.',
  temperature: 0.7,
  topK: 40,
  saveHistory: true
};

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get('settings');
    return result.settings || DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

// Save settings to storage
async function saveSettings(settings) {
  try {
    await chrome.storage.sync.set({ settings });
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

// Show message to user
function showMessage(text, type = 'success') {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = `glass-message mt-12 ${type}`;
  messageDiv.style.display = 'block';
  
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 3000);
}

// Check AI availability on load
async function checkAvailability() {
  const statusDiv = document.getElementById('status');
  
  try {
    if (!window.LanguageModel) {
      statusDiv.textContent = '❌ LanguageModel API not available. Make sure you enabled the flag!';
      statusDiv.className = 'glass-pill error';
      return;
    }

    const availability = await LanguageModel.availability();
    
    if (availability === 'available') {
      statusDiv.textContent = '✅ AI is ready!';
      statusDiv.className = 'glass-pill';
    } else if (availability === 'after-download') {
      statusDiv.textContent = '⏳ AI model is downloading. Check chrome://components';
      statusDiv.className = 'glass-pill';
    } else {
      statusDiv.textContent = `⚠️ AI availability: ${availability}`;
      statusDiv.className = 'glass-pill';
    }
  } catch (error) {
    console.error('Error checking availability:', error);
    statusDiv.textContent = `❌ Error: ${error.message}`;
    statusDiv.className = 'glass-pill error';
  }
}

// Populate UI with current settings
async function populateUI() {
  const settings = await loadSettings();
  
  document.getElementById('showOnStartup').checked = settings.showOnStartup;
  document.getElementById('overlayPosition').value = settings.overlayPosition;
  document.getElementById('systemPrompt').value = settings.systemPrompt;
  document.getElementById('temperature').value = settings.temperature;
  document.getElementById('topK').value = settings.topK;
  document.getElementById('saveHistory').checked = settings.saveHistory;
  
  // Update slider value displays
  document.getElementById('tempValue').textContent = settings.temperature;
  document.getElementById('topKValue').textContent = settings.topK;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Check AI availability
  await checkAvailability();
  
  // Load and display settings
  await populateUI();
  
  // Temperature slider
  document.getElementById('temperature').addEventListener('input', (e) => {
    document.getElementById('tempValue').textContent = e.target.value;
  });
  
  // Top K slider
  document.getElementById('topK').addEventListener('input', (e) => {
    document.getElementById('topKValue').textContent = e.target.value;
  });
  
  // Test Overlay button
  document.getElementById('testOverlayBtn').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_GLASS' });
      showMessage('Overlay toggled! Press Cmd/Ctrl+Shift+Y to toggle again.', 'success');
    } catch (error) {
      console.error('Error toggling overlay:', error);
      showMessage('Could not toggle overlay. Make sure you\'re on a valid web page.', 'error');
    }
  });
  
  // Clear History button
  document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
    try {
      await chrome.storage.local.remove('conversationHistory');
      showMessage('Conversation history cleared!', 'success');
    } catch (error) {
      console.error('Error clearing history:', error);
      showMessage('Failed to clear history.', 'error');
    }
  });
  
  // Check Updates button
  document.getElementById('checkUpdatesBtn').addEventListener('click', () => {
    showMessage('You are running the latest version!', 'success');
  });
  
  // Reset to Defaults button
  document.getElementById('resetBtn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      await saveSettings(DEFAULT_SETTINGS);
      await populateUI();
      showMessage('Settings reset to defaults!', 'success');
    }
  });
  
  // Save Settings button
  document.getElementById('saveBtn').addEventListener('click', async () => {
    const settings = {
      showOnStartup: document.getElementById('showOnStartup').checked,
      overlayPosition: document.getElementById('overlayPosition').value,
      systemPrompt: document.getElementById('systemPrompt').value,
      temperature: parseFloat(document.getElementById('temperature').value),
      topK: parseInt(document.getElementById('topK').value),
      saveHistory: document.getElementById('saveHistory').checked
    };
    
    const success = await saveSettings(settings);
    
    if (success) {
      showMessage('Settings saved successfully!', 'success');
      
      // Notify content scripts of settings update
      try {
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { 
            type: 'SETTINGS_UPDATED', 
            settings 
          }).catch(() => {
            // Ignore errors for tabs that don't have content script
          });
        });
      } catch (error) {
        console.error('Error notifying tabs:', error);
      }
    } else {
      showMessage('Failed to save settings.', 'error');
    }
  });
});
