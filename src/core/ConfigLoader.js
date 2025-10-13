/**
 * ConfigLoader - Loads and manages site extraction configurations
 */

export class ConfigLoader {
  constructor() {
    this.configs = new Map();
    this.initialized = false;
  }

  /**
   * Initialize and load all site configurations
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Load all site configs
      const siteConfigs = [
        'amazon.json',
        'walmart.json',
        // Future: 'ebay.json', 'target.json', etc.
      ];

      for (const configFile of siteConfigs) {
        await this.loadConfig(configFile);
      }

      this.initialized = true;
      console.log(`[ConfigLoader] Loaded ${this.configs.size} site configuration(s)`);
    } catch (error) {
      console.error('[ConfigLoader] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Load a specific site configuration
   * @param {string} configFile - Filename of the config (e.g., 'amazon.json')
   */
  async loadConfig(configFile) {
    try {
      const url = chrome.runtime.getURL(`src/config/sites/${configFile}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to load ${configFile}: ${response.status}`);
      }

      const config = await response.json();
      
      // Basic validation
      if (!config.id || !config.detection || !config.extraction) {
        throw new Error(`Invalid config structure in ${configFile}`);
      }

      // Only store enabled configs
      if (config.enabled !== false) {
        this.configs.set(config.id, config);
        console.log(`[ConfigLoader] Loaded config: ${config.name} (v${config.version})`);
      } else {
        console.log(`[ConfigLoader] Skipped disabled config: ${config.name}`);
      }
    } catch (error) {
      console.error(`[ConfigLoader] Error loading ${configFile}:`, error);
      throw error;
    }
  }

  /**
   * Get configuration for a specific site ID
   * @param {string} siteId - Site identifier (e.g., 'amazon-global')
   * @returns {Object|null} Site configuration or null
   */
  getConfig(siteId) {
    return this.configs.get(siteId) || null;
  }

  /**
   * Find which site config matches the current URL
   * @param {string} url - Current page URL
   * @returns {Object|null} Matching config and detected product info
   */
  detectSite(url) {
    for (const [siteId, config] of this.configs) {
      for (const urlPattern of config.detection.urlPatterns) {
        const regex = new RegExp(urlPattern.pattern, 'i');
        const match = url.match(regex);
        
        if (match) {
          const productIdGroup = urlPattern.productIdGroup || 1;
          return {
            config: config,
            productId: match[productIdGroup] || null,
            url: url
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Get all loaded configurations (for debugging)
   */
  getAllConfigs() {
    return Array.from(this.configs.values());
  }

  /**
   * Reload a specific configuration (useful for development)
   */
  async reloadConfig(siteId) {
    const config = this.configs.get(siteId);
    if (!config) {
      throw new Error(`Config ${siteId} not found`);
    }

    // Determine filename from metadata or ID
    const filename = `${siteId.replace('-', '_')}.json`;
    this.configs.delete(siteId);
    await this.loadConfig(filename);
  }
}

// Singleton instance
export const configLoader = new ConfigLoader();
