/**
 * AIAnalyzer - Handles AI-powered analysis using Chrome's Built-in Prompt API
 * Phase 3: Single-pass scoring with material reference data
 */

export class AIAnalyzer {
  constructor(config) {
    this.config = config;
    this.scoringMatrix = null;
    this.matrixLoaded = false;
  }

  /**
   * Initialize analyzer (load scoring matrix once)
   */
  async initialize() {
    if (this.matrixLoaded) return;
    
    try {
      // Dynamic import for CSV loader
      const { loadScoringMatrix } = await import(
        chrome.runtime.getURL('src/utils/csvLoader.js')
      );
      
      this.scoringMatrix = await loadScoringMatrix();
      this.matrixLoaded = true;
      
      console.log(`[AIAnalyzer] Loaded ${this.scoringMatrix.length} materials`);
    } catch (error) {
      console.error('[AIAnalyzer] Failed to load matrix:', error);
      throw error;
    }
  }

  /**
   * Analyze content using Prompt API with scoring matrix
   * @param {Array} sections - Extracted product sections
   * @returns {Promise<Object>} Analysis result with score
   */
  async analyzeSustainability(sections) {
    const startTime = performance.now();
    
    try {
      // Ensure matrix is loaded
      if (!this.matrixLoaded) {
        await this.initialize();
      }
      
      // Check API availability
      if (!window.LanguageModel && !self.LanguageModel) {
        return { 
          error: 'Prompt API not available',
          hint: 'Enable chrome://flags/#prompt-api-for-gemini-nano or check origin trial token',
          success: false
        };
      }
      
      const LanguageModel = window.LanguageModel || self.LanguageModel;
      
      // Get capabilities
      const { available, defaultTemperature, maxTemperature, defaultTopK, maxTopK } 
        = await LanguageModel.params();
      
      if (available === 'no') {
        return { 
          error: 'Prompt API not ready: model unavailable',
          hint: 'Check chrome://components for Gemini Nano download status',
          success: false
        };
      }
      
      if (available === 'after-download') {
        return { 
          error: 'Gemini Nano is downloading',
          hint: 'Check chrome://components for download progress. Requires 22GB free space.',
          success: false
        };
      }
      
      console.log(`[AIAnalyzer] Prompt API ready (temp: ${defaultTemperature}, topK: ${defaultTopK})`);
      
      // Create session with scoring-optimized parameters
      const session = await LanguageModel.create({
        systemPrompt: this.buildSystemPrompt(),
        temperature: 0.3,  // Low for consistent scoring (0.2-0.4 range)
        topK: Math.min(10, maxTopK)  // Low topK for stable, repeatable scores
      });
      
      console.log(`[AIAnalyzer] Session created (quota: ${session.inputQuota} tokens)`);
      
      // Build prompt with product content + matrix
      const prompt = this.buildScoringPrompt(sections, this.scoringMatrix);
      
      // Measure prompt size
      const promptUsage = await session.measureInputUsage(prompt);
      console.log(`[AIAnalyzer] Prompt size: ${promptUsage} / ${session.inputQuota} tokens`);
      
      if (promptUsage > session.inputQuota) {
        console.warn('[AIAnalyzer] ⚠️ Prompt exceeds quota! Attempting anyway...');
      }
      
      // Get response
      console.log('[AIAnalyzer] 🤖 Prompting model...');
      const response = await session.prompt(prompt);
      
      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`[AIAnalyzer] ✅ Response received in ${duration}s`);
      
      // Clean up session
      session.destroy();
      
      // Parse JSON
      try {
        // Strip markdown code fences if present (AI sometimes adds ```json ... ```)
        let cleanedResponse = response.trim();
        if (cleanedResponse.startsWith('```')) {
          // Remove ```json or ``` at start
          cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/, '');
          // Remove ``` at end
          cleanedResponse = cleanedResponse.replace(/\n?```\s*$/, '');
        }
        
        const result = JSON.parse(cleanedResponse);
        
        // Validate structure
        if (!result.extracted || !result.score) {
          throw new Error('Invalid response structure: missing extracted or score fields');
        }
        
        // Ensure arrays exist (defensive programming)
        if (!result.extracted.materials) result.extracted.materials = [];
        if (!result.extracted.certifications) result.extracted.certifications = [];
        if (!result.score.strengths) result.score.strengths = [];
        if (!result.score.concerns) result.score.concerns = [];
        if (!result.score.recommendation) result.score.recommendation = 'Based on the available data, consider the environmental impact shown in the breakdown above.';
        
        // Validate and fix material percentages
        if (result.extracted.materials && result.extracted.materials.length > 0) {
          const totalPercentage = result.extracted.materials.reduce((sum, m) => sum + (m.percentage || 0), 0);
          
          console.log(`[AIAnalyzer] 📊 Material validation: ${result.extracted.materials.length} materials, total percentage: ${totalPercentage}`);
          
          // If percentages are in 0-100 range instead of 0-1, normalize them
          if (totalPercentage > 2) {
            console.warn('[AIAnalyzer] ⚠️ Percentages appear to be in 0-100 range, normalizing to 0-1...');
            result.extracted.materials = result.extracted.materials.map(m => ({
              ...m,
              percentage: (m.percentage || 0) / 100
            }));
          }
          
          // If percentages don't sum to ~1.0, normalize them
          const newTotal = result.extracted.materials.reduce((sum, m) => sum + (m.percentage || 0), 0);
          if (Math.abs(newTotal - 1.0) > 0.05 && newTotal > 0) {
            console.warn(`[AIAnalyzer] ⚠️ Percentages don't sum to 1.0 (sum: ${newTotal}), normalizing...`);
            result.extracted.materials = result.extracted.materials.map(m => ({
              ...m,
              percentage: (m.percentage || 0) / newTotal
            }));
          }
          
          // Log final percentages
          result.extracted.materials.forEach(m => {
            console.log(`[AIAnalyzer]   - ${m.name}: ${(m.percentage * 100).toFixed(1)}%`);
          });
        }
        
        console.log('[AIAnalyzer] ✅ Parsed result:', {
          materials: result.extracted.materials.length,
          certifications: result.extracted.certifications.length,
          strengths: result.score.strengths.length,
          concerns: result.score.concerns.length,
          hasRecommendation: !!result.score.recommendation
        });
        
        return {
          ...result,
          duration: duration,
          tokensUsed: promptUsage,
          quota: session.inputQuota,
          success: true
        };
        
      } catch (parseError) {
        console.error('[AIAnalyzer] ❌ JSON parse failed:', parseError);
        console.log('[AIAnalyzer] Raw response (first 500 chars):', response.substring(0, 500));
        
        return {
          error: 'Failed to parse AI response as JSON',
          rawResponse: response.substring(0, 500), // First 500 chars for debugging
          parseError: parseError.message,
          success: false
        };
      }
      
    } catch (error) {
      console.error('[AIAnalyzer] ❌ Error:', error);
      return {
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Build system prompt for scoring
   */
  buildSystemPrompt() {
    return `You are a sustainability analyst. Extract product materials, calculate environmental scores using reference data, and output JSON only. Be precise with material extraction and percentages. Understand multi-component products (e.g., pillow fill vs cover).`;
  }

  /**
   * Build the complete scoring prompt
   * @param {Array} sections - Extracted product sections
   * @param {Array} matrix - Scoring matrix
   * @returns {string} Complete prompt
   */
  buildScoringPrompt(sections, matrix) {
    // Format sections as text
    const productContent = sections
      .map(s => `[${s.label || s.type}]\n${s.text}`)
      .join('\n\n');
    
    // Format matrix as compact CSV (only essential fields)
    const matrixCSV = [
      'material,score,recyclable',
      ...matrix.map(m => `${m.material},${m.score_0_100},${m.recyclable}`)
    ].join('\n');
    
    return `
PRODUCT CONTENT:
${productContent}

═══════════════════════════════════════════════════════════════

REFERENCE DATA (${matrix.length} materials with GHG-based scores, higher=better):
${matrixCSV}

═══════════════════════════════════════════════════════════════

TASK: Calculate sustainability score (0-100) using this framework:

1. MATERIAL SCORE (base):
   ⚠️ CRITICAL: If NO materials are explicitly mentioned, return EMPTY materials array []
   
   COMPONENT WEIGHTS (for textile products only):
   - Pillows: Fill 90%, Cover 10%
   - Clothing: Outer 80%, Lining 20%
   - Bedding: Fill 70%, Shell 30%
   - Bags: Main 85%, Lining 15%
   
   RULES:
   - Extract ONLY if explicitly stated: "100% Cotton", "Polyester fill", "Fabric: Nylon", etc.
   - For electronics, batteries, non-textile items: typically NO fabric materials → return []
   - Use decimals (1.0 = 100%, 0.5 = 50%)
   - Percentages must sum to 1.0
   - NO hardware (zippers, buttons)
   - DO NOT INVENT materials if not mentioned
   - If unsure or no materials found → return []
   - Calculate: Σ(percentage × reference_score) OR 0 if no materials

2. BONUSES (max +30):
   Certs: GOTS +10, OEKO-TEX +8, FSC +5, etc. (max +15)
   Durability: Warranty >5yr +8, Rechargeable +8, etc. (max +10)
   Packaging: Plastic-free +5, Recyclable +3, etc. (max +5)

3. PENALTIES (max -10):
   Non-recyclable materials -5, Single-use -5, Hazardous -3

FINAL: base + bonuses - penalties (cap at 100)

TIERS: 90-100=A+, 75-89=A, 60-74=B, 40-59=C, 0-39=D

═══════════════════════════════════════════════════════════════

OUTPUT (JSON only, no markdown):

Example with materials - "Pillow: Down Alternative Fill, Cotton Cover":
{
  "extracted": {
    "materials": [
      {"name": "Down Alternative", "percentage": 0.9, "reference_score": 42.3, "recyclable": "limited"},
      {"name": "Cotton", "percentage": 0.1, "reference_score": 95.9, "recyclable": "yes"}
    ],
    "certifications": ["OEKO-TEX"],
    "durability_features": ["Machine washable"],
    "packaging": "Recyclable bag",
    "origin": "Imported",
    "recyclability": "Limited"
  },
  "score": {
    "overall": 55,
    "tier": "C",
    "breakdown": {"base_material_score": 43.4, "certification_bonus": 8, "durability_bonus": 5, "packaging_bonus": 2, "circularity_penalty": -3, "calculation": "(0.9×42.3)+(0.1×95.9)+8+5+2-3=55.4"},
    "strengths": ["OEKO-TEX certified", "Machine washable"],
    "concerns": ["Synthetic fill", "Limited recyclability"],
    "recommendation": "The OEKO-TEX certification is solid, and machine washability adds convenience. Main trade-off: synthetic fill isn't as eco-friendly as natural alternatives like organic cotton or kapok, but it's hypoallergenic and more affordable."
  }
}

Example NO materials found - "Tablet, Battery, Electronics":
{
  "extracted": {
    "materials": [],
    "certifications": [],
    "durability_features": ["Rechargeable", "10-hour battery"],
    "packaging": "Recyclable cardboard",
    "origin": "Imported",
    "recyclability": "E-waste recycling required"
  },
  "score": {
    "overall": 40,
    "tier": "C",
    "breakdown": {"base_material_score": 0, "certification_bonus": 0, "durability_bonus": 8, "packaging_bonus": 3, "circularity_penalty": -5, "calculation": "0+0+8+3-5=6, adjusted for product type"},
    "strengths": ["Rechargeable battery", "Long battery life"],
    "concerns": ["E-waste disposal required"],
    "recommendation": "The rechargeable battery and long runtime are positives for reducing waste. When it's time to upgrade, use a certified e-waste recycler to keep toxic materials out of landfills."
  }
}

STYLE GUIDE:
- Recommendations: Conversational, specific, actionable. Mention positives first, then trade-offs. Avoid generic phrases like "Good choice" or "Consider X".
- Strengths/Concerns: Keep concise (3-5 words max per item). Be specific, not vague.

CRITICAL: Return materials:[] if NO fabric/textile materials explicitly mentioned. For electronics/batteries → typically [].
`;
  }

  /**
   * Get analysis configuration (for debugging)
   */
  getConfig() {
    return this.config.analysis;
  }
}
