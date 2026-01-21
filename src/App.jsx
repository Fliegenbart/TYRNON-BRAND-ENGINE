import React, { useState, useEffect } from 'react';
import './styles.css';

// Components
import LoginScreen from './components/LoginScreen';
import BrandSidebar from './components/BrandSidebar';
import BrandEditor from './components/BrandEditor';
import AssetPreview from './components/AssetPreview';
import BrandImport from './components/BrandImport';

// Lib imports
import { generateContentWithDefaults } from './lib/content.js';
import { exportAsset } from './lib/exporters/index.js';

// ============================================
// BRAND ENGINE - Multi-Brand Marketing Platform
// ============================================

function BrandEngine() {
  const [brands, setBrands] = useState(() => {
    const saved = localStorage.getItem('brand_engine_brands');
    return saved ? JSON.parse(saved) : [{
      id: '1',
      name: 'Demo Brand',
      colors: { primary: '#2563eb', secondary: '#1e40af', accent: '#f59e0b', background: '#ffffff', text: '#1f2937' },
      fonts: { heading: "'Space Grotesk', sans-serif", body: "'Inter', sans-serif" },
      voice: { tone: 'professional', formality: 'sie', tagline: 'Innovation trifft Zuverlassigkeit', dos: 'nachhaltig, zukunftsorientiert', donts: 'billig, irgendwie' },
      logo: null
    }];
  });

  const [activeBrand, setActiveBrand] = useState(brands[0]);
  const [selectedAsset, setSelectedAsset] = useState('website');
  const [showImport, setShowImport] = useState(false);
  const [assetContent, setAssetContent] = useState(() => {
    const saved = localStorage.getItem('brand_engine_content');
    return saved ? JSON.parse(saved) : {};
  });

  const currentContent = assetContent[`${activeBrand.id}-${selectedAsset}`] || generateContentWithDefaults(selectedAsset, activeBrand);

  useEffect(() => {
    localStorage.setItem('brand_engine_brands', JSON.stringify(brands));
  }, [brands]);

  useEffect(() => {
    localStorage.setItem('brand_engine_content', JSON.stringify(assetContent));
  }, [assetContent]);

  const handleUpdateBrand = (updatedBrand) => {
    setBrands(brands.map(b => b.id === updatedBrand.id ? updatedBrand : b));
    setActiveBrand(updatedBrand);
  };

  const handleCreateBrand = () => {
    const newBrand = {
      id: Date.now().toString(),
      name: `Marke ${brands.length + 1}`,
      colors: { primary: '#6366f1', secondary: '#4f46e5', accent: '#ec4899', background: '#ffffff', text: '#1f2937' },
      fonts: { heading: "'DM Sans', sans-serif", body: "'Inter', sans-serif" },
      voice: { tone: 'friendly', formality: 'du', tagline: '', dos: '', donts: '' },
      logo: null
    };
    setBrands([...brands, newBrand]);
    setActiveBrand(newBrand);
  };

  const handleDeleteBrand = (brandId) => {
    if (brands.length <= 1) return;
    const newBrands = brands.filter(b => b.id !== brandId);
    setBrands(newBrands);
    if (activeBrand.id === brandId) setActiveBrand(newBrands[0]);
  };

  const handleContentChange = (newContent) => {
    setAssetContent({ ...assetContent, [`${activeBrand.id}-${selectedAsset}`]: newContent });
  };

  const handleImportBrand = (importedBrand) => {
    setBrands([...brands, importedBrand]);
    setActiveBrand(importedBrand);
    setShowImport(false);
  };

  return (
    <div className="app-container">
      <BrandSidebar
        brands={brands}
        activeBrand={activeBrand}
        onSelectBrand={setActiveBrand}
        onCreateBrand={handleCreateBrand}
        onDeleteBrand={handleDeleteBrand}
      />

      <main className="main-content">
        <header className="app-header">
          <input
            type="text"
            value={activeBrand.name}
            onChange={(e) => handleUpdateBrand({ ...activeBrand, name: e.target.value })}
            className="brand-name-input"
          />
          <div className="header-actions">
            <button className="btn-primary" onClick={() => setShowImport(true)}>
              PPT Import
            </button>
            <button className="btn-secondary" onClick={() => exportAsset(activeBrand, currentContent, 'pdf-guidelines')}>
              Brand Guidelines
            </button>
            <button className="btn-logout" onClick={() => { localStorage.removeItem('brand_engine_auth'); window.location.reload(); }}>
              Abmelden
            </button>
          </div>
        </header>

        <div className="workspace">
          <BrandEditor brand={activeBrand} onUpdate={handleUpdateBrand} />
          <AssetPreview
            brand={activeBrand}
            selectedAsset={selectedAsset}
            onAssetChange={setSelectedAsset}
            content={currentContent}
            onContentChange={handleContentChange}
          />
        </div>
      </main>

      {showImport && (
        <BrandImport
          onImport={handleImportBrand}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}

// ============================================
// ROOT
// ============================================
export default function App() {
  const [isAuth, setIsAuth] = useState(() => localStorage.getItem('brand_engine_auth') === 'true');

  if (!isAuth) return <LoginScreen onLogin={() => setIsAuth(true)} />;
  return <BrandEngine />;
}
