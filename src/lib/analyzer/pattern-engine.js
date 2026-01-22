// ============================================
// PATTERN ENGINE - Generate Brand Rules from Analysis
// ============================================

/**
 * Analyze all parsed assets and generate brand rules with confidence scores
 * @param {Object} analyzedAssets - Results from all analyzers
 * @returns {Object} Rules and extracted assets
 */
export function analyzePatterns(analyzedAssets) {
  const { pptx = [], pdf = [], images = [] } = analyzedAssets;

  const rules = [];

  // Detect color rules
  rules.push(...detectColorRules(pptx, pdf, images));

  // Detect typography rules
  rules.push(...detectTypographyRules(pptx));

  // Detect spatial rules (logo position, etc.)
  rules.push(...detectSpatialRules(pptx));

  // Detect component rules
  rules.push(...detectComponentRules(pptx));

  // Merge extracted assets
  const extractedAssets = mergeExtractedAssets(pptx, images);

  // Separate rules by confidence - lower threshold to catch more rules
  const confirmedRules = rules.filter(r => r.confidence >= 0.6);
  const needsReview = rules.filter(r => r.confidence >= 0.3 && r.confidence < 0.6);

  // If we have no rules at all, include all with any confidence
  if (confirmedRules.length === 0 && needsReview.length === 0 && rules.length > 0) {
    return {
      rules: [],
      needsReview: rules, // Put all rules in review
      extractedAssets
    };
  }

  return {
    rules: confirmedRules,
    needsReview,
    extractedAssets
  };
}

/**
 * Detect color rules from all sources
 */
function detectColorRules(pptxResults, pdfResults, imageResults) {
  const rules = [];
  const colorFrequency = {};
  const colorSources = {};

  // Aggregate colors from PPTX themes
  for (const pptx of pptxResults) {
    for (const themeColor of pptx.theme.colors) {
      const hex = themeColor.value;
      colorFrequency[hex] = (colorFrequency[hex] || 0) + 10; // Theme colors weighted heavily
      colorSources[hex] = colorSources[hex] || [];
      colorSources[hex].push({ file: pptx.source, location: 'theme', type: themeColor.type });
    }

    // Add slide colors
    for (const [hex, data] of Object.entries(pptx.patterns.colorUsage)) {
      colorFrequency[hex] = (colorFrequency[hex] || 0) + data.frequency;
      colorSources[hex] = colorSources[hex] || [];
      colorSources[hex].push({ file: pptx.source, location: 'slides', contexts: data.contexts });
    }
  }

  // Add colors from PDFs
  for (const pdf of pdfResults) {
    for (const color of [...pdf.colors.dominant, ...pdf.colors.accent]) {
      const hex = color.hex;
      colorFrequency[hex] = (colorFrequency[hex] || 0) + color.count;
      colorSources[hex] = colorSources[hex] || [];
      colorSources[hex].push({ file: pdf.source, location: 'pages' });
    }
  }

  // Add colors from images
  for (const img of imageResults) {
    if (img.properties.isLikelyLogo) {
      for (const color of img.colors.dominant) {
        const hex = color.hex;
        colorFrequency[hex] = (colorFrequency[hex] || 0) + 5; // Logo colors weighted
        colorSources[hex] = colorSources[hex] || [];
        colorSources[hex].push({ file: img.source, location: 'logo' });
      }
    }
  }

  // Sort colors by frequency
  const sortedColors = Object.entries(colorFrequency)
    .filter(([hex]) => !isNearWhiteOrBlack(hex))
    .sort((a, b) => b[1] - a[1]);

  // Generate rules for top colors
  if (sortedColors.length > 0) {
    const [primaryHex, primaryFreq] = sortedColors[0];
    const primarySources = colorSources[primaryHex] || [];
    const usage = detectColorUsage(primarySources);

    rules.push({
      id: generateId(),
      category: 'color',
      name: 'Primärfarbe',
      description: `${primaryHex} wird als Hauptfarbe verwendet${usage.length > 0 ? ` (${usage.join(', ')})` : ''}`,
      confidence: calculateColorConfidence(primaryFreq, primarySources.length),
      sources: primarySources,
      value: {
        type: 'primary',
        color: primaryHex,
        usage
      },
      applicableTo: ['all']
    });
  }

  if (sortedColors.length > 1) {
    const [secondaryHex, secondaryFreq] = sortedColors[1];
    const secondarySources = colorSources[secondaryHex] || [];

    rules.push({
      id: generateId(),
      category: 'color',
      name: 'Sekundärfarbe',
      description: `${secondaryHex} wird als zweite Markenfarbe verwendet`,
      confidence: calculateColorConfidence(secondaryFreq, secondarySources.length) * 0.9,
      sources: secondarySources,
      value: {
        type: 'secondary',
        color: secondaryHex
      },
      applicableTo: ['all']
    });
  }

  // Find accent color (different hue from primary)
  if (sortedColors.length > 2) {
    const primaryHue = getHue(sortedColors[0][0]);

    for (let i = 2; i < Math.min(sortedColors.length, 6); i++) {
      const [hex, freq] = sortedColors[i];
      const hue = getHue(hex);

      // Check if hue is significantly different
      const hueDiff = Math.abs(hue - primaryHue);
      if (hueDiff > 30 || hueDiff < 330) {
        const sources = colorSources[hex] || [];
        rules.push({
          id: generateId(),
          category: 'color',
          name: 'Akzentfarbe',
          description: `${hex} wird als Akzentfarbe für CTAs und Highlights verwendet`,
          confidence: calculateColorConfidence(freq, sources.length) * 0.8,
          sources,
          value: {
            type: 'accent',
            color: hex,
            usage: ['cta', 'highlight']
          },
          applicableTo: ['all']
        });
        break;
      }
    }
  }

  return rules;
}

/**
 * Detect typography rules
 */
function detectTypographyRules(pptxResults) {
  const rules = [];

  // Collect fonts from all PPTX files
  const fontUsage = {
    major: {},
    minor: {}
  };

  for (const pptx of pptxResults) {
    if (pptx.theme.fonts.major) {
      fontUsage.major[pptx.theme.fonts.major] = (fontUsage.major[pptx.theme.fonts.major] || 0) + 1;
    }
    if (pptx.theme.fonts.minor) {
      fontUsage.minor[pptx.theme.fonts.minor] = (fontUsage.minor[pptx.theme.fonts.minor] || 0) + 1;
    }
  }

  // Major font (headlines)
  const majorFonts = Object.entries(fontUsage.major).sort((a, b) => b[1] - a[1]);
  if (majorFonts.length > 0) {
    const [font, count] = majorFonts[0];
    rules.push({
      id: generateId(),
      category: 'typography',
      name: 'Headline-Schrift',
      description: `${font} wird für Überschriften verwendet`,
      confidence: Math.min(0.95, 0.7 + count * 0.1),
      sources: pptxResults.map(p => ({ file: p.source, location: 'theme' })),
      value: {
        type: 'heading',
        fontFamily: font
      },
      applicableTo: ['all']
    });
  }

  // Minor font (body)
  const minorFonts = Object.entries(fontUsage.minor).sort((a, b) => b[1] - a[1]);
  if (minorFonts.length > 0) {
    const [font, count] = minorFonts[0];
    rules.push({
      id: generateId(),
      category: 'typography',
      name: 'Body-Schrift',
      description: `${font} wird für Fließtext verwendet`,
      confidence: Math.min(0.95, 0.7 + count * 0.1),
      sources: pptxResults.map(p => ({ file: p.source, location: 'theme' })),
      value: {
        type: 'body',
        fontFamily: font
      },
      applicableTo: ['all']
    });
  }

  // Typography patterns (uppercase, bold, etc.)
  let uppercaseCount = 0;
  let boldCount = 0;

  for (const pptx of pptxResults) {
    if (pptx.patterns.typographyPatterns.usesUppercase) uppercaseCount++;
    if (pptx.patterns.typographyPatterns.usesBold) boldCount++;
  }

  if (uppercaseCount > 0 && pptxResults.length > 0) {
    const confidence = uppercaseCount / pptxResults.length;
    if (confidence >= 0.5) {
      rules.push({
        id: generateId(),
        category: 'typography',
        name: 'Headline-Stil',
        description: 'Headlines werden in Großbuchstaben gesetzt',
        confidence,
        sources: pptxResults.filter(p => p.patterns.typographyPatterns.usesUppercase)
          .map(p => ({ file: p.source, location: 'slideMaster' })),
        value: {
          textTransform: 'uppercase'
        },
        applicableTo: ['website', 'presentation', 'flyer']
      });
    }
  }

  return rules;
}

/**
 * Detect spatial rules (logo position, grid, etc.)
 */
function detectSpatialRules(pptxResults) {
  const rules = [];

  // Grid detection from spacing values
  const allSpacings = [];
  for (const pptx of pptxResults) {
    allSpacings.push(...(pptx.patterns.detectedGridValues || []));
  }

  if (allSpacings.length > 0) {
    // Find common spacing base (likely grid unit)
    const spacingCounts = {};
    for (const spacing of allSpacings) {
      // Check for common grid units
      for (const base of [4, 8, 10, 12, 16]) {
        if (spacing % base === 0) {
          spacingCounts[base] = (spacingCounts[base] || 0) + 1;
        }
      }
    }

    const sortedBases = Object.entries(spacingCounts).sort((a, b) => b[1] - a[1]);
    if (sortedBases.length > 0) {
      const [baseUnit, count] = sortedBases[0];
      const confidence = Math.min(0.9, count / allSpacings.length);

      if (confidence >= 0.5) {
        rules.push({
          id: generateId(),
          category: 'spacing',
          name: 'Grid-System',
          description: `${baseUnit}px Grundraster - alle Abstände als Vielfache von ${baseUnit}`,
          confidence,
          sources: pptxResults.map(p => ({ file: p.source, location: 'slides' })),
          value: {
            baseUnit: parseInt(baseUnit),
            scale: [1, 2, 3, 4, 6, 8].map(m => parseInt(baseUnit) * m)
          },
          applicableTo: ['website', 'presentation', 'flyer']
        });
      }
    }
  }

  return rules;
}

/**
 * Detect component rules (buttons, cards, etc.)
 */
function detectComponentRules(pptxResults) {
  // For now, return empty - can be expanded later
  return [];
}

/**
 * Merge extracted assets from all sources
 */
function mergeExtractedAssets(pptxResults, imageResults) {
  const assets = {
    logos: [],
    images: []
  };

  // From PPTX
  for (const pptx of pptxResults) {
    assets.logos.push(...pptx.extractedAssets.logos);
    assets.images.push(...pptx.extractedAssets.images);
  }

  // From images
  for (const img of imageResults) {
    if (img.properties.isLikelyLogo) {
      // This is already a data URL from the original file
      // We need to get it from somewhere or mark it
      assets.logos.push({
        name: img.source,
        isLogo: true,
        confidence: img.confidence,
        colors: img.colors.dominant
      });
    }
  }

  // Sort by confidence
  assets.logos.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  return assets;
}

// Helper functions

function generateId() {
  return 'rule-' + Math.random().toString(36).substring(2, 9);
}

function isNearWhiteOrBlack(hex) {
  const rgb = hexToRgb(hex);
  const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  return luminance < 20 || luminance > 240;
}

function calculateColorConfidence(frequency, sourceCount) {
  // More frequency and more sources = higher confidence
  // Lower thresholds to be more generous
  const freqScore = Math.min(frequency / 5, 1); // Was /20, now /5
  const sourceScore = Math.min(sourceCount / 2, 1); // Was /3, now /2
  const base = 0.4; // Minimum confidence for any detected color
  return Math.round((base + (freqScore * 0.4 + sourceScore * 0.2)) * 100) / 100;
}

function detectColorUsage(sources) {
  const usage = new Set();
  for (const source of sources) {
    if (source.type === 'accent') usage.add('accent');
    if (source.contexts) {
      source.contexts.forEach(c => usage.add(c));
    }
    if (source.location === 'logo') usage.add('logo');
  }
  return Array.from(usage);
}

function getHue(hex) {
  const rgb = hexToRgb(hex);
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  if (max === min) return 0;

  let h;
  const d = max - min;

  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }

  return Math.round(h * 360);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

export const generateRules = analyzePatterns;
export default analyzePatterns;
