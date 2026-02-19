import React, { useState, useEffect } from 'react';
import { participantesService, usuariosService, authService, solicitudesService } from '../../services/api';
import {
  DumbbellIcon,
  LogOutIcon,
  UserIcon,
  AppleIcon,
  PlusIcon,
  TrashIcon
} from '../common/Icons';
import ManageParticipant from './ManageParticipant';
import ManageCredentials from './ManageCredentials';
import ExerciseCatalogManager from './ExerciseCatalogManager';
import TemplateCatalogManager from './TemplateCatalogManager';

function TrainerDashboard({ user, onLogout, setView }) {
  const [participantes, setParticipantes] = useState([]);
  const [activeSection, setActiveSection] = useState('participantes'); // 'participantes', 'catalogo', 'plantillas'
  const [usuarios, setUsuarios] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState('participante'); // 'participante' o 'usuario'
  const [newParticipant, setNewParticipant] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    fecha_nacimiento: '',
    genero: 'M'
  });
  const [newUsuario, setNewUsuario] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'entrenador'
  });
  const [loading, setLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showCredentialsManager, setShowCredentialsManager] = useState(false);

  // Solicitudes de registro
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudesEstado, setSolicitudesEstado] = useState('pendiente');
  const [solicitudesPendienteCount, setSolicitudesPendienteCount] = useState(0);
  const [showRechazarModal, setShowRechazarModal] = useState(false);
  const [solicitudArechazar, setSolicitudArechazar] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [solicitudesLoading, setSolicitudesLoading] = useState(false);

  const isAdmin = user.rol === 'admin';

  useEffect(() => {
    loadParticipantes();
    if (isAdmin) {
      loadUsuarios();
      loadSolicitudesPendienteCount();
    }
  }, [isAdmin]);

  const loadSolicitudes = async (estado) => {
    setSolicitudesLoading(true);
    try {
      const data = await solicitudesService.listar(estado);
      setSolicitudes(data);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    } finally {
      setSolicitudesLoading(false);
    }
  };

  const loadSolicitudesPendienteCount = async () => {
    try {
      const data = await solicitudesService.listar('pendiente');
      setSolicitudesPendienteCount(data.length);
    } catch (error) {
      console.error('Error cargando conteo de solicitudes:', error);
    }
  };

  const handleAprobar = async (id) => {
    if (!window.confirm('¿Aprobar esta solicitud y crear el participante?')) return;
    try {
      await solicitudesService.aprobar(id);
      await loadSolicitudes(solicitudesEstado);
      await loadSolicitudesPendienteCount();
      await loadParticipantes();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al aprobar la solicitud');
    }
  };

  const handleAbrirRechazo = (solicitud) => {
    setSolicitudArechazar(solicitud);
    setMotivoRechazo('');
    setShowRechazarModal(true);
  };

  const handleConfirmarRechazo = async () => {
    if (!solicitudArechazar) return;
    try {
      await solicitudesService.rechazar(solicitudArechazar.id, motivoRechazo);
      setShowRechazarModal(false);
      setSolicitudArechazar(null);
      await loadSolicitudes(solicitudesEstado);
      await loadSolicitudesPendienteCount();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al rechazar la solicitud');
    }
  };

  const loadParticipantes = async () => {
    try {
      const response = await participantesService.obtenerTodos();
      // El backend ahora retorna { data: [...], pagination: {...} }
      setParticipantes(response.data || response);
    } catch (error) {
      console.error('Error cargando participantes:', error);
    }
  };

  const loadUsuarios = async () => {
    try {
      const response = await usuariosService.obtenerTodos();
      setUsuarios(response.data || response);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await participantesService.crear(newParticipant);
      setNewParticipant({
        nombre: '',
        email: '',
        password: '',
        telefono: '',
        fecha_nacimiento: '',
        genero: 'M'
      });
      setShowAddForm(false);
      loadParticipantes();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al crear participante');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUsuario = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.registrarUsuario(newUsuario);
      setNewUsuario({
        nombre: '',
        email: '',
        password: '',
        rol: 'entrenador'
      });
      setShowAddForm(false);
      loadUsuarios();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParticipant = async (id, nombre) => {
    if (window.confirm(`¿Eliminar a ${nombre}?`)) {
      try {
        await participantesService.eliminar(id);
        loadParticipantes();
      } catch (error) {
        alert('Error al eliminar participante');
      }
    }
  };

  const handleDeleteUsuario = async (id, nombre) => {
    if (window.confirm(`¿Eliminar al usuario ${nombre}? Esta acción no se puede deshacer.`)) {
      try {
        await usuariosService.eliminar(id);
        loadUsuarios();
      } catch (error) {
        alert('Error al eliminar usuario');
      }
    }
  };

  if (showCredentialsManager) {
    return (
      <ManageCredentials
        onBack={() => setShowCredentialsManager(false)}
      />
    );
  }

  if (selectedParticipant) {
    return (
      <ManageParticipant
        participant={selectedParticipant}
        onBack={() => setSelectedParticipant(null)}
        user={user}
      />
    );
  }

  return (
    <div className={`dashboard ${isAdmin ? 'admin-dashboard' : 'trainer-dashboard'}`}>
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <DumbbellIcon />
            <div>
              <h1 className="header-title">VIGOROSO</h1>
              <p className="header-subtitle">{isAdmin ? 'Panel de Administrador' : 'Panel de Entrenador'}</p>
            </div>
          </div>
          <div className="header-right">
            <span className="user-name">{user.nombre}</span>
            <button onClick={onLogout} className="btn-logout">
              <LogOutIcon />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="stats-grid">
          <div className="stat-card stat-orange">
            <div className="stat-header">
              <UserIcon />
              <span className="stat-value">{participantes.length}</span>
            </div>
            <p className="stat-label">Participantes Activos</p>
          </div>

          <div className="stat-card stat-blue">
            <div className="stat-header">
              <DumbbellIcon />
              <span className="stat-value">
                {participantes.reduce((acc, p) => acc + (p.total_planes_entrenamiento || 0), 0)}
              </span>
            </div>
            <p className="stat-label">Planes de Entrenamiento</p>
          </div>

          <div className="stat-card stat-green">
            <div className="stat-header">
              <AppleIcon />
              <span className="stat-value">
                {participantes.reduce((acc, p) => acc + (p.total_planes_nutricion || 0), 0)}
              </span>
            </div>
            <p className="stat-label">Planes de Nutrición</p>
          </div>
        </div>

        {/* Navegación de secciones */}
        <div className="tabs" style={{ marginBottom: '1rem' }}>
          <button className={`tab ${activeSection === 'participantes' ? 'active' : ''}`} onClick={() => setActiveSection('participantes')}>
            <UserIcon />
            <span>Participantes</span>
          </button>
          <button className={`tab ${activeSection === 'catalogo' ? 'active' : ''}`} onClick={() => setActiveSection('catalogo')}>
            <DumbbellIcon />
            <span>Catálogo Ejercicios</span>
          </button>
          <button className={`tab ${activeSection === 'plantillas' ? 'active' : ''}`} onClick={() => setActiveSection('plantillas')}>
            <DumbbellIcon />
            <span>Plantillas</span>
          </button>
          {isAdmin && (
            <button
              className={`tab ${activeSection === 'solicitudes' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('solicitudes');
                loadSolicitudes(solicitudesEstado);
              }}
              style={{ position: 'relative' }}
            >
              <UserIcon />
              <span>Solicitudes</span>
              {solicitudesPendienteCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1
                }}>
                  {solicitudesPendienteCount > 99 ? '99+' : solicitudesPendienteCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Sección de Catálogo de Ejercicios */}
        {activeSection === 'catalogo' && <ExerciseCatalogManager />}

        {/* Sección de Plantillas */}
        {activeSection === 'plantillas' && <TemplateCatalogManager />}

        {/* Sección de Participantes */}
        {activeSection === 'participantes' && isAdmin && (
          <div className="admin-action-center">
            <button
              onClick={() => setShowCredentialsManager(true)}
              className="btn-success btn-admin-action"
            >
              🔐 Gestionar Contraseñas y Emails
            </button>
          </div>
        )}

        {/* Sección de Solicitudes de Registro */}
        {activeSection === 'solicitudes' && isAdmin && (
          <div className="participants-section">
            <div className="section-header">
              <h2>Solicitudes de Registro</h2>
            </div>

            {/* Sub-tabs de estado */}
            <div className="tabs" style={{ marginBottom: '1rem' }}>
              {['pendiente', 'aprobado', 'rechazado'].map((estado) => (
                <button
                  key={estado}
                  className={`tab ${solicitudesEstado === estado ? 'active' : ''}`}
                  onClick={() => {
                    setSolicitudesEstado(estado);
                    loadSolicitudes(estado);
                  }}
                >
                  {estado === 'pendiente' ? 'Pendientes' : estado === 'aprobado' ? 'Aprobadas' : 'Rechazadas'}
                  {estado === 'pendiente' && solicitudesPendienteCount > 0 && (
                    <span style={{
                      marginLeft: '6px',
                      background: '#ef4444',
                      color: '#fff',
                      borderRadius: '10px',
                      padding: '1px 6px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      {solicitudesPendienteCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {solicitudesLoading ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>Cargando...</p>
            ) : solicitudes.length === 0 ? (
              <div className="empty-state">
                <UserIcon />
                <p>No hay solicitudes {solicitudesEstado === 'pendiente' ? 'pendientes' : solicitudesEstado === 'aprobado' ? 'aprobadas' : 'rechazadas'}</p>
              </div>
            ) : (
              <div className="participants-grid">
                {solicitudes.map((sol) => (
                  <div key={sol.id} className="participant-card" style={{ cursor: 'default' }}>
                    <div className="participant-header">
                      <div className="participant-avatar" style={{
                        background: sol.estado === 'aprobado'
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : sol.estado === 'rechazado'
                          ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                          : 'linear-gradient(135deg, #f59e0b, #d97706)'
                      }}>
                        <UserIcon />
                      </div>
                      <div className="participant-info">
                        <h3>{sol.nombre}</h3>
                        <p>{sol.email}</p>
                      </div>
                    </div>

                    <div className="participant-tags" style={{ marginBottom: '0.5rem' }}>
                      <span className={`tag ${sol.estado === 'aprobado' ? 'tag-green' : sol.estado === 'rechazado' ? 'tag-orange' : 'tag-blue'}`}>
                        {sol.estado === 'pendiente' ? '⏳ Pendiente' : sol.estado === 'aprobado' ? '✅ Aprobado' : '❌ Rechazado'}
                      </span>
                      {sol.genero && <span className="tag tag-blue">{sol.genero === 'M' ? 'Masculino' : sol.genero === 'F' ? 'Femenino' : 'Otro'}</span>}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {sol.telefono && <div>📞 {sol.telefono}</div>}
                      {sol.fecha_nacimiento && <div>🎂 {new Date(sol.fecha_nacimiento).toLocaleDateString('es-CO')}</div>}
                      <div>📅 Solicitado: {new Date(sol.fecha_solicitud).toLocaleDateString('es-CO')}</div>
                      {sol.motivo_rechazo && (
                        <div style={{ marginTop: '0.25rem', color: '#ef4444' }}>
                          Motivo: {sol.motivo_rechazo}
                        </div>
                      )}
                    </div>

                    {sol.estado === 'pendiente' && (
                      <div className="form-actions" style={{ marginTop: '0.5rem' }}>
                        <button
                          className="btn-success"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                          onClick={() => handleAprobar(sol.id)}
                        >
                          ✅ Aprobar
                        </button>
                        <button
                          className="btn-danger"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                          onClick={() => handleAbrirRechazo(sol)}
                        >
                          ❌ Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal de rechazo */}
        {showRechazarModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{
              background: 'var(--card-bg, #1e1e2e)', borderRadius: '12px',
              padding: '1.5rem', width: '90%', maxWidth: '440px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Rechazar solicitud</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {solicitudArechazar?.nombre} — {solicitudArechazar?.email}
              </p>
              <div className="form-group">
                <label>Motivo del rechazo (opcional)</label>
                <textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Indica el motivo del rechazo..."
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
              <div className="form-actions" style={{ marginTop: '1rem' }}>
                <button className="btn-danger" onClick={handleConfirmarRechazo}>
                  Confirmar Rechazo
                </button>
                <button className="btn-secondary" onClick={() => setShowRechazarModal(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'participantes' && <div className="participants-section">
          <div className="section-header">
            <h2>{isAdmin ? 'Gestión de Usuarios y Participantes' : 'Gestión de Participantes'}</h2>
            {isAdmin ? (
              <div className="button-group" style={{ flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setAddType('participante');
                    setShowAddForm(true);
                  }}
                  className="btn-primary"
                >
                  <PlusIcon />
                  <span>Agregar Participante</span>
                </button>
                <button
                  onClick={() => {
                    setAddType('usuario');
                    setShowAddForm(true);
                  }}
                  className="btn-success"
                >
                  <PlusIcon />
                  <span>Agregar Entrenador</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAddType('participante');
                  setShowAddForm(true);
                }}
                className="btn-primary"
              >
                <PlusIcon />
                <span>Agregar Participante</span>
              </button>
            )}
          </div>

          {showAddForm && (
            <div className="add-form-container">
              <form onSubmit={addType === 'participante' ? handleAddParticipant : handleAddUsuario} className="add-form">
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  {addType === 'participante' ? '👤 Nuevo Participante' : '🎓 Nuevo Entrenador'}
                </h3>

                {addType === 'participante' ? (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nombre Completo *</label>
                        <input
                          type="text"
                          value={newParticipant.nombre}
                          onChange={(e) => setNewParticipant({...newParticipant, nombre: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email *</label>
                        <input
                          type="email"
                          value={newParticipant.email}
                          onChange={(e) => setNewParticipant({...newParticipant, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Contraseña *</label>
                        <input
                          type="password"
                          value={newParticipant.password}
                          onChange={(e) => setNewParticipant({...newParticipant, password: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Teléfono</label>
                        <input
                          type="tel"
                          value={newParticipant.telefono}
                          onChange={(e) => setNewParticipant({...newParticipant, telefono: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Fecha de Nacimiento</label>
                        <input
                          type="date"
                          value={newParticipant.fecha_nacimiento}
                          onChange={(e) => setNewParticipant({...newParticipant, fecha_nacimiento: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Género</label>
                        <select
                          value={newParticipant.genero}
                          onChange={(e) => setNewParticipant({...newParticipant, genero: e.target.value})}
                        >
                          <option value="M">Masculino</option>
                          <option value="F">Femenino</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nombre Completo *</label>
                        <input
                          type="text"
                          value={newUsuario.nombre}
                          onChange={(e) => setNewUsuario({...newUsuario, nombre: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email *</label>
                        <input
                          type="email"
                          value={newUsuario.email}
                          onChange={(e) => setNewUsuario({...newUsuario, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Contraseña * (mín. 8 caracteres, incluye mayúscula, minúscula y número)</label>
                        <input
                          type="password"
                          value={newUsuario.password}
                          onChange={(e) => setNewUsuario({...newUsuario, password: e.target.value})}
                          required
                          minLength="8"
                        />
                      </div>
                      <div className="form-group">
                        <label>Rol *</label>
                        <select
                          value={newUsuario.rol}
                          onChange={(e) => setNewUsuario({...newUsuario, rol: e.target.value})}
                          required
                        >
                          <option value="entrenador">Entrenador</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="form-actions">
                  <button type="submit" className="btn-success" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {participantes.length === 0 && usuarios.length === 0 ? (
            <div className="empty-state">
              <UserIcon />
              <p>No hay {isAdmin ? 'usuarios ni ' : ''}participantes registrados</p>
            </div>
          ) : (
            <div className="participants-grid">
              {/* Mostrar usuarios (solo para admin) */}
              {isAdmin && usuarios.map(usuario => (
                <div
                  key={`usuario-${usuario.id}`}
                  className="participant-card"
                  style={{ cursor: 'default' }}
                >
                  <div className="participant-header">
                    <div className="participant-avatar" style={{ background: usuario.rol === 'admin' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #10b981, #059669)' }}>
                      <UserIcon />
                    </div>
                    <div className="participant-info">
                      <h3>{usuario.nombre}</h3>
                      <p>{usuario.email}</p>
                    </div>
                    {usuario.id !== user.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUsuario(usuario.id, usuario.nombre);
                        }}
                        className="btn-icon-danger"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                  <div className="participant-tags">
                    <span className={`tag ${usuario.rol === 'admin' ? 'tag-orange' : 'tag-green'}`}>
                      {usuario.rol === 'admin' ? '👑 Administrador' : '🎓 Entrenador'}
                    </span>
                  </div>
                </div>
              ))}

              {/* Mostrar participantes */}
              {participantes.map(participant => (
                <div
                  key={`participante-${participant.id}`}
                  className="participant-card"
                  onClick={() => setSelectedParticipant(participant)}
                >
                  <div className="participant-header">
                    <div className="participant-avatar">
                      <UserIcon />
                    </div>
                    <div className="participant-info">
                      <h3>{participant.nombre}</h3>
                      <p>{participant.email}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteParticipant(participant.id, participant.nombre);
                      }}
                      className="btn-icon-danger"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  <div className="participant-tags">
                    <span className="tag tag-blue">👤 Participante</span>
                    {participant.total_planes_entrenamiento > 0 && (
                      <span className="tag tag-blue">Plan Entrenamiento</span>
                    )}
                    {participant.total_planes_nutricion > 0 && (
                      <span className="tag tag-green">Plan Nutrición</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>}
      </main>
    </div>
  );
}


export default TrainerDashboard;
