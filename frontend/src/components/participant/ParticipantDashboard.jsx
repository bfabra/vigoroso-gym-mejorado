import React, { useState, useEffect } from 'react';
import { entrenamientoService, nutricionService, participantesService } from '../../services/api';
import {
  DumbbellIcon,
  LogOutIcon,
  AppleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XIcon,
  UserIcon
} from '../common/Icons';
import { DIAS_SEMANA, CALENTAMIENTO_DIARIO } from '../../constants/plantillas';

function ParticipantDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('training');

  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    password_actual: '',
    password_nueva: '',
    confirmar_password: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Estados para cambio de email
  const [emailData, setEmailData] = useState({
    password: '',
    nuevo_email: ''
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState({ type: '', text: '' });
  const [plan, setPlan] = useState(null);
  const [ejercicios, setEjercicios] = useState([]);
  const [nutricionPlan, setNutricionPlan] = useState(null);
  const [comidas, setComidas] = useState([]);
  const [expandedDay, setExpandedDay] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [registros, setRegistros] = useState({});
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [editingNotes, setEditingNotes] = useState({});

  const currentMonth = selectedMonth; // Para mantener compatibilidad
  const dias = DIAS_SEMANA;

  useEffect(() => {
    if (activeTab === 'training') {
      loadTrainingPlan();
      loadRegistros();
    } else if (activeTab === 'nutrition') {
      loadNutritionPlan();
    }
  }, [activeTab, user.id, selectedMonth]); // Recargar cuando cambie el mes

  useEffect(() => {
    if (selectedDate) {
      loadRegistros();
    }
  }, [selectedDate]);

  const loadTrainingPlan = async () => {
    try {
      const data = await entrenamientoService.obtenerPlan(user.id, currentMonth);
      setPlan(data.plan);
      setEjercicios(data.ejercicios || []);
    } catch (error) {
      console.error('Error cargando plan:', error);
    }
  };

  const loadNutritionPlan = async () => {
    try {
      const data = await nutricionService.obtenerPlan(user.id);
      setNutricionPlan(data.plan);
      setComidas(data.comidas || []);
    } catch (error) {
      console.error('Error cargando plan de nutrición:', error);
    }
  };

  const loadRegistros = async () => {
    try {
      const data = await entrenamientoService.obtenerRegistros(user.id, selectedDate, selectedDate);
      const registrosMap = {};
      data.forEach(reg => {
        registrosMap[reg.ejercicio_plan_id] = reg;
      });
      setRegistros(registrosMap);
    } catch (error) {
      console.error('Error cargando registros:', error);
    }
  };

  const handleRegistrarPeso = async (ejercicioId, peso, comentarios = '') => {
    try {
      const registro = {
        participante_id: user.id,
        ejercicio_plan_id: ejercicioId,
        fecha_registro: selectedDate,
        peso_utilizado: parseInt(peso, 10) || 0, // Convertir a entero
        comentarios: comentarios || ''
      };

      if (registros[ejercicioId]) {
        await entrenamientoService.actualizarRegistro(registros[ejercicioId].id, registro);
      } else {
        await entrenamientoService.registrarEntrenamiento(registro);
      }

      loadRegistros();
    } catch (error) {
      console.error('Error registrando peso:', error);
    }
  };

  const handleShowHistory = async (ejercicio) => {
    try {
      setSelectedExercise(ejercicio);
      const history = await entrenamientoService.obtenerHistorialEjercicio(user.id, ejercicio.id);
      setExerciseHistory(history);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error cargando historial:', error);
      alert('Error al cargar el historial');
    }
  };

  const handleUpdateNotes = (ejercicioId, notas) => {
    setEditingNotes(prev => ({
      ...prev,
      [ejercicioId]: notas
    }));
  };

  const handleSaveNotes = async (ejercicioId) => {
    const peso = registros[ejercicioId]?.peso_utilizado || 0;
    const notas = editingNotes[ejercicioId] || registros[ejercicioId]?.comentarios || '';
    await handleRegistrarPeso(ejercicioId, peso, notas);
    setEditingNotes(prev => {
      const updated = { ...prev };
      delete updated[ejercicioId];
      return updated;
    });
  };

  // Handlers para cambio de contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (passwordData.password_nueva !== passwordData.confirmar_password) {
      setPasswordMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden' });
      return;
    }

    if (passwordData.password_nueva.length < 6) {
      setPasswordMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setPasswordLoading(true);

    try {
      await participantesService.cambiarPasswordPropia(
        passwordData.password_actual,
        passwordData.password_nueva
      );
      setPasswordMessage({ type: 'success', text: 'Contraseña actualizada exitosamente' });
      setPasswordData({ password_actual: '', password_nueva: '', confirmar_password: '' });
    } catch (error) {
      setPasswordMessage({
        type: 'error',
        text: error.response?.data?.error || 'Error al cambiar contraseña'
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handlers para cambio de email
  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setEmailMessage({ type: '', text: '' });

    if (!emailData.nuevo_email) {
      setEmailMessage({ type: 'error', text: 'El nuevo email es requerido' });
      return;
    }

    setEmailLoading(true);

    try {
      const response = await participantesService.cambiarEmailPropio(
        emailData.password,
        emailData.nuevo_email
      );
      setEmailMessage({ type: 'success', text: 'Email actualizado exitosamente' });
      setEmailData({ password: '', nuevo_email: '' });

      // Actualizar el user en localStorage
      const updatedUser = { ...user, email: response.nuevo_email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      setEmailMessage({
        type: 'error',
        text: error.response?.data?.error || 'Error al cambiar email'
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const getEjerciciosByDia = (dia) => {
    return ejercicios.filter(e => e.dia_semana === dia).sort((a, b) => a.orden - b.orden);
  };

  return (
    <div className="dashboard participant-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <DumbbellIcon />
            <div>
              <h1 className="header-title">VIGOROSO</h1>
              <p className="header-subtitle">Hola, {user.nombre}</p>
            </div>
          </div>
          <button onClick={onLogout} className="btn-logout">
            <LogOutIcon />
            <span>Salir</span>
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'training' ? 'active' : ''}`}
            onClick={() => setActiveTab('training')}
          >
            <DumbbellIcon />
            <span>Mi Entrenamiento</span>
          </button>
          <button
            className={`tab ${activeTab === 'nutrition' ? 'active' : ''}`}
            onClick={() => setActiveTab('nutrition')}
          >
            <AppleIcon />
            <span>Mi Nutrición</span>
          </button>
          <button
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <UserIcon />
            <span>Mi Cuenta</span>
          </button>
        </div>

        {activeTab === 'training' && (
          <div className="participant-training">
            <div className="date-selector" style={{ marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label>Mes del Plan:</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '13px', color: 'rgba(0, 0, 0, 0.6)' }}>
                  ({new Date(selectedMonth + '-01').toLocaleDateString('es', { month: 'long', year: 'numeric' })})
                </span>
              </div>
            </div>

            {!plan ? (
              <div className="empty-state">
                <DumbbellIcon />
                <p>No tienes un plan de entrenamiento asignado para este mes</p>
              </div>
            ) : (
              <>
                <div className="date-selector">
                  <label>
                    📅 Fecha de Registro:
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginLeft: '8px' }}>
                      (Selecciona el día que entrenaste para registrar los pesos)
                    </span>
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* ==================== CALENTAMIENTO DIARIO ==================== */}
                <div style={{
                  marginBottom: '25px',
                  padding: '20px',
                  background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 159, 64, 0.15))',
                  borderRadius: '8px',
                  border: '2px solid rgba(255, 107, 53, 0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '24px' }}>🔥</span>
                    <h4 style={{
                      margin: 0,
                      color: '#ffffff',
                      fontSize: '17px',
                      fontWeight: '700'
                    }}>
                      CALENTAMIENTO DIARIO (OBLIGATORIO)
                    </h4>
                  </div>
                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontStyle: 'italic'
                  }}>
                    ⚠️ Tip: El calentamiento debe hacerse SIEMPRE antes de empezar.
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '10px'
                  }}>
                    {CALENTAMIENTO_DIARIO.map((ej, i) => (
                      <div key={i} style={{
                        padding: '12px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.15)'
                      }}>
                        <div style={{
                          fontWeight: '600',
                          color: '#ff6b35',
                          marginBottom: '6px',
                          fontSize: '14px'
                        }}>
                          {i + 1}. {ej.nombre}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.7)',
                          marginBottom: '4px'
                        }}>
                          📊 {ej.series} × {ej.reps}
                        </div>
                        {ej.notas && (
                          <div style={{
                            fontSize: '11px',
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontStyle: 'italic'
                          }}>
                            💡 {ej.notas}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="days-list">
                  {dias.map(dia => {
                    const ejerciciosDia = getEjerciciosByDia(dia);
                    if (ejerciciosDia.length === 0 || !ejerciciosDia.some(e => e.nombre_ejercicio)) {
                      return null;
                    }

                    return (
                      <div key={dia} className="day-card">
                        <button
                          className="day-header"
                          onClick={() => setExpandedDay(expandedDay === dia ? null : dia)}
                        >
                          <span className="day-name">{dia}</span>
                          {expandedDay === dia ? <ChevronDownIcon /> : <ChevronRightIcon />}
                        </button>

                        {expandedDay === dia && (
                          <div className="day-exercises">
                            {ejerciciosDia.map(ejercicio => {
                              if (!ejercicio.nombre_ejercicio) return null;
                              
                              const registro = registros[ejercicio.id];
                              const notasActuales = editingNotes[ejercicio.id] !== undefined 
                                ? editingNotes[ejercicio.id] 
                                : (registro?.comentarios || '');

                              return (
                                <div key={ejercicio.id} className="participant-exercise-card-enhanced">
                                  <div className="exercise-header-row">
                                    <div className="exercise-info">
                                      <h4>{ejercicio.nombre_ejercicio}</h4>
                                      <p className="exercise-plan-info">
                                        {ejercicio.series} series × {ejercicio.repeticiones} reps
                                      </p>
                                      {ejercicio.notas && (
                                        <p className="exercise-notes">
                                          <strong>Instrucción:</strong> {ejercicio.notas}
                                        </p>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => handleShowHistory(ejercicio)}
                                      className="btn-history"
                                      title="Ver historial"
                                    >
                                      📊 Historial
                                    </button>
                                  </div>

                                  <div className="exercise-log-enhanced">
                                    <div className="weight-input-group">
                                      <label>Peso usado (kg):</label>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        value={registro?.peso_utilizado ? Math.floor(registro.peso_utilizado) : ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          // Solo permitir números enteros de hasta 4 dígitos (0-9999)
                                          if (value === '' || /^\d{1,4}$/.test(value)) {
                                            handleRegistrarPeso(ejercicio.id, value, notasActuales);
                                          }
                                        }}
                                        placeholder="Ej: 50, 120, 200"
                                        maxLength="4"
                                        className="weight-input"
                                      />
                                      {registro?.peso_utilizado && (
                                        <span className="weight-saved">✓ Guardado</span>
                                      )}
                                    </div>

                                    <div className="notes-input-group">
                                      <label>Observaciones personales:</label>
                                      <div className="notes-with-button">
                                        <textarea
                                          value={notasActuales}
                                          onChange={(e) => handleUpdateNotes(ejercicio.id, e.target.value)}
                                          placeholder="Ej: Sentí mucha fuerza hoy, aumentar peso próxima vez..."
                                          rows={2}
                                          className="notes-textarea"
                                        />
                                        {editingNotes[ejercicio.id] !== undefined && 
                                         editingNotes[ejercicio.id] !== (registro?.comentarios || '') && (
                                          <button
                                            onClick={() => handleSaveNotes(ejercicio.id)}
                                            className="btn-save-notes"
                                          >
                                            💾 Guardar Nota
                                          </button>
                                        )}
                                      </div>
                                      {registro?.comentarios && editingNotes[ejercicio.id] === undefined && (
                                        <p className="saved-notes">
                                          <strong>Última nota:</strong> {registro.comentarios}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div className="participant-nutrition">
            {!nutricionPlan ? (
              <div className="empty-state">
                <AppleIcon />
                <p>No tienes un plan de nutrición asignado</p>
              </div>
            ) : (
              <>
                <div className="nutrition-list">
                  {comidas.map(comida => (
                    <div key={comida.tipo_comida} className="meal-card">
                      <h3 className="meal-title">{comida.tipo_comida}</h3>
                      <div className="meal-options">
                        <div className="meal-option meal-option-readonly">
                          <h4>Opción 1</h4>
                          <p>{comida.opcion_1 || 'No especificado'}</p>
                        </div>
                        <div className="meal-option meal-option-readonly">
                          <h4>Opción 2</h4>
                          <p>{comida.opcion_2 || 'No especificado'}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {nutricionPlan.recomendaciones_generales && (
                    <div className="recommendations-card recommendations-readonly">
                      <h3 className="meal-title">Recomendaciones Adicionales</h3>
                      <p>{nutricionPlan.recomendaciones_generales}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="participant-settings">
            <div className="settings-container">
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '30px' }}>⚙️ Configuración de Cuenta</h2>

              {/* Información de la cuenta */}
              <div className="settings-section">
                <h3>📋 Información Personal</h3>
                <div className="info-card">
                  <div className="info-row">
                    <strong>Nombre:</strong> <span>{user.nombre}</span>
                  </div>
                  <div className="info-row">
                    <strong>Email actual:</strong> <span>{user.email}</span>
                  </div>
                </div>
              </div>

              {/* Cambiar Contraseña */}
              <div className="settings-section">
                <h3>🔒 Cambiar Contraseña</h3>
                <form onSubmit={handleChangePassword} className="settings-form">
                  <div className="form-group">
                    <label>Contraseña Actual *</label>
                    <input
                      type="password"
                      value={passwordData.password_actual}
                      onChange={(e) => setPasswordData({ ...passwordData, password_actual: e.target.value })}
                      required
                      placeholder="Ingresa tu contraseña actual"
                    />
                  </div>
                  <div className="form-group">
                    <label>Nueva Contraseña * (mínimo 6 caracteres)</label>
                    <input
                      type="password"
                      value={passwordData.password_nueva}
                      onChange={(e) => setPasswordData({ ...passwordData, password_nueva: e.target.value })}
                      required
                      minLength="6"
                      placeholder="Ingresa tu nueva contraseña"
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirmar Nueva Contraseña *</label>
                    <input
                      type="password"
                      value={passwordData.confirmar_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmar_password: e.target.value })}
                      required
                      placeholder="Confirma tu nueva contraseña"
                    />
                  </div>

                  {passwordMessage.text && (
                    <div className={`message ${passwordMessage.type === 'success' ? 'message-success' : 'message-error'}`}>
                      {passwordMessage.text}
                    </div>
                  )}

                  <button type="submit" className="btn-primary" disabled={passwordLoading}>
                    {passwordLoading ? 'Actualizando...' : '🔐 Cambiar Contraseña'}
                  </button>

                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '10px' }}>
                    💡 Si olvidaste tu contraseña actual, solicita al administrador que te asigne una nueva.
                  </p>
                </form>
              </div>

              {/* Cambiar Email */}
              <div className="settings-section">
                <h3>📧 Cambiar Email</h3>
                <form onSubmit={handleChangeEmail} className="settings-form">
                  <div className="form-group">
                    <label>Contraseña Actual * (para confirmar)</label>
                    <input
                      type="password"
                      value={emailData.password}
                      onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                      required
                      placeholder="Ingresa tu contraseña"
                    />
                  </div>
                  <div className="form-group">
                    <label>Nuevo Email *</label>
                    <input
                      type="email"
                      value={emailData.nuevo_email}
                      onChange={(e) => setEmailData({ ...emailData, nuevo_email: e.target.value })}
                      required
                      placeholder="nuevo.email@ejemplo.com"
                    />
                  </div>

                  {emailMessage.text && (
                    <div className={`message ${emailMessage.type === 'success' ? 'message-success' : 'message-error'}`}>
                      {emailMessage.text}
                    </div>
                  )}

                  <button type="submit" className="btn-primary" disabled={emailLoading}>
                    {emailLoading ? 'Actualizando...' : '📧 Cambiar Email'}
                  </button>

                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '10px' }}>
                    ⚠️ Asegúrate de tener acceso al nuevo email antes de cambiarlo.
                  </p>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Historial */}
      {showHistoryModal && selectedExercise && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Historial: {selectedExercise.nombre_ejercicio}</h2>
              <button onClick={() => setShowHistoryModal(false)} className="btn-close-modal">
                <XIcon />
              </button>
            </div>
            
            <div className="modal-body">
              {exerciseHistory.length === 0 ? (
                <div className="empty-state-small">
                  <p>No hay registros previos para este ejercicio</p>
                </div>
              ) : (
                <div className="history-list">
                  <div className="history-stats">
                    <div className="stat-box">
                      <span className="stat-label">Máximo registrado</span>
                      <span className="stat-value-large">
                        {Math.max(...exerciseHistory.map(h => h.peso_utilizado || 0))} kg
                      </span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Promedio</span>
                      <span className="stat-value-large">
                        {(exerciseHistory.reduce((acc, h) => acc + (h.peso_utilizado || 0), 0) / exerciseHistory.length).toFixed(1)} kg
                      </span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Sesiones</span>
                      <span className="stat-value-large">{exerciseHistory.length}</span>
                    </div>
                  </div>

                  <div className="history-timeline">
                    {exerciseHistory.map((record, index) => (
                      <div key={record.id} className="history-record">
                        <div className="record-date">
                          <span className="date-day">
                            {new Date(record.fecha_registro).toLocaleDateString('es', { 
                              day: '2-digit',
                              month: 'short'
                            })}
                          </span>
                          <span className="date-year">
                            {new Date(record.fecha_registro).getFullYear()}
                          </span>
                        </div>
                        <div className="record-details">
                          <div className="record-weight">
                            <strong>{record.peso_utilizado || 0} kg</strong>
                            {index < exerciseHistory.length - 1 && (
                              <span className={`weight-change ${
                                (record.peso_utilizado || 0) > (exerciseHistory[index + 1].peso_utilizado || 0)
                                  ? 'positive'
                                  : (record.peso_utilizado || 0) < (exerciseHistory[index + 1].peso_utilizado || 0)
                                  ? 'negative'
                                  : 'neutral'
                              }`}>
                                {(record.peso_utilizado || 0) > (exerciseHistory[index + 1].peso_utilizado || 0) && '↑'}
                                {(record.peso_utilizado || 0) < (exerciseHistory[index + 1].peso_utilizado || 0) && '↓'}
                                {(record.peso_utilizado || 0) === (exerciseHistory[index + 1].peso_utilizado || 0) && '='}
                                {' '}
                                {Math.abs((record.peso_utilizado || 0) - (exerciseHistory[index + 1].peso_utilizado || 0))} kg
                              </span>
                            )}
                          </div>
                          {record.comentarios && (
                            <div className="record-notes">
                              <em>"{record.comentarios}"</em>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default ParticipantDashboard;
