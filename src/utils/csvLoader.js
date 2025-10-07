/**
 * CSV Loader for Sustainability Scoring Matrix
 * Loads and parses the 200+ material reference data
 */

export async function loadScoringMatrix() {
  try {
    const csvUrl = chrome.runtime.getURL('src/data/sustainability_matrix.csv');
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const matrix = parseCSV(csvText);
    
    console.log(`[CSVLoader] Loaded ${matrix.length} materials`);
    return matrix;
    
  } catch (error) {
    console.error('[CSVLoader] Failed to load matrix:', error);
    throw error;
  }
}

/**
 * Parse CSV text into structured array
 * @param {string} csvText - Raw CSV content
 * @returns {Array<Object>} Parsed matrix
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV is empty or malformed');
  }
  
  // Skip header (line 0)
  const matrix = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    // Handle CSV with quoted fields (notes may contain commas)
    const values = parseCSVLine(line);
    
    if (values.length < 7) {
      console.warn(`[CSVLoader] Skipping malformed line ${i}: ${line}`);
      continue;
    }
    
    matrix.push({
      material: values[0],
      domain_category: values[1],
      unit: values[2],
      ghg_kgco2e_per_kg: parseFloat(values[3]) || 0,
      recyclable: values[4],
      notes: values[5].replace(/^"|"$/g, ''), // Remove surrounding quotes
      score_0_100: parseFloat(values[6]) || 0
    });
  }
  
  return matrix;
}

/**
 * Parse a CSV line respecting quoted fields
 * Simple implementation - handles basic cases
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Push last value
  values.push(current.trim());
  
  return values;
}

