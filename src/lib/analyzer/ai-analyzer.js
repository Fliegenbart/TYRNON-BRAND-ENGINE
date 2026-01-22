// ============================================
// AI ANALYZER - Use Claude API for brand extraction
// Sends documents to serverless function for analysis
// ============================================

/**
 * Analyze files using Claude AI
 * @param {File[]} files - Array of files to analyze
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Extracted brand data
 */
export async function analyzeWithAI(files, onProgress = () => {}) {
  onProgress(5);

  // Convert files to base64
  const preparedFiles = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress(10 + (i / files.length) * 30);

    const base64 = await fileToBase64(file);

    if (file.type === 'application/pdf') {
      preparedFiles.push({
        type: 'document',
        data: base64,
        name: file.name
      });
    } else if (file.type.startsWith('image/')) {
      preparedFiles.push({
        type: 'image',
        data: base64,
        mediaType: file.type,
        name: file.name
      });
    }
  }

  if (preparedFiles.length === 0) {
    throw new Error('Keine analysierbaren Dateien gefunden');
  }

  onProgress(50);

  // Call the serverless function
  const apiUrl = getApiUrl('/api/analyze-brand');

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files: preparedFiles })
  });

  onProgress(80);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API Fehler: ${response.status}`);
  }

  const brandData = await response.json();
  onProgress(100);

  // Transform Claude's response to our format
  return transformToPreviewFormat(brandData);
}

/**
 * Convert file to base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get API URL (works for local dev and production)
 */
function getApiUrl(path) {
  // In development, Vite proxies to the API
  // In production (Vercel), the API is at the same domain
  if (import.meta.env.DEV) {
    // For local development, we need to use Vercel dev server
    // or fallback to localhost:3000 if API is proxied
    return path;
  }
  return path;
}

/**
 * Transform Claude's brand data to preview format
 */
function transformToPreviewFormat(data) {
  if (data.parseError) {
    console.warn('AI response parsing failed, returning raw data');
    return { colors: [], fonts: [], logos: [], raw: data.raw };
  }

  const colors = (data.colors || []).map(c => ({
    hex: c.hex?.toUpperCase() || c.hex,
    name: c.name,
    role: c.role,
    usage: c.usage,
    source: 'ai-analysis'
  }));

  const fonts = (data.fonts || []).map(f => ({
    name: f.name,
    usage: f.role === 'heading' ? 'heading' : f.role === 'body' ? 'body' : f.role,
    description: f.description,
    source: 'ai-analysis'
  }));

  const logos = (data.logos || []).map(l => ({
    description: l.description,
    format: l.format,
    source: 'ai-analysis'
  }));

  return {
    colors,
    fonts,
    logos,
    toneOfVoice: data.toneOfVoice,
    additionalNotes: data.additionalNotes
  };
}

export default analyzeWithAI;
