// Popup script for Envairo - Sustainability Product Advisor

// ============================================================================
// STATE & INITIALIZATION
// ============================================================================

let productHistory = [];

// Update extension status
function updateStatus() {
  const statusBadge = document.getElementById('status');
  // Note: AI APIs are only available in content scripts, not extension popups
  // So we just show that the extension is active
  statusBadge.innerHTML = '<span style="display: inline-block; width: 6px; height: 6px; background: currentColor; border-radius: 50%; margin-right: 6px;"></span>Active';
  statusBadge.className = 'status-badge ready';
}

// Load product history from storage
async function loadProductHistory() {
  try {
    const result = await chrome.storage.local.get('productHistory');
    productHistory = result.productHistory || [];
    return productHistory;
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
}

// Save product history to storage
async function saveProductHistory(history) {
  try {
    await chrome.storage.local.set({ productHistory: history });
    return true;
  } catch (error) {
    console.error('Error saving history:', error);
    return false;
  }
}

// ============================================================================
// UI RENDERING
// ============================================================================

// Get score category for styling
function getScoreCategory(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score >= 20) return 'poor';
  return 'bad';
}

// Format date as relative time
function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

// Render a single history item
function createHistoryItem(product) {
  const item = document.createElement('div');
  item.className = 'history-item';
  item.dataset.url = product.url;
  
  const scoreCategory = getScoreCategory(product.score);
  const scorePercentage = Math.min(100, Math.max(0, product.score));
  
  item.innerHTML = `
    <div class="history-item-header">
      <div class="history-item-title">${product.title}</div>
      <div class="history-item-score">
        <span class="history-score-number">${product.score}/100</span>
        <div class="history-score-bar">
          <div class="history-score-fill ${scoreCategory}" style="width: ${scorePercentage}%"></div>
        </div>
      </div>
    </div>
    <div class="history-item-meta">
      <span class="history-item-date">${formatRelativeTime(product.timestamp)}</span>
      <span>•</span>
      <span class="history-item-site">${product.site}</span>
    </div>
  `;
  
  // Make item clickable to open product page
  item.addEventListener('click', () => {
    chrome.tabs.create({ url: product.url });
  });
  
  return item;
}

// Update stats display
function updateStats(history) {
  const totalAnalyzed = history.length;
  const avgScore = history.length > 0
    ? Math.round(history.reduce((sum, p) => sum + p.score, 0) / history.length)
    : 0;
  
  // Update count
  const totalElement = document.getElementById('totalAnalyzed');
  totalElement.innerHTML = `
    <div class="stat-value">
      <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      ${totalAnalyzed}
    </div>
  `;
  
  // Update average score with visual indicator
  const avgElement = document.getElementById('avgScore');
  if (history.length > 0) {
    const scoreCategory = getScoreCategory(avgScore);
    avgElement.innerHTML = `
      <div class="score-indicator ${scoreCategory}">
        ${avgScore}
      </div>
    `;
  } else {
    avgElement.innerHTML = `<div class="stat-value">—</div>`;
  }
}

// Render the history list
function renderHistory(history) {
  const historyList = document.getElementById('historyList');
  const emptyState = document.getElementById('emptyState');
  
  // Clear existing items
  historyList.innerHTML = '';
  
  if (history.length === 0) {
    emptyState.classList.add('visible');
    historyList.style.display = 'none';
  } else {
    emptyState.classList.remove('visible');
    historyList.style.display = 'flex';
    
    // Sort by timestamp (most recent first) and render only top 5
    const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);
    const recentProducts = sortedHistory.slice(0, 5); // Limit to 5 most recent
    recentProducts.forEach(product => {
      historyList.appendChild(createHistoryItem(product));
    });
  }
  
  // Update stats
  updateStats(history);
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

// Toggle overlay on current tab
async function toggleOverlay() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if it's a valid URL (not chrome://, etc.)
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showNotification('Cannot toggle overlay on this page', 'error');
      return;
    }
    
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_GLASS' });
  } catch (error) {
    console.error('Error toggling overlay:', error);
    showNotification('Make sure you\'re on a product page', 'error');
  }
}

// Clear all history
async function clearAllHistory() {
  if (!confirm('Clear all product history? This cannot be undone.')) {
    return;
  }
  
  productHistory = [];
  await saveProductHistory(productHistory);
  renderHistory(productHistory);
  showNotification('History cleared', 'success');
}

// Show temporary notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 20px;
    border-radius: 12px;
    background: ${type === 'error' ? 'rgba(255,235,235,0.95)' : 'rgba(230,255,235,0.95)'};
    border: 1px solid ${type === 'error' ? 'rgba(255,100,100,0.6)' : 'rgba(46,184,76,0.6)'};
    color: ${type === 'error' ? '#c81e1e' : '#2e8b57'};
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 6px 20px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideDown 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Update status badge
  updateStatus();
  
  // Load and display history
  await loadProductHistory();
  renderHistory(productHistory);
  
  // Set up event listeners
  document.getElementById('toggleOverlayBtn').addEventListener('click', toggleOverlay);
  document.getElementById('clearHistoryBtn').addEventListener('click', clearAllHistory);
  
  // Listen for history updates from content scripts
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PRODUCT_ANALYZED') {
      // Add new product to history
      const newProduct = {
        title: message.data.title,
        url: message.data.url,
        site: message.data.site,
        score: message.data.score,
        timestamp: Date.now()
      };
      
      // Remove duplicates (same URL)
      productHistory = productHistory.filter(p => p.url !== newProduct.url);
      
      // Add to beginning and limit to 50 items
      productHistory.unshift(newProduct);
      if (productHistory.length > 50) {
        productHistory = productHistory.slice(0, 50);
      }
      
      // Save and re-render
      saveProductHistory(productHistory);
      renderHistory(productHistory);
    }
  });
  
  // Add keyboard shortcut info
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcut = isMac ? 'Cmd+Shift+Y' : 'Ctrl+Shift+Y';
  document.querySelector('.button-hint').textContent = shortcut;
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translate(-50%, -20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translate(-50%, 0);
    }
    to {
      opacity: 0;
      transform: translate(-50%, -20px);
    }
  }
`;
document.head.appendChild(style);
