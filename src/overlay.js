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

/**
 * Initialize and run sustainability analysis with UI integration
 * Uses dynamic import for Chrome extension compatibility
 */
async function initializeSustainabilityAdvisor() {
  // Guard against multiple executions
  let hasStarted = false;
  
  const runAnalysis = async () => {
    // Prevent race conditions from multiple strategies
    if (hasStarted) {
      return;
    }
    hasStarted = true;
    
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
        hasStarted = false; // Allow retry if page changes
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
      } else if (result && result.error) {
        console.warn('[Overlay] Analysis failed:', result.error);
        showSustainabilityOverlay('error', result.error);
      }
    
  } catch (error) {
      console.error('[SustainabilityAdvisor] Failed:', error);
      showSustainabilityOverlay('error', error.message);
      hasStarted = false; // Reset on error to allow retry
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
    if (!hasStarted) {
      runAnalysis();
    }
  }, 300);
}

/**
 * Show/update sustainability overlay
 * @param {string} state - 'loading', 'results', or 'error'
 * @param {*} data - State-specific data
 */
async function showSustainabilityOverlay(state, data) {
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
    
    // Create container structure
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
    createLoadingState, 
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
    case 'loading':
      panel.appendChild(createLoadingState(data));
      break;
      
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