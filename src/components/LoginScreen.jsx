import React, { useState } from 'react';

const TEAM_PASSWORD = 'brandengine2024';

export default function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === TEAM_PASSWORD) {
      localStorage.setItem('brand_engine_auth', 'true');
      onLogin();
    } else {
      setError('Falsches Passwort');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <svg viewBox="0 0 48 48" className="logo-icon">
            <rect x="4" y="4" width="18" height="18" rx="2" fill="currentColor" opacity="0.9"/>
            <rect x="26" y="4" width="18" height="18" rx="2" fill="currentColor" opacity="0.6"/>
            <rect x="4" y="26" width="18" height="18" rx="2" fill="currentColor" opacity="0.6"/>
            <rect x="26" y="26" width="18" height="18" rx="2" fill="currentColor" opacity="0.3"/>
          </svg>
        </div>
        <h1>Brand Engine</h1>
        <p className="login-subtitle">Multi-Brand Marketing Platform</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Team-Passwort eingeben"
            autoFocus
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit">Anmelden</button>
        </form>
      </div>
    </div>
  );
}
