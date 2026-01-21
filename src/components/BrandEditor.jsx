import React, { useState } from 'react';
import AccessibilityChecker from './AccessibilityChecker';

export default function BrandEditor({ brand, onUpdate }) {
  const [activeTab, setActiveTab] = useState('visuals');

  const updateBrand = (key, value) => {
    onUpdate({ ...brand, [key]: value });
  };

  const updateColors = (colorKey, value) => {
    onUpdate({ ...brand, colors: { ...brand.colors, [colorKey]: value } });
  };

  return (
    <div className="brand-editor">
      <div className="editor-tabs">
        <button className={activeTab === 'visuals' ? 'active' : ''} onClick={() => setActiveTab('visuals')}>Visuals</button>
        <button className={activeTab === 'typography' ? 'active' : ''} onClick={() => setActiveTab('typography')}>Typo</button>
        <button className={activeTab === 'voice' ? 'active' : ''} onClick={() => setActiveTab('voice')}>Voice</button>
        <button className={activeTab === 'a11y' ? 'active' : ''} onClick={() => setActiveTab('a11y')}>A11y</button>
      </div>

      <div className="editor-content">
        {activeTab === 'visuals' && (
          <div className="editor-section">
            <h3>Farben</h3>
            <div className="color-grid">
              {['primary', 'secondary', 'accent', 'background', 'text'].map(colorKey => (
                <div key={colorKey} className="color-input">
                  <label>{colorKey === 'primary' ? 'Primar' : colorKey === 'secondary' ? 'Sekundar' : colorKey === 'accent' ? 'Akzent' : colorKey === 'background' ? 'Hintergrund' : 'Text'}</label>
                  <div className="color-picker-row">
                    <input type="color" value={brand.colors[colorKey]} onChange={(e) => updateColors(colorKey, e.target.value)} />
                    <input type="text" value={brand.colors[colorKey]} onChange={(e) => updateColors(colorKey, e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
            <h3>Logo</h3>
            <div className="logo-upload">
              <div className="logo-preview" style={{ backgroundColor: brand.colors.primary + '20' }}>
                {brand.logo ? <img src={brand.logo} alt="Logo" /> : <span>Logo hochladen</span>}
              </div>
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => updateBrand('logo', ev.target.result);
                  reader.readAsDataURL(file);
                }
              }} />
            </div>
          </div>
        )}

        {activeTab === 'typography' && (
          <div className="editor-section">
            <h3>Schriftarten</h3>
            <div className="font-selector">
              <label>Uberschriften</label>
              <select value={brand.fonts.heading} onChange={(e) => updateBrand('fonts', { ...brand.fonts, heading: e.target.value })}>
                <option value="'Playfair Display', serif">Playfair Display</option>
                <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                <option value="'Bebas Neue', sans-serif">Bebas Neue</option>
                <option value="'DM Sans', sans-serif">DM Sans</option>
              </select>
            </div>
            <div className="font-selector">
              <label>Fliesstext</label>
              <select value={brand.fonts.body} onChange={(e) => updateBrand('fonts', { ...brand.fonts, body: e.target.value })}>
                <option value="'Inter', sans-serif">Inter</option>
                <option value="'Source Sans 3', sans-serif">Source Sans</option>
                <option value="'Lora', serif">Lora</option>
                <option value="'Work Sans', sans-serif">Work Sans</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'voice' && (
          <div className="editor-section">
            <h3>Markenstimme</h3>
            <div className="voice-input">
              <label>Tonalitat</label>
              <select value={brand.voice.tone} onChange={(e) => updateBrand('voice', { ...brand.voice, tone: e.target.value })}>
                <option value="professional">Professionell</option>
                <option value="friendly">Freundlich</option>
                <option value="innovative">Innovativ</option>
                <option value="premium">Premium</option>
                <option value="playful">Spielerisch</option>
                <option value="trustworthy">Vertrauenswurdig</option>
              </select>
            </div>
            <div className="voice-input">
              <label>Ansprache</label>
              <select value={brand.voice.formality} onChange={(e) => updateBrand('voice', { ...brand.voice, formality: e.target.value })}>
                <option value="du">Du</option>
                <option value="sie">Sie</option>
                <option value="wir">Wir</option>
              </select>
            </div>
            <div className="voice-input">
              <label>Tagline</label>
              <input type="text" value={brand.voice.tagline} onChange={(e) => updateBrand('voice', { ...brand.voice, tagline: e.target.value })} placeholder="Kernbotschaft" />
            </div>
            <div className="voice-input">
              <label>Do's</label>
              <textarea value={brand.voice.dos} onChange={(e) => updateBrand('voice', { ...brand.voice, dos: e.target.value })} placeholder="Gewunschte Worter (kommagetrennt)" />
            </div>
            <div className="voice-input">
              <label>Don'ts</label>
              <textarea value={brand.voice.donts} onChange={(e) => updateBrand('voice', { ...brand.voice, donts: e.target.value })} placeholder="Vermeidene Worter (kommagetrennt)" />
            </div>
          </div>
        )}

        {activeTab === 'a11y' && (
          <AccessibilityChecker brand={brand} />
        )}
      </div>
    </div>
  );
}
