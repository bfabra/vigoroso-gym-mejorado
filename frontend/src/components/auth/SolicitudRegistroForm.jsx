import React, { useState } from 'react';
import { DumbbellIcon } from '../common/Icons';
import { authService } from '../../services/api';

function SolicitudRegistroForm({ onVolver }) {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmar_password: '',
    telefono: '',
    fecha_nacimiento: '',
    genero: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmar_password) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const datos = {
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        telefono: form.telefono || undefined,
        fecha_nacimiento: form.fecha_nacimiento || undefined,
        genero: form.genero || undefined
      };
      await authService.solicitarCuenta(datos);
      setExito(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (exito) {
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
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>¡Solicitud enviada!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              El administrador revisará tu solicitud y te notificará cuando sea aprobada.
            </p>
            <button className="btn-primary" onClick={onVolver}>
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <h2 className="form-title">Solicitar Acceso</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Nombre Completo *</label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Tu nombre completo"
              required
              minLength={2}
              maxLength={100}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Contraseña *</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Confirmar Contraseña *</label>
            <input
              type="password"
              name="confirmar_password"
              value={form.confirmar_password}
              onChange={handleChange}
              placeholder="Repite tu contraseña"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="Opcional"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Fecha de Nacimiento</label>
            <input
              type="date"
              name="fecha_nacimiento"
              value={form.fecha_nacimiento}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Género</label>
            <select
              name="genero"
              value={form.genero}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">-- Seleccionar --</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'ENVIANDO...' : 'ENVIAR SOLICITUD'}
          </button>

          <button
            type="button"
            onClick={onVolver}
            className="btn-secondary"
            style={{ marginTop: '0.5rem', width: '100%' }}
            disabled={loading}
          >
            Volver al inicio de sesión
          </button>
        </form>
      </div>
    </div>
  );
}

export default SolicitudRegistroForm;
