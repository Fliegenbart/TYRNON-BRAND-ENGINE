import React, { useState, useCallback } from 'react';

const acceptedTypes = {
  'pptx': { icon: 'P', label: 'PowerPoint', accept: '.pptx,.ppt,.potx' },
  'pdf': { icon: 'D', label: 'PDF', accept: '.pdf' },
  'image': { icon: 'I', label: 'Bilder', accept: '.png,.jpg,.jpeg,.svg,.webp' }
};

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
      return ['pptx', 'ppt', 'potx', 'pdf', 'png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext);
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
    if (ext === 'pptx' || ext === 'ppt' || ext === 'potx') return 'P';
    if (ext === 'pdf') return 'D';
    return 'I';
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pptx' || ext === 'ppt') return 'PowerPoint';
    if (ext === 'potx') return 'PowerPoint Template';
    if (ext === 'pdf') return 'PDF';
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

  return (
    <div className="analyzer-upload">
      <div className="upload-intro">
        <div className="upload-icon-large">
          <span>AI</span>
        </div>
        <h2>Brand-Assets analysieren</h2>
        <p>
          Lade deine bestehenden Brand-Materialien hoch und wir extrahieren automatisch
          Farben, Schriften, Logos und Stilregeln.
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
                accept=".pptx,.ppt,.potx,.pdf,.png,.jpg,.jpeg,.svg,.webp"
                onChange={handleFileSelect}
                hidden
              />
            </label>
          </p>
          <p className="dropzone-hint">
            PowerPoint (PPTX/POTX), PDF, PNG, JPG, SVG
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
            Analyse starten
          </button>
        </div>
      )}
    </div>
  );
}
