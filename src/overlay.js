// Inject a shadow-rooted container so page CSS can't affect us
console.log('[AI Glass Overlay] Content script loaded');

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
    // Clear any inline styles from dragging
    container.style.transform = '';
    container.style.top = '';
    container.style.left = '';
    container.style.right = '';
    container.style.bottom = '';
    
    // Remove all position classes
    container.classList.remove('pos-top-right', 'pos-top-left', 'pos-bottom-right', 'pos-bottom-left', 'pos-center');
    
    // Add the current position class
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
      
      if (availability === 'available') {
        pill.textContent = '✅ AI is ready!';
        pill.style.background = 'rgba(230,255,235,0.35)';
        streamBtn.disabled = false;
        getBtn.disabled = false;
        
        // Create session with settings
        await loadSettings();
        const createOptions = {};
        if (settings.systemPrompt) {
          createOptions.systemPrompt = settings.systemPrompt;
        }
        if (settings.temperature !== undefined) {
          createOptions.temperature = settings.temperature;
        }
        if (settings.topK !== undefined) {
          createOptions.topK = settings.topK;
        }
        
        session = await LanguageModel.create(createOptions);
        console.log('Session created with options:', createOptions);
        
        // Verify settings were applied by reading back the session properties
        console.log('Verified session config:', {
          temperature: session.temperature,
          topK: session.topK,
          systemPrompt: createOptions.systemPrompt ? '✓ Set' : '✗ Not set'
        });
        
        // Update pill to show active settings
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

  // Smooth drag functionality using the drag handle
  let isDragging = false;
  let currentX = 0, currentY = 0;
  let initialX = 0, initialY = 0;
  
  dragHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    
    // Get current position
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
    
    // Calculate new position
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    
    // Constrain to viewport with padding
    const maxX = window.innerWidth - container.offsetWidth - 8;
    const maxY = window.innerHeight - container.offsetHeight - 8;
    
    currentX = Math.max(8, Math.min(currentX, maxX));
    currentY = Math.max(8, Math.min(currentY, maxY));
    
    // Use transform for smooth, hardware-accelerated movement
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
  
  // Use passive: false for better drag performance
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  // Close on ESC
  window.addEventListener('keydown', (e)=>{ 
    if(e.key==='Escape' && container.classList.contains('is-open')) {
      container.classList.remove('is-open'); 
    }
  });

  // Listen for toggle from background and settings updates
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
    console.log('Overlay received message:', msg);
    
    if(msg?.type==='TOGGLE_GLASS'){
      const wasOpen = container.classList.contains('is-open');
      container.classList.toggle('is-open');
      const isOpen = container.classList.contains('is-open');
      
      console.log('Overlay toggled:', wasOpen ? 'open->closed' : 'closed->open');
      
      // Apply position and check AI when opening
      if (isOpen) {
        if (!settings) {
          loadSettings().then(() => applyPosition());
        } else {
          applyPosition();
        }
        
        if (!session) {
          checkAvailability();
        }
      }
      
      sendResponse({success: true, isOpen});
    } else if(msg?.type==='SETTINGS_UPDATED'){
      console.log('Settings updated, reloading settings and session...');
      settings = msg.settings;
      // Apply new position immediately
      applyPosition();
      // Reset session to apply new settings
      session = null;
      checkAvailability();
      sendResponse({success: true});
    }
    return true; // Keep message channel open for async response
  });

  console.log('[AI Glass Overlay] Message listener registered, ready to receive commands');

  // Initialize - load settings, apply position, and check AI
  loadSettings().then(() => {
    applyPosition();
    checkAvailability();
  });
} else {
  console.log('[AI Glass Overlay] Already initialized (host exists)');
}

