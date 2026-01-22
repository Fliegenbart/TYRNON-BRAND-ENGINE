import React, { useState } from 'react';

export default function BrandPreview({ extractedData, onApply, onCancel }) {
  const { colors = [], fonts = [], logos = [] } = extractedData || {};

  // State für Farbzuweisung
  const [selectedColors, setSelectedColors] = useState({
    primary: colors[0]?.hex || null,
    secondary: colors[1]?.hex || null,
    accent: colors[2]?.hex || null,
    background: '#ffffff',
    text: '#1d1d1f'
  });

  const [selectedFonts, setSelectedFonts] = useState({
    heading: fonts[0]?.name || null,
    body: fonts[1]?.name || fonts[0]?.name || null
  });

  const [selectedLogo, setSelectedLogo] = useState(logos[0]?.dataUrl || null);

  const handleColorSelect = (role, hex) => {
    setSelectedColors(prev => ({ ...prev, [role]: hex }));
  };

  const handleApply = () => {
    onApply({
      colors: selectedColors,
      fonts: selectedFonts,
      logo: selectedLogo
    });
  };

  const colorRoles = [
    { key: 'primary', label: 'Primär' },
    { key: 'secondary', label: 'Sekundär' },
    { key: 'accent', label: 'Akzent' }
  ];

  return (
    <div className="brand-preview">
      <div className="preview-header">
        <h2>Gefundene Brand-Elemente</h2>
        <p>Wähle aus, welche Elemente du übernehmen möchtest</p>
      </div>

      {/* Farben */}
      <section className="preview-section">
        <h3>Farben ({colors.length} gefunden)</h3>

        {colors.length > 0 ? (
          <>
            <div className="color-palette">
              {colors.map((color, i) => (
                <div
                  key={i}
                  className="color-swatch-large"
                  style={{ backgroundColor: color.hex }}
                  title={color.hex}
                >
                  <span className="color-hex">{color.hex}</span>
                </div>
              ))}
            </div>

            <div className="color-assignment">
              {colorRoles.map(({ key, label }) => (
                <div key={key} className="color-role">
                  <label>{label}:</label>
                  <div className="color-options">
                    {colors.slice(0, 8).map((color, i) => (
                      <button
                        key={i}
                        className={`color-option ${selectedColors[key] === color.hex ? 'selected' : ''}`}
                        style={{ backgroundColor: color.hex }}
                        onClick={() => handleColorSelect(key, color.hex)}
                        title={color.hex}
                      />
                    ))}
                  </div>
                  {selectedColors[key] && (
                    <span className="selected-color">{selectedColors[key]}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="no-results">Keine Farben gefunden</p>
        )}
      </section>

      {/* Logos */}
      <section className="preview-section">
        <h3>Logo ({logos.length} gefunden)</h3>

        {logos.length > 0 ? (
          <div className="logo-grid">
            {logos.map((logo, i) => (
              <div
                key={i}
                className={`logo-option ${selectedLogo === logo.dataUrl ? 'selected' : ''}`}
                onClick={() => setSelectedLogo(logo.dataUrl)}
              >
                <img src={logo.dataUrl} alt={logo.name || `Logo ${i + 1}`} />
                {logo.name && <span className="logo-name">{logo.name}</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-results">Keine Logos gefunden - du kannst später ein Logo in den Brand-Einstellungen hinzufügen</p>
        )}
      </section>

      {/* Schriften */}
      <section className="preview-section">
        <h3>Schriften ({fonts.length} gefunden)</h3>

        {fonts.length > 0 ? (
          <div className="font-list">
            {fonts.map((font, i) => (
              <div key={i} className="font-item">
                <span
                  className="font-sample"
                  style={{ fontFamily: font.name }}
                >
                  {font.name}
                </span>
                <span className="font-usage">
                  {font.usage === 'heading' ? 'Headlines' : font.usage === 'body' ? 'Fließtext' : font.usage}
                </span>
                <div className="font-actions">
                  <button
                    className={selectedFonts.heading === font.name ? 'active' : ''}
                    onClick={() => setSelectedFonts(prev => ({ ...prev, heading: font.name }))}
                  >
                    Headline
                  </button>
                  <button
                    className={selectedFonts.body === font.name ? 'active' : ''}
                    onClick={() => setSelectedFonts(prev => ({ ...prev, body: font.name }))}
                  >
                    Body
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-results">Keine Schriften gefunden - Standard-Schriften werden verwendet</p>
        )}
      </section>

      {/* Preview */}
      <section className="preview-section">
        <h3>Vorschau</h3>
        <div
          className="brand-mini-preview"
          style={{
            backgroundColor: selectedColors.background,
            color: selectedColors.text
          }}
        >
          {selectedLogo && (
            <img src={selectedLogo} alt="Logo" className="mini-preview-logo" />
          )}
          <h4 style={{
            color: selectedColors.primary,
            fontFamily: selectedFonts.heading || 'inherit'
          }}>
            Headline Text
          </h4>
          <p style={{ fontFamily: selectedFonts.body || 'inherit' }}>
            Body text beispiel mit der gewählten Schriftart.
          </p>
          <button style={{ backgroundColor: selectedColors.accent, color: '#fff' }}>
            Button
          </button>
        </div>
      </section>

      {/* Actions */}
      <div className="preview-actions">
        <button className="btn-secondary" onClick={onCancel}>
          Zurück
        </button>
        <button className="btn-primary btn-large" onClick={handleApply}>
          In Brand übernehmen
        </button>
      </div>
    </div>
  );
}
