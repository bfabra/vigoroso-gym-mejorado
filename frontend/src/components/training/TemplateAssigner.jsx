import React, { useState, useEffect } from 'react';
import { plantillasService, asignacionesService } from '../../services/api';

const CATEGORIA_LABELS = { MUJERES: 'Mujeres', HOMBRES: 'Hombres', NINOS: 'Niños', ADULTO_MAYOR: 'Adulto Mayor' };
const CATEGORIAS = ['MUJERES', 'HOMBRES', 'NINOS', 'ADULTO_MAYOR'];

function TemplateAssigner({ participantId, userId, onAssigned }) {
  const [plantillas, setPlantillas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedPlantillaId, setSelectedPlantillaId] = useState('');
  const [notas, setNotas] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [previewPlantilla, setPreviewPlantilla] = useState(null);

  useEffect(() => {
    loadPlantillas();
    loadHistorial();
  }, [participantId]);

  useEffect(() => {
    loadCurrentAssignment();
  }, [participantId, selectedMonth]);

  const loadPlantillas = async () => {
    try {
      const data = await plantillasService.listar({ activo: 'true' });
      setPlantillas(data);
    } catch (error) {
      console.error('Error cargando plantillas:', error);
    }
  };

  const loadHistorial = async () => {
    try {
      const data = await asignacionesService.obtenerHistorial(participantId);
      setHistorial(data);
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  const loadCurrentAssignment = async () => {
    try {
      const data = await asignacionesService.obtenerAsignacion(participantId, selectedMonth);
      setCurrentAssignment(data.asignacion);
      if (data.asignacion) {
        setSelectedPlantillaId(String(data.asignacion.plantilla_id));
        setNotas(data.asignacion.notas_entrenador || '');
      } else {
        setSelectedPlantillaId('');
        setNotas('');
      }
    } catch (error) {
      console.error('Error cargando asignación actual:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedPlantillaId) {
      alert('Seleccione una plantilla');
      return;
    }

    if (currentAssignment) {
      const confirm = window.confirm(
        'Ya existe una asignación para este mes. ¿Desea reemplazarla? Los registros anteriores se conservarán.'
      );
      if (!confirm) return;
    }

    setLoading(true);
    try {
      const result = await asignacionesService.asignar({
        participante_id: participantId,
        plantilla_id: parseInt(selectedPlantillaId),
        mes_anio: selectedMonth,
        notas_entrenador: notas
      });

      if (result.registros_previos > 0) {
        alert(`Plantilla asignada. Se conservaron ${result.registros_previos} registros de la asignación anterior.`);
      }

      loadCurrentAssignment();
      loadHistorial();
      if (onAssigned) onAssigned();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al asignar plantilla');
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async (id) => {
    try {
      const data = await plantillasService.obtener(id);
      setPreviewPlantilla(data);
    } catch (error) {
      console.error('Error cargando preview:', error);
    }
  };

  const filteredPlantillas = filtroCategoria
    ? plantillas.filter(p => p.categoria === filtroCategoria)
    : plantillas;

  const formatMonth = (mesAnio) => {
    const [year, month] = mesAnio.split('-');
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${meses[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Asignar Plantilla de Entrenamiento</h3>

      {/* Selector de mes */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.85rem' }}>Mes</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          />
        </div>

        {currentAssignment && (
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
            <span style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: 600 }}>
              Asignada: {currentAssignment.plantilla_nombre}
            </span>
          </div>
        )}

        <button onClick={() => setShowHistorial(!showHistorial)} className="btn-secondary" style={{ fontSize: '0.85rem', marginLeft: 'auto' }}>
          {showHistorial ? 'Ocultar Historial' : 'Ver Historial'}
        </button>
      </div>

      {/* Historial */}
      {showHistorial && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Historial de Asignaciones</h4>
          {historial.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sin asignaciones previas</p>
          ) : (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {historial.map(h => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{formatMonth(h.mes_anio)}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                      {h.plantilla_nombre}
                    </span>
                  </div>
                  <span className={`tag ${h.activo ? 'tag-green' : 'tag-blue'}`} style={{ fontSize: '0.7rem' }}>
                    {h.activo ? 'Activa' : 'Anterior'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selector de plantilla */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
        <label style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
          Seleccionar Plantilla
        </label>

        {/* Filtros categoría */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => setFiltroCategoria('')} className={!filtroCategoria ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>Todas</button>
          {CATEGORIAS.map(c => (
            <button key={c} onClick={() => setFiltroCategoria(c)} className={filtroCategoria === c ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
              {CATEGORIA_LABELS[c]}
            </button>
          ))}
        </div>

        {/* Lista de plantillas */}
        <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
          {filteredPlantillas.map(p => (
            <div
              key={p.id}
              onClick={() => { setSelectedPlantillaId(String(p.id)); loadPreview(p.id); }}
              style={{
                padding: '0.6rem',
                borderRadius: '8px',
                border: selectedPlantillaId === String(p.id) ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: selectedPlantillaId === String(p.id) ? 'rgba(249, 115, 22, 0.1)' : 'var(--bg-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{p.nombre}</strong>
                <span className="tag tag-blue" style={{ fontSize: '0.7rem' }}>{CATEGORIA_LABELS[p.categoria]}</span>
              </div>
              {p.objetivo && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{p.objetivo} - {p.nivel}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Preview de plantilla seleccionada */}
      {previewPlantilla && selectedPlantillaId === String(previewPlantilla.id) && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent-primary)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
          <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Vista Previa: {previewPlantilla.nombre}</h4>
          {previewPlantilla.dias?.map(dia => (
            <div key={dia.id} style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>Día {dia.numero_dia} - {dia.nombre_dia}</strong>
              <div style={{ paddingLeft: '1rem' }}>
                {dia.ejercicios?.map(ej => (
                  <div key={ej.id} style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {ej.orden}. {ej.nombre_ejercicio} — {ej.series} x {ej.repeticiones}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notas y botón de asignar */}
      <div className="form-group">
        <label>Notas del Entrenador (opcional)</label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows="2"
          placeholder="Indicaciones especiales para este participante..."
          style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }}
        />
      </div>

      <button
        onClick={handleAssign}
        className="btn-success"
        disabled={loading || !selectedPlantillaId}
        style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
      >
        {loading ? 'Asignando...' : currentAssignment ? 'Cambiar Plantilla para ' + formatMonth(selectedMonth) : 'Asignar Plantilla para ' + formatMonth(selectedMonth)}
      </button>
    </div>
  );
}

export default TemplateAssigner;
