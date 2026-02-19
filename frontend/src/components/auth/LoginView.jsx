import React, { useState } from 'react';
import { DumbbellIcon } from '../common/Icons';

function LoginView({ onLogin, loading, error, onSolicitarAcceso }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isParticipant, setIsParticipant] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password, isParticipant);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-circle">
            <DumbbellIcon />
          </div>
          <h1 className="gym-title">VIGOROSO</h1>
          <p className="gym-subtitle">ENTRENA CON PROPÓSITO</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <h2 className="form-title">Iniciar Sesión</h2>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isParticipant}
                onChange={(e) => setIsParticipant(e.target.checked)}
              />
              <span>Soy participante</span>
            </label>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'INGRESANDO...' : 'INGRESAR'}
          </button>

          {onSolicitarAcceso && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={onSolicitarAcceso}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Solicitar acceso al gimnasio
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}

export default LoginView;
