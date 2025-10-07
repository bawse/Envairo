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
        temperature: 0.4,  // Low for consistent scoring
        topK: Math.min(40, maxTopK)
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
    return `You are a sustainability scoring expert analyzing product environmental impact.

Your task:
1. Extract materials, percentages, certifications, and sustainability features from product content
2. Match materials to the provided reference data (200+ materials with GHG scores)
3. Calculate weighted material scores based on composition percentages
4. Add bonuses for certifications, durability, and sustainable practices
5. Apply penalties for non-recyclable materials or hazardous content
6. Provide transparent score breakdown with clear reasoning

Output Requirements:
- Always return valid JSON matching the specified schema
- Be specific about material percentages (estimate if not explicitly stated)
- Provide actionable recommendations for consumers
- Explain tradeoffs clearly (e.g., high-GHG material with excellent durability)`;
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
    
    // Format matrix as CSV
    const matrixCSV = [
      'material,domain_category,unit,ghg_kgco2e_per_kg,recyclable,notes,score_0_100',
      ...matrix.map(m => 
        `${m.material},${m.domain_category},${m.unit},${m.ghg_kgco2e_per_kg},${m.recyclable},"${m.notes}",${m.score_0_100}`
      )
    ].join('\n');
    
    return `
PRODUCT CONTENT:
${productContent}

═══════════════════════════════════════════════════════════════

MATERIAL REFERENCE DATA (${matrix.length} materials):
${matrixCSV}

Each material has a pre-calculated GHG score (0-100, higher=better) based on carbon footprint from credible sources:
- ICE v3.0 (Inventory of Carbon & Energy)
- PlasticsEurope eco-profiles
- USLCI (US Life Cycle Inventory)
- OWID (Our World in Data - food products)

═══════════════════════════════════════════════════════════════

SCORING TASK:

Calculate a holistic sustainability score using this framework:

1. MATERIAL SCORE (base component):
   - Carefully read the PRODUCT CONTENT above
   - Identify ALL materials mentioned in THIS SPECIFIC PRODUCT (not from examples)
   - Determine percentage composition (estimate if not explicitly stated)
   - Look up each material's reference score in the matrix above
   - Calculate weighted average: Σ(material_percentage × reference_score)
   
   IMPORTANT: Extract materials from the actual product content above, NOT from this example:
   Example calculation format: (0.92 × score1) + (0.08 × score2) = weighted_score
   
   Note: If a material isn't in the matrix, find the closest match or estimate based on similar materials

2. CERTIFICATION BONUS (up to +15 points):
   - GOTS (Global Organic Textile Standard): +10
   - OEKO-TEX Standard 100: +8
   - Cradle to Cradle: +8
   - Fair Trade Certified: +7
   - Climate Pledge Friendly: +5
   - Nordic Swan / EU Ecolabel: +5
   - GRS (Global Recycled Standard): +5
   - FSC / PEFC (wood/paper): +5
   - B Corp: +5
   - Energy Star: +3
   - Maximum total: +15 (even if more certs exist)

3. DURABILITY ASSESSMENT (up to +10 points):
   - Lifetime warranty: +10
   - Warranty >5 years: +8
   - Rechargeable (vs disposable): +8
   - Reusable (vs single-use): +8
   - Refillable: +6
   - Warranty 2-5 years: +5
   - High-quality construction: +5
   - Replaceable parts: +4
   - Maximum total: +10

4. PACKAGING (up to +5 points):
   - Plastic-free packaging: +5
   - Compostable packaging: +4
   - Recyclable cardboard/paper: +3
   - Minimal packaging: +2
   - Ships in own container: +2
   - Maximum total: +5

5. CIRCULARITY PENALTY (up to -10 points):
   - Materials marked "no" recyclability in matrix: -5 per major material
   - Non-recyclable composite materials: -3
   - Hazardous substances mentioned: -3
   - Single-use product: -5
   - Maximum total: -10

FINAL SCORE CALCULATION:
- Start with base material score (step 1)
- Add certification bonus (step 2)
- Add durability bonus (step 3)
- Add packaging bonus (step 4)
- Subtract circularity penalty (step 5)
- Cap final score at 100 (minimum 0)

SCORE TIERS:
- 90-100: A+ (Excellent - minimal environmental impact)
- 75-89:  A  (Good - better than average)
- 60-74:  B  (Fair - average impact)
- 40-59:  C  (Concerning - significant impact)
- 0-39:   D  (Poor - high environmental impact)

═══════════════════════════════════════════════════════════════

OUTPUT FORMAT (valid JSON only, NO markdown code fences):

IMPORTANT: 
- Output ONLY valid JSON
- NO markdown formatting (no \`\`\`json or \`\`\` tags)
- Extract materials from the ACTUAL product content above, not from this template
- This template shows the structure, but use REAL data from the product

{
  "extracted": {
    "materials": [
      {
        "name": "[actual material from product]",
        "percentage": [actual percentage],
        "reference_score": [score from matrix],
        "recyclable": "[yes/limited/no from matrix]"
      }
    ],
    "certifications": ["[actual certifications found]"],
    "durability_features": ["[actual features found]"],
    "packaging": "[actual packaging description]",
    "origin": "[actual origin if found]",
    "recyclability": "[overall assessment]"
  },
  "score": {
    "overall": [calculated number 0-100],
    "tier": "[A+/A/B/C/D]",
    "breakdown": {
      "base_material_score": [number],
      "certification_bonus": [number],
      "durability_bonus": [number],
      "packaging_bonus": [number],
      "circularity_penalty": [number],
      "calculation": "[show your work]"
    },
    "strengths": [
      "[specific strength 1]",
      "[specific strength 2]"
    ],
    "concerns": [
      "[specific concern 1]",
      "[specific concern 2]"
    ],
    "recommendation": "[personalized advice for this specific product]"
  }
}

CRITICAL REMINDERS:
- Read the PRODUCT CONTENT section carefully
- Extract materials that are ACTUALLY in this product
- For batteries: look for alkaline, lithium, zinc, etc.
- For clothing: look for cotton, polyester, wool, etc.
- For electronics: look for aluminum, plastic, glass, silicon, etc.
- Do NOT copy materials from this template - use REAL product data
- Output ONLY JSON, no markdown formatting
`;
  }

  /**
   * Get analysis configuration (for debugging)
   */
  getConfig() {
    return this.config.analysis;
  }
}
