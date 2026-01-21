import React from 'react';
import CampaignsPanel from './CampaignsPanel';

export default function BrandSidebar({ brands, activeBrand, onSelectBrand, onCreateBrand, onDeleteBrand }) {
  return (
    <div className="brand-sidebar">
      <div className="sidebar-header">
        <h2>Marken</h2>
        <button className="btn-add" onClick={onCreateBrand}>+</button>
      </div>
      <div className="brand-list">
        {brands.map(brand => (
          <div
            key={brand.id}
            className={`brand-item ${activeBrand?.id === brand.id ? 'active' : ''}`}
            onClick={() => onSelectBrand(brand)}
          >
            <div className="brand-color-dot" style={{ backgroundColor: brand.colors.primary }} />
            <span>{brand.name}</span>
            {brands.length > 1 && (
              <button className="btn-delete-brand" onClick={(e) => { e.stopPropagation(); onDeleteBrand(brand.id); }}>x</button>
            )}
          </div>
        ))}
      </div>

      <CampaignsPanel brand={activeBrand} />
    </div>
  );
}
