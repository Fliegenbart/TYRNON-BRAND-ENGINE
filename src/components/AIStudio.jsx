import React, { useState } from 'react';
import { generateCompleteAsset, generateImage, scrapeWebsite, assetStructures } from '../lib/ai.js';

export default function AIStudio({ brand, selectedAsset, onApplyContent }) {
  const [activeTab, setActiveTab] = useState('text');
  const [briefing, setBriefing] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [scrapedContent, setScrapedContent] = useState(null);
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [error, setError] = useState(null);

  // Image generation state
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('modern');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const currentAsset = assetStructures[selectedAsset];

  const handleScrapeUrl = async () => {
    if (!sourceUrl.trim()) return;
    setIsScraping(true);
    setError(null);

    try {
      const content = await scrapeWebsite(sourceUrl);
      setScrapedContent(content);
    } catch (err) {
      setError(err.message);
    }

    setIsScraping(false);
  };

  const handleGenerate = async () => {
    if (!briefing.trim()) {
      setError('Bitte gib ein Briefing ein');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const text = await generateCompleteAsset(brand, selectedAsset, briefing, scrapedContent);
      setGeneratedText(text);
    } catch (err) {
      setError(err.message);
    }

    setIsGenerating(false);
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      setError('Bitte beschreibe das gewünschte Bild');
      return;
    }

    setIsGeneratingImage(true);
    setError(null);

    try {
      const image = await generateImage(imagePrompt, brand, imageStyle);
      setGeneratedImage(image);
    } catch (err) {
      setError(err.message);
    }

    setIsGeneratingImage(false);
  };

  const handleApplyText = () => {
    if (onApplyContent && generatedText) {
      onApplyContent(generatedText);
    }
  };

  const tabs = [
    { id: 'text', label: 'Text', icon: 'T' },
    { id: 'image', label: 'Bild', icon: 'B' },
  ];

  return (
    <div className="ai-studio">
      <div className="ai-studio-header">
        <h3>AI Studio</h3>
        <div className="ai-studio-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`ai-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="ai-tab-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="ai-error">
          <span>!</span>
          <span>{error}</span>
          <button onClick={() => setError(null)}>x</button>
        </div>
      )}

      {activeTab === 'text' && (
        <div className="ai-text-panel">
          <div className="ai-asset-info">
            <span className="ai-asset-badge">{currentAsset?.name || selectedAsset}</span>
            <span className="ai-asset-hint">Komplettes Asset generieren</span>
          </div>

          <div className="ai-section">
            <label className="ai-label">
              <span className="label-icon">URL</span>
              <span>Quelle (optional)</span>
            </label>
            <div className="ai-url-input">
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://beispiel.de/seite"
                disabled={isScraping}
              />
              <button
                onClick={handleScrapeUrl}
                disabled={isScraping || !sourceUrl.trim()}
                className="btn-scrape"
              >
                {isScraping ? '...' : 'Analysieren'}
              </button>
            </div>
            {scrapedContent && (
              <div className="ai-scraped-preview expanded">
                <div className="scraped-header">
                  <span className="scraped-title">Website-Analyse</span>
                  <div className="scraped-actions">
                    <button
                      className="btn-use-content"
                      onClick={() => setBriefing(prev => prev + '\n\nWebsite-Kontext:\n' + scrapedContent.slice(0, 1000))}
                      title="In Briefing übernehmen"
                    >
                      Nutzen
                    </button>
                    <button onClick={() => setScrapedContent(null)} className="btn-close">×</button>
                  </div>
                </div>
                <div className="scraped-content">
                  {scrapedContent.split('\n').map((line, i) => {
                    if (line.startsWith('📊') || line.startsWith('📄')) {
                      return <h4 key={i} className="scraped-section-title">{line}</h4>;
                    }
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <h5 key={i} className="scraped-label">{line.replace(/\*\*/g, '')}</h5>;
                    }
                    if (line.startsWith('**')) {
                      const [label, ...rest] = line.split(':');
                      return (
                        <p key={i} className="scraped-line">
                          <strong>{label.replace(/\*\*/g, '')}:</strong>
                          {rest.join(':')}
                        </p>
                      );
                    }
                    if (line.startsWith('•')) {
                      return <p key={i} className="scraped-bullet">{line}</p>;
                    }
                    if (line.startsWith('"')) {
                      return <blockquote key={i} className="scraped-quote">{line}</blockquote>;
                    }
                    if (line.startsWith('---')) {
                      return <hr key={i} className="scraped-divider" />;
                    }
                    if (line.trim()) {
                      return <p key={i}>{line}</p>;
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="ai-section">
            <label className="ai-label">
              <span className="label-icon">B</span>
              <span>Briefing</span>
            </label>
            <textarea
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              placeholder={`Beschreibe, was du brauchst...

Beispiele:
• "Landingpage für unser neues SaaS-Produkt zur Zeiterfassung"
• "Social Media Kampagne für Frühlingsrabatt-Aktion 20%"
• "Newsletter zur Ankündigung unseres Webinars am 15. März"`}
              rows={5}
              disabled={isGenerating}
            />
          </div>

          <button
            className="btn-generate-full"
            onClick={handleGenerate}
            disabled={isGenerating || !briefing.trim()}
          >
            {isGenerating ? (
              <>
                <span className="spinner-small"></span>
                <span>Generiere {currentAsset?.name || 'Asset'}...</span>
              </>
            ) : (
              <>
                <span className="generate-icon">*</span>
                <span>Asset generieren</span>
              </>
            )}
          </button>

          {generatedText && (
            <div className="ai-result-panel">
              <div className="ai-result-header">
                <h4>Generierter Content</h4>
                <div className="ai-result-actions">
                  <button onClick={() => navigator.clipboard.writeText(generatedText)}>
                    Kopieren
                  </button>
                  <button onClick={handleApplyText} className="btn-apply">
                    Anwenden
                  </button>
                </div>
              </div>
              <div className="ai-result-content">
                <pre>{generatedText}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'image' && (
        <div className="ai-image-panel">
          <div className="ai-section">
            <label className="ai-label">
              <span className="label-icon">P</span>
              <span>Bildbeschreibung</span>
            </label>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder={`Beschreibe das Bild, das du brauchst...

Beispiele:
• "Hero-Bild für Tech-Startup: Person arbeitet an Laptop, moderne Büroumgebung"
• "Abstrakte Grafik für Nachhaltigkeit: Grüne Elemente, Natur, modern"
• "Team-Foto-Stil: Diverse Gruppe in Meeting, professionell"`}
              rows={4}
              disabled={isGeneratingImage}
            />
          </div>

          <div className="ai-section">
            <label className="ai-label">
              <span className="label-icon">S</span>
              <span>Stil</span>
            </label>
            <div className="ai-style-options">
              {[
                { id: 'modern', label: 'Modern' },
                { id: 'corporate', label: 'Corporate' },
                { id: 'creative', label: 'Kreativ' },
                { id: 'photo', label: 'Foto' },
                { id: 'illustration', label: 'Illustration' },
              ].map(style => (
                <button
                  key={style.id}
                  className={`style-option ${imageStyle === style.id ? 'active' : ''}`}
                  onClick={() => setImageStyle(style.id)}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn-generate-full"
            onClick={handleGenerateImage}
            disabled={isGeneratingImage || !imagePrompt.trim()}
          >
            {isGeneratingImage ? (
              <>
                <span className="spinner-small"></span>
                <span>Generiere Bild...</span>
              </>
            ) : (
              <>
                <span className="generate-icon">*</span>
                <span>Bild generieren</span>
              </>
            )}
          </button>

          {generatedImage && (
            <div className="ai-image-result">
              <div className="ai-result-header">
                <h4>Generiertes Bild</h4>
                <div className="ai-result-actions">
                  <a
                    href={generatedImage}
                    download="generated-image.png"
                    className="btn-download"
                  >
                    Download
                  </a>
                </div>
              </div>
              <div className="ai-image-preview">
                <img src={generatedImage} alt="Generated" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
