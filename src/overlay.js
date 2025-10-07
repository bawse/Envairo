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
 * Initialize and run sustainability analysis
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
      
      // Analyze current page (automatically detects site and extracts)
      await sustainabilityAdvisor.analyzeCurrentPage();
    
  } catch (error) {
      console.error('[SustainabilityAdvisor] Failed:', error);
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

// Run advisor
initializeSustainabilityAdvisor();

// ============================================================================
// END SUSTAINABILITY ADVISOR
// ============================================================================

// ============================================================================
// AI GLASS OVERLAY: Interactive AI Interface
// ============================================================================

let host = document.getElementById('ai-glass-host');
if (!host){
  console.log('[AI Glass Overlay] Initializing overlay...');
  host = document.createElement('div');
  host.id = 'ai-glass-host';
  host.style.all = 'initial';
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({mode:'open'});

  const container = document.createElement('div');
  container.className = 'ai-glass-container';
  container.innerHTML = `
    <div class="ai-glass-panel">
      <div class="ai-drag-handle" title="Drag to move">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7" cy="5" r="1.5" fill="currentColor"/>
          <circle cx="13" cy="5" r="1.5" fill="currentColor"/>
          <circle cx="7" cy="10" r="1.5" fill="currentColor"/>
          <circle cx="13" cy="10" r="1.5" fill="currentColor"/>
          <circle cx="7" cy="15" r="1.5" fill="currentColor"/>
          <circle cx="13" cy="15" r="1.5" fill="currentColor"/>
        </svg>
      </div>
      <h1 class="ai-title">✨ Chrome AI Assistant</h1>
      <div class="ai-pill" id="ai-pill">Checking AI availability...</div>
      <textarea class="ai-input" id="ai-input" placeholder="Ask me anything... Try 'Write a haiku about AI'"></textarea>
      <div class="ai-actions">
        <button class="ai-btn" id="ai-stream" disabled>Stream Response</button>
        <button class="ai-btn" id="ai-get" disabled>Get Response</button>
      </div>
      <div class="ai-output" id="ai-output"></div>
    </div>`;

  // Load CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet'; 
  link.href = chrome.runtime.getURL('src/overlay.css');
  shadow.appendChild(link);
  shadow.appendChild(container);

  // Get elements
  const panel = container.querySelector('.ai-glass-panel');
  const dragHandle = container.querySelector('.ai-drag-handle');
  const pill = container.querySelector('#ai-pill');
  const input = container.querySelector('#ai-input');
  const streamBtn = container.querySelector('#ai-stream');
  const getBtn = container.querySelector('#ai-get');
  const output = container.querySelector('#ai-output');

  // AI Session
  let session = null;
  let settings = null;

  // Load settings from storage
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get('settings');
      settings = result.settings || {
        systemPrompt: 'You are a helpful AI assistant integrated into the browser. Provide concise, accurate, and friendly responses.',
        temperature: 0.7,
        topK: 40,
        saveHistory: true,
        overlayPosition: 'top-right'
      };
      console.log('Loaded settings:', settings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  // Apply overlay position from settings
  function applyPosition() {
    container.style.transform = '';
    container.style.top = '';
    container.style.left = '';
    container.style.right = '';
    container.style.bottom = '';
    
    container.classList.remove('pos-top-right', 'pos-top-left', 'pos-bottom-right', 'pos-bottom-left', 'pos-center');
    
    const position = settings?.overlayPosition || 'top-right';
    container.classList.add(`pos-${position}`);
    console.log('Applied position:', position);
  }

  // Check AI availability
  async function checkAvailability() {
    try {
      if (!window.LanguageModel) {
        pill.textContent = '❌ LanguageModel API not available. Enable the flag!';
        pill.style.background = 'rgba(255,235,235,0.40)';
        return;
      }

      const availability = await LanguageModel.availability();
      
      if (availability === 'readily' || availability === 'available') {
        pill.textContent = '✅ AI is ready!';
        pill.style.background = 'rgba(230,255,235,0.35)';
        streamBtn.disabled = false;
        getBtn.disabled = false;
        
        await loadSettings();
        const createOptions = {};
        if (settings.systemPrompt) createOptions.systemPrompt = settings.systemPrompt;
        if (settings.temperature !== undefined) createOptions.temperature = settings.temperature;
        if (settings.topK !== undefined) createOptions.topK = settings.topK;
        
        session = await LanguageModel.create(createOptions);
        console.log('Session created with options:', createOptions);
        
        pill.textContent = `✅ AI Ready | Temp: ${session.temperature} | TopK: ${session.topK}`;
        pill.style.fontSize = '12px';
      } else if (availability === 'after-download') {
        pill.textContent = '⏳ AI model is downloading. Check chrome://components';
      } else {
        pill.textContent = `⚠️ AI availability: ${availability}`;
      }
    } catch (error) {
      pill.textContent = `❌ Error: ${error.message}`;
      pill.style.background = 'rgba(255,235,235,0.40)';
    }
  }

  // Stream response
  streamBtn.addEventListener('click', async () => {
    const promptText = input.value.trim();
    if (!promptText) {
      output.textContent = 'Please enter a prompt first.';
      return;
    }
    
    try {
      streamBtn.disabled = true;
      getBtn.disabled = true;
      output.textContent = 'Thinking...';
      output.style.fontStyle = 'italic';
      
      const stream = session.promptStreaming(promptText);
      output.textContent = '';
      output.style.fontStyle = 'normal';
      
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        output.textContent = fullResponse;
      }
    } catch (error) {
      output.textContent = `Error: ${error.message}`;
      output.style.background = 'rgba(255,240,240,0.25)';
    } finally {
      streamBtn.disabled = false;
      getBtn.disabled = false;
    }
  });

  // Get response
  getBtn.addEventListener('click', async () => {
    const promptText = input.value.trim();
    if (!promptText) {
      output.textContent = 'Please enter a prompt first.';
      return;
    }
    
    try {
      streamBtn.disabled = true;
      getBtn.disabled = true;
      output.textContent = 'Thinking...';
      output.style.fontStyle = 'italic';
      
      const result = await session.prompt(promptText);
      
      output.textContent = result;
      output.style.fontStyle = 'normal';
    } catch (error) {
      output.textContent = `Error: ${error.message}`;
      output.style.background = 'rgba(255,240,240,0.25)';
    } finally {
      streamBtn.disabled = false;
      getBtn.disabled = false;
    }
  });

  // Drag functionality
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

  // Close on ESC
  window.addEventListener('keydown', (e)=>{ 
    if(e.key==='Escape' && container.classList.contains('is-open')) {
      container.classList.remove('is-open'); 
    }
  });

  // Listen for messages
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
    console.log('Overlay received message:', msg);
    
    if(msg?.type==='TOGGLE_GLASS'){
      const wasOpen = container.classList.contains('is-open');
      container.classList.toggle('is-open');
      const isOpen = container.classList.contains('is-open');
      
      console.log('Overlay toggled:', wasOpen ? 'open->closed' : 'closed->open');
      
      if (isOpen) {
        if (!settings) {
          loadSettings().then(() => applyPosition());
        } else {
          applyPosition();
        }
        if (!session) checkAvailability();
      }
      
      sendResponse({success: true, isOpen});
    } else if(msg?.type==='SETTINGS_UPDATED'){
      console.log('Settings updated, reloading...');
      settings = msg.settings;
      applyPosition();
      session = null;
      checkAvailability();
      sendResponse({success: true});
    }
    return true;
  });

  console.log('[AI Glass Overlay] Message listener registered');

  // Initialize
  loadSettings().then(() => {
    applyPosition();
    checkAvailability();
  });
} else {
  console.log('[AI Glass Overlay] Already initialized');
}