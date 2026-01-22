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

  // Smart parser for AI-generated content
  const handleApplyAIContent = (generatedText) => {
    const extractField = (text, patterns) => {
      for (const pattern of patterns) {
        const regex = new RegExp(`\\*\\*${pattern}[:\\*]*\\**\\s*(.+?)(?=\\n\\n|\\n\\*\\*|$)`, 'is');
        const match = text.match(regex);
        if (match) {
          return match[1].trim().replace(/\*\*/g, '').replace(/^["„]|[""]$/g, '');
        }
      }
      return null;
    };

    const extractSection = (text, sectionNames) => {
      for (const name of sectionNames) {
        const regex = new RegExp(`#\\s*${name}[\\s\\S]*?(?=\\n#|$)`, 'i');
        const match = text.match(regex);
        if (match) return match[0];
      }
      return null;
    };

    const extractBullets = (text, patterns) => {
      for (const pattern of patterns) {
        const regex = new RegExp(`\\*\\*${pattern}[:\\*]*\\**\\s*([\\s\\S]*?)(?=\\n\\n\\*\\*|\\n#|$)`, 'i');
        const match = text.match(regex);
        if (match) {
          const bullets = match[1].match(/[•\-]\s*(.+)/g);
          if (bullets) {
            return bullets.map(b => b.replace(/^[•\-]\s*/, '').trim());
          }
        }
      }
      return null;
    };

    let newFields = { ...content.fields };

    // Asset-specific parsing
    switch (selectedAsset) {
      case 'website': {
        const heroSection = extractSection(generatedText, ['HERO-BEREICH', 'HERO']);
        const headline = extractField(generatedText, ['Headline', 'Überschrift'])
          || extractField(heroSection || '', ['Headline']);
        const subline = extractField(generatedText, ['Subline', 'Untertitel', 'Beschreibung'])
          || extractField(heroSection || '', ['Subline']);
        const cta = extractField(generatedText, ['CTA', 'Button', 'Call-to-Action']);

        if (headline) newFields.headline = { value: headline };
        if (subline) newFields.subline = { value: subline };
        if (cta) newFields.cta = { value: cta };
        break;
      }

      case 'social': {
        const hook = extractField(generatedText, ['Hook', 'Headline']);
        const hashtags = extractField(generatedText, ['Hashtags', 'Tags']);

        if (hook) newFields.headline = { value: hook };
        if (hashtags) newFields.hashtags = { value: hashtags };
        break;
      }

      case 'presentation': {
        const titleSection = extractSection(generatedText, ['SLIDE 1', 'TITEL']);
        const title = extractField(titleSection || generatedText, ['Präsentationstitel', 'Titel'])
          || generatedText.match(/\*\*(.+?)\*\*/)?.[1];
        const subtitle = extractField(generatedText, ['Untertitel', 'Tagline', 'Subtitle']);

        if (title) newFields.title = { value: title };
        if (subtitle) newFields.subtitle = { value: subtitle };
        break;
      }

      case 'flyer': {
        const headline = extractField(generatedText, ['Headline', 'Überschrift']);
        const description = extractField(generatedText, ['Einleitung', 'Beschreibung', 'Text']);
        const cta = extractField(generatedText, ['CTA', 'Eyecatcher', 'Button']);
        const benefits = extractBullets(generatedText, ['Benefits', 'Vorteile', 'Key Benefits']);

        if (headline) newFields.headline = { value: headline };
        if (description) newFields.description = { value: description };
        if (cta) newFields.cta = { value: cta };
        if (benefits) newFields.details = { value: benefits.join('\n• ') };
        break;
      }

      case 'email': {
        const subject = extractField(generatedText, ['Betreff', 'Betreffzeile', 'Subject']);
        const preheader = extractField(generatedText, ['Preheader', 'Vorschau']);
        const greeting = extractField(generatedText, ['Anrede', 'Greeting']);
        const cta = extractField(generatedText, ['CTA-BUTTON', 'Button-Text', 'CTA']);

        // Extract main body (everything between greeting and signature)
        const bodyMatch = generatedText.match(/(?:Hallo|Sehr geehrte)[,\s\S]*?(?=\n\nMit|$)/i);
        const body = bodyMatch ? bodyMatch[0].replace(/^\*\*.*?\*\*\s*/gm, '').trim() : null;

        if (subject) newFields.subject = { value: subject };
        if (preheader) newFields.preheader = { value: preheader };
        if (greeting) newFields.greeting = { value: greeting };
        if (body) newFields.body = { value: body };
        if (cta) newFields.cta = { value: cta };
        break;
      }

      case 'businesscard': {
        const title = extractField(generatedText, ['Position', 'Titel']);
        const description = extractField(generatedText, ['Beschreibung', 'Tätigkeit']);
        const motto = extractField(generatedText, ['Motto', 'Slogan', 'Tagline']);

        if (title) newFields.title = { value: title };
        if (motto) newFields.name = { value: motto }; // Use motto as a placeholder suggestion
        break;
      }
    }

    // Store raw content for reference
    newFields._rawContent = { value: generatedText };

    handleContentChange({
      ...content,
      fields: newFields
    });

    // Switch to content tab to show editable fields
    setActiveToolTab('content');
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
                <PreviewComponent
                  brand={brand}
                  content={content}
                  onFieldChange={(field, value) => {
                    handleContentChange({
                      ...content,
                      fields: {
                        ...content.fields,
                        [field]: { value }
                      }
                    });
                  }}
                />
              )}
            </div>
            <div className="preview-label">
              {assetTypes.find(a => a.id === selectedAsset)?.name} Preview
              <span className="preview-hint">Klicke auf Texte zum Bearbeiten</span>
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
