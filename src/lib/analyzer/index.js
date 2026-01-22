// ============================================
// BRAND ANALYZER - Main Export
// ============================================

export { analyzePptx } from './pptx-analyzer.js';
export { analyzePdf } from './pdf-analyzer.js';
export { analyzeImage } from './image-analyzer.js';
export { analyzePatterns, generateRules } from './pattern-engine.js';

/**
 * Analyze multiple files and generate brand rules
 * @param {File[]} files - Array of files to analyze
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<{analysis: Object, rules: Array}>}
 */
export async function analyzeFiles(files, onProgress = () => {}) {
  const results = {
    pptx: [],
    pdf: [],
    images: [],
  };

  const totalFiles = files.length;
  let completed = 0;

  for (const file of files) {
    const ext = file.name.split('.').pop().toLowerCase();

    try {
      if (ext === 'pptx' || ext === 'ppt' || ext === 'potx') {
        const { analyzePptx } = await import('./pptx-analyzer.js');
        results.pptx.push(await analyzePptx(file));
      } else if (ext === 'pdf') {
        const { analyzePdf } = await import('./pdf-analyzer.js');
        results.pdf.push(await analyzePdf(file));
      } else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
        const { analyzeImage } = await import('./image-analyzer.js');
        results.images.push(await analyzeImage(file));
      }
    } catch (error) {
      console.error(`Error analyzing ${file.name}:`, error);
    }

    completed++;
    onProgress(Math.round((completed / totalFiles) * 80)); // 80% for file analysis
  }

  // Generate rules from all analyzed files
  const { analyzePatterns } = await import('./pattern-engine.js');
  const rulesResult = analyzePatterns(results);

  onProgress(100);

  return {
    analysis: results,
    ...rulesResult
  };
}
