import React, { useState } from 'react';
import { previewComponents } from './previews/index.jsx';
import AITextGenerator from './AITextGenerator';
import ContentEditor from './ContentEditor';
import QRCodeGenerator from './QRCodeGenerator';
import ImagePicker from './ImagePicker';
import ExportPanel from './ExportPanel';

const assetTypes = [
  { id: 'website', name: 'Website', icon: 'W' },
  { id: 'social', name: 'Social', icon: 'S' },
  { id: 'presentation', name: 'PPT', icon: 'P' },
  { id: 'flyer', name: 'Flyer', icon: 'F' },
  { id: 'email', name: 'E-Mail', icon: 'E' },
  { id: 'businesscard', name: 'Karte', icon: 'K' },
];

export default function AssetPreview({ brand, selectedAsset, onAssetChange, content, onContentChange }) {
  const [activeToolTab, setActiveToolTab] = useState('content');

  const PreviewComponent = previewComponents[selectedAsset];

  const handleInsertText = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    const headline = lines[0]?.replace(/^\d+\.\s*/, '') || '';

    onContentChange({
      ...content,
      fields: {
        ...content.fields,
        headline: { value: headline },
        body: { value: text }
      }
    });
  };

  const toolTabs = [
    { id: 'content', name: 'Inhalt', icon: 'C' },
    { id: 'ai', name: 'AI', icon: 'A' },
    { id: 'media', name: 'Medien', icon: 'M' },
    { id: 'export', name: 'Export', icon: 'E' },
  ];

  return (
    <div className="asset-preview-panel">
      <div className="asset-selector">
        {assetTypes.map(asset => (
          <button
            key={asset.id}
            className={selectedAsset === asset.id ? 'active' : ''}
            onClick={() => onAssetChange(asset.id)}
          >
            <span className="asset-icon">{asset.icon}</span>
            <span>{asset.name}</span>
          </button>
        ))}
      </div>

      <div className="preview-workspace">
        <div className="preview-main">
          <div className="preview-container">
            {PreviewComponent && <PreviewComponent brand={brand} content={content} />}
          </div>
        </div>

        <div className="preview-sidebar">
          <div className="tool-tabs">
            {toolTabs.map(tab => (
              <button
                key={tab.id}
                className={`tool-tab ${activeToolTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveToolTab(tab.id)}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <div className="tool-content">
            {activeToolTab === 'content' && (
              <ContentEditor
                assetType={selectedAsset}
                content={content}
                onChange={onContentChange}
                brand={brand}
              />
            )}

            {activeToolTab === 'ai' && (
              <AITextGenerator brand={brand} onInsertText={handleInsertText} />
            )}

            {activeToolTab === 'media' && (
              <>
                <QRCodeGenerator brand={brand} content={content} />
                <ImagePicker brand={brand} onSelectImage={(img) => console.log('Selected:', img)} />
              </>
            )}

            {activeToolTab === 'export' && (
              <ExportPanel brand={brand} content={content} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
