/**
 * SustainabilityAdvisor - Main orchestrator for sustainability analysis
 * Uses configuration-driven architecture for maintainability and extensibility
 */

import { configLoader } from './ConfigLoader.js';
import { ContentExtractor } from './ContentExtractor.js';
import { AIAnalyzer } from './AIAnalyzer.js';

export class SustainabilityAdvisor {
  constructor() {
    this.initialized = false;
    this.currentSite = null;
    this.hasRun = false;
    this.isRunning = false;
  }

  /**
   * Initialize the advisor (loads configurations)
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('[SustainabilityAdvisor] Initializing...');
      await configLoader.initialize();
      this.initialized = true;
      console.log('[SustainabilityAdvisor] Ready');
    } catch (error) {
      console.error('[SustainabilityAdvisor] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Detect if current page is a supported product page
   * @returns {Object|null} Detection result with site config and product info
   */
  detectProductPage() {
    const url = window.location.href;
    const detection = configLoader.detectSite(url);

    if (detection) {
      console.log(`[SustainabilityAdvisor] ✅ Product detected: ${detection.config.name}`);
      console.log(`[SustainabilityAdvisor] Product ID: ${detection.productId}`);
      this.currentSite = detection;
      return detection;
    }

    return null;
  }

  /**
   * Analyze the current product page
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeCurrentPage() {
    if (!this.initialized) {
      await this.initialize();
    }

    // Prevent duplicate runs
    if (this.isRunning || this.hasRun) {
      console.log('[SustainabilityAdvisor] Analysis already running or completed');
      return null;
    }

    this.isRunning = true;
    const startTime = performance.now();

    try {
      // Detect product page
      const detection = this.detectProductPage();
      if (!detection) {
        console.log('[SustainabilityAdvisor] Not a supported product page');
        return null;
      }

      // Extract content using config
      console.log('[SustainabilityAdvisor] 🚀 Starting content extraction...');
      const extractor = new ContentExtractor(detection.config);
      const sections = extractor.extractSections();

      if (!sections || sections.length === 0) {
        console.warn('[SustainabilityAdvisor] ⚠️ No relevant sections found');
        return null;
      }

      const extractionTime = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`[SustainabilityAdvisor] ⚡ Extraction completed in ${extractionTime}s`);

      // Prepare for AI analysis
      const analyzer = new AIAnalyzer(detection.config);

      // Initialize analyzer (loads scoring matrix)
      await analyzer.initialize();

      // Select sections for AI analysis
      // Note: Prompt API typically has larger context than Summarizer
      // Estimate ~8K-16K tokens = ~6K-12K characters
      const targetChars = 6000; // Conservative estimate

      const selection = extractor.selectSectionsForAnalysis(sections, targetChars);
      
      console.log(`[SustainabilityAdvisor] Selected ${selection.selected.length} sections (${selection.totalChars} chars)`);
      
      // Log selected sections
      this.logSelectedSections(selection.selected);

      // Analyze with AI (pass sections array, not focusedContent string)
      console.log('[SustainabilityAdvisor] 🤖 Starting AI analysis with scoring...');
      const analysisResult = await analyzer.analyzeSustainability(selection.selected);

      if (!analysisResult.success) {
        console.warn('[SustainabilityAdvisor] ⚠️ Analysis failed:', analysisResult.error);
        return this.createFailureResult(detection, analysisResult.error);
      }

      // Log results
      console.log('[SustainabilityAdvisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`[SustainabilityAdvisor] 🌱 SUSTAINABILITY SCORE: ${analysisResult.score.overall}/100 (${analysisResult.score.tier})`);
      console.log('[SustainabilityAdvisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[SustainabilityAdvisor] 📊 BREAKDOWN:');
      console.log(`[SustainabilityAdvisor]    Material Score: ${analysisResult.score.breakdown.base_material_score}`);
      console.log(`[SustainabilityAdvisor]    Certifications: +${analysisResult.score.breakdown.certification_bonus}`);
      console.log(`[SustainabilityAdvisor]    Durability: +${analysisResult.score.breakdown.durability_bonus}`);
      console.log(`[SustainabilityAdvisor]    Packaging: +${analysisResult.score.breakdown.packaging_bonus}`);
      console.log(`[SustainabilityAdvisor]    Circularity: ${analysisResult.score.breakdown.circularity_penalty}`);
      console.log('[SustainabilityAdvisor]');
      console.log('[SustainabilityAdvisor] ✅ STRENGTHS:');
      if (analysisResult.score.strengths && Array.isArray(analysisResult.score.strengths)) {
        analysisResult.score.strengths.forEach(s => 
          console.log(`[SustainabilityAdvisor]    • ${s}`)
        );
      } else {
        console.log('[SustainabilityAdvisor]    (none provided)');
      }
      console.log('[SustainabilityAdvisor]');
      console.log('[SustainabilityAdvisor] ⚠️ CONCERNS:');
      if (analysisResult.score.concerns && Array.isArray(analysisResult.score.concerns)) {
        analysisResult.score.concerns.forEach(c => 
          console.log(`[SustainabilityAdvisor]    • ${c}`)
        );
      } else {
        console.log('[SustainabilityAdvisor]    (none provided)');
      }
      console.log('[SustainabilityAdvisor]');
      console.log('[SustainabilityAdvisor] 💡 RECOMMENDATION:');
      console.log(`[SustainabilityAdvisor]    ${analysisResult.score.recommendation || 'No recommendation provided'}`);
      console.log('[SustainabilityAdvisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`[SustainabilityAdvisor] 🎉 Complete! Total: ${totalTime}s (Extract: ${extractionTime}s + Analysis: ${analysisResult.duration}s)`);

      // Build result
      const result = this.createSuccessResult(
        detection,
        sections,
        selection,
        analysisResult,
        extractionTime,
        totalTime
      );

      // Store globally
      this.storeResult(result);

      this.hasRun = true;
      return result;

    } catch (error) {
      console.error('[SustainabilityAdvisor] ❌ Error:', error);
      return this.createFailureResult(this.currentSite, error.message);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Log selected sections with details
   */
  logSelectedSections(sections) {
    console.log('[SustainabilityAdvisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[SustainabilityAdvisor] 📄 SELECTED SECTIONS:');
    console.log('[SustainabilityAdvisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    sections.forEach((section, idx) => {
      const label = section.label || section.selector || section.heading || 'Unknown';
      const preview = (section.text || '').substring(0, 150).replace(/\n/g, ' ');
      console.log(`[SustainabilityAdvisor] ${idx + 1}. [Score: ${section.score.toFixed(2)}] ${label}`);
      console.log(`[SustainabilityAdvisor]    ${preview}...`);
    });
    
    console.log('[SustainabilityAdvisor] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * Create success result object
   */
  createSuccessResult(detection, sections, selection, analysisResult, extractionTime, totalTime) {
    return {
      success: true,
      site: detection.config.name,
      siteId: detection.config.id,
      productId: detection.productId,
      url: detection.url,
      
      // AI analysis results
      extracted: analysisResult.extracted,
      score: analysisResult.score,
      
      // Metadata
      sectionsFound: sections.length,
      sectionsUsed: selection.selected.length,
      charsProcessed: selection.totalChars,
      tokensUsed: analysisResult.tokensUsed,
      quota: analysisResult.quota,
      
      // Timing
      extractionTime: extractionTime,
      analysisTime: analysisResult.duration,
      totalTime: totalTime,
      
      // Raw data (for debugging/advanced use)
      selectedSections: selection.selected,
      
      timestamp: Date.now()
    };
  }

  /**
   * Create failure result object
   */
  createFailureResult(detection, error) {
    return {
      success: false,
      site: detection?.config?.name || 'Unknown',
      siteId: detection?.config?.id || null,
      productId: detection?.productId || null,
      url: detection?.url || window.location.href,
      error: error,
      timestamp: Date.now()
    };
  }

  /**
   * Store result globally for access by UI/other scripts
   */
  storeResult(result) {
    if (typeof window !== 'undefined') {
      window.__sustainabilityAdvisorData = result;
    }
    if (typeof self !== 'undefined') {
      self.__sustainabilityAdvisorData = result;
    }
    
    console.log('[SustainabilityAdvisor] 💾 Result stored');
    console.log('[SustainabilityAdvisor] 💡 Access with: window.__sustainabilityAdvisorData');
  }

  /**
   * Get stored result
   */
  getStoredResult() {
    return window.__sustainabilityAdvisorData || null;
  }

  /**
   * Reset state (useful for testing)
   */
  reset() {
    this.hasRun = false;
    this.isRunning = false;
    this.currentSite = null;
  }
}

// Export singleton instance
export const sustainabilityAdvisor = new SustainabilityAdvisor();
