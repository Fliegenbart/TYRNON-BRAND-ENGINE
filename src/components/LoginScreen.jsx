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
          <div className="logo-mark">
            <span className="logo-t">T</span>
          </div>
        </div>
        <h1>TYRN.ON</h1>
        <p className="login-subtitle">Brand Engine</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Team-Passwort"
            autoFocus
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit">Einloggen</button>
        </form>
      </div>
    </div>
  );
}
