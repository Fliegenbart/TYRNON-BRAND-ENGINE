import React from 'react';
import { generateVCardQR } from '../../lib/qrcode.js';

export function WebsitePreview({ brand, content }) {
  const fields = content?.fields || {};
  return (
    <div className="preview-frame website-preview" style={{ backgroundColor: brand.colors.background, color: brand.colors.text }}>
      <nav style={{ borderBottomColor: brand.colors.primary + '30' }}>
        <div className="nav-logo" style={{ color: brand.colors.primary }}>
          {brand.logo ? <img src={brand.logo} alt="" style={{ height: '24px' }} /> : brand.name}
        </div>
        <div className="nav-links">
          {(fields.navLinks?.value || ['Produkte', 'Uber uns', 'Kontakt']).map((link, i) => <span key={i}>{link}</span>)}
        </div>
      </nav>
      <div className="hero-section">
        <h1 style={{ fontFamily: brand.fonts.heading }}>{fields.headline?.value || brand.voice.tagline || 'Ihre Headline'}</h1>
        <p style={{ fontFamily: brand.fonts.body }}>{fields.subline?.value || 'Beschreibung hier'}</p>
        <button style={{ backgroundColor: brand.colors.primary }}>{fields.cta?.value || 'Mehr erfahren'}</button>
      </div>
    </div>
  );
}

export function SocialPreview({ brand, content }) {
  const fields = content?.fields || {};
  return (
    <div className="preview-frame social-preview" style={{ backgroundColor: brand.colors.primary }}>
      <div className="social-content">
        {brand.logo && <img src={brand.logo} alt="" className="social-logo" />}
        <h2 style={{ fontFamily: brand.fonts.heading, color: '#fff' }}>{fields.headline?.value || brand.voice.tagline || 'Social Post'}</h2>
        <div className="social-accent" style={{ backgroundColor: brand.colors.accent }} />
      </div>
    </div>
  );
}

export function PresentationPreview({ brand, content }) {
  const fields = content?.fields || {};
  return (
    <div className="preview-frame presentation-preview" style={{ backgroundColor: brand.colors.background }}>
      <div className="slide-header" style={{ backgroundColor: brand.colors.primary }}>
        {brand.logo && <img src={brand.logo} alt="" />}
      </div>
      <div className="slide-content">
        <h2 style={{ fontFamily: brand.fonts.heading, color: brand.colors.text }}>{fields.title?.value || 'Prasentation'}</h2>
        <div className="slide-bullets" style={{ fontFamily: brand.fonts.body }}>
          {['Punkt 1', 'Punkt 2', 'Punkt 3'].map((t, i) => (
            <div key={i} className="bullet"><span style={{ backgroundColor: brand.colors.accent }} />{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FlyerPreview({ brand, content }) {
  const fields = content?.fields || {};
  return (
    <div className="preview-frame flyer-preview" style={{ backgroundColor: brand.colors.background }}>
      <div className="flyer-header" style={{ backgroundColor: brand.colors.primary }}>
        {brand.logo && <img src={brand.logo} alt="" />}
      </div>
      <div className="flyer-body">
        <h2 style={{ fontFamily: brand.fonts.heading, color: brand.colors.text }}>{fields.headline?.value || 'Flyer Titel'}</h2>
        <p style={{ fontFamily: brand.fonts.body }}>{fields.description?.value || 'Beschreibung'}</p>
        <div className="flyer-cta" style={{ backgroundColor: brand.colors.accent }}>{fields.cta?.value || 'Jetzt!'}</div>
      </div>
    </div>
  );
}

export function EmailPreview({ brand, content }) {
  const fields = content?.fields || {};
  return (
    <div className="preview-frame email-preview">
      <div className="email-header" style={{ backgroundColor: brand.colors.primary }}>
        {brand.logo && <img src={brand.logo} alt="" />}
      </div>
      <div className="email-body">
        <h2 style={{ fontFamily: brand.fonts.heading }}>{fields.subject?.value || 'Newsletter'}</h2>
        <p style={{ fontFamily: brand.fonts.body }}>{fields.body?.value || 'Inhalt hier...'}</p>
        <button style={{ backgroundColor: brand.colors.primary }}>{fields.cta?.value || 'Mehr'}</button>
      </div>
    </div>
  );
}

export function BusinessCardPreview({ brand, content }) {
  const fields = content?.fields || {};
  const qrSvg = generateVCardQR(content, brand, { size: 50 });

  return (
    <div className="preview-frame businesscard-preview">
      <div className="card-front" style={{ backgroundColor: brand.colors.background, borderColor: brand.colors.primary }}>
        {brand.logo && <img src={brand.logo} alt="" className="card-logo" />}
        <div className="card-name" style={{ fontFamily: brand.fonts.heading, color: brand.colors.text }}>
          {fields.name?.value || 'Max Mustermann'}
        </div>
        <div className="card-title" style={{ fontFamily: brand.fonts.body, color: brand.colors.primary }}>
          {fields.title?.value || 'Position'}
        </div>
      </div>
      <div className="card-back" style={{ backgroundColor: brand.colors.primary }}>
        <div className="card-contact">
          <div>{fields.phone?.value || '+49 123 456'}</div>
          <div>{fields.email?.value || 'mail@firma.de'}</div>
        </div>
        <div className="card-qr" dangerouslySetInnerHTML={{ __html: qrSvg }} />
      </div>
    </div>
  );
}

export const previewComponents = {
  website: WebsitePreview,
  social: SocialPreview,
  presentation: PresentationPreview,
  flyer: FlyerPreview,
  email: EmailPreview,
  businesscard: BusinessCardPreview
};
