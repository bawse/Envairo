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
 * Extracts relevant sections from the Amazon product page using targeted selectors
 * This dramatically reduces the amount of content that needs LLM processing
 * @returns {Array} Array of section objects with {method, selector, score, text, html}
 */
function extractRelevantSections() {
  console.log('[Sustainability Advisor] 🔍 Starting targeted section extraction...');
  
  // Keywords for relevance detection
  const MATERIAL_KEYWORDS = [
    'material', 'materials', 'fabric', 'composition', 'shell', 'lining', 'upper', 'outsole', 'insole',
    'leather', 'cotton', 'polyester', 'nylon', 'viscose', 'elastane', 'spandex', 'wool', 'silk',
    'hemp', 'linen', 'down', 'fill', 'wood', 'rubber', 'eva', 'tpu', 'tpe', 'pu', 'bpa', 'microfiber',
    'plastic', 'metal', 'aluminum', 'steel', 'glass', 'ceramic', 'bamboo', 'cork',
    'rayon', 'acrylic', 'modal', 'tencel', 'lyocell', 'acetate', 'denim', 'canvas', 'fleece',
    'mesh', 'suede', 'velvet', 'satin', 'chiffon', 'jersey', 'knit', 'woven',
    'crafted', 'care instructions', 'wash', 'breathability', 'moisture-wicking'
  ];
  
  const SUSTAINABILITY_KEYWORDS = [
    'sustainab', 'recycled', 'recyclable', 'biodegrad', 'compostable', 'organic', 'fsc', 'pefc',
    'oeko-tex', 'gots', 'fair trade', 'bluesign', 'carbon neutral', 'carbon-neutral', 'b corp',
    'waterless', 'eco', 'environment', 'packaging', 'responsibly', 'ethically', 'renewable',
    'climate pledge', 'grs', 'certified', 'certification', 'nordic swan', 'ecolabel', 'safer chemicals',
    'manufacturing practices'
  ];
  
  const INGREDIENTS_KEYWORDS = [
    'ingredient', 'inci', 'allergen', 'nutrition', 'nutritional', 'additives', 'preservatives',
    'paraben', 'sulfate', 'phthalate', 'fragrance', 'safety information', 'directions', 'usage'
  ];
  
  const KEYWORDS = [...MATERIAL_KEYWORDS, ...SUSTAINABILITY_KEYWORDS, ...INGREDIENTS_KEYWORDS];
  
  // TWO-TIER APPROACH: More general, less keyword-dependent
  
  // Tier 1: Always include (structure indicates high relevance)
  // These sections almost always contain material/product/sustainability info
  const ALWAYS_INCLUDE_SELECTORS = [
    '#productTitle',                          // Product name
    '#feature-bullets',                       // Key features ("About this item")
    '#productFactsDesktop_feature_div',       // Product facts (fabric type, care, origin, "About this item")
    '#productFactsDesktopExpander',           // Product facts expander content
    '#productOverview_feature_div',           // Product specs table
    '#productDetails_techSpec_section_1',     // Technical specifications
    '#productDetails_detailBullets_sections1',// Product details bullets
    '#prodDetails',                           // Legacy product details
    '.prodDetTable',                          // Product details table
    '#productDescription',                    // Product description
    '#aplus',                                 // A+ content (manufacturer content)
    '#aplus_feature_div',                     // A+ content container
    '#climatePledgeFriendly',                 // Climate Pledge Friendly section
    '#certificateBadge_feature_div',          // Certification badges
    '#cr-badge-row',                          // Climate pledge badge row
    '#badge-packaging'                        // Packaging badges
  ];
  
  // Tier 2: Only include if keywords match (for ambiguous sections)
  const KEYWORD_FILTERED_SELECTORS = [
    '#detailBullets_feature_div',  // Can contain mixed content
    '#poExpander'                   // Mobile product overview (may be redundant)
  ];
  
  // All known selectors combined (for duplicate detection)
  const ALL_KNOWN_SELECTORS = [...ALWAYS_INCLUDE_SELECTORS, ...KEYWORD_FILTERED_SELECTORS];
  
  function normText(s) {
    return (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }
  
  function containsAnyKeyword(text, keywords) {
    const t = normText(text);
    return keywords.some(k => t.includes(k));
  }
  
  // Detect material/sustainability indicators by pattern (catches unknown materials)
  function hasMaterialIndicators(text) {
    const patterns = [
      /made (of|from|with)/i,                    // "made of X", "made from X"
      /composed of/i,                            // "composed of X"
      /crafted from/i,                           // "crafted from X"
      /material:?\s*[\w\-]+/i,                   // "Material: X" or "Material X"
      /fabric:?\s*[\w\-]+/i,                     // "Fabric: X"
      /fabric type/i,                            // "Fabric type" (structured data)
      /care instructions/i,                      // "Care instructions" (often near materials)
      /\d+%\s+[\w\-]+/i,                         // "50% cotton", "100% recycled"
      /ingredients?:/i,                          // "Ingredients:", "Ingredient:"
      /contains?:/i,                             // "Contains:", "Contain:"
      /certified (by|to)/i,                      // "certified by X", "certified to X"
      /certification/i,                          // "certification"
      /upper:?\s*[\w\-]+/i,                      // "Upper: leather" (footwear)
      /outsole:?\s*[\w\-]+/i,                    // "Outsole: rubber"
      /insole:?\s*[\w\-]+/i,                     // "Insole: foam"
      /lining:?\s*[\w\-]+/i,                     // "Lining: polyester"
      /fill:?\s*[\w\-]+/i,                       // "Fill: down"
      /shell:?\s*[\w\-]+/i,                      // "Shell: nylon"
      /construction:?\s*[\w\-]+/i,               // "Construction: X"
      /finish:?\s*[\w\-]+/i,                     // "Finish: X"
      /viscose|bamboo|spandex/i,                 // Common sustainable materials
      /high-quality material/i,                  // Common material callouts
      /product details/i                         // Section header that often has materials
    ];
    return patterns.some(p => p.test(text));
  }
  
  // 1. Collect by known selectors (TWO-TIER APPROACH)
  function collectBySelectors() {
    const sections = [];
    
    // TIER 1: Always include (no keyword filtering - structure indicates relevance)
    for (const sel of ALWAYS_INCLUDE_SELECTORS) {
      document.querySelectorAll(sel).forEach((el) => {
        if (!el || !el.innerText?.trim()) return;
        const text = el.innerText || '';
        const normTextVal = normText(text);
        
        // Calculate base score by selector importance
        let baseScore = 0.7;
        if (sel === '#productTitle') baseScore = 0.9;
        else if (sel === '#climatePledgeFriendly') baseScore = 0.85;
        else if (sel === '#productFactsDesktop_feature_div') baseScore = 0.85;
        else if (sel === '#productFactsDesktopExpander') baseScore = 0.85;
        else if (sel === '#certificateBadge_feature_div') baseScore = 0.8;
        else if (sel === '#productOverview_feature_div') baseScore = 0.75;
        else if (sel === '#feature-bullets') baseScore = 0.75;
        
        // BONUS: Boost score if contains material indicators (pattern-based)
        if (hasMaterialIndicators(text)) {
          baseScore += 0.1;
        }
        
        sections.push({
          method: 'selector-always',
          selector: sel,
          score: baseScore,
          text: text.trim().substring(0, 3000),
          html: el.outerHTML.substring(0, 5000)
        });
      });
    }
    
    // TIER 2: Only include if keywords match (for ambiguous sections)
    for (const sel of KEYWORD_FILTERED_SELECTORS) {
      document.querySelectorAll(sel).forEach((el) => {
        if (!el || !el.innerText?.trim()) return;
        const text = el.innerText || '';
        const normTextVal = normText(text);
        
        // Must contain keywords or material indicators
        if (containsAnyKeyword(normTextVal, KEYWORDS) || hasMaterialIndicators(text)) {
          sections.push({
            method: 'selector-filtered',
            selector: sel,
            score: 0.7,
            text: text.trim().substring(0, 3000),
            html: el.outerHTML.substring(0, 5000)
          });
        }
      });
    }
    
    return sections;
  }
  
  // 2. Collect by heading crawl
  function collectByHeadings() {
    const sections = [];
    const candidates = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"],.aplus h3,.a-section h3'));
    
    for (const h of candidates) {
      const headingText = h.innerText || '';
      const normHeadingText = normText(headingText);
      // Include if has keywords OR material indicators
      if (!normHeadingText || !(containsAnyKeyword(normHeadingText, KEYWORDS) || hasMaterialIndicators(headingText))) continue;
      
      let blockText = h.innerText || '';
      let score = 0.6;
      
      // First, try to capture following siblings
      let node = h.nextElementSibling;
      let steps = 0;
      
      while (node && steps < 10) {
        if (node.matches('h1,h2,h3,h4,h5,h6,[role="heading"]')) break;
        
        const nodeText = node.innerText || '';
        const txt = normText(nodeText);
        // Include if has keywords OR material indicators, or if we're in first 3 siblings
        if (txt && (containsAnyKeyword(txt, KEYWORDS) || hasMaterialIndicators(nodeText) || steps < 3)) {
          blockText += '\n' + nodeText;
          // Higher score if explicitly relevant
          score = Math.max(score, (containsAnyKeyword(txt, KEYWORDS) || hasMaterialIndicators(nodeText)) ? 0.7 : 0.6);
        } else if (steps > 5) {
          break;
        }
        node = node.nextElementSibling;
        steps++;
      }
      
      // If we didn't capture much content, try capturing parent container
      // This helps with nested structures like #climatePledgeFriendly
      // BUT: Skip this if parent has an ID that's already in our selector list
      if (blockText.length < 200) {
        let parent = h.parentElement;
        let depth = 0;
        while (parent && depth < 3) {
          // Skip if this parent is already covered by a selector
          if (parent.id && ALL_KNOWN_SELECTORS.includes('#' + parent.id)) {
            break;
          }
          
          const parentText = parent.innerText || '';
          if (parentText.length > blockText.length && parentText.length < 3000) {
            const parentNormText = normText(parentText);
            // Include if has keywords OR material indicators
            if (containsAnyKeyword(parentNormText, KEYWORDS) || hasMaterialIndicators(parentText)) {
              blockText = parentText;
              score = 0.70; // Lower score for parent container (selector version is better)
              break;
            }
          }
          parent = parent.parentElement;
          depth++;
        }
      }
      
      // Only add if we have substantial content
      if (blockText.length < 100) continue;
      
      sections.push({
        method: 'heading-crawl',
        heading: h.innerText?.trim(),
        score,
        text: blockText.trim().substring(0, 3000),
        html: h.outerHTML.substring(0, 5000)
      });
    }
    return sections;
  }
  
  // 3. Deduplicate - improved to catch similar content
  function dedupe(sections) {
    const seen = new Set();
    const result = [];
    
    for (const s of sections) {
      const normTextVal = normText(s.text);
      
      // Create multiple signatures to catch duplicates
      const sig1 = normTextVal.substring(0, 300);  // First 300 chars
      const sig2 = normTextVal.substring(100, 400); // Middle section
      
      // Check if this is substantially similar to something we've seen
      let isDuplicate = false;
      for (const seenSig of seen) {
        // If 80%+ of the shorter signature is contained in a seen signature, it's a duplicate
        const shorter = sig1.length < seenSig.length ? sig1 : seenSig;
        const longer = sig1.length >= seenSig.length ? sig1 : seenSig;
        
        if (longer.includes(shorter.substring(0, Math.floor(shorter.length * 0.8)))) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        seen.add(sig1);
        result.push(s);
      }
    }
    
    return result;
  }
  
  // 4. Rank by keyword family coverage (reduced bonus to avoid over-prioritizing)
  function rank(sections) {
    function familyScore(text) {
      const t = normText(text);
      let f = 0;
      if (MATERIAL_KEYWORDS.some(k => t.includes(k))) f++;
      if (SUSTAINABILITY_KEYWORDS.some(k => t.includes(k))) f++;
      if (INGREDIENTS_KEYWORDS.some(k => t.includes(k))) f++;
      return f;
    }
    
    return sections
      .map(s => ({
        ...s,
        // Reduced from 0.15 to 0.05 per family to avoid overwhelming product info
        score: (s.score || 0.5) + 0.05 * familyScore(s.text || '')
      }))
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }
  
  // Execute extraction
  const selectorSections = collectBySelectors();
  const headingSections = collectByHeadings();
  const allSections = [...selectorSections, ...headingSections];
  const uniqueSections = dedupe(allSections);
  const rankedSections = rank(uniqueSections);
  
  // Count sections by method for debugging
  const alwaysIncluded = selectorSections.filter(s => s.method === 'selector-always').length;
  const keywordFiltered = selectorSections.filter(s => s.method === 'selector-filtered').length;
  
  console.log(`[Sustainability Advisor] 📊 Extraction complete: ${rankedSections.length} relevant sections found`);
  console.log(`[Sustainability Advisor]    - Always included (structural): ${alwaysIncluded}`);
  console.log(`[Sustainability Advisor]    - Keyword filtered: ${keywordFiltered}`);
  console.log(`[Sustainability Advisor]    - From headings: ${headingSections.length}`);
  console.log(`[Sustainability Advisor]    - After deduplication: ${uniqueSections.length}`);
  
  return rankedSections;
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
 * Now uses targeted extraction to process only relevant sections (much faster!)
 * @param {Array} sections Array of extracted sections from extractRelevantSections()
 * @returns {Promise<Object>} Extracted product data
 */
async function extractWithSummarizer(sections) {
  const startTime = performance.now();
  console.log('[Sustainability Advisor] 🤖 Analyzing extracted sections...');
  
  try {
    // Check if Summarizer API is available (Chrome 138+)
    if (!self.Summarizer) {
      console.warn('[Sustainability Advisor] ⚠️ Summarizer API not available. Enable at chrome://flags/#summarization-api-for-gemini-nano');
      return { error: 'Summarizer API not available' };
    }
    
    // Check availability
    const availability = await self.Summarizer.availability();
    
    if (availability === 'no') {
      console.warn('[Sustainability Advisor] ⚠️ Summarizer not available');
      return { error: 'Summarizer not available' };
    }
    
    if (availability === 'after-download') {
      console.warn('[Sustainability Advisor] ⏳ Model needs to download. Trigger download by calling Summarizer.create()');
      return { error: 'Model needs download' };
    }
    
    // Create summarizer with sustainability-focused context
    const summarizer = await self.Summarizer.create({
      sharedContext: 'Extract sustainability and environmental information from this product. Focus on: materials (including exact material names like TPU, plastic, metal, etc.), environmental certifications (GRS, Climate Pledge, etc.), recycled content percentage, packaging sustainability, manufacturing origin, worker welfare, and environmental impact. Include specific material composition details. Ignore pricing, shipping, and general product features.',
      type: 'key-points',
      format: 'plain-text',
      length: 'long'
    });
    
    const inputQuota = summarizer.inputQuota;
    console.log(`[Sustainability Advisor] 📏 Summarizer input quota: ${inputQuota.toLocaleString()} chars`);
    
    // Build focused content from top-scored sections
    // CRITICAL: Always include product title and key info first, then add sustainability
    let focusedContent = '';
    let sectionsUsed = [];
    let totalChars = 0;
    const targetSize = Math.floor(inputQuota * 0.85); // Use 85% of quota to be safe
    
    console.log(`[Sustainability Advisor] 🎯 Selecting sections (target: ${targetSize.toLocaleString()} chars)...`);
    
    // Phase 1: Always include critical product info selectors (regardless of score)
    const criticalSelectors = [
      '#productTitle', 
      '#productFactsDesktop_feature_div', 
      '#productFactsDesktopExpander',
      '#feature-bullets', 
      '#productOverview_feature_div'
    ];
    const criticalSections = [];
    const otherSections = [];
    
    for (const section of sections) {
      if (section.selector && criticalSelectors.includes(section.selector)) {
        criticalSections.push(section);
      } else {
        otherSections.push(section);
      }
    }
    
    console.log(`[Sustainability Advisor] 📌 Found ${criticalSections.length} critical product sections, ${otherSections.length} other sections`);
    
    // Add critical sections first
    for (const section of criticalSections) {
      const sectionText = section.text || '';
      const potentialLength = totalChars + sectionText.length + 100;
      
      if (potentialLength < targetSize) {
        const header = `\n\n[Section: ${section.selector}]`;
        focusedContent += header + '\n' + sectionText;
        totalChars = focusedContent.length;
        sectionsUsed.push(section);
      }
    }
    
    // Phase 2: Add other high-scoring sections (sustainability, etc.)
    for (const section of otherSections) {
      const sectionText = section.text || '';
      const potentialLength = totalChars + sectionText.length + 100;
      
      if (potentialLength < targetSize) {
        const header = section.selector 
          ? `\n\n[Section: ${section.selector}]` 
          : `\n\n[Section: ${section.heading || 'Unknown'}]`;
        
        focusedContent += header + '\n' + sectionText;
        totalChars = focusedContent.length;
        sectionsUsed.push(section);
      } else {
        break; // Stop when we reach capacity
      }
    }
    
    console.log(`[Sustainability Advisor] ✂️ Selected ${sectionsUsed.length} sections (${totalChars.toLocaleString()} chars)`);
    console.log('[Sustainability Advisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Sustainability Advisor] 📄 FOCUSED CONTENT TO ANALYZE:');
    console.log('[Sustainability Advisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Show each section with its score
    sectionsUsed.forEach((section, idx) => {
      const label = section.selector || section.heading || 'Unknown';
      const preview = section.text.substring(0, 200).replace(/\n/g, ' ');
      console.log(`[Sustainability Advisor] ${idx + 1}. [Score: ${section.score.toFixed(2)}] ${label}`);
      console.log(`[Sustainability Advisor]    Preview: ${preview}...`);
    });
    
    console.log('[Sustainability Advisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Show full focused content in a collapsible group
    console.groupCollapsed('[Sustainability Advisor] 📋 Full Focused Content (click to expand)');
    console.log(focusedContent);
    console.groupEnd();
    
    // Verify we're within quota
    const measuredTokens = await summarizer.measureInputUsage(focusedContent);
    console.log(`[Sustainability Advisor] ⚖️ Content size check: ${measuredTokens.toLocaleString()} / ${inputQuota.toLocaleString()} tokens (${Math.round(measuredTokens / inputQuota * 100)}%)`);
    
    if (measuredTokens > inputQuota) {
      console.warn('[Sustainability Advisor] ⚠️ Content exceeds quota, trimming...');
      // Trim to fit
      const ratio = inputQuota / measuredTokens * 0.9; // 90% to be safe
      focusedContent = focusedContent.substring(0, Math.floor(focusedContent.length * ratio));
      console.log(`[Sustainability Advisor] ✂️ Trimmed to ${focusedContent.length.toLocaleString()} chars`);
    }
    
    // Single summarizer pass!
    console.log('[Sustainability Advisor] 🔄 Generating summary...');
    const summarizeStart = performance.now();
    const summary = await summarizer.summarize(focusedContent);
    const summarizeDuration = ((performance.now() - summarizeStart) / 1000).toFixed(2);
    
    const totalDuration = ((performance.now() - startTime) / 1000).toFixed(2);
    
    console.log('[Sustainability Advisor] ✅ Analysis complete!');
    console.log(`[Sustainability Advisor] ⏱️ Timing: Summarization ${summarizeDuration}s | Total ${totalDuration}s`);
    console.log('[Sustainability Advisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Sustainability Advisor] 🌱 SUSTAINABILITY SUMMARY:');
    console.log('[Sustainability Advisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(summary);
    console.log('[Sustainability Advisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Destroy the summarizer session to free resources
    summarizer.destroy();
    
    return {
      summary: summary,
      focusedContent: focusedContent,
      sectionsUsed: sectionsUsed.length,
      totalSectionsFound: sections.length,
      processedChars: totalChars,
      summarizationTime: summarizeDuration,
      totalTime: totalDuration,
      extractedAt: Date.now()
    };
    
  } catch (error) {
    console.error('[Sustainability Advisor] ❌ Error:', error.message);
    return { error: error.message };
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
    const overallStart = performance.now();
    
    // NEW APPROACH: Direct targeted extraction
    console.log('[Sustainability Advisor] 🚀 Starting targeted extraction...');
    const sections = extractRelevantSections();
    
    if (!sections || sections.length === 0) {
      console.warn('[Sustainability Advisor] ⚠️ No relevant sections found');
      isRunning = false;
      return;
    }
    
    const extractionTime = ((performance.now() - overallStart) / 1000).toFixed(2);
    console.log(`[Sustainability Advisor] ⚡ Extraction completed in ${extractionTime}s`);
    
    // Use Summarizer API to analyze the focused sections
    const summarizerResult = await extractWithSummarizer(sections);
    
    const overallDuration = ((performance.now() - overallStart) / 1000).toFixed(2);
    
    // Log summarizer results - summary is already shown in extractWithSummarizer
    if (summarizerResult.error) {
      console.warn('[Sustainability Advisor] ⚠️ Could not generate summary:', summarizerResult.error);
    } else {
      console.log(`[Sustainability Advisor] 🎉 Complete! Total time: ${overallDuration}s (Extraction: ${extractionTime}s + Analysis: ${summarizerResult.summarizationTime}s)`);
    }
    
    // Store for later use - assign directly to global window object
    const dataToStore = {
      productId: detectionResult.productId,
      url: detectionResult.url,
      summary: summarizerResult.summary || null,
      summaryError: summarizerResult.error || null,
      focusedContent: summarizerResult.focusedContent || null,
      sectionsUsed: summarizerResult.sectionsUsed || 0,
      totalSectionsFound: summarizerResult.totalSectionsFound || 0,
      processedChars: summarizerResult.processedChars || 0,
      extractionTime: extractionTime,
      summarizationTime: summarizerResult.summarizationTime || null,
      totalTime: overallDuration,
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
    
    console.log('[Sustainability Advisor] 💾 Data stored');
    console.log('[Sustainability Advisor] 💡 Access with: window.__sustainabilityAdvisorData');
    
    // Mark as complete
    hasRun = true;
    isRunning = false;
  };
  
  // Start extraction as soon as possible
  // Try multiple strategies to catch the content when ready
  
  // Strategy 1: Try immediately (might already be loaded)
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // DOM is already loaded, try extraction immediately
    setTimeout(extractWhenReady, 0);
  }
  
  // Strategy 2: Wait for DOMContentLoaded if not yet fired
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(extractWhenReady, 100);
    });
  }
  
  // Strategy 3: Fallback - try after a short delay for dynamically loaded content
  // Amazon loads some content via JS after initial page load
  setTimeout(extractWhenReady, 300);
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

