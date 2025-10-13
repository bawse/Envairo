/**
 * UI Components Builder for Sustainability Overlay
 * Generates all visual components with proper styling and animations
 */

import { getIconSVG } from './icons.js';

/**
 * Create loading state UI
 * @param {string} phase - 'extracting' or 'analyzing'
 * @returns {HTMLElement} Loading container
 */
export function createLoadingState(phase = 'extracting') {
  const container = document.createElement('div');
  container.className = 'loading-container animate-fade-in';
  
  const messages = {
    extracting: {
      useImage: true,
      text: 'Analyzing Product...',
      subtext: 'Extracting product information'
    },
    analyzing: {
      useImage: true,
      text: 'AI Analysis in Progress',
      subtext: 'Powered by Chrome Built-in AI'
    }
  };
  
  const msg = messages[phase] || messages.extracting;
  
  // Create logo image or icon
  let iconHtml;
  if (msg.useImage) {
    const logoUrl = chrome.runtime.getURL('src/icons/icon-64.png');
    iconHtml = `<img src="${logoUrl}" alt="Envairo" class="loading-logo" style="width: 64px; height: 64px; object-fit: contain; animation: pulse 2s ease-in-out infinite;">`;
  } else {
    iconHtml = `<div class="loading-spinner icon icon-xl">${getIconSVG(msg.icon)}</div>`;
  }
  
  container.innerHTML = `
    ${iconHtml}
    <div class="loading-text">${msg.text}</div>
    <div class="loading-subtext">${msg.subtext}</div>
    <div class="loading-bar">
      <div class="loading-bar-fill"></div>
    </div>
  `;
  
  return container;
}

/**
 * Create circular score ring with SVG
 * @param {number} score - Score value (0-100)
 * @param {string} tier - Score tier (A+, A, B, C, D)
 * @returns {HTMLElement} Score ring container
 */
export function createScoreRing(score, tier) {
  const container = document.createElement('div');
  container.className = 'score-ring-container animate-scale-in';
  
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const remaining = circumference - progress;
  
  // Normalize tier for CSS class
  const tierClass = tier.toLowerCase().replace('+', '-plus');
  
  // SVG Gradients for each tier
  const gradients = `
    <defs>
      <linearGradient id="gradient-a-plus" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#2EC74C;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#34C759;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="gradient-a" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#30D158;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#32D74B;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="gradient-b" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FFD60A;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#FFC700;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="gradient-c" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FF9F0A;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#FF9500;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="gradient-d" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FF453A;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#FF3B30;stop-opacity:1" />
      </linearGradient>
    </defs>
  `;
  
  container.innerHTML = `
    <div class="score-ring">
      <svg viewBox="0 0 140 140">
        ${gradients}
        <circle class="score-ring-bg" cx="70" cy="70" r="${radius}"/>
        <circle 
          class="score-ring-progress tier-${tierClass}" 
          cx="70" 
          cy="70" 
          r="${radius}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${remaining}"
        />
      </svg>
      <div class="score-ring-center">
        <div class="score-number">${score}</div>
        <div class="score-total">/100</div>
      </div>
    </div>
    <div class="score-tier-badge tier-${tierClass}">${tier}</div>
  `;
  
  return container;
}

/**
 * Create breakdown card with all score components
 * @param {Object} breakdown - Score breakdown data
 * @returns {HTMLElement} Breakdown card
 */
export function createBreakdownCard(breakdown) {
  const card = document.createElement('div');
  card.className = 'glass-card animate-slide-in animate-delay-1';
  
  const items = [
    {
      icon: 'barChart',
      label: 'Material Score',
      value: breakdown.base_material_score,
      type: 'neutral',
      max: 100,
      showValue: false, // Base score - just show bar
      tooltip: 'Base sustainability score from the materials used in this product'
    },
    {
      icon: 'trophy',
      label: 'Certifications',
      value: breakdown.certification_bonus,
      type: 'positive',
      max: 15,
      showValue: true, // Show +8, +10, etc.
      tooltip: 'Bonus points for environmental or safety certifications'
    },
    {
      icon: 'clock',
      label: 'Durability',
      value: breakdown.durability_bonus,
      type: 'positive',
      max: 10,
      showValue: true,
      tooltip: 'Bonus for longevity features like warranties or rechargeable batteries'
    },
    {
      icon: 'box',
      label: 'Packaging',
      value: breakdown.packaging_bonus,
      type: 'positive',
      max: 5,
      showValue: true,
      tooltip: 'Bonus for eco-friendly packaging materials'
    },
    {
      icon: 'recycle',
      label: 'Circularity',
      value: breakdown.circularity_penalty,
      type: 'negative',
      max: 10,
      showValue: true,
      tooltip: 'Penalty for end-of-life concerns like non-recyclable materials or single-use design'
    }
  ];
  
  const header = document.createElement('div');
  header.className = 'section-header';
  header.innerHTML = `
    <span class="icon icon-sm">${getIconSVG('barChart')}</span>
    Score Breakdown
  `;
  
  card.appendChild(header);
  
  items.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'breakdown-item';
    
    const percent = Math.abs(item.value) / item.max * 100;
    const valueClass = item.value > 0 ? 'positive' : (item.value < 0 ? 'negative' : '');
    
    // For bonus/penalty items, show +/- indicator
    // For material score, hide the number
    let displayValue = '';
    if (item.showValue && item.value !== 0) {
      displayValue = item.value > 0 ? `+${Math.round(item.value)}` : Math.round(item.value);
    }
    
    itemEl.innerHTML = `
      <div class="breakdown-icon ${item.type}">
        <span class="icon icon-sm">${getIconSVG(item.icon)}</span>
      </div>
      <div class="breakdown-content">
        <div class="breakdown-label">
          <div class="label-with-tooltip">
            <span>${item.label}</span>
            <span class="tooltip-trigger">
              <span class="icon icon-xs">${getIconSVG('questionCircle')}</span>
              <span class="tooltip-content">${item.tooltip}</span>
            </span>
          </div>
          ${displayValue ? `<span class="breakdown-value ${valueClass}">${displayValue}</span>` : ''}
        </div>
        <div class="breakdown-bar">
          <div class="breakdown-bar-fill ${item.type}" style="width: ${percent}%"></div>
        </div>
      </div>
    `;
    
    card.appendChild(itemEl);
  });
  
  return card;
}

/**
 * Get material color based on properties
 * @param {Object} material - Material object
 * @param {number} index - Material index for color variation
 * @returns {string} CSS color
 */
function getMaterialColor(material, index) {
  const recyclable = material.recyclable?.toLowerCase();
  const score = material.reference_score || 50;
  
  // Color by recyclability and score
  if (recyclable === 'yes' && score > 70) {
    return ['#34C759', '#32D74B', '#30D158'][index % 3]; // Greens
  } else if (recyclable === 'yes') {
    return ['#0A84FF', '#64D2FF', '#5AC8FA'][index % 3]; // Blues
  } else if (recyclable === 'limited') {
    return ['#FFD60A', '#FFC700', '#FF9F0A'][index % 3]; // Yellows
  } else {
    return ['#8E8E93', '#AEAEB2', '#C7C7CC'][index % 3]; // Grays
  }
}

/**
 * Create materials composition section
 * @param {Array} materials - Array of material objects
 * @returns {HTMLElement|null} Materials card or null if no materials
 */
export function createMaterialsCard(materials) {
  // Return null if no materials
  if (!materials || materials.length === 0) {
    return null;
  }
  
  const card = document.createElement('div');
  card.className = 'glass-card animate-slide-in animate-delay-2';
  
  const header = document.createElement('div');
  header.className = 'section-header';
  header.innerHTML = `
    <span class="icon icon-sm">${getIconSVG('fabric')}</span>
    Materials Composition
  `;
  
  card.appendChild(header);
  
  // Materials list
  const list = document.createElement('div');
  list.className = 'materials-list';
  
  materials.forEach((material, index) => {
    const color = getMaterialColor(material, index);
    const item = document.createElement('div');
    item.className = 'material-item';
    
    item.innerHTML = `
      <div class="material-color" style="background: ${color}"></div>
      <div class="material-info">
        <span class="material-name">${material.name}</span>
        <span class="material-percentage">${(material.percentage * 100).toFixed(0)}%</span>
      </div>
      <span class="material-score">${material.reference_score}/100</span>
    `;
    
    list.appendChild(item);
  });
  
  card.appendChild(list);
  
  // Visual bar
  const bar = document.createElement('div');
  bar.className = 'materials-bar';
  
  materials.forEach((material, index) => {
    const segment = document.createElement('div');
    segment.className = 'material-segment';
    segment.style.width = `${material.percentage * 100}%`;
    segment.style.background = getMaterialColor(material, index);
    segment.title = `${material.name}: ${(material.percentage * 100).toFixed(0)}%`;
    bar.appendChild(segment);
  });
  
  card.appendChild(bar);
  
  return card;
}

/**
 * Create certifications section
 * @param {Array} certifications - Array of certification strings
 * @returns {HTMLElement} Certifications card
 */
export function createCertificationsCard(certifications) {
  const card = document.createElement('div');
  card.className = 'glass-card animate-slide-in animate-delay-3';
  
  const header = document.createElement('div');
  header.className = 'section-header';
  header.innerHTML = `
    <span class="icon icon-sm">${getIconSVG('shield')}</span>
    Certifications
  `;
  
  card.appendChild(header);
  
  if (!certifications || certifications.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'no-certifications';
    empty.textContent = 'No certifications found';
    card.appendChild(empty);
    return card;
  }
  
  const grid = document.createElement('div');
  grid.className = 'certifications-grid';
  
  certifications.forEach(cert => {
    const badge = document.createElement('div');
    badge.className = 'certification-badge';
    badge.innerHTML = `
      <span class="icon icon-sm">${getIconSVG('check')}</span>
      <span>${cert}</span>
    `;
    grid.appendChild(badge);
  });
  
  card.appendChild(grid);
  
  return card;
}

/**
 * Create insights section (strengths & concerns)
 * @param {Array} strengths - Array of strength strings
 * @param {Array} concerns - Array of concern strings
 * @param {Array} certifications - Optional array of certification strings
 * @returns {HTMLElement} Insights card
 */
export function createInsightsCard(strengths, concerns, certifications = []) {
  // Ensure we have arrays
  const strengthsList = Array.isArray(strengths) ? strengths : [];
  const concernsList = Array.isArray(concerns) ? concerns : [];
  const certificationsList = Array.isArray(certifications) ? certifications : [];
  
  // Skip if no data
  if (strengthsList.length === 0 && concernsList.length === 0 && certificationsList.length === 0) {
    return null;
  }
  
  const card = document.createElement('div');
  card.className = 'glass-card animate-slide-in animate-delay-3';
  
  const container = document.createElement('div');
  container.className = 'insights-container';
  
  // Strengths section (includes certifications)
  if (strengthsList.length > 0 || certificationsList.length > 0) {
    const strengthSection = document.createElement('div');
    strengthSection.className = 'insight-section';
    
    const header = document.createElement('div');
    header.className = 'insight-section-header';
    header.innerHTML = `
      <span class="icon">${getIconSVG('check')}</span>
      Strengths
    `;
    strengthSection.appendChild(header);
    
    const badges = document.createElement('div');
    badges.className = 'insight-badges';
    
    // Add certifications first with shield icon
    certificationsList.forEach(cert => {
      const badge = document.createElement('div');
      badge.className = 'insight-badge strength certification';
      badge.innerHTML = `
        <span class="icon">${getIconSVG('shield')}</span>
        <span>${cert}</span>
      `;
      badges.appendChild(badge);
    });
    
    // Then add regular strengths with check icon
    strengthsList.forEach(strength => {
      const badge = document.createElement('div');
      badge.className = 'insight-badge strength';
      badge.innerHTML = `
        <span class="icon">${getIconSVG('check')}</span>
        <span>${strength}</span>
      `;
      badges.appendChild(badge);
    });
    
    strengthSection.appendChild(badges);
    container.appendChild(strengthSection);
  }
  
  // Concerns section
  if (concernsList.length > 0) {
    const concernSection = document.createElement('div');
    concernSection.className = 'insight-section';
    
    const header = document.createElement('div');
    header.className = 'insight-section-header';
    header.innerHTML = `
      <span class="icon">${getIconSVG('alert')}</span>
      Concerns
    `;
    concernSection.appendChild(header);
    
    const badges = document.createElement('div');
    badges.className = 'insight-badges';
    
    concernsList.forEach(concern => {
      const badge = document.createElement('div');
      badge.className = 'insight-badge concern';
      badge.innerHTML = `
        <span class="icon">${getIconSVG('alert')}</span>
        <span>${concern}</span>
      `;
      badges.appendChild(badge);
    });
    
    concernSection.appendChild(badges);
    container.appendChild(concernSection);
  }
  
  card.appendChild(container);
  
  return card;
}

/**
 * Create recommendation card
 * @param {string} recommendation - Recommendation text
 * @returns {HTMLElement|null} Recommendation card or null if no recommendation
 */
export function createRecommendationCard(recommendation) {
  if (!recommendation) {
    return null;
  }
  
  const card = document.createElement('div');
  card.className = 'recommendation-card animate-slide-in animate-delay-5';
  
  card.innerHTML = `
    <div class="recommendation-icon">
      <span class="icon">${getIconSVG('lightbulb')}</span>
    </div>
    <div class="recommendation-content">
      <div class="recommendation-title">Recommendation</div>
      <div class="recommendation-text">${recommendation}</div>
    </div>
  `;
  
  return card;
}

/**
 * Create error state UI
 * @param {string} errorMessage - Error message to display
 * @returns {HTMLElement} Error container
 */
export function createErrorState(errorMessage) {
  const container = document.createElement('div');
  container.className = 'error-container animate-fade-in';
  
  container.innerHTML = `
    <div class="error-icon icon icon-xl">
      ${getIconSVG('alert')}
    </div>
    <div class="error-title">Analysis Failed</div>
    <div class="error-message">${errorMessage}</div>
  `;
  
  return container;
}

/**
 * Create close button
 * @param {Function} onClick - Click handler
 * @returns {HTMLElement} Close button
 */
export function createCloseButton(onClick) {
  const button = document.createElement('button');
  button.className = 'close-button';
  button.innerHTML = `<span class="icon icon-sm">${getIconSVG('close')}</span>`;
  button.addEventListener('click', onClick);
  return button;
}

/**
 * Build complete sustainability panel
 * @param {Object} data - Sustainability analysis data
 * @returns {HTMLElement} Complete panel
 */
export function buildSustainabilityPanel(data) {
  const panel = document.createElement('div');
  panel.className = 'sustainability-panel';
  
  // Score ring
  panel.appendChild(createScoreRing(data.score.overall, data.score.tier));
  
  // Breakdown
  panel.appendChild(createBreakdownCard(data.score.breakdown));
  
  // Materials (card returns null if no materials)
  const materialsCard = createMaterialsCard(data.extracted.materials);
  if (materialsCard) {
    panel.appendChild(materialsCard);
  }
  
  // Insights (includes certifications, strengths, and concerns)
  const insightsCard = createInsightsCard(
    data.score.strengths, 
    data.score.concerns,
    data.extracted.certifications
  );
  if (insightsCard) {
    panel.appendChild(insightsCard);
  }
  
  // Recommendation
  const recommendationCard = createRecommendationCard(data.score.recommendation);
  if (recommendationCard) {
    panel.appendChild(recommendationCard);
  }
  
  return panel;
}

