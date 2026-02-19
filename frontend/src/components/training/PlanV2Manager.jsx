import React, { useState, useEffect } from 'react';
import { entrenamientoV2Service } from '../../services/api';
import {
  DumbbellIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  SaveIcon,
  XIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '../common/Icons';

// ─── helpers ────────────────────────────────────────────────────────────────

const nivelColor = (nivel) => {
  if (nivel === 'Principiante') return '#10b981';
  if (nivel === 'Intermedio')   return '#f59e0b';
  if (nivel === 'Avanzado')     return '#ef4444';
  return '#6b7280';
};

const emptyEjercicio = () => ({
  nombre_ejercicio: '',
  series: '',
  repeticiones: '',
  peso: '',
  descanso: '',
  notas: '',
});

const emptyDia = () => ({
  nombre: '',
  descripcion: '',
  notas: '',
  ejercicios: [emptyEjercicio()],
});

const emptyFormPlan = () => ({
  nombre: '',
  descripcion: '',
  objetivo: '',
  nivel: 'Principiante',
  duracion_semanas: '',
  fecha_inicio: '',
  dias: [emptyDia()],
});

// ─── component ──────────────────────────────────────────────────────────────

function PlanV2Manager({ participantId, userId }) {
  // list state
  const [planes, setPlanes]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [exito, setExito]             = useState('');

  // create form state
  const [showCrear, setShowCrear]     = useState(false);
  const [formPlan, setFormPlan]       = useState(emptyFormPlan());
  const [guardando, setGuardando]     = useState(false);

  // detail state
  const [planDetalle, setPlanDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // detail – header edit
  const [editHeader, setEditHeader]   = useState(false);
  const [formHeader, setFormHeader]   = useState({});
  const [guardandoHeader, setGuardandoHeader] = useState(false);

  // detail – add day form
  const [showAddDia, setShowAddDia]   = useState(false);
  const [formDia, setFormDia]         = useState({ nombre: '', descripcion: '', notas: '' });
  const [guardandoDia, setGuardandoDia] = useState(false);

  // detail – per-day state
  const [expandedDays, setExpandedDays] = useState({});
  const [editDia, setEditDia]         = useState(null);   // dia_id being edited
  const [formEditDia, setFormEditDia] = useState({});
  const [guardandoEditDia, setGuardandoEditDia] = useState(false);

  // detail – add exercise per day
  const [showAddEjercicio, setShowAddEjercicio] = useState(null); // dia_id
  const [formEjercicio, setFormEjercicio] = useState(emptyEjercicio());
  const [guardandoEjercicio, setGuardandoEjercicio] = useState(false);

  // detail – edit exercise
  const [editEjercicio, setEditEjercicio] = useState(null); // ejercicio_id
  const [formEditEjercicio, setFormEditEjercicio] = useState({});
  const [guardandoEditEjercicio, setGuardandoEditEjercicio] = useState(false);

  // ─── effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    loadPlanes();
  }, [participantId]);

  // ─── helpers ──────────────────────────────────────────────────────────────

  const mostrarExito = (msg) => {
    setExito(msg);
    setTimeout(() => setExito(''), 3000);
  };

  const loadPlanes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await entrenamientoV2Service.obtenerPlanes(participantId);
      setPlanes(data.planes || data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar los programas');
    } finally {
      setLoading(false);
    }
  };

  const loadDetalle = async (plan_id) => {
    setLoadingDetalle(true);
    setError('');
    try {
      const data = await entrenamientoV2Service.obtenerPlan(plan_id);
      const plan = data.plan || data;
      setPlanDetalle(plan);
      // pre-expand all days
      const expanded = {};
      (plan.dias || []).forEach(d => { expanded[d.id] = true; });
      setExpandedDays(expanded);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar el programa');
    } finally {
      setLoadingDetalle(false);
    }
  };

  const resetFormPlan = () => setFormPlan(emptyFormPlan());

  // ─── create plan ──────────────────────────────────────────────────────────

  const handleCrearPlan = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      const payload = {
        participante_id: participantId,
        nombre: formPlan.nombre,
        descripcion: formPlan.descripcion,
        objetivo: formPlan.objetivo,
        nivel: formPlan.nivel,
        duracion_semanas: formPlan.duracion_semanas ? parseInt(formPlan.duracion_semanas) : undefined,
        fecha_inicio: formPlan.fecha_inicio || undefined,
        dias: formPlan.dias.map((dia, i) => ({
          numero_dia: i + 1,
          nombre: dia.nombre,
          descripcion: dia.descripcion,
          notas: dia.notas,
          ejercicios: dia.ejercicios.map((ej) => ({
            nombre_ejercicio: ej.nombre_ejercicio,
            series: parseInt(ej.series),
            repeticiones: ej.repeticiones,
            peso: ej.peso || undefined,
            descanso: ej.descanso || undefined,
            notas: ej.notas || undefined,
          })),
        })),
      };
      await entrenamientoV2Service.crearPlan(payload);
      mostrarExito('Programa creado exitosamente');
      setShowCrear(false);
      resetFormPlan();
      loadPlanes();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el programa');
    } finally {
      setGuardando(false);
    }
  };

  // days in create form
  const addDiaForm = () =>
    setFormPlan(prev => ({ ...prev, dias: [...prev.dias, emptyDia()] }));

  const removeDiaForm = (idx) =>
    setFormPlan(prev => ({ ...prev, dias: prev.dias.filter((_, i) => i !== idx) }));

  const updateDiaForm = (idx, field, value) =>
    setFormPlan(prev => {
      const dias = [...prev.dias];
      dias[idx] = { ...dias[idx], [field]: value };
      return { ...prev, dias };
    });

  // exercises in create form
  const addEjercicioForm = (diaIdx) =>
    setFormPlan(prev => {
      const dias = [...prev.dias];
      dias[diaIdx] = { ...dias[diaIdx], ejercicios: [...dias[diaIdx].ejercicios, emptyEjercicio()] };
      return { ...prev, dias };
    });

  const removeEjercicioForm = (diaIdx, ejIdx) =>
    setFormPlan(prev => {
      const dias = [...prev.dias];
      dias[diaIdx] = {
        ...dias[diaIdx],
        ejercicios: dias[diaIdx].ejercicios.filter((_, i) => i !== ejIdx),
      };
      return { ...prev, dias };
    });

  const updateEjercicioForm = (diaIdx, ejIdx, field, value) =>
    setFormPlan(prev => {
      const dias = [...prev.dias];
      const ejercicios = [...dias[diaIdx].ejercicios];
      ejercicios[ejIdx] = { ...ejercicios[ejIdx], [field]: value };
      dias[diaIdx] = { ...dias[diaIdx], ejercicios };
      return { ...prev, dias };
    });

  // ─── delete plan ──────────────────────────────────────────────────────────

  const handleEliminarPlan = async (plan_id, nombre) => {
    if (!window.confirm(`¿Eliminar el programa "${nombre}"? Esta acción no se puede deshacer.`)) return;
    setError('');
    try {
      await entrenamientoV2Service.eliminarPlan(plan_id);
      mostrarExito('Programa eliminado');
      loadPlanes();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar el programa');
    }
  };

  const handleEliminarPlanDetalle = async () => {
    if (!planDetalle) return;
    if (!window.confirm(`¿Eliminar el programa "${planDetalle.nombre}"? Esta acción no se puede deshacer.`)) return;
    setError('');
    try {
      await entrenamientoV2Service.eliminarPlan(planDetalle.id);
      mostrarExito('Programa eliminado');
      setPlanDetalle(null);
      loadPlanes();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar el programa');
    }
  };

  // ─── edit header ──────────────────────────────────────────────────────────

  const startEditHeader = () => {
    setFormHeader({
      nombre: planDetalle.nombre || '',
      descripcion: planDetalle.descripcion || '',
      objetivo: planDetalle.objetivo || '',
      nivel: planDetalle.nivel || 'Principiante',
      duracion_semanas: planDetalle.duracion_semanas || '',
      fecha_inicio: planDetalle.fecha_inicio ? planDetalle.fecha_inicio.slice(0, 10) : '',
      fecha_fin: planDetalle.fecha_fin ? planDetalle.fecha_fin.slice(0, 10) : '',
    });
    setEditHeader(true);
  };

  const handleGuardarHeader = async (e) => {
    e.preventDefault();
    setGuardandoHeader(true);
    setError('');
    try {
      await entrenamientoV2Service.actualizarPlan(planDetalle.id, {
        nombre: formHeader.nombre,
        descripcion: formHeader.descripcion,
        objetivo: formHeader.objetivo,
        nivel: formHeader.nivel,
        duracion_semanas: formHeader.duracion_semanas ? parseInt(formHeader.duracion_semanas) : undefined,
        fecha_inicio: formHeader.fecha_inicio || undefined,
        fecha_fin: formHeader.fecha_fin || undefined,
      });
      mostrarExito('Encabezado actualizado');
      setEditHeader(false);
      await loadDetalle(planDetalle.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar el encabezado');
    } finally {
      setGuardandoHeader(false);
    }
  };

  // ─── add day (detail) ─────────────────────────────────────────────────────

  const handleAgregarDia = async (e) => {
    e.preventDefault();
    setGuardandoDia(true);
    setError('');
    try {
      const maxOrden = (planDetalle.dias || []).reduce((m, d) => Math.max(m, d.numero_dia || d.orden || 0), 0);
      await entrenamientoV2Service.agregarDia(planDetalle.id, {
        nombre: formDia.nombre,
        descripcion: formDia.descripcion,
        notas: formDia.notas,
        numero_dia: maxOrden + 1,
      });
      mostrarExito('Día agregado');
      setShowAddDia(false);
      setFormDia({ nombre: '', descripcion: '', notas: '' });
      await loadDetalle(planDetalle.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agregar el día');
    } finally {
      setGuardandoDia(false);
    }
  };

  // ─── edit day (detail) ────────────────────────────────────────────────────

  const startEditDia = (dia) => {
    setFormEditDia({
      nombre: dia.nombre || '',
      descripcion: dia.descripcion || '',
      notas: dia.notas || '',
    });
    setEditDia(dia.id);
    setShowAddEjercicio(null);
  };

  const handleGuardarEditDia = async (e, dia_id) => {
    e.preventDefault();
    setGuardandoEditDia(true);
    setError('');
    try {
      await entrenamientoV2Service.actualizarDia(dia_id, {
        nombre: formEditDia.nombre,
        descripcion: formEditDia.descripcion,
        notas: formEditDia.notas,
      });
      mostrarExito('Día actualizado');
      setEditDia(null);
      await loadDetalle(planDetalle.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar el día');
    } finally {
      setGuardandoEditDia(false);
    }
  };

  const handleEliminarDia = async (dia_id, nombre) => {
    if (!window.confirm(`¿Eliminar el día "${nombre}"? Se eliminarán también sus ejercicios.`)) return;
    setError('');
    try {
      await entrenamientoV2Service.eliminarDia(dia_id);
      mostrarExito('Día eliminado');
      await loadDetalle(planDetalle.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar el día');
    }
  };

  // ─── add exercise (detail) ────────────────────────────────────────────────

  const startAddEjercicio = (dia_id) => {
    setFormEjercicio(emptyEjercicio());
    setShowAddEjercicio(dia_id);
    setEditEjercicio(null);
    setEditDia(null);
  };

  const handleAgregarEjercicio = async (e, dia_id) => {
    e.preventDefault();
    setGuardandoEjercicio(true);
    setError('');
    try {
      await entrenamientoV2Service.agregarEjercicio(dia_id, {
        nombre_ejercicio: formEjercicio.nombre_ejercicio,
        series: parseInt(formEjercicio.series),
        repeticiones: formEjercicio.repeticiones,
        peso: formEjercicio.peso || undefined,
        descanso: formEjercicio.descanso || undefined,
        notas: formEjercicio.notas || undefined,
      });
      mostrarExito('Ejercicio agregado');
      setShowAddEjercicio(null);
      setFormEjercicio(emptyEjercicio());
      await loadDetalle(planDetalle.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agregar el ejercicio');
    } finally {
      setGuardandoEjercicio(false);
    }
  };

  // ─── edit exercise (detail) ───────────────────────────────────────────────

  const startEditEjercicio = (ej) => {
    setFormEditEjercicio({
      nombre_ejercicio: ej.nombre_ejercicio || '',
      series: ej.series != null ? String(ej.series) : '',
      repeticiones: ej.repeticiones || '',
      peso: ej.peso || '',
      descanso: ej.descanso || '',
      notas: ej.notas || '',
    });
    setEditEjercicio(ej.id);
    setShowAddEjercicio(null);
  };

  const handleGuardarEditEjercicio = async (e, ejercicio_id) => {
    e.preventDefault();
    setGuardandoEditEjercicio(true);
    setError('');
    try {
      await entrenamientoV2Service.actualizarEjercicio(ejercicio_id, {
        nombre_ejercicio: formEditEjercicio.nombre_ejercicio,
        series: parseInt(formEditEjercicio.series),
        repeticiones: formEditEjercicio.repeticiones,
        peso: formEditEjercicio.peso || undefined,
        descanso: formEditEjercicio.descanso || undefined,
        notas: formEditEjercicio.notas || undefined,
      });
      mostrarExito('Ejercicio actualizado');
      setEditEjercicio(null);
      await loadDetalle(planDetalle.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar el ejercicio');
    } finally {
      setGuardandoEditEjercicio(false);
    }
  };

  const handleEliminarEjercicio = async (ejercicio_id, nombre) => {
    if (!window.confirm(`¿Eliminar el ejercicio "${nombre}"?`)) return;
    setError('');
    try {
      await entrenamientoV2Service.eliminarEjercicio(ejercicio_id);
      mostrarExito('Ejercicio eliminado');
      await loadDetalle(planDetalle.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar el ejercicio');
    }
  };

  // ─── toggle day expand ────────────────────────────────────────────────────

  const toggleDay = (dia_id) =>
    setExpandedDays(prev => ({ ...prev, [dia_id]: !prev[dia_id] }));

  // ─── shared styles ────────────────────────────────────────────────────────

  const cardStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  };

  const inlineFormStyle = {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 16,
    marginTop: 12,
  };

  const tableTh = {
    padding: '8px 10px',
    textAlign: 'left',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: 13,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    whiteSpace: 'nowrap',
  };

  const tableTd = {
    padding: '8px 10px',
    color: 'var(--text-primary)',
    fontSize: 14,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    verticalAlign: 'middle',
  };

  // ─── subcomponents ────────────────────────────────────────────────────────

  const NivelBadge = ({ nivel }) => (
    <span style={{
      background: nivelColor(nivel),
      color: '#fff',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
    }}>
      {nivel}
    </span>
  );

  const EjercicioFormFields = ({ values, onChange, prefix }) => (
    <>
      <div className="form-row">
        <div className="form-group">
          <label>Ejercicio *</label>
          <input
            type="text"
            value={values.nombre_ejercicio}
            onChange={e => onChange('nombre_ejercicio', e.target.value)}
            placeholder="Ej: Sentadilla con barra"
            required
          />
        </div>
        <div className="form-group">
          <label>Series *</label>
          <input
            type="number"
            min="1"
            value={values.series}
            onChange={e => onChange('series', e.target.value)}
            placeholder="Ej: 4"
            required
          />
        </div>
        <div className="form-group">
          <label>Repeticiones *</label>
          <input
            type="text"
            value={values.repeticiones}
            onChange={e => onChange('repeticiones', e.target.value)}
            placeholder="Ej: 10-12"
            required
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Peso</label>
          <input
            type="text"
            value={values.peso}
            onChange={e => onChange('peso', e.target.value)}
            placeholder="Ej: 80 kg"
          />
        </div>
        <div className="form-group">
          <label>Descanso</label>
          <input
            type="text"
            value={values.descanso}
            onChange={e => onChange('descanso', e.target.value)}
            placeholder="Ej: 90 seg"
          />
        </div>
        <div className="form-group">
          <label>Notas</label>
          <input
            type="text"
            value={values.notas}
            onChange={e => onChange('notas', e.target.value)}
            placeholder="Observaciones..."
          />
        </div>
      </div>
    </>
  );

  // ─── render: loading ──────────────────────────────────────────────────────

  if (loading) return <div className="loading">Cargando programas...</div>;

  // ─── render: detail view ──────────────────────────────────────────────────

  if (planDetalle !== null) {
    if (loadingDetalle) return <div className="loading">Cargando programa...</div>;

    const plan = planDetalle;
    return (
      <div className="plan-manager">
        {/* messages */}
        {error && <div className="error-message">{error}</div>}
        {exito && <div className="message-success">{exito}</div>}

        {/* back button */}
        <button
          className="btn-secondary"
          style={{ marginBottom: 20 }}
          onClick={() => { setPlanDetalle(null); setEditHeader(false); setShowAddDia(false); }}
        >
          ← Volver
        </button>

        {/* ── plan header card ── */}
        <div style={cardStyle}>
          {!editHeader ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>{plan.nombre}</h2>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {plan.objetivo && (
                      <span style={{ background: 'rgba(99,102,241,0.25)', color: '#a5b4fc', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                        {plan.objetivo}
                      </span>
                    )}
                    {plan.nivel && <NivelBadge nivel={plan.nivel} />}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn-secondary" onClick={startEditHeader}>
                    <EditIcon /> <span>Editar Encabezado</span>
                  </button>
                  <button className="btn-danger" onClick={handleEliminarPlanDetalle}>
                    <TrashIcon /> <span>Eliminar Programa</span>
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 14, fontSize: 14, color: 'var(--text-secondary)' }}>
                {plan.duracion_semanas && <span>Duración: <strong style={{ color: 'var(--text-primary)' }}>{plan.duracion_semanas} semanas</strong></span>}
                {plan.fecha_inicio && <span>Inicio: <strong style={{ color: 'var(--text-primary)' }}>{plan.fecha_inicio.slice(0, 10)}</strong></span>}
                {plan.fecha_fin   && <span>Fin: <strong style={{ color: 'var(--text-primary)' }}>{plan.fecha_fin.slice(0, 10)}</strong></span>}
                {plan.creador_nombre && <span>Creado por: <strong style={{ color: 'var(--text-primary)' }}>{plan.creador_nombre}</strong></span>}
              </div>
              {plan.descripcion && <p style={{ marginTop: 10, fontSize: 14, color: 'var(--text-secondary)' }}>{plan.descripcion}</p>}
            </>
          ) : (
            /* ── inline header edit form ── */
            <form onSubmit={handleGuardarHeader}>
              <h3 style={{ marginTop: 0, marginBottom: 16, color: 'var(--text-primary)' }}>Editar Encabezado</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={formHeader.nombre}
                    onChange={e => setFormHeader(p => ({ ...p, nombre: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Objetivo</label>
                  <input
                    type="text"
                    value={formHeader.objetivo}
                    onChange={e => setFormHeader(p => ({ ...p, objetivo: e.target.value }))}
                    placeholder="Ej: Hipertrofia"
                  />
                </div>
                <div className="form-group">
                  <label>Nivel *</label>
                  <select
                    value={formHeader.nivel}
                    onChange={e => setFormHeader(p => ({ ...p, nivel: e.target.value }))}
                  >
                    <option>Principiante</option>
                    <option>Intermedio</option>
                    <option>Avanzado</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Duración (semanas)</label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={formHeader.duracion_semanas}
                    onChange={e => setFormHeader(p => ({ ...p, duracion_semanas: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Fecha inicio</label>
                  <input
                    type="date"
                    value={formHeader.fecha_inicio}
                    onChange={e => setFormHeader(p => ({ ...p, fecha_inicio: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Fecha fin</label>
                  <input
                    type="date"
                    value={formHeader.fecha_fin}
                    onChange={e => setFormHeader(p => ({ ...p, fecha_fin: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  rows={3}
                  value={formHeader.descripcion}
                  onChange={e => setFormHeader(p => ({ ...p, descripcion: e.target.value }))}
                  placeholder="Descripción general del programa..."
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-success" disabled={guardandoHeader}>
                  <SaveIcon /> <span>{guardandoHeader ? 'Guardando...' : 'Guardar'}</span>
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditHeader(false)}>
                  <XIcon /> <span>Cancelar</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── add day button + form ── */}
        {!showAddDia ? (
          <button className="btn-primary" style={{ marginBottom: 16 }} onClick={() => setShowAddDia(true)}>
            <PlusIcon /> <span>Agregar Día</span>
          </button>
        ) : (
          <div style={{ ...inlineFormStyle, marginBottom: 20 }}>
            <h4 style={{ marginTop: 0, marginBottom: 12, color: 'var(--text-primary)' }}>Nuevo Día</h4>
            <form onSubmit={handleAgregarDia}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={formDia.nombre}
                    onChange={e => setFormDia(p => ({ ...p, nombre: e.target.value }))}
                    placeholder="Ej: Día de Pecho"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <input
                    type="text"
                    value={formDia.descripcion}
                    onChange={e => setFormDia(p => ({ ...p, descripcion: e.target.value }))}
                    placeholder="Descripción del día..."
                  />
                </div>
                <div className="form-group">
                  <label>Notas</label>
                  <input
                    type="text"
                    value={formDia.notas}
                    onChange={e => setFormDia(p => ({ ...p, notas: e.target.value }))}
                    placeholder="Notas opcionales..."
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-success" disabled={guardandoDia}>
                  <SaveIcon /> <span>{guardandoDia ? 'Guardando...' : 'Guardar Día'}</span>
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowAddDia(false)}>
                  <XIcon /> <span>Cancelar</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── days list ── */}
        <div className="days-list">
          {(!plan.dias || plan.dias.length === 0) && (
            <div className="empty-state">
              <DumbbellIcon />
              <p>No hay días en este programa. Agrega el primero.</p>
            </div>
          )}

          {(plan.dias || []).map(dia => {
            const isExpanded = !!expandedDays[dia.id];
            const isEditingDia = editDia === dia.id;
            const isAddingEj  = showAddEjercicio === dia.id;

            return (
              <div key={dia.id} className="day-card">
                {/* day header row */}
                <div className="day-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'default', flexWrap: 'wrap', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => toggleDay(dia.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: 0 }}
                  >
                    {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                    <span className="day-name">
                      Día {dia.numero_dia || dia.orden}: {dia.nombre}
                    </span>
                  </button>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn-secondary" style={{ fontSize: 13, padding: '4px 10px' }} onClick={() => startAddEjercicio(dia.id)}>
                      <PlusIcon /> <span>Ejercicio</span>
                    </button>
                    <button className="btn-secondary" style={{ fontSize: 13, padding: '4px 10px' }} onClick={() => startEditDia(dia)}>
                      <EditIcon /> <span>Editar</span>
                    </button>
                    <button className="btn-danger" style={{ fontSize: 13, padding: '4px 10px' }} onClick={() => handleEliminarDia(dia.id, dia.nombre)}>
                      <TrashIcon /> <span>Eliminar</span>
                    </button>
                  </div>
                </div>

                {/* inline edit day form */}
                {isEditingDia && (
                  <div style={inlineFormStyle}>
                    <h4 style={{ marginTop: 0, marginBottom: 12, color: 'var(--text-primary)' }}>Editar Día</h4>
                    <form onSubmit={e => handleGuardarEditDia(e, dia.id)}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Nombre *</label>
                          <input
                            type="text"
                            value={formEditDia.nombre}
                            onChange={e => setFormEditDia(p => ({ ...p, nombre: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Descripción</label>
                          <input
                            type="text"
                            value={formEditDia.descripcion}
                            onChange={e => setFormEditDia(p => ({ ...p, descripcion: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label>Notas</label>
                          <input
                            type="text"
                            value={formEditDia.notas}
                            onChange={e => setFormEditDia(p => ({ ...p, notas: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="btn-success" disabled={guardandoEditDia}>
                          <SaveIcon /> <span>{guardandoEditDia ? 'Guardando...' : 'Guardar'}</span>
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => setEditDia(null)}>
                          <XIcon /> <span>Cancelar</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* inline add exercise form */}
                {isAddingEj && (
                  <div style={inlineFormStyle}>
                    <h4 style={{ marginTop: 0, marginBottom: 12, color: 'var(--text-primary)' }}>Nuevo Ejercicio</h4>
                    <form onSubmit={e => handleAgregarEjercicio(e, dia.id)}>
                      <EjercicioFormFields
                        values={formEjercicio}
                        onChange={(field, val) => setFormEjercicio(p => ({ ...p, [field]: val }))}
                      />
                      <div className="form-actions">
                        <button type="submit" className="btn-success" disabled={guardandoEjercicio}>
                          <SaveIcon /> <span>{guardandoEjercicio ? 'Guardando...' : 'Guardar Ejercicio'}</span>
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => setShowAddEjercicio(null)}>
                          <XIcon /> <span>Cancelar</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* exercises table */}
                {isExpanded && (
                  <div className="day-exercises">
                    {(!dia.ejercicios || dia.ejercicios.length === 0) ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: 14, padding: '8px 0' }}>
                        No hay ejercicios. Usa "+ Ejercicio" para agregar.
                      </p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={tableTh}>Ejercicio</th>
                              <th style={tableTh}>Series</th>
                              <th style={tableTh}>Reps</th>
                              <th style={tableTh}>Peso</th>
                              <th style={tableTh}>Descanso</th>
                              <th style={tableTh}>Notas</th>
                              <th style={tableTh}>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(dia.ejercicios || []).map(ej => {
                              const isEditingEj = editEjercicio === ej.id;
                              if (isEditingEj) {
                                return (
                                  <tr key={ej.id} style={{ background: 'rgba(99,102,241,0.08)' }}>
                                    <td colSpan={7} style={{ padding: '12px 10px' }}>
                                      <form onSubmit={e => handleGuardarEditEjercicio(e, ej.id)}>
                                        <EjercicioFormFields
                                          values={formEditEjercicio}
                                          onChange={(field, val) => setFormEditEjercicio(p => ({ ...p, [field]: val }))}
                                        />
                                        <div className="form-actions">
                                          <button type="submit" className="btn-success" disabled={guardandoEditEjercicio}>
                                            <SaveIcon /> <span>{guardandoEditEjercicio ? 'Guardando...' : 'Guardar'}</span>
                                          </button>
                                          <button type="button" className="btn-secondary" onClick={() => setEditEjercicio(null)}>
                                            <XIcon /> <span>Cancelar</span>
                                          </button>
                                        </div>
                                      </form>
                                    </td>
                                  </tr>
                                );
                              }
                              return (
                                <tr key={ej.id}>
                                  <td style={{ ...tableTd, fontWeight: 600 }}>{ej.nombre_ejercicio}</td>
                                  <td style={tableTd}>{ej.series}</td>
                                  <td style={tableTd}>{ej.repeticiones}</td>
                                  <td style={tableTd}>{ej.peso || '—'}</td>
                                  <td style={tableTd}>{ej.descanso || '—'}</td>
                                  <td style={{ ...tableTd, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {ej.notas || '—'}
                                  </td>
                                  <td style={tableTd}>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                      <button
                                        className="btn-secondary"
                                        style={{ fontSize: 12, padding: '3px 8px' }}
                                        onClick={() => startEditEjercicio(ej)}
                                        title="Editar"
                                      >
                                        <EditIcon />
                                      </button>
                                      <button
                                        className="btn-danger"
                                        style={{ fontSize: 12, padding: '3px 8px' }}
                                        onClick={() => handleEliminarEjercicio(ej.id, ej.nombre_ejercicio)}
                                        title="Eliminar"
                                      >
                                        <TrashIcon />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── render: list view ────────────────────────────────────────────────────

  return (
    <div className="plan-manager">
      {/* messages */}
      {error && <div className="error-message">{error}</div>}
      {exito && <div className="message-success">{exito}</div>}

      {/* header */}
      <div className="plan-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DumbbellIcon />
          <h2 style={{ margin: 0 }}>Programas de Entrenamiento v2</h2>
        </div>
        <button
          className="btn-primary"
          onClick={() => { setShowCrear(true); resetFormPlan(); setError(''); }}
        >
          <PlusIcon /> <span>Crear Programa</span>
        </button>
      </div>

      {/* ── create plan form ── */}
      {showCrear && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h3 style={{ marginTop: 0, marginBottom: 20, color: 'var(--text-primary)' }}>Nuevo Programa de Entrenamiento</h3>
          <form onSubmit={handleCrearPlan}>
            {/* plan meta */}
            <div className="form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formPlan.nombre}
                  onChange={e => setFormPlan(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej: Programa Fullbody 8 Semanas"
                  required
                />
              </div>
              <div className="form-group">
                <label>Objetivo</label>
                <input
                  type="text"
                  value={formPlan.objetivo}
                  onChange={e => setFormPlan(p => ({ ...p, objetivo: e.target.value }))}
                  placeholder="Ej: Hipertrofia"
                />
              </div>
              <div className="form-group">
                <label>Nivel *</label>
                <select
                  value={formPlan.nivel}
                  onChange={e => setFormPlan(p => ({ ...p, nivel: e.target.value }))}
                  required
                >
                  <option>Principiante</option>
                  <option>Intermedio</option>
                  <option>Avanzado</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Duración (semanas)</label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={formPlan.duracion_semanas}
                  onChange={e => setFormPlan(p => ({ ...p, duracion_semanas: e.target.value }))}
                  placeholder="Ej: 8"
                />
              </div>
              <div className="form-group">
                <label>Fecha inicio</label>
                <input
                  type="date"
                  value={formPlan.fecha_inicio}
                  onChange={e => setFormPlan(p => ({ ...p, fecha_inicio: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea
                rows={3}
                value={formPlan.descripcion}
                onChange={e => setFormPlan(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Descripción general del programa..."
              />
            </div>

            {/* days builder */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Días del programa</h4>
                <button type="button" className="btn-secondary" onClick={addDiaForm}>
                  <PlusIcon /> <span>Agregar Día</span>
                </button>
              </div>

              {formPlan.dias.map((dia, diaIdx) => (
                <div key={diaIdx} style={{ ...inlineFormStyle, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Día {diaIdx + 1}</strong>
                    {formPlan.dias.length > 1 && (
                      <button
                        type="button"
                        className="btn-danger"
                        style={{ fontSize: 13, padding: '3px 10px' }}
                        onClick={() => removeDiaForm(diaIdx)}
                      >
                        <XIcon /> <span>Quitar día</span>
                      </button>
                    )}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nombre *</label>
                      <input
                        type="text"
                        value={dia.nombre}
                        onChange={e => updateDiaForm(diaIdx, 'nombre', e.target.value)}
                        placeholder="Ej: Día de Piernas"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Descripción</label>
                      <input
                        type="text"
                        value={dia.descripcion}
                        onChange={e => updateDiaForm(diaIdx, 'descripcion', e.target.value)}
                        placeholder="Descripción del día..."
                      />
                    </div>
                    <div className="form-group">
                      <label>Notas</label>
                      <input
                        type="text"
                        value={dia.notas}
                        onChange={e => updateDiaForm(diaIdx, 'notas', e.target.value)}
                        placeholder="Notas opcionales..."
                      />
                    </div>
                  </div>

                  {/* exercises per day */}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Ejercicios</span>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: 12, padding: '3px 10px' }}
                        onClick={() => addEjercicioForm(diaIdx)}
                      >
                        <PlusIcon /> <span>Agregar Ejercicio</span>
                      </button>
                    </div>

                    {dia.ejercicios.map((ej, ejIdx) => (
                      <div
                        key={ejIdx}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 8,
                          padding: 12,
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ejercicio {ejIdx + 1}</span>
                          {dia.ejercicios.length > 1 && (
                            <button
                              type="button"
                              className="btn-danger"
                              style={{ fontSize: 12, padding: '2px 8px' }}
                              onClick={() => removeEjercicioForm(diaIdx, ejIdx)}
                            >
                              <XIcon /> <span>Quitar</span>
                            </button>
                          )}
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Ejercicio *</label>
                            <input
                              type="text"
                              value={ej.nombre_ejercicio}
                              onChange={e => updateEjercicioForm(diaIdx, ejIdx, 'nombre_ejercicio', e.target.value)}
                              placeholder="Ej: Press de banca"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Series *</label>
                            <input
                              type="number"
                              min="1"
                              value={ej.series}
                              onChange={e => updateEjercicioForm(diaIdx, ejIdx, 'series', e.target.value)}
                              placeholder="Ej: 4"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Repeticiones *</label>
                            <input
                              type="text"
                              value={ej.repeticiones}
                              onChange={e => updateEjercicioForm(diaIdx, ejIdx, 'repeticiones', e.target.value)}
                              placeholder="Ej: 10-12"
                              required
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Peso</label>
                            <input
                              type="text"
                              value={ej.peso}
                              onChange={e => updateEjercicioForm(diaIdx, ejIdx, 'peso', e.target.value)}
                              placeholder="Ej: 80 kg"
                            />
                          </div>
                          <div className="form-group">
                            <label>Descanso</label>
                            <input
                              type="text"
                              value={ej.descanso}
                              onChange={e => updateEjercicioForm(diaIdx, ejIdx, 'descanso', e.target.value)}
                              placeholder="Ej: 90 seg"
                            />
                          </div>
                          <div className="form-group">
                            <label>Notas</label>
                            <input
                              type="text"
                              value={ej.notas}
                              onChange={e => updateEjercicioForm(diaIdx, ejIdx, 'notas', e.target.value)}
                              placeholder="Observaciones..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* form actions */}
            <div className="form-actions" style={{ marginTop: 20 }}>
              <button type="submit" className="btn-success" disabled={guardando}>
                <SaveIcon /> <span>{guardando ? 'Guardando...' : 'Guardar Programa'}</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setShowCrear(false); resetFormPlan(); setError(''); }}
              >
                <XIcon /> <span>Cancelar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── plan list ── */}
      {planes.length === 0 && !showCrear ? (
        <div className="empty-state">
          <DumbbellIcon />
          <h3>No hay programas de entrenamiento</h3>
          <p>Haz clic en "Crear Programa" para comenzar</p>
        </div>
      ) : (
        <div className="days-list">
          {planes.map(plan => (
            <div key={plan.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 18 }}>{plan.nombre}</h3>
                    {plan.nivel && <NivelBadge nivel={plan.nivel} />}
                  </div>
                  {plan.objetivo && (
                    <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--text-secondary)' }}>
                      Objetivo: <strong style={{ color: 'var(--text-primary)' }}>{plan.objetivo}</strong>
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {plan.duracion_semanas != null && (
                      <span>Duración: <strong style={{ color: 'var(--text-primary)' }}>{plan.duracion_semanas} sem</strong></span>
                    )}
                    {plan.total_dias != null && (
                      <span>Días: <strong style={{ color: 'var(--text-primary)' }}>{plan.total_dias}</strong></span>
                    )}
                    {plan.total_ejercicios != null && (
                      <span>Ejercicios: <strong style={{ color: 'var(--text-primary)' }}>{plan.total_ejercicios}</strong></span>
                    )}
                    {plan.creador_nombre && (
                      <span>Por: <strong style={{ color: 'var(--text-primary)' }}>{plan.creador_nombre}</strong></span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className="btn-primary"
                    onClick={() => loadDetalle(plan.id)}
                  >
                    Ver Programa
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleEliminarPlan(plan.id, plan.nombre)}
                  >
                    <TrashIcon /> <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PlanV2Manager;
