import React, { useState, useEffect } from 'react';
import { participantesService, usuariosService } from '../../services/api';
import { UserIcon, XIcon } from '../common/Icons';

function ManageCredentials({ onBack }) {
  const [usuarios, setUsuarios] = useState([]);
  const [participantes, setParticipantes] = useState([]);
  const [activeTab, setActiveTab] = useState('participantes');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingData(true);
    setLoadError('');

    // Cargar usuarios y participantes de forma independiente
    // para que un error en uno no bloquee al otro
    const results = await Promise.allSettled([
      usuariosService.obtenerTodos(),
      participantesService.obtenerTodos()
    ]);

    const [usersResult, participantsResult] = results;
    const errors = [];

    if (usersResult.status === 'fulfilled') {
      const usersData = usersResult.value;
      setUsuarios(usersData.data || usersData);
    } else {
      console.error('Error cargando usuarios:', usersResult.reason);
      errors.push('entrenadores/admins');
    }

    if (participantsResult.status === 'fulfilled') {
      const participantsData = participantsResult.value;
      setParticipantes(participantsData.data || participantsData);
    } else {
      console.error('Error cargando participantes:', participantsResult.reason);
      errors.push('participantes');
    }

    if (errors.length > 0) {
      setLoadError(`Error al cargar ${errors.join(' y ')}`);
    }

    setLoadingData(false);
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      setMessage({ type: 'error', text: 'Ingresa una nueva contraseña' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (activeTab === 'participantes') {
        await participantesService.cambiarPassword(selectedPerson.id, newPassword);
      } else {
        await usuariosService.cambiarPassword(selectedPerson.id, newPassword);
      }

      setMessage({ type: 'success', text: `Contraseña actualizada para ${selectedPerson.nombre}` });
      setNewPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setSelectedPerson(null);
        setMessage({ type: '', text: '' });
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Error al cambiar contraseña' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail) {
      setMessage({ type: 'error', text: 'Ingresa un nuevo email' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (activeTab === 'participantes') {
        await participantesService.cambiarEmail(selectedPerson.id, newEmail);
      } else {
        await usuariosService.cambiarEmail(selectedPerson.id, newEmail);
      }

      setMessage({ type: 'success', text: `Email actualizado para ${selectedPerson.nombre}` });
      setNewEmail('');
      loadData(); // Recargar para mostrar el nuevo email

      setTimeout(() => {
        setShowEmailModal(false);
        setSelectedPerson(null);
        setMessage({ type: '', text: '' });
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Error al cambiar email' });
    } finally {
      setLoading(false);
    }
  };

  const currentList = activeTab === 'participantes' ? participantes : usuarios;

  return (
    <div className="manage-credentials">
      <div className="section-header" style={{ marginBottom: '30px' }}>
        <h2>🔐 Gestión de Credenciales</h2>
        <button onClick={onBack} className="btn-secondary">
          ← Volver
        </button>
      </div>

      <div className="tabs" style={{ marginBottom: '30px' }}>
        <button
          className={`tab ${activeTab === 'participantes' ? 'active' : ''}`}
          onClick={() => setActiveTab('participantes')}
        >
          👤 Participantes
        </button>
        <button
          className={`tab ${activeTab === 'usuarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('usuarios')}
        >
          🎓 Entrenadores/Admins
        </button>
      </div>

      {loadError && (
        <div className="message message-error" style={{ marginBottom: '20px' }}>
          {loadError}
          <button onClick={loadData} className="btn-small btn-secondary" style={{ marginLeft: '10px' }}>
            Reintentar
          </button>
        </div>
      )}

      <div className="credentials-list">
        {loadingData ? (
          <div className="empty-state">
            <p>Cargando {activeTab === 'participantes' ? 'participantes' : 'usuarios'}...</p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="empty-state">
            <UserIcon />
            <p>No hay {activeTab === 'participantes' ? 'participantes' : 'usuarios'} registrados</p>
          </div>
        ) : (
          <div className="credentials-grid">
            {currentList.map(person => (
              <div key={person.id} className="credential-card">
                <div className="credential-header">
                  <div className="credential-avatar">
                    <UserIcon />
                  </div>
                  <div className="credential-info">
                    <h3>{person.nombre}</h3>
                    <p>{person.email}</p>
                    {person.rol && (
                      <span className={`tag ${person.rol === 'admin' ? 'tag-orange' : 'tag-green'}`}>
                        {person.rol === 'admin' ? '👑 Admin' : '🎓 Entrenador'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="credential-actions">
                  <button
                    onClick={() => {
                      setSelectedPerson(person);
                      setShowPasswordModal(true);
                      setMessage({ type: '', text: '' });
                    }}
                    className="btn-primary btn-small"
                  >
                    🔒 Cambiar Contraseña
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPerson(person);
                      setNewEmail(person.email);
                      setShowEmailModal(true);
                      setMessage({ type: '', text: '' });
                    }}
                    className="btn-success btn-small"
                  >
                    📧 Cambiar Email
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Cambio de Contraseña */}
      {showPasswordModal && selectedPerson && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔒 Cambiar Contraseña</h2>
              <button onClick={() => setShowPasswordModal(false)} className="btn-close-modal">
                <XIcon />
              </button>
            </div>
            <div className="modal-body">
              <div className="info-box">
                <p><strong>Usuario:</strong> {selectedPerson.nombre}</p>
                <p><strong>Email:</strong> {selectedPerson.email}</p>
              </div>

              <div className="form-group">
                <label>Nueva Contraseña * (mínimo 6 caracteres)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingresa la nueva contraseña"
                  minLength="6"
                  autoFocus
                />
              </div>

              {message.text && (
                <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
                  {message.text}
                </div>
              )}

              <div className="form-actions">
                <button
                  onClick={handleResetPassword}
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Actualizando...' : '✅ Confirmar Cambio'}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setMessage({ type: '', text: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cambio de Email */}
      {showEmailModal && selectedPerson && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📧 Cambiar Email</h2>
              <button onClick={() => setShowEmailModal(false)} className="btn-close-modal">
                <XIcon />
              </button>
            </div>
            <div className="modal-body">
              <div className="info-box">
                <p><strong>Usuario:</strong> {selectedPerson.nombre}</p>
                <p><strong>Email actual:</strong> {selectedPerson.email}</p>
              </div>

              <div className="form-group">
                <label>Nuevo Email *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nuevo.email@ejemplo.com"
                  autoFocus
                />
              </div>

              {message.text && (
                <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
                  {message.text}
                </div>
              )}

              <div className="form-actions">
                <button
                  onClick={handleChangeEmail}
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Actualizando...' : '✅ Confirmar Cambio'}
                </button>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setNewEmail('');
                    setMessage({ type: '', text: '' });
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageCredentials;
