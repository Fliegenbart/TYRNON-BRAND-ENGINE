import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBrandStore } from '../../stores/brandStore';
import { previewComponents } from '../previews/index.jsx';
import AIStudio from '../AIStudio';
import ContentEditor from '../ContentEditor';
import ImagePicker from '../ImagePicker';

const assetTypes = [
  { id: 'website', name: 'Website', icon: '🌐', description: 'Landing Page, Hero Section' },
  { id: 'social', name: 'Social Media', icon: '📱', description: 'Posts für Instagram, LinkedIn' },
  { id: 'presentation', name: 'Präsentation', icon: '📊', description: 'PowerPoint Slides' },
  { id: 'flyer', name: 'Flyer', icon: '📄', description: 'Print-Flyer, Broschüren' },
  { id: 'email', name: 'Newsletter', icon: '✉️', description: 'E-Mail Kampagnen' },
  { id: 'businesscard', name: 'Visitenkarte', icon: '🪪', description: 'Business Cards' },
];

const toolTabs = [
  { id: 'ai', name: 'AI Studio', icon: '✨' },
  { id: 'content', name: 'Inhalt', icon: '✎' },
  { id: 'media', name: 'Medien', icon: '🖼' },
];

export default function AssetGenerator() {
  const { brandId, assetType: urlAssetType } = useParams();
  const navigate = useNavigate();
  const { getBrandById, getAssetContent, updateAssetContent } = useBrandStore();

  const brand = getBrandById(brandId);
  const [selectedAsset, setSelectedAsset] = useState(urlAssetType || 'website');
  const [activeToolTab, setActiveToolTab] = useState('ai');
  const [showSidebar, setShowSidebar] = useState(true);

  if (!brand) {
    return <div className="not-found">Marke nicht gefunden</div>;
  }

  const content = getAssetContent(brandId, selectedAsset) || { fields: {} };
  const PreviewComponent = previewComponents[selectedAsset];

  const handleAssetChange = (assetId) => {
    setSelectedAsset(assetId);
    navigate(`/brand/${brandId}/assets/${assetId}`, { replace: true });
  };

  const handleContentChange = (newContent) => {
    updateAssetContent(brandId, selectedAsset, newContent);
  };

  const handleApplyAIContent = (generatedText) => {
    const lines = generatedText.split('\n').filter(l => l.trim());
    const headline = lines.find(l => l.toLowerCase().includes('headline'))
      ?.replace(/.*?[:：]\s*/, '').replace(/\*\*/g, '') || '';

    handleContentChange({
      ...content,
      fields: {
        ...content.fields,
        headline: { value: headline || lines[0]?.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '') || '' },
        body: { value: generatedText }
      }
    });
  };

  return (
    <div className="asset-generator">
      <header className="page-header">
        <div className="page-header-content">
          <h1>Asset Generator</h1>
          <p className="page-subtitle">Erstelle Marketing-Assets für {brand.name}</p>
        </div>
        <button
          className={`btn-secondary ${showSidebar ? 'active' : ''}`}
          onClick={() => setShowSidebar(!showSidebar)}
        >
          {showSidebar ? 'Tools ausblenden' : 'Tools anzeigen'}
        </button>
      </header>

      <div className="asset-workspace">
        <aside className="asset-type-sidebar">
          <div className="asset-type-list">
            {assetTypes.map(asset => (
              <button
                key={asset.id}
                className={`asset-type-btn ${selectedAsset === asset.id ? 'active' : ''}`}
                onClick={() => handleAssetChange(asset.id)}
              >
                <span className="asset-type-icon">{asset.icon}</span>
                <div className="asset-type-info">
                  <span className="asset-type-name">{asset.name}</span>
                  <span className="asset-type-desc">{asset.description}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="asset-preview-area">
          <div className="preview-frame-wrapper">
            <div className="preview-frame">
              {PreviewComponent && (
                <PreviewComponent brand={brand} content={content} />
              )}
            </div>
            <div className="preview-label">
              {assetTypes.find(a => a.id === selectedAsset)?.name} Preview
            </div>
          </div>
        </main>

        {showSidebar && (
          <aside className="asset-tools-sidebar">
            <div className="tool-tabs">
              {toolTabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tool-tab ${activeToolTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveToolTab(tab.id)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-name">{tab.name}</span>
                </button>
              ))}
            </div>

            <div className="tool-panel">
              {activeToolTab === 'ai' && (
                <AIStudio
                  brand={brand}
                  selectedAsset={selectedAsset}
                  onApplyContent={handleApplyAIContent}
                />
              )}

              {activeToolTab === 'content' && (
                <ContentEditor
                  assetType={selectedAsset}
                  content={content}
                  onChange={handleContentChange}
                  brand={brand}
                />
              )}

              {activeToolTab === 'media' && (
                <div className="media-panel">
                  <ImagePicker
                    brand={brand}
                    onSelectImage={(img) => {
                      handleContentChange({
                        ...content,
                        fields: {
                          ...content.fields,
                          image: { value: img.url || img }
                        }
                      });
                    }}
                  />
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
