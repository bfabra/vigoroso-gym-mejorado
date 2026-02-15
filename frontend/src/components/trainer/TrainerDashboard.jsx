import React, { useState, useEffect } from 'react';
import { participantesService, usuariosService, authService } from '../../services/api';
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

function TrainerDashboard({ user, onLogout, setView }) {
  const [participantes, setParticipantes] = useState([]);
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

  const isAdmin = user.rol === 'admin';

  useEffect(() => {
    loadParticipantes();
    if (isAdmin) {
      loadUsuarios();
    }
  }, [isAdmin]);

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

        {isAdmin && (
          <div className="admin-action-center">
            <button
              onClick={() => setShowCredentialsManager(true)}
              className="btn-success btn-admin-action"
            >
              🔐 Gestionar Contraseñas y Emails
            </button>
          </div>
        )}

        <div className="participants-section">
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
        </div>
      </main>
    </div>
  );
}


export default TrainerDashboard;
