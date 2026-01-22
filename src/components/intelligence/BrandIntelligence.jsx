import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useBrandStore } from '../../stores/brandStore';
import { useRulesStore } from '../../stores/rulesStore';
import { analyzeFiles } from '../../lib/analyzer/index.js';
import AnalyzerUpload from './AnalyzerUpload';
import AnalysisProgress from './AnalysisProgress';
import RulesReview from './RulesReview';
import RulesManager from './RulesManager';

export default function BrandIntelligence() {
  const { brandId } = useParams();
  const { getBrandById } = useBrandStore();
  const {
    getAnalysisStatus,
    setAnalysisStatus,
    setRulesForBrand,
    hasRules
  } = useRulesStore();

  const brand = getBrandById(brandId);
  const currentStatus = getAnalysisStatus(brandId);
  const brandHasRules = hasRules(brandId);

  // Local state for analysis flow
  const [step, setStep] = useState(() => {
    if (currentStatus === 'complete' || brandHasRules) return 'manage';
    if (currentStatus === 'review') return 'review';
    return 'upload';
  });

  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);

  const handleStartAnalysis = useCallback(async (files) => {
    setStep('analyzing');
    setProgress(0);
    setError(null);
    setAnalysisStatus(brandId, 'analyzing');

    try {
      setProgressMessage('Dateien werden analysiert...');

      const results = await analyzeFiles(files, (p) => {
        setProgress(p);
        if (p < 30) setProgressMessage('Extrahiere Farben und Fonts...');
        else if (p < 60) setProgressMessage('Analysiere Patterns...');
        else if (p < 90) setProgressMessage('Generiere Regeln...');
        else setProgressMessage('Analyse abgeschlossen!');
      });

      setAnalysisResults(results);
      // Don't pass extractedAssets to store - too large for localStorage
      // Keep them in local state only (analysisResults)
      setRulesForBrand(
        brandId,
        [...results.rules, ...results.needsReview]
      );
      setStep('review');
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Analyse fehlgeschlagen');
      setStep('upload');
      setAnalysisStatus(brandId, 'none');
    }
  }, [brandId, setAnalysisStatus, setRulesForBrand]);

  const handleConfirmRules = useCallback(() => {
    setAnalysisStatus(brandId, 'complete');
    setStep('manage');
  }, [brandId, setAnalysisStatus]);

  const handleReanalyze = useCallback(() => {
    setStep('upload');
    setAnalysisResults(null);
  }, []);

  const handleFigmaAnalysis = useCallback((analysis) => {
    // Convert Figma analysis to rules format
    const rules = [];

    // Add color rules from Figma
    if (analysis.colors && analysis.colors.length > 0) {
      analysis.colors.forEach((color, index) => {
        if (color.value) {
          rules.push({
            id: `figma-color-${index}`,
            category: 'color',
            name: color.name || `Figma Color ${index + 1}`,
            description: color.description || `Farbe aus ${analysis.fileName}`,
            confidence: analysis.confidence || 0.95,
            sources: [{ file: analysis.fileName, location: 'figma', type: 'figma' }],
            value: {
              color: color.value,
              opacity: color.opacity || 1,
              usage: []
            },
            applicableTo: ['all']
          });
        }
      });
    }

    // Add font rules from Figma
    if (analysis.fonts && analysis.fonts.length > 0) {
      analysis.fonts.forEach((font, index) => {
        rules.push({
          id: `figma-font-${index}`,
          category: 'typography',
          name: font.name,
          description: `Schriftart aus ${analysis.fileName}`,
          confidence: analysis.confidence || 0.95,
          sources: [{ file: analysis.fileName, location: 'figma', type: 'figma' }],
          value: {
            fontFamily: font.name,
            weights: font.weights || [],
            fontSize: font.fontSize,
            lineHeight: font.lineHeight
          },
          applicableTo: ['all']
        });
      });
    }

    // Store results
    const results = {
      rules: rules.filter(r => r.confidence >= 0.7),
      needsReview: rules.filter(r => r.confidence < 0.7 && r.confidence >= 0.5),
      extractedAssets: {
        logos: analysis.logos || [],
        components: analysis.components || []
      }
    };

    setAnalysisResults(results);
    setRulesForBrand(brandId, [...results.rules, ...results.needsReview]);
    setAnalysisStatus(brandId, 'review');
    setStep('review');
  }, [brandId, setAnalysisStatus, setRulesForBrand]);

  if (!brand) {
    return <div className="not-found">Marke nicht gefunden</div>;
  }

  return (
    <div className="brand-intelligence">
      <header className="page-header">
        <div className="page-header-content">
          <h1>Brand Intelligence</h1>
          <p className="page-subtitle">
            {step === 'upload' && 'Lade Templates hoch und wir lernen automatisch deine Brand-Regeln'}
            {step === 'analyzing' && 'Analysiere deine Brand-Assets...'}
            {step === 'review' && 'Prüfe und bestätige die erkannten Regeln'}
            {step === 'manage' && `${brand.name} - Gelernte Brand-Regeln verwalten`}
          </p>
        </div>
        {step === 'manage' && (
          <button className="btn-secondary" onClick={handleReanalyze}>
            Neu analysieren
          </button>
        )}
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

        {step === 'review' && (
          <RulesReview
            brandId={brandId}
            onConfirm={handleConfirmRules}
            onBack={() => setStep('upload')}
          />
        )}

        {step === 'manage' && (
          <RulesManager
            brandId={brandId}
            onReanalyze={handleReanalyze}
            extractedAssets={analysisResults?.extractedAssets}
          />
        )}
      </div>
    </div>
  );
}
