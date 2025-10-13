/**
 * Chrome Built-in AI Extension - Configuration-Driven Architecture
 * 
 * ARCHITECTURE:
 * - Logic (core/) is separated from configuration (config/)
 * - Easy to add new sites by creating JSON config files
 * - Testable, maintainable, extensible
 * 
 * NOTE: Uses dynamic imports for Chrome extension compatibility
 */

console.log('[AI Glass Overlay] Content script loaded (configuration-driven architecture)');

// ============================================================================
// SUSTAINABILITY ADVISOR: Configuration-Driven Product Analysis
// ============================================================================

// Global state to track if analysis is currently running
let isAnalysisRunning = false;

/**
 * Initialize and run sustainability analysis with UI integration
 * Uses dynamic import for Chrome extension compatibility
 */
async function initializeSustainabilityAdvisor() {
  const runAnalysis = async () => {
    // Prevent race conditions from multiple strategies
    if (isAnalysisRunning) {
      console.log('[Overlay] Analysis already running, skipping...');
      return;
    }
    isAnalysisRunning = true;
    
    try {
      // Dynamic import for Chrome extension compatibility
      const { sustainabilityAdvisor } = await import(
        chrome.runtime.getURL('src/core/SustainabilityAdvisor.js')
      );
      
      // Initialize config system
      await sustainabilityAdvisor.initialize();
      
      // First, detect if this is a product page
      const detection = sustainabilityAdvisor.detectProductPage();
      
      if (!detection) {
        // Not a product page - don't show overlay automatically
        console.log('[Overlay] Not a product page, overlay will remain hidden');
        // Store state for manual toggle
        window._isProductPage = false;
        isAnalysisRunning = false; // Allow retry if page changes
        return;
      }
      
      // Is a product page
      window._isProductPage = true;
      
      // Show loading overlay
      showSustainabilityOverlay('loading', 'extracting');
      
      // Update loading state
      showSustainabilityOverlay('loading', 'analyzing');
      
      // Analyze current page (automatically detects site and extracts)
      const result = await sustainabilityAdvisor.analyzeCurrentPage();
      
      // Display results if successful
      if (result && result.success) {
        console.log('[Overlay] Analysis complete, displaying results...');
        showSustainabilityOverlay('results', result);
        
        // Save to history and notify popup
        saveProductToHistory(result);
      } else if (result && result.error) {
        console.warn('[Overlay] Analysis failed:', result.error);
        showSustainabilityOverlay('error', result.error);
      }
    
  } catch (error) {
      console.error('[SustainabilityAdvisor] Failed:', error);
      showSustainabilityOverlay('error', error.message);
    } finally {
      isAnalysisRunning = false; // Reset flag when done
    }
  };

  // Strategy 1: Try immediately if DOM ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(runAnalysis, 0);
  }
  
  // Strategy 2: Wait for DOMContentLoaded if loading
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(runAnalysis, 100);
    }, { once: true }); // Use 'once' option to prevent multiple fires
  }

  // Strategy 3: Fallback for dynamic content (only if not already started)
  setTimeout(() => {
    if (!isAnalysisRunning) {
      runAnalysis();
    }
  }, 300);
}

/**
 * Save product analysis to history and notify popup
 * @param {Object} result - Analysis result object
 */
async function saveProductToHistory(result) {
  try {
    // Extract relevant data for history
    const productData = {
      title: result.extracted?.title || document.title,
      url: window.location.href,
      site: result.site || 'Unknown',
      score: result.score?.overall || 0,
      timestamp: Date.now()
    };
    
    console.log('[Overlay] Saving product to history:', productData);
    
    // Load existing history
    const storage = await chrome.storage.local.get('productHistory');
    let history = storage.productHistory || [];
    
    // Remove duplicates (same URL)
    history = history.filter(p => p.url !== productData.url);
    
    // Add to beginning and limit to 50 items
    history.unshift(productData);
    if (history.length > 50) {
      history = history.slice(0, 50);
    }
    
    // Save back to storage
    await chrome.storage.local.set({ productHistory: history });
    
    // Notify popup if it's open
    try {
      chrome.runtime.sendMessage({
        type: 'PRODUCT_ANALYZED',
        data: productData
      });
    } catch (error) {
      // Popup might not be open, that's okay
      console.log('[Overlay] Popup not listening (that\'s okay)');
    }
    
    console.log('[Overlay] Product saved to history successfully');
  } catch (error) {
    console.error('[Overlay] Failed to save product to history:', error);
  }
}

/**
 * Show floating progress button during loading
 * @param {string} phase - 'extracting' or 'analyzing'
 */
async function showFloatingProgressButton(phase) {
  // Check if already exists
  let progressHost = document.getElementById('envairo-progress-host');
  
  if (!progressHost) {
    // Create shadow DOM for progress button
    progressHost = document.createElement('div');
    progressHost.id = 'envairo-progress-host';
    progressHost.style.all = 'initial';
    document.documentElement.appendChild(progressHost);
    
    const shadow = progressHost.attachShadow({ mode: 'open' });
    
    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('src/overlay.css');
    shadow.appendChild(link);
    
    // Import and create floating button
    const { createFloatingProgressButton } = await import(
      chrome.runtime.getURL('src/utils/uiComponents.js')
    );
    
    const button = createFloatingProgressButton(0);
    shadow.appendChild(button);
    
    progressHost._shadow = shadow;
    progressHost._button = button;
  }
  
  // Animate progress from 0 to 95% (we'll complete at 100% when results come)
  // Slower animations for better UX
  animateProgress(0, 95, phase === 'extracting' ? 4000 : 6000);
}

/**
 * Animate progress bar
 * @param {number} start - Start percentage
 * @param {number} end - End percentage
 * @param {number} duration - Duration in ms
 */
async function animateProgress(start, end, duration) {
  const { updateFloatingProgress } = await import(
    chrome.runtime.getURL('src/utils/uiComponents.js')
  );
  
  const startTime = Date.now();
  const progressDiff = end - start;
  
  function update() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic for smooth animation
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentProgress = start + (progressDiff * easeProgress);
    
    updateFloatingProgress(currentProgress);
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

/**
 * Convert floating progress button to toggle button
 */
async function convertToToggleButton() {
  const progressHost = document.getElementById('envairo-progress-host');
  if (!progressHost) return;
  
  // Complete to 100% first
  try {
    const { updateFloatingProgress, convertButtonToToggle } = await import(
      chrome.runtime.getURL('src/utils/uiComponents.js')
    );
    
    // Animate to 100%
    updateFloatingProgress(100);
    
    // After brief delay, convert to toggle button
    setTimeout(() => {
      convertButtonToToggle();
      
      // Add click handler to toggle overlay
      const button = progressHost._shadow.querySelector('#envairo-progress-button');
      if (button) {
        button.style.cursor = 'pointer';
        button.onclick = () => {
          const container = document.getElementById('sustainability-overlay-host')?._container;
          if (container) {
            const isOpen = container.classList.toggle('is-open');
            
            // Update button appearance based on overlay state
            const logo = button.querySelector('.progress-button-logo');
            if (logo) {
              if (isOpen) {
                // Overlay is open - show active state
                logo.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 3px rgba(46, 184, 76, 0.5)';
              } else {
                // Overlay is closed - show subtle state
                logo.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 3px rgba(46, 184, 76, 0.2)';
              }
            }
          }
        };
      }
    }, 500);
  } catch (e) {
    console.log('[Overlay] Could not update button:', e);
  }
}

/**
 * Show/update sustainability overlay
 * @param {string} state - 'loading', 'results', or 'error'
 * @param {*} data - State-specific data
 */
async function showSustainabilityOverlay(state, data) {
  // For loading state, show floating button instead
  if (state === 'loading') {
    await showFloatingProgressButton(data);
    return;
  }
  
  // For results/error, convert button to toggle and show full overlay
  await convertToToggleButton();
  
  // Ensure overlay container exists
  let sustainabilityHost = document.getElementById('sustainability-overlay-host');
  
  if (!sustainabilityHost) {
    console.log('[Sustainability Overlay] Creating overlay container...');
    sustainabilityHost = document.createElement('div');
    sustainabilityHost.id = 'sustainability-overlay-host';
    sustainabilityHost.style.all = 'initial';
    document.documentElement.appendChild(sustainabilityHost);
    
    const shadow = sustainabilityHost.attachShadow({ mode: 'open' });
    
    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('src/overlay.css');
    shadow.appendChild(link);
    
    // Create container structure (initially open to show results)
    const container = document.createElement('div');
    container.className = 'ai-glass-container pos-bottom-right is-open';
    container.id = 'sustainability-container';
    
    const panel = document.createElement('div');
    panel.className = 'ai-glass-panel';
    panel.id = 'sustainability-panel';
    
    // Add drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'ai-drag-handle';
    dragHandle.title = 'Drag to move';
    dragHandle.innerHTML = `
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="7" cy="5" r="1.5" fill="currentColor"/>
        <circle cx="13" cy="5" r="1.5" fill="currentColor"/>
        <circle cx="7" cy="10" r="1.5" fill="currentColor"/>
        <circle cx="13" cy="10" r="1.5" fill="currentColor"/>
        <circle cx="7" cy="15" r="1.5" fill="currentColor"/>
        <circle cx="13" cy="15" r="1.5" fill="currentColor"/>
      </svg>
    `;
    
    panel.appendChild(dragHandle);
    container.appendChild(panel);
    shadow.appendChild(container);
    
    // Setup drag functionality
    setupDragFunctionality(dragHandle, container);
    
    // Store references
    sustainabilityHost._shadow = shadow;
    sustainabilityHost._container = container;
    sustainabilityHost._panel = panel;
  }
  
  const panel = sustainabilityHost._panel;
  
  // Dynamic import UI components
  const { 
    createErrorState, 
    buildSustainabilityPanel,
    createCloseButton
  } = await import(chrome.runtime.getURL('src/utils/uiComponents.js'));
  
  // Clear current content (preserve drag handle)
  const dragHandle = panel.querySelector('.ai-drag-handle');
  panel.innerHTML = '';
  if (dragHandle) {
    panel.appendChild(dragHandle);
  }
  
  // Add close button
  const closeBtn = createCloseButton(() => {
    sustainabilityHost._container.classList.remove('is-open');
  });
  panel.appendChild(closeBtn);
  
  // Render based on state
  switch (state) {
    case 'results':
      panel.appendChild(buildSustainabilityPanel(data));
      break;
      
    case 'error':
      panel.appendChild(createErrorState(data));
      break;
  }
  
  // Make sure it's visible
  sustainabilityHost._container.classList.add('is-open');
}

/**
 * Setup drag functionality for overlay
 * @param {HTMLElement} dragHandle - Drag handle element
 * @param {HTMLElement} container - Container element
 */
function setupDragFunctionality(dragHandle, container) {
  let isDragging = false;
  let currentX = 0, currentY = 0;
  let initialX = 0, initialY = 0;
  
  dragHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const rect = container.getBoundingClientRect();
    initialX = e.clientX - rect.left;
    initialY = e.clientY - rect.top;
    isDragging = true;
    container.classList.add('is-dragging');
    dragHandle.style.cursor = 'grabbing';
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  });
  
  const onMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    const maxX = window.innerWidth - container.offsetWidth - 8;
    const maxY = window.innerHeight - container.offsetHeight - 8;
    currentX = Math.max(8, Math.min(currentX, maxX));
    currentY = Math.max(8, Math.min(currentY, maxY));
    container.style.transform = `translate(${currentX}px, ${currentY}px)`;
    container.style.top = '0';
    container.style.left = '0';
    container.style.right = 'auto';
    container.style.bottom = 'auto';
  };
  
  const onMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    container.classList.remove('is-dragging');
    dragHandle.style.cursor = 'grab';
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// Run advisor on page load
initializeSustainabilityAdvisor();

// ============================================================================
// URL CHANGE DETECTION: Handle SPA Navigation
// ============================================================================

/**
 * Monitor URL changes and hide/show overlay accordingly
 * This handles single-page app navigation (Amazon, Walmart, etc.)
 */
let lastUrl = window.location.href;

// Check if we're still on a product page and hide overlay if not
async function checkUrlChange() {
  const currentUrl = window.location.href;
  
  if (currentUrl !== lastUrl) {
    console.log('[Overlay] URL changed, checking if still on product page...');
    console.log('[Overlay] Old URL:', lastUrl);
    console.log('[Overlay] New URL:', currentUrl);
    
    lastUrl = currentUrl;
    
    try {
      // Import and initialize advisor
      const { sustainabilityAdvisor } = await import(
        chrome.runtime.getURL('src/core/SustainabilityAdvisor.js')
      );
      
      if (!sustainabilityAdvisor.initialized) {
        await sustainabilityAdvisor.initialize();
      }
      
      // Check if new URL is a product page
      const detection = sustainabilityAdvisor.detectProductPage();
      
      if (!detection) {
        // No longer on a product page - hide the overlay and button
        console.log('[Overlay] Not a product page anymore, hiding overlay...');
        hideOverlayAndButton();
        window._isProductPage = false;
        
        // Reset advisor state to allow re-analysis if user navigates to another product
        sustainabilityAdvisor.reset();
      } else if (window._isProductPage === false) {
        // Navigated FROM non-product page TO product page
        console.log('[Overlay] Navigated to product page from non-product page');
        sustainabilityAdvisor.reset();
        window._isProductPage = true;
        isAnalysisRunning = false; // Reset analysis flag
        
        // Show overlay and start analysis
        showOverlayAndButton();
        setTimeout(() => {
          initializeSustainabilityAdvisor();
        }, 500);
      } else {
        // Navigated to a different product page
        console.log('[Overlay] New product page detected:', detection.config.name);
        console.log('[Overlay] Product ID:', detection.productId);
        
        // Check if it's a different product
        const oldProductId = window.__sustainabilityAdvisorData?.productId;
        if (oldProductId !== detection.productId) {
          console.log('[Overlay] Different product detected, resetting for new analysis...');
          
          // Hide current overlay
          hideOverlayAndButton();
          
          // Reset state
          sustainabilityAdvisor.reset();
          window._isProductPage = true;
          isAnalysisRunning = false; // Reset analysis flag
          
          // Re-run analysis for new product
          setTimeout(() => {
            initializeSustainabilityAdvisor();
          }, 500); // Small delay to let page finish loading
        } else {
          console.log('[Overlay] Same product, keeping current overlay');
          // Make sure overlay is visible in case it was hidden
          showOverlayAndButton();
        }
      }
    } catch (error) {
      console.error('[Overlay] Error checking URL change:', error);
    }
  }
}

/**
 * Hide the overlay and floating button
 */
function hideOverlayAndButton() {
  // Hide floating button
  const progressHost = document.getElementById('envairo-progress-host');
  if (progressHost) {
    progressHost.style.display = 'none';
    console.log('[Overlay] Floating button hidden');
  }
  
  // Hide main overlay
  const sustainabilityHost = document.getElementById('sustainability-overlay-host');
  if (sustainabilityHost && sustainabilityHost._container) {
    sustainabilityHost._container.classList.remove('is-open');
    sustainabilityHost.style.display = 'none';
    console.log('[Overlay] Main overlay hidden');
  }
}

/**
 * Show the overlay and floating button (when navigating to product page)
 */
function showOverlayAndButton() {
  // Show floating button
  const progressHost = document.getElementById('envairo-progress-host');
  if (progressHost) {
    progressHost.style.display = '';
    console.log('[Overlay] Floating button shown');
  }
  
  // Show main overlay (but keep it closed initially)
  const sustainabilityHost = document.getElementById('sustainability-overlay-host');
  if (sustainabilityHost) {
    sustainabilityHost.style.display = '';
    console.log('[Overlay] Main overlay container shown');
  }
}

// Monitor URL changes using multiple strategies

// Strategy 1: Listen for popstate (back/forward buttons)
window.addEventListener('popstate', () => {
  console.log('[Overlay] popstate event detected');
  setTimeout(checkUrlChange, 100);
});

// Strategy 2: Monitor pushState and replaceState (programmatic navigation)
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  originalPushState.apply(this, args);
  console.log('[Overlay] pushState detected');
  setTimeout(checkUrlChange, 100);
};

history.replaceState = function(...args) {
  originalReplaceState.apply(this, args);
  console.log('[Overlay] replaceState detected');
  setTimeout(checkUrlChange, 100);
};

// Strategy 3: Poll for URL changes (fallback for edge cases)
// This catches any navigation we might have missed
setInterval(checkUrlChange, 2000);

console.log('[Overlay] URL change monitoring active');

// ============================================================================
// END SUSTAINABILITY ADVISOR
// ============================================================================

// ============================================================================
// MESSAGE LISTENER: Toggle Sustainability Overlay with Keyboard Shortcut
// ============================================================================

/**
 * Listen for keyboard shortcut to toggle sustainability overlay
 */
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  console.log('[Overlay] Received message:', msg);
  
  if (msg?.type === 'TOGGLE_GLASS') {
    const sustainabilityHost = document.getElementById('sustainability-overlay-host');
    
    // If overlay exists, just toggle it regardless of page type
    if (sustainabilityHost && sustainabilityHost._container) {
      const container = sustainabilityHost._container;
      const wasOpen = container.classList.contains('is-open');
      container.classList.toggle('is-open');
      const isOpen = container.classList.contains('is-open');
      
      // Update floating button visual state
      const progressHost = document.getElementById('envairo-progress-host');
      if (progressHost && progressHost._shadow) {
        const button = progressHost._shadow.querySelector('#envairo-progress-button');
        const logo = button?.querySelector('.progress-button-logo');
        if (logo) {
          if (isOpen) {
            logo.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 3px rgba(46, 184, 76, 0.5)';
          } else {
            logo.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 3px rgba(46, 184, 76, 0.2)';
          }
        }
      }
      
      console.log('[Overlay] Overlay toggled:', wasOpen ? 'open->closed' : 'closed->open');
      sendResponse({ success: true, isOpen });
      return true;
    }
    
    // No overlay exists yet - check if we should create one
    
    // Check if detection has completed
    if (window._isProductPage === false) {
      // Detected as not a product page - show informative message
      console.log('[Overlay] Not on product page, showing info message');
      await showNotProductPageMessage();
      sendResponse({ success: true, isOpen: true, isProductPage: false });
      return true;
    }
    
    // If still initializing, try to detect now
    if (window._isProductPage === undefined) {
      try {
        console.log('[Overlay] Detection not complete, checking now...');
        const { sustainabilityAdvisor } = await import(
          chrome.runtime.getURL('src/core/SustainabilityAdvisor.js')
        );
        await sustainabilityAdvisor.initialize();
        const detection = sustainabilityAdvisor.detectProductPage();
        
        if (!detection) {
          window._isProductPage = false;
          await showNotProductPageMessage();
          sendResponse({ success: true, isOpen: true, isProductPage: false });
          return true;
        }
        window._isProductPage = true;
      } catch (error) {
        console.error('[Overlay] Error during manual detection:', error);
      }
    }
    
    // If we get here, something went wrong
    console.warn('[Overlay] Sustainability overlay not initialized - may not be a product page');
    sendResponse({ success: false, message: 'Overlay not available on this page' });
  }
  
  return true;
});

/**
 * Show a message when user toggles on a non-product page
 */
async function showNotProductPageMessage() {
  // Ensure overlay container exists
  let sustainabilityHost = document.getElementById('sustainability-overlay-host');
  
  if (!sustainabilityHost) {
    console.log('[Overlay] Creating overlay for non-product page message...');
    sustainabilityHost = document.createElement('div');
    sustainabilityHost.id = 'sustainability-overlay-host';
    sustainabilityHost.style.all = 'initial';
    document.documentElement.appendChild(sustainabilityHost);
    
    const shadow = sustainabilityHost.attachShadow({ mode: 'open' });
    
    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('src/overlay.css');
    shadow.appendChild(link);
    
    // Create container structure (compact for non-product page)
  const container = document.createElement('div');
    container.className = 'ai-glass-container pos-bottom-right is-open compact-message';
    container.id = 'sustainability-container';
    
    const panel = document.createElement('div');
    panel.className = 'ai-glass-panel';
    panel.id = 'sustainability-panel';
    
    // Add drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'ai-drag-handle';
    dragHandle.title = 'Drag to move';
    dragHandle.innerHTML = `
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7" cy="5" r="1.5" fill="currentColor"/>
          <circle cx="13" cy="5" r="1.5" fill="currentColor"/>
          <circle cx="7" cy="10" r="1.5" fill="currentColor"/>
          <circle cx="13" cy="10" r="1.5" fill="currentColor"/>
          <circle cx="7" cy="15" r="1.5" fill="currentColor"/>
          <circle cx="13" cy="15" r="1.5" fill="currentColor"/>
        </svg>
    `;
    
    panel.appendChild(dragHandle);
    container.appendChild(panel);
  shadow.appendChild(container);
    
    // Setup drag functionality
    setupDragFunctionality(dragHandle, container);
    
    // Store references
    sustainabilityHost._shadow = shadow;
    sustainabilityHost._container = container;
    sustainabilityHost._panel = panel;
  }
  
  const panel = sustainabilityHost._panel;
  const container = sustainabilityHost._container;
  
  // Ensure compact styling
  container.classList.add('compact-message');
  
  // Dynamic import UI components
  const { createCloseButton } = await import(chrome.runtime.getURL('src/utils/uiComponents.js'));
  
  // Clear current content (preserve drag handle)
  const dragHandle = panel.querySelector('.ai-drag-handle');
  panel.innerHTML = '';
  if (dragHandle) {
    panel.appendChild(dragHandle);
  }
  
  // Add close button
  const closeBtn = createCloseButton(() => {
    sustainabilityHost._container.classList.remove('is-open');
  });
  panel.appendChild(closeBtn);
  
  // Create not-a-product-page message
  const messageContent = document.createElement('div');
  messageContent.className = 'sustainability-content';
  messageContent.innerHTML = `
    <div class="not-product-page-message">
      <div class="message-icon">🔍</div>
      <h2 class="message-title">Not a Product Page</h2>
      <p class="message-text">Navigate to a product page to see sustainability analysis.</p>
    </div>
  `;
  
  panel.appendChild(messageContent);
  
  // Make sure it's visible
  sustainabilityHost._container.classList.add('is-open');
}

console.log('[Overlay] Message listener registered for sustainability overlay toggle');