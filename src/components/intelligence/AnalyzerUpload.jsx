import React, { useState, useCallback } from 'react';

const acceptedTypes = {
  'templates': { icon: 'T', label: 'Templates', accept: '.pptx,.ppt,.potx,.pdf' },
  'images': { icon: 'I', label: 'Bilder & Logos', accept: '.png,.jpg,.jpeg,.svg,.webp,.gif,.ico' },
  'fonts': { icon: 'F', label: 'Schriften', accept: '.ttf,.otf,.woff,.woff2' },
  'tokens': { icon: '{', label: 'Design Tokens', accept: '.json' }
};

const allAcceptedExtensions = [
  // Templates
  'pptx', 'ppt', 'potx', 'pdf',
  // Images
  'png', 'jpg', 'jpeg', 'svg', 'webp', 'gif', 'ico',
  // Fonts
  'ttf', 'otf', 'woff', 'woff2',
  // Design Tokens (Figma, Style Dictionary, etc.)
  'json'
];

export default function AnalyzerUpload({ onStartAnalysis }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
    e.target.value = ''; // Reset input
  }, []);

  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return allAcceptedExtensions.includes(ext);
    });

    setFiles(prev => {
      // Avoid duplicates
      const existingNames = new Set(prev.map(f => f.name));
      const unique = validFiles.filter(f => !existingNames.has(f.name));
      return [...prev, ...unique];
    });
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['pptx', 'ppt', 'potx'].includes(ext)) return 'P';
    if (ext === 'pdf') return 'D';
    if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) return 'F';
    if (['svg'].includes(ext)) return 'S';
    if (ext === 'json') return '{';
    return 'I';
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['pptx', 'ppt'].includes(ext)) return 'PowerPoint';
    if (ext === 'potx') return 'PowerPoint Template';
    if (ext === 'pdf') return 'PDF';
    if (['ttf', 'otf'].includes(ext)) return 'Schriftart';
    if (['woff', 'woff2'].includes(ext)) return 'Web-Schrift';
    if (ext === 'svg') return 'SVG Vektor';
    if (ext === 'ico') return 'Favicon';
    if (ext === 'json') return 'Design Tokens';
    return 'Bild';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleStart = () => {
    if (files.length > 0) {
      onStartAnalysis(files);
    }
  };

  // Count files by type
  const fileCounts = {
    templates: files.filter(f => ['pptx', 'ppt', 'potx', 'pdf'].includes(f.name.split('.').pop().toLowerCase())).length,
    images: files.filter(f => ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif', 'ico'].includes(f.name.split('.').pop().toLowerCase())).length,
    fonts: files.filter(f => ['ttf', 'otf', 'woff', 'woff2'].includes(f.name.split('.').pop().toLowerCase())).length,
    tokens: files.filter(f => f.name.split('.').pop().toLowerCase() === 'json').length
  };

  return (
    <div className="analyzer-upload">
      <div className="upload-intro">
        <div className="upload-icon-large">
          <span>+</span>
        </div>
        <h2>Brand-Assets hochladen</h2>
        <p>
          Lade deine Logos, Bilder, Schriften und Templates hoch.
          Wir extrahieren automatisch Farben, Schriften und Stilregeln.
        </p>
        <p className="upload-hint-figma">
          Figma-Nutzer: Exportiere deine Assets als SVG/PNG und Design Tokens als JSON
        </p>
      </div>

      <div
        className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="dropzone-content">
          <div className="dropzone-icon">+</div>
          <p className="dropzone-text">
            Dateien hierher ziehen oder <label className="dropzone-browse">
              durchsuchen
              <input
                type="file"
                multiple
                accept={allAcceptedExtensions.map(e => '.' + e).join(',')}
                onChange={handleFileSelect}
                hidden
              />
            </label>
          </p>
          <p className="dropzone-hint">
            Bilder, Logos, Schriften, PowerPoint, PDF
          </p>
        </div>
      </div>

      <div className="upload-types">
        {Object.entries(acceptedTypes).map(([key, { icon, label, accept }]) => (
          <label key={key} className="upload-type-card">
            <input
              type="file"
              multiple
              accept={accept}
              onChange={handleFileSelect}
              hidden
            />
            <span className="type-icon">{icon}</span>
            <span className="type-label">{label}</span>
          </label>
        ))}
      </div>

      {files.length > 0 && (
        <div className="upload-file-list">
          <div className="file-list-header">
            <h3>Ausgewählte Dateien ({files.length})</h3>
            <div className="file-counts">
              {fileCounts.templates > 0 && <span className="file-count-badge">{fileCounts.templates} Templates</span>}
              {fileCounts.images > 0 && <span className="file-count-badge">{fileCounts.images} Bilder</span>}
              {fileCounts.fonts > 0 && <span className="file-count-badge">{fileCounts.fonts} Schriften</span>}
              {fileCounts.tokens > 0 && <span className="file-count-badge">{fileCounts.tokens} Tokens</span>}
            </div>
            <button
              className="btn-text"
              onClick={() => setFiles([])}
            >
              Alle entfernen
            </button>
          </div>

          <div className="file-list">
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <span className="file-icon">{getFileIcon(file.name)}</span>
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-meta">
                    {getFileType(file.name)} • {formatFileSize(file.size)}
                  </span>
                </div>
                <button
                  className="file-remove"
                  onClick={() => removeFile(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            className="btn-primary btn-large"
            onClick={handleStart}
          >
            <span className="btn-icon">*</span>
            {fileCounts.templates > 0 ? 'Analyse starten' : 'Assets hinzufügen'}
          </button>
        </div>
      )}
    </div>
  );
}
