// Inject a shadow-rooted container so page CSS can't affect us
console.log('[AI Glass Overlay] Content script loaded');

// ============================================================================
// SUSTAINABILITY ADVISOR: Amazon Product Detection & Extraction
// ============================================================================

// Debug flag - set to true for verbose logging
const SUSTAINABILITY_DEBUG = false;

/**
 * Detects if the current page is an Amazon product page
 * @returns {Object|null} Returns object with productId if detected, null otherwise
 */
function detectAmazonProductPage() {
  const url = window.location.href;
  // Updated regex to handle product title slugs before /dp/ or /gp/product/
  // Example: amazon.com/Product-Name-Here/dp/B09H6GGYYZ/...
  const amazonProductRegex = /https?:\/\/(?:www\.|smile\.)?amazon\.(?:com|co\.uk|de|fr|ca|in|it|es|com\.au|co\.jp)\/(?:.*\/)?(?:gp\/product|dp)\/([A-Z0-9]{10})/;
  
  const match = url.match(amazonProductRegex);
  
  if (match) {
    const productId = match[1];
    console.log('[Sustainability Advisor] ✅ Amazon product detected:', productId);
    return {
      isProductPage: true,
      productId: productId,
      url: url
    };
  }
  
  return null;
}

/**
 * Extracts the main product information container from Amazon product page
 * @returns {HTMLElement|null} The product info container element or null
 */
function extractAmazonProductInfo() {
  // Amazon typically uses these containers for product information
  const selectors = [
    '#dp',                          // Main product details container
    '#dp-container',                // Alternative container
    '[data-feature-name="dp"]',     // Data attribute selector
    '#ppd',                         // Product page details
    '#centerCol'                    // Center column with product info
  ];
  
  let productContainer = null;
  
  // Try each selector until we find one
  for (const selector of selectors) {
    productContainer = document.querySelector(selector);
    if (productContainer) {
      if (SUSTAINABILITY_DEBUG) {
        console.log(`[Sustainability Advisor] Found product container using selector: ${selector}`);
      }
      break;
    }
  }
  
  if (!productContainer) {
    console.warn('[Sustainability Advisor] ⚠️ Could not find product container');
    return null;
  }
  
  return productContainer;
}

/**
 * Cleans HTML by removing unnecessary elements and keeping only relevant text content
 * @param {HTMLElement} container The container element to clean
 * @returns {string} Cleaned text content
 */
function cleanProductHTML(container) {
  if (SUSTAINABILITY_DEBUG) {
    console.log('[Sustainability Advisor] 🧹 Cleaning HTML...');
  }
  
  // Clone the container to avoid modifying the actual page
  const clone = container.cloneNode(true);
  
  // STEP 1: Remove non-content elements (scripts, styles, etc.)
  const removeSelectors = [
    'script',           // JavaScript
    'style',            // CSS
    'link',             // Stylesheets
    'noscript',         // Noscript tags
    'svg',              // SVG images (keep text but remove the svg itself)
    'iframe',           // Embedded frames
    'img',              // Images (we only need text)
    'input',            // Form inputs
    'select',           // Dropdowns
    '.a-popover',       // Popovers
    '.a-dropdown-container', // Dropdown containers
    '#nav-main',        // Main navigation
    '#navbar',          // Navbar
    '.a-carousel',      // Image carousels
    '#reviewsMedley',   // Customer reviews section (too noisy)
    '[id*="advertisement"]', // Ads
    '[id*="sponsored"]', // Sponsored content
    '[class*="ad-feedback"]', // Ad feedback
  ];
  
  // Remove all matching elements
  removeSelectors.forEach(selector => {
    const elements = clone.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });
  
  // STEP 2: Remove button elements but keep their text (in case there's useful info)
  const buttons = clone.querySelectorAll('button, .a-button, [role="button"]');
  buttons.forEach(btn => {
    // Keep the text content but remove the button wrapper
    const textNode = document.createTextNode(btn.textContent + ' ');
    btn.parentNode?.replaceChild(textNode, btn);
  });
  
  // STEP 3: Extract text from specific high-value areas first (if they exist)
  const importantContent = [];
  
  // Product title
  const title = clone.querySelector('#productTitle, #title, h1.product-title');
  if (title) {
    importantContent.push(`TITLE: ${title.textContent.trim()}`);
  }
  
  // Product features/bullets
  const features = clone.querySelectorAll('#feature-bullets li, #feature-bullets-btf li');
  if (features.length > 0) {
    importantContent.push('FEATURES:');
    features.forEach(f => {
      const text = f.textContent.trim();
      if (text) importantContent.push(`- ${text}`);
    });
  }
  
  // Product description
  const description = clone.querySelector('#productDescription, #productDescription p, .product-description');
  if (description) {
    const descText = description.textContent.trim();
    if (descText.length > 50) { // Only if it's substantial
      importantContent.push(`DESCRIPTION: ${descText}`);
    }
  }
  
  // Product details table
  const detailsTable = clone.querySelector('#productDetails_detailBullets_sections1, #productDetails_techSpec_section_1, .prodDetTable');
  if (detailsTable) {
    importantContent.push('PRODUCT DETAILS:');
    importantContent.push(detailsTable.textContent.trim());
  }
  
  // STEP 4: Get all remaining text content
  let textContent = clone.textContent;
  
  // Clean up whitespace
  textContent = textContent
    .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
    .replace(/\n+/g, ' ')           // Replace newlines with spaces
    .trim();                         // Trim leading/trailing whitespace
  
  // STEP 5: Combine important content with general content
  let finalText = '';
  if (importantContent.length > 0) {
    finalText = importantContent.join('\n\n') + '\n\n' + textContent;
  } else {
    finalText = textContent;
  }
  
  // Remove excessive whitespace in the final text
  finalText = finalText
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
  
  if (SUSTAINABILITY_DEBUG) {
    const originalSize = container.outerHTML.length;
    const cleanedSize = finalText.length;
    const reductionPercent = ((1 - cleanedSize/originalSize) * 100).toFixed(1);
    console.log(`[Sustainability Advisor] ✨ Cleaned HTML: ${originalSize.toLocaleString()} → ${cleanedSize.toLocaleString()} chars (${reductionPercent}% reduction)`);
  }
  
  return finalText;
}

/**
 * Simple text splitter that splits text into chunks with overlap
 * @param {string} text The text to split
 * @param {number} chunkSize Maximum characters per chunk
 * @param {number} chunkOverlap Number of characters to overlap between chunks
 * @returns {string[]} Array of text chunks
 */
function splitTextIntoChunks(text, chunkSize, chunkOverlap) {
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    const endIndex = startIndex + chunkSize;
    let chunk = text.substring(startIndex, endIndex);
    
    // If this isn't the last chunk and we're in the middle of a sentence,
    // try to find a natural break point (., !, ?, or newline)
    if (endIndex < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastExclamation = chunk.lastIndexOf('!');
      const lastQuestion = chunk.lastIndexOf('?');
      const lastNewline = chunk.lastIndexOf('\n');
      
      const breakPoints = [lastPeriod, lastExclamation, lastQuestion, lastNewline]
        .filter(pos => pos > chunkSize * 0.7); // Only consider break points in last 30% of chunk
      
      if (breakPoints.length > 0) {
        const bestBreakPoint = Math.max(...breakPoints);
        chunk = text.substring(startIndex, startIndex + bestBreakPoint + 1);
        startIndex = startIndex + bestBreakPoint + 1 - chunkOverlap;
      } else {
        startIndex = endIndex - chunkOverlap;
      }
    } else {
      startIndex = endIndex;
    }
    
    chunks.push(chunk.trim());
  }
  
  return chunks;
}

/**
 * Recursively summarizes text chunks until they fit within the input quota
 * Uses parallel processing for independent chunks to improve performance
 * @param {any} summarizer The Summarizer API instance
 * @param {string[]} parts Array of text parts to summarize
 * @param {boolean} isFirstLevel Whether this is the first level (can parallelize)
 * @returns {Promise<string>} Final summary
 */
async function recursiveSummarizer(summarizer, parts, isFirstLevel = false) {
  if (SUSTAINABILITY_DEBUG) {
    console.log(`[Sustainability Advisor] 🔄 Summarizing ${parts.length} parts...`);
  }
  
  let summarizedParts = [];
  
  // OPTIMIZATION: Parallelize the first level since chunks are independent
  if (isFirstLevel && parts.length > 1) {
    const startTime = performance.now();
    
    // Summarize all parts in parallel
    summarizedParts = await Promise.all(
      parts.map(part => summarizer.summarize(part.trim()))
    );
    
    const duration = ((performance.now() - startTime) / 1000).toFixed(1);
    console.log(`[Sustainability Advisor] ⚡ Parallelized ${parts.length} chunks in ${duration}s`);
  } else {
    // For recursive levels, process sequentially (usually small number of summaries)
    summarizedParts = [];
    for (let i = 0; i < parts.length; i++) {
      if (SUSTAINABILITY_DEBUG) {
        console.log(`[Sustainability Advisor] Processing part ${i + 1} of ${parts.length}...`);
      }
      const summarizedPart = await summarizer.summarize(parts[i].trim());
      summarizedParts.push(summarizedPart);
    }
  }
  
  // Now batch the summarized parts based on token limits
  let summaries = [];
  let currentSummary = [];
  
  for (const summarizedPart of summarizedParts) {
    // Check if adding this summary would exceed the input quota
    const combinedText = [...currentSummary, summarizedPart].join('\n');
    const tokenCount = await summarizer.measureInputUsage(combinedText);
    
    if (tokenCount > summarizer.inputQuota) {
      // Save the current batch and start a new one
      summaries.push(currentSummary.join('\n'));
      currentSummary = [summarizedPart];
      if (SUSTAINABILITY_DEBUG) {
        console.log(`[Sustainability Advisor] 📦 Batch complete (${summaries.length}), starting new batch`);
      }
    } else {
      currentSummary.push(summarizedPart);
    }
  }
  
  // Add the last batch
  summaries.push(currentSummary.join('\n'));
  
  if (SUSTAINABILITY_DEBUG) {
    console.log(`[Sustainability Advisor] ✅ Generated ${summaries.length} summary batch(es)`);
  }
  
  // If we only have one summary, we're done
  if (summaries.length === 1) {
    if (SUSTAINABILITY_DEBUG) {
      console.log('[Sustainability Advisor] 🎯 Final summary generated!');
    }
    return await summarizer.summarize(summaries[0]);
  }
  
  // Otherwise, recursively summarize the summaries (not parallel for safety)
  if (SUSTAINABILITY_DEBUG) {
    console.log('[Sustainability Advisor] 🔁 Recursing to summarize summaries...');
  }
  return recursiveSummarizer(summarizer, summaries, false);
}

/**
 * Uses Chrome's Summarizer API to extract sustainability-relevant information
 * Implements "summary of summaries" technique for large texts
 * Reference: https://developer.chrome.com/docs/ai/scale-summarization
 * @param {string} textContent The cleaned text content
 * @returns {Promise<Object>} Extracted product data
 */
async function extractWithSummarizer(textContent) {
  console.log('[Sustainability Advisor] 🤖 Analyzing product sustainability...');
  
  try {
    // Check if Summarizer API is available (Chrome 138+)
    if (!self.Summarizer) {
      console.warn('[Sustainability Advisor] ⚠️ Summarizer API not available. Enable at chrome://flags/#summarization-api-for-gemini-nano');
      return { error: 'Summarizer API not available', fullText: textContent };
    }
    
    // Check availability
    const availability = await self.Summarizer.availability();
    
    if (availability === 'no') {
      console.warn('[Sustainability Advisor] ⚠️ Summarizer not available');
      return { error: 'Summarizer not available', fullText: textContent };
    }
    
    if (availability === 'after-download') {
      console.warn('[Sustainability Advisor] ⏳ Model needs to download. Trigger download by calling Summarizer.create()');
      return { error: 'Model needs download', fullText: textContent };
    }
    
    // Create summarizer with sustainability-focused context
    // Enhanced context to explicitly request material information
    const summarizer = await self.Summarizer.create({
      sharedContext: 'Extract sustainability and environmental information from this product. Focus on: materials (including exact material names like TPU, plastic, metal, etc.), environmental certifications (GRS, Climate Pledge, etc.), recycled content percentage, packaging sustainability, manufacturing origin, worker welfare, and environmental impact. Include specific material composition details. Ignore pricing, shipping, and general product features.',
      type: 'key-points',      // Extract key points
      format: 'plain-text',     // Plain text output
      length: 'long'            // Long length for more detail
    });
    
    const originalLength = textContent.length;
    const chunkSize = summarizer.inputQuota;
    const needsSplitting = originalLength > chunkSize;
    
    let summary;
    let chunks = [];
    
    if (!needsSplitting) {
      // Text is small enough to process in one go
      if (SUSTAINABILITY_DEBUG) {
        console.log('[Sustainability Advisor] ✨ Processing in one chunk...');
      }
      summary = await summarizer.summarize(textContent);
      chunks = [textContent];
    } else {
      // Split text into chunks with overlap
      const chunkOverlap = 200; // Characters to overlap between chunks for context
      chunks = splitTextIntoChunks(textContent, chunkSize, chunkOverlap);
      
      console.log(`[Sustainability Advisor] 📝 Processing ${originalLength.toLocaleString()} characters in ${chunks.length} chunks...`);
      
      // Use recursive summarization with parallel processing on first level
      summary = await recursiveSummarizer(summarizer, chunks, true);
    }
    
    console.log('[Sustainability Advisor] ✅ Analysis complete!');
    console.log('[Sustainability Advisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(summary);
    console.log('[Sustainability Advisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Destroy the summarizer session to free resources
    summarizer.destroy();
    
    return {
      summary: summary,
      fullText: textContent,
      truncated: false,  // We processed everything with summary of summaries
      originalLength: originalLength,
      processedLength: originalLength,  // We processed all of it
      chunksCount: chunks.length,
      extractedAt: Date.now()
    };
    
  } catch (error) {
    console.error('[Sustainability Advisor] ❌ Error:', error.message);
    return { error: error.message, fullText: textContent };
  }
}


/**
 * Main function to detect and extract Amazon product information
 */
function initializeSustainabilityAdvisor() {
  // Detect if we're on an Amazon product page
  const detectionResult = detectAmazonProductPage();
  
  if (!detectionResult) {
    return;
  }
  
  // Prevent duplicate execution
  let hasRun = false;
  let isRunning = false;
  
  // Wait for DOM to be fully ready (Amazon pages are complex and load dynamically)
  const extractWhenReady = async () => {
    // Prevent duplicate runs
    if (isRunning || hasRun) {
      return;
    }
    
    isRunning = true;
    
    const productContainer = extractAmazonProductInfo();
    
    if (!productContainer) {
      console.warn('[Sustainability Advisor] ⚠️ Could not find product data');
      isRunning = false;
      return;
    }
    
    // Clean the HTML
    const cleanedText = cleanProductHTML(productContainer);
    
    if (SUSTAINABILITY_DEBUG) {
      console.log(`[Sustainability Advisor] 📊 Extracted ${cleanedText.length.toLocaleString()} characters`);
      console.groupCollapsed('[Sustainability Advisor] 📄 Full cleaned text (click to expand)');
      console.log(cleanedText);
      console.groupEnd();
    }
    
    // Use Summarizer API to generate key points
    const summarizerResult = await extractWithSummarizer(cleanedText);
    
    // Log summarizer results - summary is already shown in extractWithSummarizer
    if (summarizerResult.error) {
      console.warn('[Sustainability Advisor] ⚠️ Could not generate summary:', summarizerResult.error);
    }
    
    // Store for later use - assign directly to global window object
    const dataToStore = {
      productId: detectionResult.productId,
      url: detectionResult.url,
      cleanedText: cleanedText,
      summary: summarizerResult.summary || null,
      summaryError: summarizerResult.error || null,
      truncated: summarizerResult.truncated || false,
      chunksCount: summarizerResult.chunksCount || 1,
      originalLength: summarizerResult.originalLength || cleanedText.length,
      processedLength: summarizerResult.processedLength || cleanedText.length,
      extractedAt: Date.now()
    };
    
    // Ensure it's on the global window object
    if (typeof window !== 'undefined') {
      window.__sustainabilityAdvisorData = dataToStore;
    }
    // Also try self in case of worker context
    if (typeof self !== 'undefined') {
      self.__sustainabilityAdvisorData = dataToStore;
    }
    
    if (SUSTAINABILITY_DEBUG) {
      console.log('[Sustainability Advisor] 💾 Data stored');
      console.log('[Sustainability Advisor] 💡 Access with: window.__sustainabilityAdvisorData');
    }
    
    // Mark as complete
    hasRun = true;
    isRunning = false;
  };
  
  // Try extraction after a short delay (wait for dynamic content)
  setTimeout(extractWhenReady, 1000);
}

// Run the sustainability advisor initialization
initializeSustainabilityAdvisor();

// ============================================================================
// END SUSTAINABILITY ADVISOR
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

