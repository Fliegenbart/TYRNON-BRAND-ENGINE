import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBrandStore } from '../../stores/brandStore';
import { analyzeFiles } from '../../lib/analyzer/index.js';
import { aggregateExtraction } from '../../lib/analyzer/aggregator.js';
import AnalyzerUpload from './AnalyzerUpload';
import AnalysisProgress from './AnalysisProgress';
import BrandPreview from './BrandPreview';

export default function BrandIntelligence() {
  const { brandId } = useParams();
  const navigate = useNavigate();
  const { getBrandById, updateBrand } = useBrandStore();

  const brand = getBrandById(brandId);

  // Simplified flow: upload → analyzing → preview
  const [step, setStep] = useState('upload');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);

  const handleStartAnalysis = useCallback(async (files) => {
    setStep('analyzing');
    setProgress(0);
    setError(null);

    try {
      setProgressMessage('Dateien werden analysiert...');

      const results = await analyzeFiles(files, (p) => {
        setProgress(p);
        if (p < 30) setProgressMessage('Extrahiere Farben...');
        else if (p < 60) setProgressMessage('Suche Logos und Schriften...');
        else if (p < 90) setProgressMessage('Bereite Vorschau vor...');
        else setProgressMessage('Fertig!');
      });

      // Use aggregator to simplify results for preview
      const aggregated = aggregateExtraction({
        pptx: results.analysis?.pptx || [],
        pdf: results.analysis?.pdf || [],
        images: results.analysis?.images || [],
        fonts: results.analysis?.fonts || []
      });

      // Add extracted logos from pattern engine results
      if (results.extractedAssets?.logos?.length > 0) {
        aggregated.logos = [
          ...aggregated.logos,
          ...results.extractedAssets.logos.filter(l => l.dataUrl || l.data)
        ];
      }

      setExtractedData(aggregated);
      setStep('preview');

    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Analyse fehlgeschlagen');
      setStep('upload');
    }
  }, []);

  const handleFigmaAnalysis = useCallback((analysis) => {
    // Convert Figma analysis to simple format for preview
    const aggregated = {
      colors: (analysis.colors || [])
        .filter(c => c.value)
        .map(c => ({
          hex: c.value,
          name: c.name,
          source: 'figma'
        })),
      fonts: (analysis.fonts || []).map(f => ({
        name: f.name,
        usage: f.weights ? 'heading' : 'body',
        source: 'figma'
      })),
      logos: (analysis.logos || []).map(l => ({
        dataUrl: l.url,
        name: l.name,
        source: 'figma'
      }))
    };

    setExtractedData(aggregated);
    setStep('preview');
  }, []);

  const handleApply = useCallback((selectedData) => {
    // Apply directly to brand
    const updates = {};

    // Colors
    if (selectedData.colors) {
      updates.colors = {
        ...brand.colors,
        primary: selectedData.colors.primary || brand.colors.primary,
        secondary: selectedData.colors.secondary || brand.colors.secondary,
        accent: selectedData.colors.accent || brand.colors.accent,
        background: selectedData.colors.background || brand.colors.background,
        text: selectedData.colors.text || brand.colors.text
      };
    }

    // Fonts
    if (selectedData.fonts) {
      updates.fonts = {
        ...brand.fonts,
        heading: selectedData.fonts.heading || brand.fonts.heading,
        body: selectedData.fonts.body || brand.fonts.body
      };
    }

    // Logo
    if (selectedData.logo) {
      updates.logo = selectedData.logo;
    }

    // Update brand in store
    updateBrand(brandId, updates);

    // Navigate to brand overview or assets
    navigate(`/brand/${brandId}`);
  }, [brandId, brand, updateBrand, navigate]);

  const handleCancel = useCallback(() => {
    setStep('upload');
    setExtractedData(null);
  }, []);

  if (!brand) {
    return <div className="not-found">Marke nicht gefunden</div>;
  }

  return (
    <div className="brand-intelligence">
      <header className="page-header">
        <div className="page-header-content">
          <h1>Brand importieren</h1>
          <p className="page-subtitle">
            {step === 'upload' && 'Lade Brand-Dokumente hoch (PDF, PPTX, Bilder)'}
            {step === 'analyzing' && 'Extrahiere Brand-Elemente...'}
            {step === 'preview' && 'Wähle die Elemente aus, die du übernehmen möchtest'}
          </p>
        </div>
      </header>

      <div className="intelligence-content">
        {error && (
          <div className="intelligence-error">
            <span className="error-icon">!</span>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {step === 'upload' && (
          <AnalyzerUpload
            onStartAnalysis={handleStartAnalysis}
            onFigmaAnalysis={handleFigmaAnalysis}
          />
        )}

        {step === 'analyzing' && (
          <AnalysisProgress
            progress={progress}
            message={progressMessage}
          />
        )}

        {step === 'preview' && extractedData && (
          <BrandPreview
            extractedData={extractedData}
            onApply={handleApply}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}
