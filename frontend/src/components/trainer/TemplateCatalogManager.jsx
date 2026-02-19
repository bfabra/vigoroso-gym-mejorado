import React, { useState, useEffect } from 'react';
import { plantillasService, catalogoService } from '../../services/api';

const CATEGORIAS = ['MUJERES', 'HOMBRES', 'NINOS', 'ADULTO_MAYOR'];
const CATEGORIA_LABELS = { MUJERES: 'Mujeres', HOMBRES: 'Hombres', NINOS: 'Niños', ADULTO_MAYOR: 'Adulto Mayor' };
const NIVELES = ['Principiante', 'Intermedio', 'Avanzado'];

function TemplateCatalogManager() {
  const [plantillas, setPlantillas] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [selectedPlantilla, setSelectedPlantilla] = useState(null);
  const [editing, setEditing] = useState(false);
  const [catalogoEjercicios, setCatalogoEjercicios] = useState([]);
  const [searchEjercicio, setSearchEjercicio] = useState('');

  // Form state for creating/editing
  const [form, setForm] = useState({
    nombre: '', categoria: 'MUJERES', descripcion: '', objetivo: '', nivel: 'Intermedio',
    dias: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlantillas();
    loadCatalogo();
  }, [filtroCategoria]);

  const loadPlantillas = async () => {
    try {
      const params = { activo: 'true' };
      if (filtroCategoria) params.categoria = filtroCategoria;
      const data = await plantillasService.listar(params);
      setPlantillas(data);
    } catch (error) {
      console.error('Error cargando plantillas:', error);
    }
  };

  const loadCatalogo = async () => {
    try {
      const data = await catalogoService.listar();
      setCatalogoEjercicios(data);
    } catch (error) {
      console.error('Error cargando catálogo:', error);
    }
  };

  const loadPlantillaDetalle = async (id) => {
    try {
      const data = await plantillasService.obtener(id);
      setSelectedPlantilla(data);
    } catch (error) {
      console.error('Error cargando detalle:', error);
    }
  };

  const startNew = () => {
    setForm({
      nombre: '', categoria: 'MUJERES', descripcion: '', objetivo: '', nivel: 'Intermedio',
      dias: Array.from({ length: 6 }, (_, i) => ({
        numero_dia: i + 1,
        nombre_dia: `Día ${i + 1}`,
        descripcion: '',
        ejercicios: []
      }))
    });
    setEditing(true);
    setSelectedPlantilla(null);
  };

  const startEdit = (plantilla) => {
    setForm({
      nombre: plantilla.nombre,
      categoria: plantilla.categoria,
      descripcion: plantilla.descripcion || '',
      objetivo: plantilla.objetivo || '',
      nivel: plantilla.nivel || 'Intermedio',
      dias: plantilla.dias.map(d => ({
        numero_dia: d.numero_dia,
        nombre_dia: d.nombre_dia,
        descripcion: d.descripcion || '',
        ejercicios: d.ejercicios.map(e => ({
          ejercicio_id: e.ejercicio_id,
          orden: e.orden,
          series: e.series || '',
          repeticiones: e.repeticiones || '',
          notas: e.notas || '',
          _nombre: e.nombre_ejercicio // para mostrar en UI
        }))
      }))
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        nombre: form.nombre,
        categoria: form.categoria,
        descripcion: form.descripcion,
        objetivo: form.objetivo,
        nivel: form.nivel,
        dias: form.dias.map(d => ({
          numero_dia: d.numero_dia,
          nombre_dia: d.nombre_dia,
          descripcion: d.descripcion,
          ejercicios: d.ejercicios.filter(e => e.ejercicio_id).map((e, i) => ({
            ejercicio_id: e.ejercicio_id,
            orden: i + 1,
            series: e.series,
            repeticiones: e.repeticiones,
            notas: e.notas
          }))
        }))
      };

      if (selectedPlantilla) {
        await plantillasService.actualizar(selectedPlantilla.id, payload);
      } else {
        await plantillasService.crear(payload);
      }

      setEditing(false);
      setSelectedPlantilla(null);
      loadPlantillas();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al guardar plantilla');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id) => {
    const nombre = prompt('Nombre para la copia:');
    if (!nombre) return;
    try {
      await plantillasService.duplicar(id, nombre);
      loadPlantillas();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al duplicar');
    }
  };

  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Eliminar plantilla "${nombre}"?`)) {
      try {
        await plantillasService.eliminar(id);
        loadPlantillas();
        if (selectedPlantilla?.id === id) setSelectedPlantilla(null);
      } catch (error) {
        alert(error.response?.data?.error || 'Error al eliminar');
      }
    }
  };

  const addEjercicioToDia = (diaIndex, ejercicio) => {
    const newDias = [...form.dias];
    newDias[diaIndex].ejercicios.push({
      ejercicio_id: ejercicio.id,
      orden: newDias[diaIndex].ejercicios.length + 1,
      series: '',
      repeticiones: '',
      notas: '',
      _nombre: ejercicio.nombre
    });
    setForm({ ...form, dias: newDias });
  };

  const removeEjercicioFromDia = (diaIndex, ejIndex) => {
    const newDias = [...form.dias];
    newDias[diaIndex].ejercicios.splice(ejIndex, 1);
    setForm({ ...form, dias: newDias });
  };

  const updateEjercicio = (diaIndex, ejIndex, field, value) => {
    const newDias = [...form.dias];
    newDias[diaIndex].ejercicios[ejIndex][field] = value;
    setForm({ ...form, dias: newDias });
  };

  const updateDia = (diaIndex, field, value) => {
    const newDias = [...form.dias];
    newDias[diaIndex][field] = value;
    setForm({ ...form, dias: newDias });
  };

  const filteredCatalogo = searchEjercicio
    ? catalogoEjercicios.filter(e => e.nombre.toLowerCase().includes(searchEjercicio.toLowerCase()))
    : catalogoEjercicios;

  // ============ EDIT MODE ============
  if (editing) {
    return (
      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>
            {selectedPlantilla ? 'Editar Plantilla' : 'Nueva Plantilla'}
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleSave} className="btn-success" disabled={loading || !form.nombre}>
              {loading ? 'Guardando...' : 'Guardar Plantilla'}
            </button>
            <button onClick={() => { setEditing(false); setSelectedPlantilla(null); }} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>

        {/* Cabecera de la plantilla */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
          <div className="template-form-grid">
            <div className="form-group">
              <label>Nombre *</label>
              <input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} placeholder="Ej: Plan Mujeres Hipertrofia" required />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <select value={form.categoria} onChange={(e) => setForm({...form, categoria: e.target.value})}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{CATEGORIA_LABELS[c]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Objetivo</label>
              <input type="text" value={form.objetivo} onChange={(e) => setForm({...form, objetivo: e.target.value})} placeholder="Ej: Hipertrofia" />
            </div>
            <div className="form-group">
              <label>Nivel</label>
              <select value={form.nivel} onChange={(e) => setForm({...form, nivel: e.target.value})}>
                {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label>Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} rows="2" style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }} />
          </div>
        </div>

        {/* Buscador de ejercicios del catálogo */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent-primary)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
          <label style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.9rem' }}>Buscar en Catálogo</label>
          <input
            type="text"
            placeholder="Escriba para buscar ejercicios..."
            value={searchEjercicio}
            onChange={(e) => setSearchEjercicio(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginTop: '0.5rem' }}
          />
          {searchEjercicio && (
            <div style={{ maxHeight: '150px', overflowY: 'auto', marginTop: '0.5rem' }}>
              {filteredCatalogo.slice(0, 20).map(ej => (
                <div key={ej.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    {ej.nombre} <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>({ej.grupo_muscular})</span>
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {form.dias.map((dia, idx) => (
                      <button key={idx} onClick={() => addEjercicioToDia(idx, ej)} style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        D{dia.numero_dia}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Días */}
        {form.dias.map((dia, diaIndex) => (
          <div key={diaIndex} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 700, minWidth: '50px' }}>Día {dia.numero_dia}</span>
              <input
                type="text"
                value={dia.nombre_dia}
                onChange={(e) => updateDia(diaIndex, 'nombre_dia', e.target.value)}
                placeholder="Nombre del día"
                style={{ flex: 1, padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{dia.ejercicios.length} ej.</span>
            </div>

            {dia.ejercicios.map((ej, ejIndex) => (
              <div key={ejIndex} className="template-exercise-row">
                <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500 }}>
                  {ejIndex + 1}. {ej._nombre}
                </span>
                <input
                  type="text"
                  value={ej.series}
                  onChange={(e) => updateEjercicio(diaIndex, ejIndex, 'series', e.target.value)}
                  placeholder="Series"
                  style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  value={ej.repeticiones}
                  onChange={(e) => updateEjercicio(diaIndex, ejIndex, 'repeticiones', e.target.value)}
                  placeholder="Reps"
                  style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  value={ej.notas}
                  onChange={(e) => updateEjercicio(diaIndex, ejIndex, 'notas', e.target.value)}
                  placeholder="Notas"
                  style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                />
                <button onClick={() => removeEjercicioFromDia(diaIndex, ejIndex)} style={{ padding: '0.2rem 0.4rem', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>X</button>
              </div>
            ))}

            {dia.ejercicios.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', margin: '0.5rem 0' }}>
                Use el buscador de arriba y haga clic en "D{dia.numero_dia}" para agregar ejercicios
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // ============ DETAIL VIEW ============
  if (selectedPlantilla) {
    return (
      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button onClick={() => setSelectedPlantilla(null)} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            ← Volver
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => startEdit(selectedPlantilla)} className="btn-primary">Editar</button>
            <button onClick={() => handleDuplicate(selectedPlantilla.id)} className="btn-secondary">Duplicar</button>
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>{selectedPlantilla.nombre}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="tag tag-blue">{CATEGORIA_LABELS[selectedPlantilla.categoria] || selectedPlantilla.categoria}</span>
            {selectedPlantilla.nivel && <span className="tag tag-green">{selectedPlantilla.nivel}</span>}
            {selectedPlantilla.objetivo && <span className="tag tag-orange">{selectedPlantilla.objetivo}</span>}
          </div>
          {selectedPlantilla.descripcion && (
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{selectedPlantilla.descripcion}</p>
          )}
        </div>

        {selectedPlantilla.dias?.map(dia => (
          <div key={dia.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', marginBottom: '0.75rem' }}>
            <h3 style={{ color: 'var(--accent-primary)', margin: '0 0 0.5rem' }}>
              Día {dia.numero_dia} - {dia.nombre_dia}
            </h3>
            {dia.ejercicios?.map(ej => (
              <div key={ej.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-primary)' }}>
                  {ej.orden}. <strong>{ej.nombre_ejercicio}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}> ({ej.grupo_muscular})</span>
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {ej.series} x {ej.repeticiones}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // ============ LIST VIEW ============
  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Plantillas de Entrenamiento</h2>
        <button onClick={startNew} className="btn-primary">+ Nueva Plantilla</button>
      </div>

      {/* Filtro por categoría */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => setFiltroCategoria('')} className={!filtroCategoria ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>Todas</button>
        {CATEGORIAS.map(c => (
          <button key={c} onClick={() => setFiltroCategoria(c)} className={filtroCategoria === c ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
            {CATEGORIA_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Grid de plantillas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {plantillas.map(p => (
          <div key={p.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', cursor: 'pointer', transition: 'border-color 0.2s' }}
            onClick={() => loadPlantillaDetalle(p.id)}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>{p.nombre}</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span className="tag tag-blue">{CATEGORIA_LABELS[p.categoria] || p.categoria}</span>
              {p.nivel && <span className="tag tag-green">{p.nivel}</span>}
              {p.objetivo && <span className="tag tag-orange">{p.objetivo}</span>}
            </div>
            {p.descripcion && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>{p.descripcion}</p>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => handleDuplicate(p.id)} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>Duplicar</button>
              <button onClick={() => handleDelete(p.id, p.nombre)} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: '#ef4444' }}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {plantillas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          No hay plantillas. Cree una nueva o ejecute el script de migración.
        </div>
      )}
    </div>
  );
}

export default TemplateCatalogManager;
