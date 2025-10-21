/**
 * ContentExtractor - Extracts content from product pages using site configuration
 */

export class ContentExtractor {
  constructor(config) {
    this.config = config;
  }

  /**
   * Extract all relevant sections from the page
   * @returns {Array} Array of extracted sections with scores
   */
  extractSections() {
    const sections = [];

    // Phase 1: Always-include selectors (no filtering)
    sections.push(...this.extractAlwaysIncludeSections());

    // Phase 2: Conditional selectors (require keyword/pattern match)
    sections.push(...this.extractConditionalSections());

    // Phase 3: Heading-based crawl (discovery mode)
    sections.push(...this.extractByHeadings());

    // Deduplicate
    const uniqueSections = this.deduplicateSections(sections);

    // Rank by score
    const rankedSections = this.rankSections(uniqueSections);

    console.log(`[ContentExtractor] Extracted ${rankedSections.length} sections`);
    
    return rankedSections;
  }

  /**
   * Extract sections that should always be included (Tier 1)
   */
  extractAlwaysIncludeSections() {
    const sections = [];
    const selectors = this.config.extraction.selectors.alwaysInclude || [];

    for (const selectorConfig of selectors) {
      const elements = document.querySelectorAll(selectorConfig.selector);
      
      elements.forEach(el => {
        if (!el || !el.innerText?.trim()) return;

        const text = el.innerText.trim();
        let score = selectorConfig.baseScore || 0.7;

        // Boost score if matches patterns
        const patternBonus = this.calculatePatternBonus(text);
        score += patternBonus;

        // Boost score based on keyword families
        const keywordBonus = this.calculateKeywordBonus(text);
        score += keywordBonus;

        sections.push({
          method: 'always-include',
          selector: selectorConfig.selector,
          label: selectorConfig.label,
          priority: selectorConfig.priority,
          score: Math.min(score, this.config.extraction.scoring?.maxScore || 1.0),
          text: text.substring(0, 3000), // Limit text length
          html: el.outerHTML.substring(0, 5000)
        });
      });
    }

    return sections;
  }

  /**
   * Extract sections that require keyword/pattern matching (Tier 2)
   */
  extractConditionalSections() {
    const sections = [];
    const selectors = this.config.extraction.selectors.conditionalInclude || [];

    for (const selectorConfig of selectors) {
      const elements = document.querySelectorAll(selectorConfig.selector);
      
      elements.forEach(el => {
        if (!el || !el.innerText?.trim()) return;

        const text = el.innerText.trim();

        // Must match keywords OR patterns
        const hasKeywords = this.hasAnyKeyword(text);
        const hasPatterns = this.hasAnyPattern(text);

        if (selectorConfig.requiresKeywords && !(hasKeywords || hasPatterns)) {
          return; // Skip if doesn't match
        }

        let score = selectorConfig.baseScore || 0.7;
        score += this.calculatePatternBonus(text);
        score += this.calculateKeywordBonus(text);

        sections.push({
          method: 'conditional',
          selector: selectorConfig.selector,
          label: selectorConfig.label,
          score: Math.min(score, this.config.extraction.scoring?.maxScore || 1.0),
          text: text.substring(0, 3000),
          html: el.outerHTML.substring(0, 5000)
        });
      });
    }

    return sections;
  }

  /**
   * Extract sections by crawling headings (discovery mode)
   */
  extractByHeadings() {
    const sections = [];
    const headings = document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]');

    for (const heading of headings) {
      const headingText = heading.innerText?.trim() || '';
      
      // Must have keywords or patterns in heading
      if (!this.hasAnyKeyword(headingText) && !this.hasAnyPattern(headingText)) {
        continue;
      }

      // Collect content after heading
      let blockText = headingText;
      let node = heading.nextElementSibling;
      let steps = 0;

      while (node && steps < 10) {
        // Stop at next heading
        if (node.matches('h1,h2,h3,h4,h5,h6,[role="heading"]')) break;

        const nodeText = node.innerText?.trim() || '';
        if (nodeText) {
          blockText += '\n' + nodeText;
        }

        node = node.nextElementSibling;
        steps++;
      }

      // Only include if substantial content
      if (blockText.length < 100) continue;

      let score = 0.6;
      score += this.calculatePatternBonus(blockText);
      score += this.calculateKeywordBonus(blockText);

      sections.push({
        method: 'heading-crawl',
        heading: headingText,
        score: Math.min(score, this.config.extraction.scoring?.maxScore || 1.0),
        text: blockText.substring(0, 3000),
        html: heading.outerHTML.substring(0, 5000)
      });
    }

    return sections;
  }

  /**
   * Calculate bonus score based on pattern matching
   */
  calculatePatternBonus(text) {
    const patterns = this.config.extraction.patterns || [];
    let totalBonus = 0;

    for (const patternConfig of patterns) {
      const regex = new RegExp(patternConfig.pattern, 'i');
      if (regex.test(text)) {
        totalBonus += patternConfig.bonus || 0.05;
      }
    }

    const maxBonus = this.config.extraction.scoring?.patternMatchBonus || 0.10;
    return Math.min(totalBonus, maxBonus);
  }

  /**
   * Calculate bonus score based on keyword family matches
   */
  calculateKeywordBonus(text) {
    const keywords = this.config.extraction.keywords;
    const normalizedText = this.normalizeText(text);
    let familiesMatched = 0;

    // Check each keyword family
    for (const [family, terms] of Object.entries(keywords)) {
      if (terms.some(term => normalizedText.includes(term.toLowerCase()))) {
        familiesMatched++;
      }
    }

    const bonusPerFamily = this.config.extraction.scoring?.keywordFamilyBonus || 0.05;
    return familiesMatched * bonusPerFamily;
  }

  /**
   * Check if text contains any keywords from any family
   */
  hasAnyKeyword(text) {
    const keywords = this.config.extraction.keywords;
    const normalizedText = this.normalizeText(text);

    for (const terms of Object.values(keywords)) {
      if (terms.some(term => normalizedText.includes(term.toLowerCase()))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if text matches any pattern
   */
  hasAnyPattern(text) {
    const patterns = this.config.extraction.patterns || [];
    
    for (const patternConfig of patterns) {
      const regex = new RegExp(patternConfig.pattern, 'i');
      if (regex.test(text)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Normalize text for comparison
   */
  normalizeText(text) {
    return (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  /**
   * Deduplicate sections based on content similarity
   */
  deduplicateSections(sections) {
    const seen = new Set();
    const result = [];

    for (const section of sections) {
      const normalized = this.normalizeText(section.text);
      const signature = normalized.substring(0, 300);

      // Check for substantial overlap with existing sections
      let isDuplicate = false;
      for (const seenSig of seen) {
        const shorter = signature.length < seenSig.length ? signature : seenSig;
        const longer = signature.length >= seenSig.length ? signature : seenSig;

        // 80% overlap = duplicate
        if (longer.includes(shorter.substring(0, Math.floor(shorter.length * 0.8)))) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        seen.add(signature);
        result.push(section);
      }
    }

    return result;
  }

  /**
   * Rank sections by score (descending)
   */
  rankSections(sections) {
    return sections.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  /**
   * Select sections for analysis (respecting quota limits)
   * @param {Array} sections - All extracted sections
   * @param {number} targetChars - Target character count
   * @returns {Object} Selected sections and metadata
   */
  selectSectionsForAnalysis(sections, targetChars) {
    // Get critical priority selectors first
    const criticalSelectors = this.config.extraction.selectors.alwaysInclude
      .filter(s => s.priority === 'critical')
      .map(s => s.selector);

    const criticalSections = sections.filter(s => 
      s.selector && criticalSelectors.includes(s.selector)
    );
    
    const otherSections = sections.filter(s => 
      !s.selector || !criticalSelectors.includes(s.selector)
    );

    let focusedContent = '';
    let totalChars = 0;
    const selected = [];

    // Phase 1: Add all critical sections
    for (const section of criticalSections) {
      const sectionText = section.text || '';
      if (totalChars + sectionText.length < targetChars) {
        focusedContent += `\n\n[Section: ${section.label || section.selector}]\n${sectionText}`;
        totalChars += sectionText.length;
        selected.push(section);
      }
    }

    // Phase 2: Add other high-scoring sections
    for (const section of otherSections) {
      const sectionText = section.text || '';
      if (totalChars + sectionText.length < targetChars) {
        const label = section.label || section.selector || section.heading || 'Unknown';
        focusedContent += `\n\n[Section: ${label}]\n${sectionText}`;
        totalChars += sectionText.length;
        selected.push(section);
      } else {
        break; // Stop when quota reached
      }
    }

    return {
      focusedContent: focusedContent.trim(),
      selected: selected,
      totalChars: totalChars
    };
  }
}
