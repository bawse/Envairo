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
      await configLoader.initialize();
      this.initialized = true;
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
      console.log(`[Envairo] Product detected: ${detection.config.name} (ID: ${detection.productId})`);
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
      return null;
    }

    this.isRunning = true;
    const startTime = performance.now();

    try {
      // Detect product page
      const detection = this.detectProductPage();
      if (!detection) {
        return null;
      }

      // Extract content using config
      const extractor = new ContentExtractor(detection.config);
      const sections = extractor.extractSections();

      if (!sections || sections.length === 0) {
        console.warn('[Envairo] No relevant sections found');
        return null;
      }

      const extractionTime = ((performance.now() - startTime) / 1000).toFixed(2);

      // Prepare for AI analysis
      const analyzer = new AIAnalyzer(detection.config);

      // Initialize analyzer (loads scoring matrix)
      await analyzer.initialize();

      // Select sections for AI analysis
      // Note: Prompt API typically has larger context than Summarizer
      // Estimate ~8K-16K tokens = ~6K-12K characters
      const targetChars = 6000; // Conservative estimate

      const selection = extractor.selectSectionsForAnalysis(sections, targetChars);
      
      console.log(`[Envairo] Selected ${selection.selected.length} sections (${selection.totalChars} chars)`);

      // Analyze with AI (pass sections array, not focusedContent string)
      const analysisResult = await analyzer.analyzeSustainability(selection.selected);

      if (!analysisResult.success) {
        console.error('[Envairo] Analysis failed:', analysisResult.error);
        return this.createFailureResult(detection, analysisResult.error);
      }

      // Log results
      console.log('[Envairo] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`[Envairo] 🌱 SCORE: ${analysisResult.score.overall}/100 (${analysisResult.score.tier})`);
      console.log('[Envairo] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`[Envairo] ✅ Complete in ${totalTime}s (Extract: ${extractionTime}s, Analysis: ${analysisResult.duration}s)`);

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
