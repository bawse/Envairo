/**
 * AIAnalyzer - Handles AI-powered analysis using Chrome's Built-in APIs
 */

export class AIAnalyzer {
  constructor(config) {
    this.config = config;
  }

  /**
   * Analyze content using Summarizer API
   * @param {string} content - Content to analyze
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeSustainability(content) {
    const startTime = performance.now();

    try {
      // Check API availability
      if (!self.Summarizer) {
        return { error: 'Summarizer API not available' };
      }

      const availability = await self.Summarizer.availability();
      // Accept both 'readily' and 'available' as ready states
      if (availability === 'no' || availability === 'after-download') {
        return { error: `Summarizer not ready: ${availability}` };
      }

      // Get configuration
      const summarizerConfig = this.config.analysis.summarizer;

      // Create summarizer with config-driven settings
      const summarizer = await self.Summarizer.create({
        sharedContext: summarizerConfig.sharedContext,
        type: summarizerConfig.type || 'key-points',
        format: summarizerConfig.format || 'plain-text',
        length: summarizerConfig.length || 'long'
      });

      console.log(`[AIAnalyzer] Summarizer created with quota: ${summarizer.inputQuota} chars`);

      // Measure content size
      const measuredTokens = await summarizer.measureInputUsage(content);
      console.log(`[AIAnalyzer] Content size: ${measuredTokens} / ${summarizer.inputQuota} tokens`);

      // Trim if necessary
      let finalContent = content;
      if (measuredTokens > summarizer.inputQuota) {
        console.warn('[AIAnalyzer] Content exceeds quota, trimming...');
        const ratio = (summarizer.inputQuota / measuredTokens) * 0.9;
        finalContent = content.substring(0, Math.floor(content.length * ratio));
      }

      // Generate summary
      console.log('[AIAnalyzer] Generating summary...');
      const summary = await summarizer.summarize(finalContent);

      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`[AIAnalyzer] Analysis complete in ${duration}s`);

      // Clean up
      summarizer.destroy();

      return {
        summary: summary,
        duration: duration,
        tokensUsed: measuredTokens,
        quota: summarizer.inputQuota,
        success: true
      };

    } catch (error) {
      console.error('[AIAnalyzer] Error:', error);
      return { 
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Extract structured data using Prompt API (Phase 3 - future)
   * @param {string} summary - Plain text summary to structure
   * @returns {Promise<Object>} Structured data
   */
  async extractStructuredData(summary) {
    const structuredConfig = this.config.analysis.structuredExtraction;

    if (!structuredConfig?.enabled) {
      return { error: 'Structured extraction not enabled' };
    }

    try {
      if (!window.LanguageModel) {
        return { error: 'LanguageModel API not available' };
      }

      const session = await LanguageModel.create({
        systemPrompt: structuredConfig.systemPrompt
      });

      const prompt = `Parse this sustainability summary into JSON matching this schema: ${JSON.stringify(structuredConfig.outputSchema)}

Summary:
${summary}

Output only valid JSON:`;

      const response = await session.prompt(prompt);
      session.destroy();

      const structured = JSON.parse(response);
      return {
        data: structured,
        success: true
      };

    } catch (error) {
      console.error('[AIAnalyzer] Structured extraction error:', error);
      return {
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Get analysis configuration (for debugging)
   */
  getConfig() {
    return this.config.analysis;
  }
}
