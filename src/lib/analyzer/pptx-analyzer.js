// ============================================
// PPTX ANALYZER - Enhanced PowerPoint Analysis
// ============================================
import JSZip from 'jszip';

/**
 * Analyze a PPTX file and extract brand patterns with confidence scores
 * @param {File} file - PPTX file to analyze
 * @returns {Promise<Object>} Analysis results with patterns
 */
export async function analyzePptx(file) {
  const zip = await JSZip.loadAsync(file);

  const analysis = {
    source: file.name,
    type: 'pptx',
    theme: {
      colors: [],
      fonts: { major: null, minor: null }
    },
    patterns: {
      colorUsage: {},
      typographyPatterns: {},
      logoUsage: [],
      spacingValues: []
    },
    extractedAssets: {
      logos: [],
      images: []
    },
    slideCount: 0
  };

  // 1. Parse Theme
  const themeFile = zip.file(/ppt\/theme\/theme\d+\.xml/);
  if (themeFile.length > 0) {
    const themeXml = await themeFile[0].async('text');
    parseTheme(themeXml, analysis);
  }

  // 2. Parse Slide Masters for typography patterns
  const masterFiles = zip.file(/ppt\/slideMasters\/slideMaster\d+\.xml/);
  for (const master of masterFiles) {
    const masterXml = await master.async('text');
    parseMasterPatterns(masterXml, analysis);
  }

  // 3. Parse all slides for color usage patterns
  const slideFiles = zip.file(/ppt\/slides\/slide\d+\.xml/);
  analysis.slideCount = slideFiles.length;

  for (const slide of slideFiles) {
    const slideXml = await slide.async('text');
    parseSlidePatterns(slideXml, analysis);
  }

  // 4. Extract media assets
  const mediaFiles = zip.file(/ppt\/media\/.+/);
  for (const media of mediaFiles) {
    await extractMedia(media, analysis);
  }

  // 5. Calculate confidence scores
  calculateConfidenceScores(analysis);

  return analysis;
}

/**
 * Parse theme colors and fonts
 */
function parseTheme(xml, analysis) {
  // Extract scheme colors with their names
  const schemeColors = [
    { name: 'dk1', type: 'dark' },
    { name: 'lt1', type: 'light' },
    { name: 'dk2', type: 'dark' },
    { name: 'lt2', type: 'light' },
    { name: 'accent1', type: 'accent' },
    { name: 'accent2', type: 'accent' },
    { name: 'accent3', type: 'accent' },
    { name: 'accent4', type: 'accent' },
    { name: 'accent5', type: 'accent' },
    { name: 'accent6', type: 'accent' },
    { name: 'hlink', type: 'link' },
    { name: 'folHlink', type: 'link' }
  ];

  for (const { name, type } of schemeColors) {
    const regex = new RegExp(`<a:${name}>[\\s\\S]*?<a:srgbClr val="([A-Fa-f0-9]{6})"`, 'i');
    const match = xml.match(regex);
    if (match) {
      analysis.theme.colors.push({
        name,
        type,
        value: '#' + match[1].toLowerCase(),
        source: 'theme'
      });
    }
  }

  // Extract major and minor fonts
  const majorFontMatch = xml.match(/<a:majorFont>[\s\S]*?<a:latin typeface="([^"]+)"/i);
  const minorFontMatch = xml.match(/<a:minorFont>[\s\S]*?<a:latin typeface="([^"]+)"/i);

  if (majorFontMatch && !majorFontMatch[1].startsWith('+')) {
    analysis.theme.fonts.major = majorFontMatch[1];
  }
  if (minorFontMatch && !minorFontMatch[1].startsWith('+')) {
    analysis.theme.fonts.minor = minorFontMatch[1];
  }
}

/**
 * Parse slide master for typography patterns
 */
function parseMasterPatterns(xml, analysis) {
  // Extract font references
  const fontRegex = /typeface="([^"]+)"/g;
  let match;
  const fonts = new Set();

  while ((match = fontRegex.exec(xml)) !== null) {
    if (!match[1].startsWith('+') && match[1].length > 1) {
      fonts.add(match[1]);
    }
  }

  // Detect text formatting patterns
  // Bold detection
  const boldCount = (xml.match(/<a:rPr[^>]*\bb="1"/g) || []).length;
  // Uppercase detection
  const capsCount = (xml.match(/<a:rPr[^>]*\bcap="all"/g) || []).length;

  if (boldCount > 2) {
    analysis.patterns.typographyPatterns.usesBold = true;
  }
  if (capsCount > 0) {
    analysis.patterns.typographyPatterns.usesUppercase = true;
  }

  // Fill in major/minor fonts if not found in theme
  const fontArray = Array.from(fonts);
  if (!analysis.theme.fonts.major && fontArray[0]) {
    analysis.theme.fonts.major = fontArray[0];
  }
  if (!analysis.theme.fonts.minor && fontArray[1]) {
    analysis.theme.fonts.minor = fontArray[1];
  }
}

/**
 * Parse individual slides for color usage patterns
 */
function parseSlidePatterns(xml, analysis) {
  // Track color usage
  const rgbRegex = /<a:srgbClr val="([A-Fa-f0-9]{6})"/g;
  let match;

  while ((match = rgbRegex.exec(xml)) !== null) {
    const color = '#' + match[1].toLowerCase();
    if (!analysis.patterns.colorUsage[color]) {
      analysis.patterns.colorUsage[color] = { frequency: 0, contexts: [] };
    }
    analysis.patterns.colorUsage[color].frequency++;

    // Try to detect context (background vs text)
    const contextBefore = xml.substring(Math.max(0, match.index - 100), match.index);
    if (contextBefore.includes('solidFill') && contextBefore.includes('spPr')) {
      if (!analysis.patterns.colorUsage[color].contexts.includes('background')) {
        analysis.patterns.colorUsage[color].contexts.push('background');
      }
    } else if (contextBefore.includes('rPr') || contextBefore.includes('defRPr')) {
      if (!analysis.patterns.colorUsage[color].contexts.includes('text')) {
        analysis.patterns.colorUsage[color].contexts.push('text');
      }
    }
  }

  // Detect spacing values (from position attributes)
  const posRegex = /(?:x|y|cx|cy)="(\d+)"/g;
  const spacings = new Set();
  while ((match = posRegex.exec(xml)) !== null) {
    // Convert EMUs to pixels (914400 EMU = 1 inch = 96 pixels)
    const px = Math.round(parseInt(match[1]) / 914400 * 96);
    if (px > 0 && px < 200) {
      spacings.add(px);
    }
  }
  analysis.patterns.spacingValues.push(...spacings);
}

/**
 * Extract media files (logos, images)
 */
async function extractMedia(media, analysis) {
  const filename = media.name.split('/').pop();
  const ext = filename.split('.').pop().toLowerCase();

  if (!['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
    return;
  }

  const blob = await media.async('blob');
  const dataUrl = await blobToDataUrl(blob);

  const isLogo = detectLogo(filename, blob.size);

  const asset = {
    name: filename,
    data: dataUrl,
    size: blob.size,
    isLogo,
    confidence: isLogo ? calculateLogoConfidence(filename, blob.size) : 0.3
  };

  if (isLogo) {
    analysis.extractedAssets.logos.push(asset);
  } else {
    analysis.extractedAssets.images.push(asset);
  }
}

/**
 * Detect if image is likely a logo
 */
function detectLogo(filename, size) {
  const name = filename.toLowerCase();
  if (name.includes('logo')) return true;
  if (name.includes('brand')) return true;
  if (name.includes('icon')) return true;
  if (name.includes('mark')) return true;
  // Small files are often logos
  if (size < 100000) return true;
  return false;
}

/**
 * Calculate logo confidence based on heuristics
 */
function calculateLogoConfidence(filename, size) {
  let confidence = 0.5;
  const name = filename.toLowerCase();

  if (name.includes('logo')) confidence += 0.3;
  if (name.includes('brand')) confidence += 0.2;
  if (name.includes('icon')) confidence += 0.1;
  if (size < 50000) confidence += 0.1;
  if (size < 20000) confidence += 0.1;

  return Math.min(confidence, 1.0);
}

/**
 * Calculate confidence scores for all patterns
 */
function calculateConfidenceScores(analysis) {
  const totalSlides = analysis.slideCount || 1;

  // Color confidence based on frequency
  for (const [color, data] of Object.entries(analysis.patterns.colorUsage)) {
    data.confidence = Math.min(data.frequency / (totalSlides * 2), 1.0);
  }

  // Typography confidence
  if (analysis.theme.fonts.major) {
    analysis.patterns.typographyPatterns.majorFontConfidence = 0.95; // From theme = high confidence
  }
  if (analysis.theme.fonts.minor) {
    analysis.patterns.typographyPatterns.minorFontConfidence = 0.95;
  }

  // Spacing pattern detection
  const spacingFrequency = {};
  for (const spacing of analysis.patterns.spacingValues) {
    spacingFrequency[spacing] = (spacingFrequency[spacing] || 0) + 1;
  }

  // Find most common spacing values (likely grid system)
  const commonSpacings = Object.entries(spacingFrequency)
    .filter(([, count]) => count > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([spacing]) => parseInt(spacing));

  analysis.patterns.detectedGridValues = commonSpacings;
}

/**
 * Convert blob to data URL
 */
function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export default analyzePptx;
